<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

    public function update(Request $request, User $custodian): RedirectResponse
    {
        $this->ensureCustodian($request);
        $this->ensureCustodianAccount($custodian);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $custodian->id],
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