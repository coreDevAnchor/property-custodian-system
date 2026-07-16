<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Employee;
use App\Models\Asset;
use Inertia\Inertia;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\ActivityLogs;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $lastEmployee = Employee::latest('id')->first();

        if ($lastEmployee) {
            $lastNumber = (int) str_replace('EMP-', '', $lastEmployee->employee_id);

            $nextEmployeeId = 'EMP-' . str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
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
                        ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%"));
                });
            })
            ->when($status !== 'All', fn($q) => $q->where('is_active', $status === 'active'))
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
            'email' => ['required', 'email:rfc,dns', 'max:255', 'unique:users,email'],

            'department' => ['required', 'string', 'max:255'],
            'contact' => ['nullable', 'regex:/^09\d{9}$/'],
        ], [
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'This email is already in use.',

            'contact.regex' => 'Contact number must be 11 digits and start with 09.',
        ]);

        DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make('Password123!'),
                'role' => 'employee',
            ]);

            $lastEmployee = Employee::latest('id')->first();

            if ($lastEmployee) {
                $lastNumber = (int) str_replace('EMP-', '', $lastEmployee->employee_id);

                $employeeId = 'EMP-' . str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
            } else {
                $employeeId = 'EMP-0001';
            }

            Employee::create([
                'user_id' => $user->id,
                'department' => $validated['department'],
                'employee_id' => $employeeId,
                'contact' => $validated['contact'] ?? null,
                'is_active' => true,
            ]);
        });

        return back()->with('success', 'Employee account created successfully.');
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
                'email:rfc,dns',
                'max:255',
                'unique:users,email,' . $employee->user_id,
            ],

            'department' => ['required', 'string', 'max:255'],
            'employee_id' => [
                'nullable',
                'string',
                'max:255',
                'unique:employees,employee_id,' . $employee->id,
            ],
            'contact' => ['nullable', 'regex:/^09\d{9}$/'],
            'is_active' => ['required', 'boolean'],
        ], [
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'This email is already in use.',
            'contact.required' => 'Contact number is required.',
            'contact.regex' => 'Contact number must be 11 digits and start with 09.',
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
