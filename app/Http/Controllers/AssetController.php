<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Category;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use App\Models\AssetType;
use App\Models\ActivityLogs;


class AssetController extends Controller
{

    public function index(Request $request)
    {
        $search = $request->string('search')->toString();
        $category = $request->input('category', 'All');
        $status = $request->input('status', 'All');
        $perPage = (int) $request->input('per_page', 10);

        $assets = Asset::with(['category', 'assetType', 'location', 'borrows.employee.user'])
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('asset_tag', 'like', "%{$search}%")
                        ->orWhereHas('category', fn($c) => $c->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('assetType', fn($c) => $c->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('location', fn($c) => $c->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($category !== 'All', fn($q) => $q->where('category_id', $category))
            ->when($status !== 'All', fn($q) => $q->where('status', $status))
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('custodian/assets', [
            'assets' => $assets,
            'categories' => Category::orderBy('name', 'asc')->get(['id', 'name']),
            'assetTypes' => AssetType::with('category:id,name')
                ->orderBy('name')
                ->get(['id', 'name', 'prefix', 'category_id']),
            'locations' => Location::orderBy('name', 'asc')->get(['id', 'name']),
            'filters' => [
                'search' => $search,
                'category' => $category,
                'status' => $status,
                'per_page' => $perPage,
            ],
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
            'condition' => ['nullable', 'integer', 'min:1', 'max:4'],
            'status' => ['required', 'in:available,borrowed,under_repair,disposed'],
            'location_id' => ['nullable', 'exists:locations,id'],
            'remarks' => ['nullable', 'string'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'asset_type_id' => ['required', 'exists:asset_types,id'],
        ], [
            'name.required' => 'Asset name is required.',
            'category_id.required' => 'Category is required.',
            'asset_type_id.required' => 'Asset type is required.',
            'acquisition_date.required' => 'Acquisition date is required.',
            'status.required' => 'Status is required.',
            'serial_number.unique' => 'This serial number already exists.',
            'photo.image' => 'The uploaded file must be an image.',
            'photo.mimes' => 'Only JPG, JPEG, PNG, and WebP images are allowed.',
            'photo.max' => 'The image must not exceed 2MB.',
        ]);

        $validated['asset_tag'] = $this->generateAssetTag($validated['asset_type_id']);
        $validated['acquisition_cost'] ??= 0;
        $validated['depreciation_rate'] ??= 0;
        $validated['condition'] ??= 4;

        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('assets', 'public');
        }

        $asset = Asset::create($validated);

        ActivityLogs::record(
            $asset,
            'asset_created',
            "{$asset->name} ({$asset->asset_tag}) was added to inventory."
        );

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
                'activityLogs.actor',
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
            'condition' => ['nullable', 'integer', 'min:1', 'max:4'],
            'status' => ['required', 'in:available,borrowed,under_repair,disposed'],
            'location_id' => ['nullable', 'exists:locations,id'],
            'remarks' => ['nullable', 'string'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'asset_type_id' => ['required', 'exists:asset_types,id'],
        ]);

        $previousStatus = $asset->status;

        if ($asset->asset_type_id !== (int) $validated['asset_type_id']) {
            $validated['acquisition_cost'] ??= $asset->acquisition_cost;
            $validated['depreciation_rate'] ??= $asset->depreciation_rate;
            $validated['condition'] ??= $asset->condition;
        }

        $validated['depreciation_rate'] ??= 0;

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

            $validated['photo'] = $request->file('photo')->store('assets', 'public');
        }

        $asset->update($validated);

        if ($previousStatus !== $asset->status) {
            $action = match ($asset->status) {
                'disposed' => 'asset_disposed',
                'under_repair' => 'asset_repair_flagged',
                default => 'asset_updated',
            };

            $description = match ($asset->status) {
                'disposed' => "{$asset->name} was marked as disposed.",
                'under_repair' => "{$asset->name} was flagged for repair.",
                default => "{$asset->name} status changed to {$asset->status}.",
            };

            ActivityLogs::record($asset, $action, $description, [
                'from' => $previousStatus,
                'to' => $asset->status,
            ]);
        } else {
            ActivityLogs::record($asset, 'asset_updated', "{$asset->name} details were updated.");
        }

        return redirect()
            ->route('custodian.assets.index')
            ->with('success', 'Asset updated successfully.');
    }

    public function destroy(Asset $asset)
    {
        ActivityLogs::record($asset, 'asset_deleted', "{$asset->name} ({$asset->asset_tag}) was removed from inventory.");

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

        if (!$lastAsset) {
            return "{$prefix}-0001";
        }

        $lastNumber = (int) substr(
            $lastAsset->asset_tag,
            strrpos($lastAsset->asset_tag, '-') + 1
        );

        return $prefix . '-' . sprintf('%04d', $lastNumber + 1);
    }
}
