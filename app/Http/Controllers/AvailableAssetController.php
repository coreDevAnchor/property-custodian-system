<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Category;
use Inertia\Inertia;
use Illuminate\Http\Request;

class AvailableAssetController extends Controller
{
    //
    public function index()
    {
        return Inertia::render('employee/employee-assets', [
            'assets' => Asset::with('category')
                ->where('status', 'available')
                ->latest()
                ->paginate(10),

            'categories' => Category::orderBy('name')->get(),
        ]);
    }
}
