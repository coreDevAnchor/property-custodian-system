<?php

use App\Models\Asset;
use App\Models\AssetType;
use App\Models\Category;
use App\Models\Location;
use App\Models\User;

test('a category may be checked for its affected assets and asset types', function () {
    $user = User::factory()->custodian()->create();
    $category = Category::create(['name' => 'Electronics', 'prefix' => 'ELEC']);
    $assetType = AssetType::create([
        'category_id' => $category->id,
        'name' => 'Laptop',
        'prefix' => 'ELEC-L',
    ]);
    Asset::factory()->create([
        'name' => 'MacBook',
        'category_id' => $category->id,
        'asset_type_id' => $assetType->id,
    ]);

    $this->actingAs($user)
        ->get(route('custodian.categories.check', $category))
        ->assertOk()
        ->assertJsonPath('assets.0.name', 'MacBook')
        ->assertJsonPath('asset_types.0.name', 'Laptop');
});

test('deleting a category nulls its assets and removes its asset types', function () {
    $user = User::factory()->custodian()->create();
    $category = Category::create(['name' => 'Electronics', 'prefix' => 'ELEC']);
    $assetType = AssetType::create([
        'category_id' => $category->id,
        'name' => 'Laptop',
        'prefix' => 'ELEC-L',
    ]);
    $asset = Asset::factory()->create([
        'name' => 'MacBook',
        'category_id' => $category->id,
        'asset_type_id' => $assetType->id,
    ]);

    $this->actingAs($user)
        ->delete(route('custodian.categories.destroy', $category))
        ->assertOk()
        ->assertJson(['ok' => true]);

    expect(Category::count())->toBe(0)
        ->and(AssetType::count())->toBe(0)
        ->and($asset->refresh()->category_id)->toBeNull()
        ->and($asset->refresh()->asset_type_id)->toBeNull();
});

test('an asset type may be checked for its affected assets', function () {
    $user = User::factory()->custodian()->create();
    $category = Category::create(['name' => 'Electronics', 'prefix' => 'ELEC']);
    $assetType = AssetType::create([
        'category_id' => $category->id,
        'name' => 'Laptop',
        'prefix' => 'ELEC-L',
    ]);
    Asset::factory()->create([
        'name' => 'MacBook',
        'category_id' => $category->id,
        'asset_type_id' => $assetType->id,
    ]);

    $this->actingAs($user)
        ->get(route('custodian.asset-types.check', $assetType))
        ->assertOk()
        ->assertJsonPath('assets.0.name', 'MacBook');
});

test('deleting an asset type nulls it on its assets', function () {
    $user = User::factory()->custodian()->create();
    $category = Category::create(['name' => 'Electronics', 'prefix' => 'ELEC']);
    $assetType = AssetType::create([
        'category_id' => $category->id,
        'name' => 'Laptop',
        'prefix' => 'ELEC-L',
    ]);
    $asset = Asset::factory()->create([
        'name' => 'MacBook',
        'category_id' => $category->id,
        'asset_type_id' => $assetType->id,
    ]);

    $this->actingAs($user)
        ->delete(route('custodian.asset-types.destroy', $assetType))
        ->assertOk()
        ->assertJson(['ok' => true]);

    expect(Category::count())->toBe(1)
        ->and(AssetType::count())->toBe(0)
        ->and($asset->refresh()->asset_type_id)->toBeNull();
});

test('the unspecificed category filter returns only assets with no category', function () {
    $user = User::factory()->custodian()->create();
    $category = Category::create(['name' => 'Electronics', 'prefix' => 'ELEC']);

    $specified = Asset::factory()->create(['category_id' => $category->id]);

    $unspecified = Asset::factory()->create(['category_id' => null]);

    $response = $this->actingAs($user)
        ->get(route('custodian.assets.index', ['category' => 'Unspecified']));

    $response->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('custodian/assets')
            ->has('assets.data', 1)
            ->where('assets.data.0.id', $unspecified->id)
            ->where('assets.data.0.category', null));
});

test('a location may be checked for its affected assets', function () {
    $user = User::factory()->custodian()->create();
    $location = Location::create(['name' => 'Main Office']);
    Asset::factory()->create([
        'name' => 'Printer',
        'location_id' => $location->id,
    ]);

    $this->actingAs($user)
        ->get(route('custodian.locations.check', $location))
        ->assertOk()
        ->assertJsonPath('assets.0.name', 'Printer');
});

test('deleting a location nulls it on its assets', function () {
    $user = User::factory()->custodian()->create();
    $location = Location::create(['name' => 'Main Office']);
    $asset = Asset::factory()->create([
        'name' => 'Printer',
        'location_id' => $location->id,
    ]);

    $this->actingAs($user)
        ->delete(route('custodian.locations.destroy', $location))
        ->assertOk()
        ->assertJson(['ok' => true]);

    expect(Location::count())->toBe(0)
        ->and($asset->refresh()->location_id)->toBeNull();
});

test('a location may be created', function () {
    $user = User::factory()->custodian()->create();

    $this->actingAs($user)
        ->postJson(route('custodian.locations.store'), ['name' => 'Warehouse A'])
        ->assertOk()
        ->assertJsonPath('name', 'Warehouse A');

    expect(Location::where('name', 'Warehouse A')->exists())->toBeTrue();
});
