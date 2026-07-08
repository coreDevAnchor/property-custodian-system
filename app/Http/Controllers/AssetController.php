<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Category;
use App\Models\Location;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AssetController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        $assets = Asset::with([
            'category',
            'location',
            'borrows.employee.user',
        ])->get();

        return Inertia::render('custodian/assets', [
            'assets' => $assets,
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
        Asset::create($request->validate([
            'asset_tag' => 'required',
            'name' => 'required',
            'category_id' => 'required',
            'location_id' => 'required',
            'status' => 'required',
        ]));

        return back();

    }

    /**
     * Display the specified resource.
     */
    public function show(Asset $asset)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Asset $asset)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Asset $asset)
    {
        //
        $asset->update($request->validate([
            'asset_tag' => 'required',
            'name' => 'required',
            'category_id' => 'required',
            'location_id' => 'required',
            'status' => 'required',
        ]));

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Asset $asset)
    {
        //
        $asset->delete();

        return back();
    }
}