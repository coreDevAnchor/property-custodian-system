<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Category;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use App\Models\AssetType;

class AssetController extends Controller
{

    public function index()
    {
        return Inertia::render('custodian/assets', [
            'assets' => Asset::with([
                    'category',
                    'assetType',
                    'location',
                    'borrows.employee.user',
                ])
            ->latest()
            ->paginate(10),

            'categories' => Category::orderBy('name', 'asc')->get(),

            'assetTypes' => AssetType::with('category')
                ->orderBy('name')
                ->get(),

            'locations' => Location::orderBy('name', 'asc')->get(),
        ]);
    }

    public function create()
    {

    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category_id' => ['required', 'exists:categories,id'],
            'serial_number' => ['nullable', 'string', 'max:255', 'unique:assets,serial_number'],
            'acquisition_date' => ['required', 'date'],
            'acquisition_cost' => ['nullable', 'numeric', 'min:0'],
            'depreciation_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'condition' => ['nullable', 'integer', 'min:1', 'max:5'],
            'status' => ['required', 'in:available,borrowed,under_repair,disposed'],
            'location_id' => ['nullable', 'exists:locations,id'],
            'remarks' => ['nullable', 'string'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
            'asset_type_id' => ['required', 'exists:asset_types,id'],
        ]);

        $validated['asset_tag'] = $this->generateAssetTag($validated['asset_type_id']);
        $validated['acquisition_cost'] ??= 0;
        $validated['depreciation_rate'] ??= 0;
        $validated['condition'] ??= 5;

        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('assets', 'public');
        }

        Asset::create($validated);

        return redirect()
            ->route('custodian.assets.index')
            ->with('success', 'Asset created successfully.');
    }

    public function show(Asset $asset)
    {
        return response()->json(
            $asset->load([
                'category',
                'assetType',
                'location',
                'currentBorrow',
            ])
        );
    }

    public function edit(Asset $asset)
    {
        return response()->json(
            $asset->load([
                'category',
                'assetType',
                'location',
            ])
        );
    }

    public function update(Request $request, Asset $asset)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category_id' => ['required', 'exists:categories,id'],
            'serial_number' => ['nullable', 'string', 'max:255', 'unique:assets,serial_number,' . $asset->id],
            'acquisition_date' => ['required', 'date'],
            'acquisition_cost' => ['nullable', 'numeric', 'min:0'],
            'depreciation_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'condition' => ['nullable', 'integer', 'min:1', 'max:5'],
            'status' => ['required', 'in:available,borrowed,under_repair,disposed'],
            'location_id' => ['nullable', 'exists:locations,id'],
            'remarks' => ['nullable', 'string'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
            'asset_type_id' => ['required', 'exists:asset_types,id'],
        ]);

        if ($asset->asset_type_id !== (int) $validated['asset_type_id']) {
            $validated['acquisition_cost'] ??= $asset->acquisition_cost;
            $validated['depreciation_rate'] ??= $asset->depreciation_rate;
            $validated['condition'] ??= $asset->condition;
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
            ->route('custodian.assets.index')
            ->with('success', 'Asset updated successfully.');
    }

    public function destroy(Asset $asset)
    {
        if ($asset->photo) {
            Storage::disk('public')->delete($asset->photo);
        }

        Asset::destroy($asset->id);

        return redirect()
            ->route('custodian.assets.index')
            ->with('success', 'Asset deleted successfully.');
    }

    private function generateAssetTag(int $assetTypeId): string
    {
        $assetType = AssetType::findOrFail($assetTypeId);

        $prefix = strtoupper($assetType->prefix);

        $lastAsset = Asset::where('asset_tag', 'LIKE', "{$prefix}-%", 'and')
            ->latest('id')
            ->first();

        if (! $lastAsset) {
            return "{$prefix}-0001";
        }

        $lastNumber = (int) substr(
            $lastAsset->asset_tag,
            strrpos($lastAsset->asset_tag, '-') + 1
        );

        return $prefix . '-' . sprintf('%04d', $lastNumber + 1);
    }
}