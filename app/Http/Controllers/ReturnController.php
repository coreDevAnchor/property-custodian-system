<?php

namespace App\Http\Controllers;

use App\Models\BorrowRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ReturnController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->string('search')->toString();
        $status = $request->input('status', 'awaiting_check');
        $sort = $request->input('sort', 'newest');
        $perPage = (int) $request->input('per_page', 10);

        $returns = BorrowRequest::with([
            'asset.category',
            'borrower',
            'checkedBy',
        ])
            ->whereIn('status', ['awaiting_check', 'returned'])

            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('borrower', fn ($u) =>
                        $u->where('name', 'ilike', "%{$search}%")
                    )
                    ->orWhereHas('asset', function ($a) use ($search) {
                        $a->where('name', 'ilike', "%{$search}%")
                            ->orWhere('asset_tag', 'ilike', "%{$search}%")
                            ->orWhereHas('assetType', function ($type) use ($search) {
                                $type->where('name', 'ilike', "%{$search}%");
                            });
                    });
                });
            })
            ->when($status !== 'All', fn($q) => $q->where('status', $status))
            ->when($sort === 'newest', fn($q) => $q->latest('requested_at'))
            ->when($sort === 'oldest', fn($q) => $q->oldest('requested_at'))
            ->when($sort === 'borrower_az', fn($q) => $q->join('users', 'users.id', '=', 'borrows.borrower_id')
                ->orderBy('users.name', 'asc')
                ->select('borrows.*'))
            ->when($sort === 'borrower_za', fn($q) => $q->join('users', 'users.id', '=', 'borrows.borrower_id')
                ->orderBy('users.name', 'desc')
                ->select('borrows.*'))
            ->paginate($perPage)
            ->withQueryString();

        $awaitingCount = BorrowRequest::where('status', 'awaiting_check')->count();

        return Inertia::render('custodian/returns', [
            'returns' => $returns,
            'awaitingCount' => $awaitingCount,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'sort' => $sort,
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

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
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
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
