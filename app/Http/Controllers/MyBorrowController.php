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
        $employee = Auth::user()->employee;

        return Inertia::render('employee/my-borrows', [
            'borrows' => BorrowRequest::with(['asset.category'])
                ->where('employee_id', $employee->id)
                ->latest('requested_at')
                ->paginate(10),
        ]);
    }
}
