<?php

namespace App\Http\Controllers;

use App\Models\ActivityLogs;
use App\Models\Asset;
use App\Models\AssetType;
use App\Models\Category;
use App\Models\Employee;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Reader\CSV\Reader as CsvReader;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;
use OpenSpout\Writer\CSV\Writer as CsvWriter;
use OpenSpout\Writer\XLSX\Writer as XlsxWriter;

class AssetController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->string('search')->toString();
        $category = $request->input('category', 'All');
        $status = $request->input('status', 'All');
        $perPage = (int) $request->input('per_page', 10);

        $assets = Asset::query()
            ->select([
                'id',
                'name',
                'asset_tag',
                'description',
                'serial_number',
                'remarks',
                'category_id',
                'asset_type_id',
                'location_id',
                'owner_id',
                'status',
                'condition',
                'photo',
                'amount',
                'acquisition_date',
                'acquisition_cost',
                'depreciation_rate',
            ])
            ->with([
                'category:id,name,unit_type',
                'assetType:id,name,prefix',
                'location:id,name',
                'owner.user:id,name',

                'currentBorrow',

                'currentBorrow.borrower:id,name',
            ])
            ->when($search, function ($query) use ($search) {

                $pattern = "%{$search}%";

                $query->where(function ($q) use ($pattern) {

                    $q->where('name', 'ILIKE', $pattern)
                        ->orWhere('asset_tag', 'ILIKE', $pattern);

                });

            })
            ->when($category !== 'All', fn ($q) => $q->where('category_id', $category))
            ->when($status !== 'All', fn ($q) => $q->where('status', $status))
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        // A page can become invalid when records are removed or a stale pagination
        // request completes after the user has reached the last page. Send the user
        // back to the final available page instead of rendering an empty dead end.
        if ($assets->currentPage() > $assets->lastPage()) {
            return redirect()->to(
                $request->fullUrlWithQuery(['page' => $assets->lastPage()])
            );
        }

        return Inertia::render('custodian/assets', [
            'assets' => $assets,
            'categories' => Category::orderBy('name', 'asc')->get(['id', 'name', 'unit_type']),
            'assetTypes' => AssetType::with('category:id,name')
                ->orderBy('name')
                ->get(['id', 'name', 'prefix', 'category_id']),
            'locations' => Location::orderBy('name', 'asc')->get(['id', 'name']),
            'employees' => Employee::query()
                ->where('is_active', true)
                ->with('user:id,name')
                ->orderBy('employee_id')
                ->get(['id', 'user_id', 'department', 'employee_id'])
                ->sortBy(fn ($employee) => $employee->user?->name ?? '')
                ->values(),
            'filters' => [
                'search' => $search,
                'category' => $category,
                'status' => $status,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function create() {}

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
            'status' => ['required', 'in:available,borrowed,under_repair,disposed,lost'],
            'location_id' => ['nullable', 'exists:locations,id'],
            'remarks' => ['nullable', 'string'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'asset_type_id' => ['required', 'exists:asset_types,id'],
            'amount' => ['nullable', 'integer', 'min:1'],
            'owner_id' => ['nullable', 'exists:employees,id'],
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

        $ownerDescription = '';

        if ($asset->owner_id) {
            $asset->load('owner.user:id,name');

            $ownerDescription = " Assigned to {$asset->owner->user->name}.";
        }

        ActivityLogs::record(
            $asset,
            'asset_created',
            "{$asset->name} ({$asset->asset_tag}) was added to inventory.{$ownerDescription}"
        );

        return redirect()
            ->route('custodian.assets.index')
            ->with('success', 'Asset created successfully.');
    }

    public function show(Request $request, Asset $asset)
    {
        $perPage = max(1, (int) $request->query('per_page', 5));

        $asset->load([
            'category',
            'assetType',
            'location',
            'owner.user:id,name',
            'currentBorrow',
            'borrows.borrower',
        ]);

        $asset->setRelation(
            'activityLogs',
            $asset->activityLogs()
                ->with('actor:id,name')
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->paginate($perPage)
        );

        return response()->json($asset);
    }

    public function edit(Asset $asset)
    {
        return response()->json(
            $asset->load([
                'category',
                'assetType',
                'location',
                'owner.user:id,name',
            ])
        );
    }

    public function update(Request $request, Asset $asset)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category_id' => ['required', 'exists:categories,id'],
            'serial_number' => ['nullable', 'string', 'max:255', 'unique:assets,serial_number,'.$asset->id],
            'acquisition_date' => ['required', 'date'],
            'acquisition_cost' => ['nullable', 'numeric', 'min:0'],
            'depreciation_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'condition' => ['nullable', 'integer', 'min:1', 'max:4'],
            'status' => ['required', 'in:available,borrowed,under_repair,disposed,lost'],
            'location_id' => ['nullable', 'exists:locations,id'],
            'remarks' => ['nullable', 'string'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'asset_type_id' => ['required', 'exists:asset_types,id'],
            'amount' => ['nullable', 'integer', 'min:1'],
            'owner_id' => ['nullable', 'exists:employees,id'],
        ]);

        $previousStatus = $asset->status;
        $previousOwnerId = $asset->owner_id;
        $previousOwnerName = $asset->load('owner.user:id,name')->owner?->user?->name;

        if (
            $asset->status === 'borrowed' &&
            $validated['status'] === 'available'
        ) {
            return back()->withErrors([
                'status' => 'This asset is currently borrowed and cannot be marked as available until it has been returned.',
            ]);
        }

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

        $ownerChanged = ($validated['owner_id'] ?? null) != $previousOwnerId;

        if ($previousStatus !== $asset->status) {
            $action = match ($asset->status) {
                'disposed' => 'asset_disposed',
                'under_repair' => 'asset_repair_flagged',
                'lost' => 'asset_lost',
                default => 'asset_updated',
            };

            $description = match ($asset->status) {
                'disposed' => "{$asset->name} was marked as disposed.",
                'under_repair' => "{$asset->name} was flagged for repair.",
                'lost' => "{$asset->name} was marked as lost.",
                default => "{$asset->name} status changed to {$asset->status}.",
            };

            ActivityLogs::record($asset, $action, $description, [
                'from' => $previousStatus,
                'to' => $asset->status,
            ]);
        } elseif ($ownerChanged) {
            if ($validated['owner_id']) {
                $asset->load('owner.user:id,name');

                ActivityLogs::record(
                    $asset,
                    'asset_updated',
                    "{$asset->name} ownership assigned to {$asset->owner->user->name}.",
                    [
                        'from' => $previousOwnerName,
                        'to' => $asset->owner?->user?->name,
                    ]
                );
            } else {
                ActivityLogs::record(
                    $asset,
                    'asset_updated',
                    "{$asset->name} ownership removed.",
                    [
                        'from' => $previousOwnerName,
                        'to' => null,
                    ]
                );
            }
        } else {
            ActivityLogs::record($asset, 'asset_updated', "{$asset->name} details were updated.");
        }

        return redirect()
            ->route('custodian.assets.index')
            ->with('success', 'Asset updated successfully.');
    }

    public function downloadTemplate(Request $request)
    {
        $format = strtolower($request->query('format', 'xlsx'));

        if (! in_array($format, ['xlsx', 'csv'], true)) {
            $format = 'xlsx';
        }

        $headerRow = [
            'Name',
            'Asset-Tag',
            'Category',
            'Asset Type',
            'Acquisition Cost',
            'Total Depreciation',
            'Amount',
            'Owner',
        ];

        $tempPath = sys_get_temp_dir()
            .DIRECTORY_SEPARATOR
            .'asset-import-template-'
            .uniqid()
            .'.'
            .$format;

        $writer = $format === 'csv' ? new CsvWriter : new XlsxWriter;
        $writer->openToFile($tempPath);
        $writer->addRow(Row::fromValues($headerRow));
        $writer->close();

        return response()
            ->download($tempPath, "asset-import-template.{$format}")
            ->deleteFileAfterSend(true);
    }

    public function import(Request $request)
    {
        $analysis = $this->analyzeImport($request);

        if ($analysis['error']) {
            return back()->withErrors(['file' => $analysis['error']]);
        }

        $importedCount = DB::transaction(function () use ($analysis) {
            $count = 0;

            foreach ($analysis['rows'] as $entry) {
                $categoryName = trim($entry['category']);
                $category = $analysis['categoriesByName']->get($categoryName);

                if (! $category) {
                    $category = Category::create([
                        'name' => $categoryName,
                        'prefix' => $this->generateUniquePrefix($categoryName),
                        'unit_type' => $analysis['categoryPlan'][$categoryName]['unit_type'],
                    ]);

                    $analysis['categoriesByName']->put($categoryName, $category);
                }

                $assetTypeName = trim($entry['asset_type']);
                $typeKey = $category->id.'|'.$assetTypeName;
                $assetType = $analysis['assetTypesByKey']->get($typeKey);

                if (! $assetType) {
                    $assetType = AssetType::create([
                        'category_id' => $category->id,
                        'name' => $assetTypeName,
                        'prefix' => $this->generateUniquePrefix($assetTypeName),
                    ]);

                    $analysis['assetTypesByKey']->put($typeKey, $assetType);
                }

                $acquisitionCost = $entry['acquisition_cost'];

                $asset = Asset::create([
                    'name' => $entry['name'],
                    'asset_tag' => $this->generateAssetTag($assetType->id),
                    'description' => null,
                    'category_id' => $category->id,
                    'asset_type_id' => $assetType->id,
                    'serial_number' => null,
                    'remarks' => 'Imported via Excel upload.',
                    'acquisition_date' => now()->toDateString(),
                    'acquisition_cost' => $acquisitionCost,
                    'depreciation_rate' => $acquisitionCost > 0
                        ? min(100, round(($entry['total_depreciation'] / $acquisitionCost) * 100, 2))
                        : 0,
                    'condition' => 4,
                    'status' => 'available',
                    'photo' => null,
                    'location_id' => null,
                    'owner_id' => $entry['owner_id'],
                    'amount' => $entry['amount'],
                ]);

                ActivityLogs::record(
                    $asset,
                    'asset_created',
                    "{$asset->name} ({$asset->asset_tag}) was added to inventory via Excel import.",
                );

                $count++;
            }

            return $count;
        });

        return redirect()
            ->route('custodian.assets.index')
            ->with('success', "Imported {$importedCount} ".($importedCount === 1 ? 'asset' : 'assets').' from Excel.');
    }

    /**
     * Analyzes an uploaded spreadsheet and returns the import plan without
     * writing anything to the database. Feeds the preview dialog.
     */
    public function preview(Request $request)
    {
        $analysis = $this->analyzeImport($request);

        if ($analysis['error']) {
            return response()->json(['message' => $analysis['error']], 422);
        }

        return response()->json([
            'summary' => $analysis['summary'],
            'rows' => $analysis['rows'],
        ]);
    }

    /**
     * Parses and validates an uploaded spreadsheet without writing anything.
     * Category and Asset Type names are matched exactly (case-sensitive) to
     * existing records so identical names are reused and only unknown names are
     * created. The unit type is inferred from the amount: blank or 1 is a
     * single-unit asset, any amount greater than 1 is multi-unit. Brand-new
     * categories adopt the unit type derived from their rows; existing
     * categories keep their current unit type.
     *
     * @return array{
     *     error: string|null,
     *     rows: list<array<string, mixed>>,
     *     summary: array<string, int>,
     *     categoriesByName: Collection<int, Category>,
     *     assetTypesByKey: Collection<int, AssetType>,
     *     categoryPlan: array<string, array{status: string, unit_type: string, existing: Category|null}>
     * }
     */
    private function analyzeImport(Request $request): array
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,csv,txt', 'max:5120'],
        ], [
            'file.required' => 'Please choose an Excel (.xlsx) or CSV file to upload.',
            'file.mimes' => 'The file must be a .xlsx or .csv spreadsheet.',
            'file.max' => 'The file must not exceed 5MB.',
        ]);

        $extension = strtolower($request->file('file')->getClientOriginalExtension());

        try {
            [$headerRow, $dataRows] = $this->parseSpreadsheet(
                $request->file('file')->getRealPath(),
                $extension,
            );
        } catch (\Throwable) {
            return ['error' => 'Could not read the file. Please make sure it is a valid .xlsx or .csv spreadsheet.'];
        }

        if ($headerRow === null) {
            return ['error' => 'The file is empty. It must start with a header row.'];
        }

        // ── Strict header validation ──
        // The upload is rejected unless the header row contains every required
        // column and nothing outside the allowed set.
        $normalizeHeader = fn ($header) => preg_replace('/[\s_\-]+/', '', strtolower(trim((string) $header)));

        $requiredHeaders = ['name', 'assettag', 'category', 'assettype', 'acquisitioncost', 'totaldepreciation'];
        $optionalHeaders = ['amount', 'owner'];

        $headerLabels = [
            'name' => 'Name',
            'assettag' => 'Asset-Tag',
            'category' => 'Category',
            'assettype' => 'Asset Type',
            'acquisitioncost' => 'Acquisition Cost',
            'totaldepreciation' => 'Total Depreciation',
            'amount' => 'Amount',
            'owner' => 'Owner',
        ];

        $normalizedHeaders = array_map($normalizeHeader, $headerRow);

        $missing = array_values(array_diff($requiredHeaders, $normalizedHeaders));
        $allowedHeaders = array_merge($requiredHeaders, $optionalHeaders);

        $unexpectedOriginal = [];
        foreach ($headerRow as $index => $original) {
            $normalized = $normalizedHeaders[$index];

            if ($normalized === '' || in_array($normalized, $allowedHeaders, true)) {
                continue;
            }

            $unexpectedOriginal[] = trim((string) $original);
        }

        if ($missing || $unexpectedOriginal) {
            $problems = ['Upload rejected — the spreadsheet columns do not match the required template.'];

            if ($missing) {
                $problems[] = 'Missing column(s): '.implode(', ', array_map(
                    fn ($key) => $headerLabels[$key],
                    $missing,
                )).'.';
            }

            if ($unexpectedOriginal) {
                $problems[] = 'Unexpected column(s): '.implode(', ', $unexpectedOriginal).'.';
            }

            $problems[] = 'Expected columns: Name, Asset-Tag, Category, Asset Type, Acquisition Cost, Total Depreciation'
                .' (optional: Amount, Owner).';

            return ['error' => implode("\n", $problems)];
        }

        // ── Exact match lookup caches ──
        $categoriesByName = Category::all()->keyBy(fn ($category) => trim($category->name));

        $assetTypesByKey = AssetType::all()
            ->keyBy(fn ($type) => $type->category_id.'|'.trim($type->name));

        $employeesByName = Employee::query()
            ->where('is_active', true)
            ->with('user:id,name')
            ->get()
            ->keyBy(fn ($employee) => mb_strtolower(trim(optional($employee->user)->name ?? '')));

        $errorLines = [];
        $validRows = [];
        $categoryPlan = [];

        foreach ($dataRows as $index => $cells) {
            $rowNumber = $index + 2; // account for the header row

            $valueByHeader = [];
            foreach ($normalizedHeaders as $columnIndex => $normalizedHeader) {
                $valueByHeader[$normalizedHeader] = $cells[$columnIndex] ?? null;
            }

            $getName = fn (string $key) => isset($valueByHeader[$key]) && $valueByHeader[$key] !== null
                ? trim((string) $valueByHeader[$key])
                : '';

            $name = $getName('name');
            $categoryName = $getName('category');
            $assetTypeName = $getName('assettype');
            $costRaw = $getName('acquisitioncost');
            $depreciationRaw = $getName('totaldepreciation');
            $amountRaw = $getName('amount');
            $ownerName = $getName('owner');

            $rowErrors = [];

            if ($name === '') {
                $rowErrors[] = 'Name is required.';
            } elseif (mb_strlen($name) > 255) {
                $rowErrors[] = 'Name must not exceed 255 characters.';
            }

            if ($categoryName === '') {
                $rowErrors[] = 'Category is required.';
            }

            if ($assetTypeName === '') {
                $rowErrors[] = 'Asset Type is required.';
            }

            if (! is_numeric($costRaw)) {
                $rowErrors[] = 'Acquisition Cost must be a number.';
            } elseif ((float) $costRaw < 0) {
                $rowErrors[] = 'Acquisition Cost cannot be negative.';
            }

            if (! is_numeric($depreciationRaw)) {
                $rowErrors[] = 'Total Depreciation must be a number.';
            } elseif ((float) $depreciationRaw < 0) {
                $rowErrors[] = 'Total Depreciation cannot be negative.';
            } elseif (is_numeric($costRaw) && (float) $costRaw >= 0 && (float) $depreciationRaw > (float) $costRaw) {
                $rowErrors[] = 'Total Depreciation cannot exceed the Acquisition Cost.';
            }

            $amount = 1;

            if ($amountRaw !== '') {
                $amountDigits = ltrim($amountRaw, '+');

                if (! ctype_digit($amountDigits) || (int) $amountDigits < 1) {
                    $rowErrors[] = 'Amount must be a whole number of at least 1.';
                } else {
                    $amount = (int) $amountDigits;
                }
            }

            $ownerId = null;

            if ($ownerName !== '') {
                $employee = $employeesByName->get(mb_strtolower($ownerName));

                if (! $employee) {
                    $rowErrors[] = "Owner \"{$ownerName}\" does not match any active employee.";
                } else {
                    $ownerId = $employee->id;
                }
            }

            if ($rowErrors) {
                $errorLines[] = "Row {$rowNumber}: ".implode(' ', $rowErrors);

                continue;
            }

            // Unit type is inferred from the amount: blank or 1 is a
            // single-unit asset, anything greater is a multi-unit asset.
            $unitType = $amount > 1 ? Category::UNIT_MULTI : Category::UNIT_SINGLE;

            if (! array_key_exists($categoryName, $categoryPlan)) {
                $existingCategory = $categoriesByName->get($categoryName);

                $categoryPlan[$categoryName] = [
                    'status' => $existingCategory ? 'existing' : 'new',
                    'unit_type' => $existingCategory ? $existingCategory->unit_type : Category::UNIT_SINGLE,
                    'existing' => $existingCategory,
                ];
            }

            // A brand-new category that carries any multi-unit row is created
            // as multi-unit; existing categories keep their unit type.
            if ($unitType === Category::UNIT_MULTI
                && $categoryPlan[$categoryName]['existing'] === null
                && $categoryPlan[$categoryName]['unit_type'] === Category::UNIT_SINGLE) {
                $categoryPlan[$categoryName]['unit_type'] = Category::UNIT_MULTI;
            }

            $validRows[] = [
                'row' => $rowNumber,
                'name' => $name,
                'category' => $categoryName,
                'asset_type' => $assetTypeName,
                'amount' => $amount,
                'unit_type' => $unitType,
                'category_status' => $categoryPlan[$categoryName]['status'],
                'asset_type_status' => $categoryPlan[$categoryName]['status'] === 'existing'
                    ? ($assetTypesByKey->has($categoryPlan[$categoryName]['existing']->id.'|'.$assetTypeName) ? 'existing' : 'new')
                    : 'new',
                'owner_id' => $ownerId,
                'acquisition_cost' => round((float) $costRaw, 2),
                'total_depreciation' => round((float) $depreciationRaw, 2),
            ];
        }

        if ($errorLines) {
            $rowCount = count($errorLines);

            array_unshift(
                $errorLines,
                "Import aborted — {$rowCount} ".($rowCount === 1 ? 'row has' : 'rows have')
                .' problems. Fix them and upload again. Nothing has been saved.'
            );

            return ['error' => implode("\n", $errorLines)];
        }

        if (empty($validRows)) {
            return ['error' => 'No data rows found. Add at least one asset below the header row.'];
        }

        $assetTypePlan = [];
        foreach ($validRows as $entry) {
            $assetTypePlan[$entry['category'].'|'.$entry['asset_type']] = $entry['asset_type_status'];
        }

        return [
            'error' => null,
            'rows' => $validRows,
            'summary' => [
                'total' => count($validRows),
                'single' => count(array_filter($validRows, fn ($entry) => $entry['unit_type'] === Category::UNIT_SINGLE)),
                'multi' => count(array_filter($validRows, fn ($entry) => $entry['unit_type'] === Category::UNIT_MULTI)),
                'categories_existing' => count(array_filter($categoryPlan, fn ($entry) => $entry['status'] === 'existing')),
                'categories_new' => count(array_filter($categoryPlan, fn ($entry) => $entry['status'] === 'new')),
                'asset_types_existing' => count(array_filter($assetTypePlan, fn ($status) => $status === 'existing')),
                'asset_types_new' => count(array_filter($assetTypePlan, fn ($status) => $status === 'new')),
            ],
            'categoriesByName' => $categoriesByName,
            'assetTypesByKey' => $assetTypesByKey,
            'categoryPlan' => $categoryPlan,
        ];
    }

    /**
     * Builds a short uppercase prefix from a name (word initials), keeping it
     * unique against existing records by appending an incrementing suffix.
     */
    private function generateUniquePrefix(string $name): string
    {
        preg_match_all('/[A-Za-z0-9]+/', $name, $words);

        $base = '';

        foreach ($words[0] as $word) {
            $base .= strtoupper(substr($word, 0, 1));
        }

        if ($base === '') {
            $base = 'GEN';
        }

        $base = substr($base, 0, 4);

        $candidate = $base;
        $suffix = 1;

        while (
            Category::where('prefix', $candidate)->exists() ||
            AssetType::where('prefix', $candidate)->exists()
        ) {
            $candidate = $base.str_pad((string) ++$suffix, 2, '0', STR_PAD_LEFT);
        }

        return $candidate;
    }

    /**
     * @return array{0: list<mixed>|null, 1: list<list<mixed>>}
     */
    private function parseSpreadsheet(string $path, string $extension): array
    {
        $reader = $extension === 'csv' ? new CsvReader : new XlsxReader;

        $reader->open($path);

        $headerRow = null;
        $rows = [];

        foreach ($reader->getSheetIterator() as $sheet) {
            foreach ($sheet->getRowIterator() as $row) {
                $cells = $row->toArray();

                if ($headerRow === null) {
                    $headerRow = $cells;

                    continue;
                }

                if ($row->isEmpty()) {
                    $hasContent = collect($cells)
                        ->contains(fn ($value) => $value !== null && trim((string) $value) !== '');

                    if (! $hasContent) {
                        continue;
                    }
                }

                $rows[] = $cells;
            }

            break; // only read the first sheet
        }

        $reader->close();

        return [$headerRow, $rows];
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

        if (! $lastAsset) {
            return "{$prefix}-0001";
        }

        $lastNumber = (int) substr(
            $lastAsset->asset_tag,
            strrpos($lastAsset->asset_tag, '-') + 1
        );

        return $prefix.'-'.sprintf('%04d', $lastNumber + 1);
    }
}
