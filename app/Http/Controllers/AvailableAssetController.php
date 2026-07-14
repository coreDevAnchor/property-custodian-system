<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AvailableAssetController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('employee/employee-assets', [
            'assets' => Asset::with('category', 'location')
                ->where('status', 'available')
                ->latest()
                ->paginate(10),

            'categories' => Category::orderBy('name')->get(),
        ]);
    }
}
