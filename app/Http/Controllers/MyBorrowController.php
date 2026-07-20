<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\BorrowRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MyBorrowController extends Controller
{
    //
    public function index()
    {
        $user = Auth::user();

        return Inertia::render('employee/my-borrows', [
            'borrows' => BorrowRequest::with(['asset.category'])
                ->where('borrower_id', $user->id)
                ->latest('requested_at')
                ->paginate(10),
        ]);
    }
}
