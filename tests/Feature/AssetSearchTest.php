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
