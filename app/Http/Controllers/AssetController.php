<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Category;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AssetController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('custodian/assets', [
            'assets' => Asset::with(['category', 'location'])
                ->latest()
                ->paginate(10),

            'categories' => Category::orderBy('name', 'asc')->get(),

            'locations' => Location::orderBy('name', 'asc')->get(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * Not used since asset creation is handled through a modal.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category_id' => ['required', 'exists:categories,id'],
            'serial_number' => ['nullable', 'string', 'max:255', 'unique:assets,serial_number'],
            'acquisition_date' => ['required', 'date'],
            'acquisition_cost' => ['required', 'numeric', 'min:0'],
            'depreciation_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'condition' => ['required', 'integer', 'min:1', 'max:5'],
            'status' => ['required', 'in:available,borrowed,under_repair,disposed'],
            'location_id' => ['nullable', 'exists:locations,id'],
            'remarks' => ['nullable', 'string'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
        ]);

        $validated['asset_tag'] = $this->generateAssetTag($validated['category_id']);
        $validated['depreciation_rate'] ??= 0;

        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('assets', 'public');
        }

        Asset::create($validated);

        return redirect()
            ->route('assets.index')
            ->with('success', 'Asset created successfully.');
    }

    /**
     * Display the specified resource.
     *
     * Used by the View Asset modal.
     */
    public function show(Asset $asset)
    {
        return response()->json(
            $asset->load([
                'category',
                'location',
                'currentBorrow',
            ])
        );
    }

    /**
     * Return the asset data for the Edit Asset modal.
     */
    public function edit(Asset $asset)
    {
        return response()->json(
            $asset->load([
                'category',
                'location',
            ])
        );
    }

    /**
     * Update the specified resource.
     */
    public function update(Request $request, Asset $asset)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category_id' => ['required', 'exists:categories,id'],
            'serial_number' => ['nullable', 'string', 'max:255', 'unique:assets,serial_number,' . $asset->id],
            'acquisition_date' => ['required', 'date'],
            'acquisition_cost' => ['required', 'numeric', 'min:0'],
            'depreciation_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'condition' => ['required', 'integer', 'min:1', 'max:5'],
            'status' => ['required', 'in:available,borrowed,under_repair,disposed'],
            'location_id' => ['nullable', 'exists:locations,id'],
            'remarks' => ['nullable', 'string'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
        ]);

        if ($asset->category_id !== (int) $validated['category_id']) {
            $validated['asset_tag'] = $this->generateAssetTag($validated['category_id']);
        }

        $validated['depreciation_rate'] ??= 0;

        if ($request->hasFile('photo')) {

            if ($asset->photo) {
                Storage::disk('public')->delete($asset->photo);
            }

            $validated['photo'] = $request
                ->file('photo')
                ->store('assets', 'public');
        }

        $asset->update($validated);

        return redirect()
            ->route('assets.index')
            ->with('success', 'Asset updated successfully.');
    }

    /**
     * Remove the specified resource.
     */
    public function destroy(Asset $asset)
    {
        if ($asset->photo) {
            Storage::disk('public')->delete($asset->photo);
        }

        Asset::destroy($asset->id);

        return redirect()
            ->route('assets.index')
            ->with('success', 'Asset deleted successfully.');
    }

    /**
     * Generate a unique asset tag based on the category prefix.
     */
    private function generateAssetTag(int $categoryId): string
    {
        $category = Category::findOrFail($categoryId);

        $prefix = strtoupper($category->prefix);

        $lastAsset = Asset::query()
            ->where('asset_tag', 'LIKE', "{$prefix}-%")
            ->orderBy('id', 'desc')
            ->first();

        if (!$lastAsset) {
            return "{$prefix}-0001";
        }

        $lastNumber = (int) substr($lastAsset->asset_tag, strrpos($lastAsset->asset_tag, '-') + 1);

        return $prefix . '-' . sprintf('%04d', $lastNumber + 1);
    }
}