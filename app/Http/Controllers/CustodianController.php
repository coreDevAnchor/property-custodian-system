<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\Spreadsheet\SpreadsheetParser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class CustodianController extends Controller
{
    public function index(Request $request): Response
    {
        $this->ensureCustodian($request);

        $search = $request->string('search')->toString();
        $perPage = (int) $request->input('per_page', 10);

        $custodians = User::query()
            ->where('role', 'custodian')
            // Mirrors the borrow-history hover card on the Employees page.
            // Assumes `User` has a `borrows()` hasMany relation to
            // BorrowRequest via `borrower_id` — add it if it doesn't exist
            // yet.
            ->with(['borrows.asset'])
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('custodian/custodians', [
            'custodians' => $custodians,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->ensureCustodian($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
        ]);

        User::create([
            ...$validated,
            'password' => Hash::make('Password123!'),
            'role' => 'custodian',
        ]);

        return back()->with('success', 'Custodian account created successfully.');
    }

    public function downloadTemplate(Request $request)
    {
        $format = SpreadsheetParser::format($request->query('format', 'xlsx'));

        $tempPath = SpreadsheetParser::writeTemplate(
            ['Full Name', 'Email'],
            $format,
            'custodian-import-template-',
        );

        return response()
            ->download($tempPath, "custodian-import-template.{$format}")
            ->deleteFileAfterSend(true);
    }

    public function previewImport(Request $request)
    {
        $analysis = $this->analyzeCustodianImport($request);

        if ($analysis['error']) {
            return response()->json(['message' => $analysis['error']], 422);
        }

        return response()->json([
            'summary' => $analysis['summary'],
            'rows' => $analysis['rows'],
        ]);
    }

    public function import(Request $request): RedirectResponse
    {
        $analysis = $this->analyzeCustodianImport($request);

        if ($analysis['error']) {
            return back()->withErrors(['file' => $analysis['error']]);
        }

        $importedCount = DB::transaction(function () use ($analysis) {
            $count = 0;

            foreach ($analysis['rows'] as $entry) {
                User::create([
                    'name' => $entry['name'],
                    'email' => $entry['email'],
                    'password' => Hash::make('Password123!'),
                    'role' => 'custodian',
                ]);

                $count++;
            }

            return $count;
        });

        return back()->with(
            'success',
            "Imported {$importedCount} ".($importedCount === 1 ? 'custodian' : 'custodians').' from Excel.',
        );
    }

    /**
     * Parses and validates an uploaded custodian spreadsheet without writing
     * anything. Emails must be unique against existing users and against other
     * rows in the same file.
     *
     * @return array{error: string|null, rows: list<array<string, mixed>>, summary: array<string, int>}
     */
    private function analyzeCustodianImport(Request $request): array
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

        $normalizeHeader = fn ($header) => preg_replace('/[\s_\-]+/', '', strtolower(trim((string) $header)));

        $requiredHeaders = ['fullname', 'email'];

        $headerLabels = [
            'fullname' => 'Full Name',
            'email' => 'Email',
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

            $problems[] = 'Expected columns: Full Name, Email.';

            return ['error' => implode("\n", $problems)];
        }

        $emailSeen = User::query()
            ->pluck('email')
            ->map(fn ($email) => strtolower((string) $email))
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

            if ($rowErrors) {
                $errorLines[] = "Row {$rowNumber}: ".implode(' ', $rowErrors);

                continue;
            }

            $validRows[] = [
                'row' => $rowNumber,
                'name' => $name,
                'email' => $email,
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
            return ['error' => 'No data rows found. Add at least one custodian below the header row.'];
        }

        return [
            'error' => null,
            'rows' => $validRows,
            'summary' => [
                'total' => count($validRows),
            ],
        ];
    }

    public function update(Request $request, User $custodian): RedirectResponse
    {
        $this->ensureCustodian($request);
        $this->ensureCustodianAccount($custodian);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,'.$custodian->id],
        ]);

        $custodian->update($validated);

        return back()->with('success', 'Custodian account updated successfully.');
    }

    public function destroy(Request $request, User $custodian): RedirectResponse
    {
        $this->ensureCustodian($request);
        $this->ensureCustodianAccount($custodian);

        abort_if($custodian->is($request->user()), 422, 'You cannot remove your own account.');
        abort_if(
            User::query()->where('role', '=', 'custodian', 'and')->count('id') <= 1,
            422,
            'At least one custodian account must remain.',
        );

        User::destroy($custodian->id);

        return back()->with('success', 'Custodian account removed successfully.');
    }

    private function ensureCustodian(Request $request): void
    {
        abort_unless($request->user()?->role === 'custodian', 403);
    }

    private function ensureCustodianAccount(User $custodian): void
    {
        abort_unless($custodian->role === 'custodian', 404);
    }
}
