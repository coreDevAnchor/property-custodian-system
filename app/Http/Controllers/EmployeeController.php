<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\User;
use App\Support\Spreadsheet\SpreadsheetParser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    /**
     * The departments accepted when creating or importing an employee.
     */
    public const DEPARTMENTS = [
        'IT Department',
        'Human Resources',
        'Finance',
        'Accounting',
        'Administration',
        'Procurement',
        'Maintenance',
    ];

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $lastEmployee = Employee::latest('id')->first();

        if ($lastEmployee) {
            $lastNumber = (int) str_replace('EMP-', '', $lastEmployee->employee_id);

            $nextEmployeeId = 'EMP-'.str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $nextEmployeeId = 'EMP-0001';
        }

        $search = $request->string('search')->toString();
        $status = $request->input('status', 'All');
        $perPage = (int) $request->input('per_page', 10);

        $employees = Employee::with(['user', 'borrows.asset'])
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('department', 'like', "%{$search}%")
                        ->orWhere('employee_id', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%"));
                });
            })
            ->when($status !== 'All', fn ($q) => $q->where('is_active', $status === 'active'))
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('custodian/employee', [
            'employees' => $employees,
            'nextEmployeeId' => $nextEmployeeId,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],

            'department' => ['required', 'string', 'max:255'],
            'contact' => ['required', 'regex:/^09\d{9}$/', 'unique:employees,contact'],
        ], [
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'This email is already in use.',

            'contact.required' => 'Contact number is required.',
            'contact.regex' => 'Contact number must be 11 digits and start with 09.',
            'contact.unique' => 'This contact number is already in use.',
        ]);

        DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make('Password123!'),
                'role' => 'employee',
            ]);

            $user->employee()->update([
                'department' => $validated['department'],
                'contact' => $validated['contact'],
                'is_active' => true,
            ]);
        });

        return back()->with('success', 'Employee account created successfully.');
    }

    public function downloadTemplate(Request $request)
    {
        $format = SpreadsheetParser::format($request->query('format', 'xlsx'));

        $tempPath = SpreadsheetParser::writeTemplate(
            ['Full Name', 'Email', 'Department', 'Contact Number'],
            $format,
            'employee-import-template-',
        );

        return response()
            ->download($tempPath, "employee-import-template.{$format}")
            ->deleteFileAfterSend(true);
    }

    public function previewImport(Request $request)
    {
        $analysis = $this->analyzeEmployeeImport($request);

        if ($analysis['error']) {
            return response()->json(['message' => $analysis['error']], 422);
        }

        return response()->json([
            'summary' => $analysis['summary'],
            'rows' => $analysis['rows'],
        ]);
    }

    public function import(Request $request)
    {
        $analysis = $this->analyzeEmployeeImport($request);

        if ($analysis['error']) {
            return back()->withErrors(['file' => $analysis['error']]);
        }

        $importedCount = DB::transaction(function () use ($analysis) {
            $count = 0;

            foreach ($analysis['rows'] as $entry) {
                $user = User::create([
                    'name' => $entry['name'],
                    'email' => $entry['email'],
                    'password' => Hash::make('Password123!'),
                    'role' => 'employee',
                ]);

                $user->employee()->update([
                    'department' => $entry['department'],
                    'contact' => $entry['contact'],
                    'is_active' => true,
                ]);

                $count++;
            }

            return $count;
        });

        return back()->with(
            'success',
            "Imported {$importedCount} ".($importedCount === 1 ? 'employee' : 'employees').' from Excel.',
        );
    }

    /**
     * Parses and validates an uploaded employee spreadsheet without writing
     * anything. Emails and contact numbers must be unique against existing
     * records and against other rows in the same file. Departments must come
     * from the fixed list used by the employee form.
     *
     * @return array{error: string|null, rows: list<array<string, mixed>>, summary: array<string, int>}
     */
    private function analyzeEmployeeImport(Request $request): array
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,csv,txt', 'max:5120'],
        ], [
            'file.required' => 'Please choose an Excel (.xlsx) or CSV file to upload.',
            'file.mimes' => 'The file must be a .xlsx or .csv spreadsheet.',
            'file.max' => 'The file must not exceed 5MB.',
        ]);

        $extension = strtolower($request->file('file')->getClientOriginalExtension());

        try {
            [$headerRow, $dataRows] = SpreadsheetParser::parse(
                $request->file('file')->getRealPath(),
                $extension,
            );
        } catch (\Throwable) {
            return ['error' => 'Could not read the file. Please make sure it is a valid .xlsx or .csv spreadsheet.'];
        }

        if ($headerRow === null) {
            return ['error' => 'The file is empty. It must start with a header row.'];
        }

        // ── Strict header validation ──
        // The upload is rejected unless the header row contains every required
        // column and nothing outside the allowed set.
        $normalizeHeader = fn ($header) => preg_replace('/[\s_\-]+/', '', strtolower(trim((string) $header)));

        $requiredHeaders = ['fullname', 'email', 'department', 'contactnumber'];

        $headerLabels = [
            'fullname' => 'Full Name',
            'email' => 'Email',
            'department' => 'Department',
            'contactnumber' => 'Contact Number',
        ];

        $normalizedHeaders = array_map($normalizeHeader, $headerRow);

        $missing = array_values(array_diff($requiredHeaders, $normalizedHeaders));

        $unexpectedOriginal = [];
        foreach ($headerRow as $index => $original) {
            $normalized = $normalizedHeaders[$index];

            if ($normalized === '' || in_array($normalized, $requiredHeaders, true)) {
                continue;
            }

            $unexpectedOriginal[] = trim((string) $original);
        }

        if ($missing || $unexpectedOriginal) {
            $problems = ['Upload rejected — the spreadsheet columns do not match the required template.'];

            if ($missing) {
                $problems[] = 'Missing column(s): '.implode(', ', array_map(
                    fn ($key) => $headerLabels[$key],
                    $missing,
                )).'.';
            }

            if ($unexpectedOriginal) {
                $problems[] = 'Unexpected column(s): '.implode(', ', $unexpectedOriginal).'.';
            }

            $problems[] = 'Expected columns: Full Name, Email, Department, Contact Number.';

            return ['error' => implode("\n", $problems)];
        }

        $emailSeen = User::query()
            ->pluck('email')
            ->map(fn ($email) => strtolower((string) $email))
            ->filter()
            ->flip();

        $contactSeen = Employee::query()
            ->pluck('contact')
            ->filter()
            ->flip();

        $errorLines = [];
        $validRows = [];

        foreach ($dataRows as $index => $cells) {
            $rowNumber = $index + 2; // account for the header row

            $valueByHeader = [];
            foreach ($normalizedHeaders as $columnIndex => $normalizedHeader) {
                $valueByHeader[$normalizedHeader] = $cells[$columnIndex] ?? null;
            }

            $getName = fn (string $key) => isset($valueByHeader[$key]) && $valueByHeader[$key] !== null
                ? trim((string) $valueByHeader[$key])
                : '';

            $name = $getName('fullname');
            $email = $getName('email');
            $department = $getName('department');
            $contact = $getName('contactnumber');

            $rowErrors = [];

            if ($name === '') {
                $rowErrors[] = 'Full Name is required.';
            } elseif (mb_strlen($name) > 255) {
                $rowErrors[] = 'Full Name must not exceed 255 characters.';
            }

            if ($email === '') {
                $rowErrors[] = 'Email is required.';
            } elseif (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
                $rowErrors[] = 'Email must be a valid email address.';
            } elseif (mb_strlen($email) > 255) {
                $rowErrors[] = 'Email must not exceed 255 characters.';
            } elseif ($emailSeen->has(strtolower($email))) {
                $rowErrors[] = 'Email is already in use.';
            } else {
                $emailSeen->put(strtolower($email), true);
            }

            if ($department === '') {
                $rowErrors[] = 'Department is required.';
            } elseif (! in_array($department, self::DEPARTMENTS, true)) {
                $rowErrors[] = 'Department must be one of: '.implode(', ', self::DEPARTMENTS).'.';
            }

            if ($contact === '') {
                $rowErrors[] = 'Contact Number is required.';
            } elseif (preg_match('/^09\d{9}$/', $contact) !== 1) {
                $rowErrors[] = 'Contact Number must be 11 digits and start with 09.';
            } elseif ($contactSeen->has($contact)) {
                $rowErrors[] = 'Contact Number is already in use.';
            } else {
                $contactSeen->put($contact, true);
            }

            if ($rowErrors) {
                $errorLines[] = "Row {$rowNumber}: ".implode(' ', $rowErrors);

                continue;
            }

            $validRows[] = [
                'row' => $rowNumber,
                'name' => $name,
                'email' => $email,
                'department' => $department,
                'contact' => $contact,
                'status' => 'new',
            ];
        }

        if ($errorLines) {
            $rowCount = count($errorLines);

            array_unshift(
                $errorLines,
                "Import aborted — {$rowCount} ".($rowCount === 1 ? 'row has' : 'rows have')
                .' problems. Fix them and upload again. Nothing has been saved.'
            );

            return ['error' => implode("\n", $errorLines)];
        }

        if (empty($validRows)) {
            return ['error' => 'No data rows found. Add at least one employee below the header row.'];
        }

        return [
            'error' => null,
            'rows' => $validRows,
            'summary' => [
                'total' => count($validRows),
            ],
        ];
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $employee = Employee::with([
            'user',
            'borrows.asset',
        ])->findOrFail($id);

        return response()->json($employee);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {

        $employee = Employee::with('user')->findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email:rfc',
                'max:255',
                'unique:users,email,'.$employee->user_id,
            ],

            'department' => ['required', 'string', 'max:255'],
            'employee_id' => [
                'nullable',
                'string',
                'max:255',
                'unique:employees,employee_id,'.$employee->id,
            ],
            'contact' => ['nullable', 'regex:/^09\d{9}$/', 'unique:employees,contact,'.$employee->id],
            'is_active' => ['required', 'boolean'],
        ], [
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'This email is already in use.',
            'contact.required' => 'Contact number is required.',
            'contact.regex' => 'Contact number must be 11 digits and start with 09.',
            'contact.unique' => 'This contact number is already in use.',
        ]);

        DB::transaction(function () use ($employee, $validated) {

            $employee->user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
            ]);

            $employee->update([
                'department' => $validated['department'],
                'employee_id' => $validated['employee_id'] ?? null,
                'contact' => $validated['contact'] ?? null,
                'is_active' => $validated['is_active'],
            ]);
        });

        return back()->with('success', 'Employee updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $employee = Employee::findOrFail($id);

        $employee->update([
            'is_active' => false,
        ]);

        return back()->with('success', 'Employee account deactivated successfully.');
    }
}
