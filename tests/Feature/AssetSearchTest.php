<?php

use App\Models\Asset;
use App\Models\AssetType;
use App\Models\Category;
use App\Models\Location;
use App\Models\User;

test('assets can be searched case-insensitively', function () {
    $user = User::factory()->create();
    $category = Category::create(['name' => 'Electronics', 'prefix' => 'ELEC']);
    $location = Location::create(['name' => 'Main Office']);
    $assetType = AssetType::create([
        'category_id' => $category->id,
        'name' => 'Computer Mouse',
        'prefix' => 'MOUSE',
    ]);
    $asset = Asset::factory()->create([
        'name' => 'Mouse',
        'category_id' => $category->id,
        'location_id' => $location->id,
        'asset_type_id' => $assetType->id,
    ]);

    $response = $this->actingAs($user)->get(route('custodian.assets.index', ['search' => 'mouse']));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('custodian/assets')
        ->has('assets.data', 1)
        ->where('assets.data.0.id', $asset->id));
});

test('an out-of-range assets page redirects to the last available page', function () {
    $user = User::factory()->custodian()->create();
    Asset::factory()->count(10)->create();

    $this->actingAs($user)
        ->get(route('custodian.assets.index', ['page' => 2]))
        ->assertRedirect(route('custodian.assets.index', ['page' => 1]));
});

test('available assets can be searched by asset type case-insensitively', function () {
    $user = User::factory()->employee()->create();
    $category = Category::create(['name' => 'Electronics', 'prefix' => 'ELEC']);
    $location = Location::create(['name' => 'Main Office']);
    $assetType = AssetType::create([
        'category_id' => $category->id,
        'name' => 'Computer Mouse',
        'prefix' => 'MOUSE',
    ]);
    $availableAsset = Asset::factory()->create([
        'name' => 'Logitech M310',
        'asset_tag' => 'ELEC-0001',
        'category_id' => $category->id,
        'location_id' => $location->id,
        'asset_type_id' => $assetType->id,
        'status' => 'available',
    ]);
    Asset::factory()->create([
        'name' => 'Logitech M325',
        'asset_tag' => 'ELEC-0002',
        'category_id' => $category->id,
        'location_id' => $location->id,
        'asset_type_id' => $assetType->id,
        'status' => 'borrowed',
    ]);

    $this->actingAs($user)
        ->get(route('employee.assets.index', ['search' => 'mOuSe']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('employee/employee-assets')
            ->has('assets.data', 1)
            ->where('assets.data.0.id', $availableAsset->id));
});
