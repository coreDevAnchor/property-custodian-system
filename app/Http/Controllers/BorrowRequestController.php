<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BorrowRequest;
use Inertia\Inertia;
use App\Models\Asset;
use Illuminate\Support\Facades\Auth;

class BorrowRequestController extends Controller
{
    public function index()
    {
        return Inertia::render('custodian/borrow-requests', [
            'borrowRequests' => BorrowRequest::with([
                'asset.category',
                'employee.user',
                'approvedBy',
                'checkedBy',
            ])
            ->latest()
            ->paginate(10),
        ]);
    }

    public function create()
    {
        //
    }

    public function store(Request $request)
    {
            $validated = $request->validate([
            'asset_id'   => ['required', 'exists:assets,id'],
            'remarks'    => ['nullable', 'string'],
        ]);

        $asset = Asset::findOrFail($validated['asset_id']);

        if ($asset->status !== 'available') {
            return back()->withErrors([
                'asset_id' => 'This asset is not available for borrowing.',
            ]);
        }

        BorrowRequest::create([
            'asset_id'         => $asset->id,
            'employee_id'      => Auth::user()->employee->id,
            'status'           => 'pending',
            'requested_at'     => now(),
            'remarks'          => $validated['remarks'] ?? null,
        ]);

        return redirect()
            ->route('borrow-requests.index')
            ->with('success', 'Borrow request submitted successfully.');
    }

    public function show(string $id)
    {
        $borrowRequest = BorrowRequest::with([
            'asset.category',
            'asset.location',
            'employee.user',
            'approvedBy',
            'checkedBy',
        ])->findOrFail($id);

        return response()->json($borrowRequest);
    }

    public function edit(string $id)
    {
            $borrowRequest = BorrowRequest::with([
            'asset.category',
            'asset.location',
            'employee.user',
            'approvedBy',
            'checkedBy',
        ])->findOrFail($id);

        return response()->json($borrowRequest);
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'status' => [
                'required',
                'in:pending,borrowed,awaiting_check,returned,rejected',
            ],
            'remarks' => ['nullable', 'string'],
            'return_condition' => ['nullable', 'in:ok,defective'],
        ]);

        $borrowRequest = BorrowRequest::with('asset')->findOrFail($id);

        $updateData = [
            'remarks' => $validated['remarks'] ?? $borrowRequest->remarks,
            'return_condition' => $validated['return_condition'] ?? $borrowRequest->return_condition,
        ];

        if ($validated['status'] === 'borrowed') {
            $updateData['approved_by'] = Auth::id();
            $updateData['approved_at'] = now();
        } elseif ($validated['status'] === 'returned') {
            $updateData['checked_by'] = Auth::id();
            $updateData['returned_at'] = now();
        }

        $borrowRequest->update([
            'status' => $validated['status'],
        ] + $updateData);

        if ($validated['status'] === 'borrowed') {
        $borrowRequest->asset->update([
            'status' => 'borrowed',
                ]);
            }

            if ($validated['status'] === 'returned') {
                $borrowRequest->asset->update([
                    'status' => 'available',
                ]);
            }

        return redirect()
            ->route('borrow-requests.index')
            ->with('success', 'Borrow request updated successfully.');
    }

    public function destroy(string $id)
    {
        BorrowRequest::destroy($id);

        return redirect()
        ->route('borrow-requests.index')
        ->with('success', 'Borrow request deleted successfully.');
    }
}
