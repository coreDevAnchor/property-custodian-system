<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Employee;
use App\Models\Asset;
use Inertia\Inertia;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $lastEmployee = Employee::latest('id')->first();

        if ($lastEmployee) {
            $lastNumber = (int) str_replace('EMP-', '', $lastEmployee->employee_id);

            $nextEmployeeId = 'EMP-' . str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $nextEmployeeId = 'EMP-0001';
        }

        return Inertia::render('custodian/employee', [
            'employees' => Employee::with(['user', 'borrows.asset'])
                ->latest()
                ->paginate(10),

            'nextEmployeeId' => $nextEmployeeId,
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
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],

            'department' => ['required', 'string', 'max:255'],
            'contact' => ['nullable', 'string', 'max:255'],
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
                'email',
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
            'contact' => ['nullable', 'string', 'max:255'],
            'is_active' => ['required', 'boolean'],
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
