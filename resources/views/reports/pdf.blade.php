<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Property Custodian Report</title>
    <style>
        /* ── Reset & Base ── */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            margin: 0;
        }

        body {
            font-family: 'DejaVu Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 10.5px;
            color: #1f2937;
            line-height: 1.55;
            background: #fff;
            padding: 0.5in 0.5in 0.65in 0.5in;
        }

        /* ── Page Header ── */
        .page-header {
            border-bottom: 2px solid #1e293b;
            padding-bottom: 16px;
            margin-bottom: 36px;
        }

        .page-header h1 {
            font-size: 19px;
            font-weight: 700;
            letter-spacing: 0.6px;
            text-transform: uppercase;
            color: #1e293b;
            margin-bottom: 3px;
        }

        .page-header .subtitle {
            font-size: 10px;
            color: #6b7280;
            font-style: italic;
        }

        .meta-row {
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
            font-size: 9px;
            color: #4b5563;
        }

        .meta-row span {
            margin-right: 20px;
        }

        .meta-row strong {
            color: #1f2937;
            font-weight: 700;
        }

        /* ── Section ── */
        .section {
            margin-bottom: 40px;
        }

        .section-title {
            font-size: 12.5px;
            font-weight: 700;
            letter-spacing: 0.4px;
            text-transform: uppercase;
            color: #1e293b;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 8px;
            margin-bottom: 22px;
        }

        .chart-title {
            font-weight: 700;
            font-size: 10.5px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 12px;
            color: #374151;
            margin-top: 18px;
            margin-bottom: 18px;
        }

        /* ── Summary KPI Grid ── */
        .kpi-grid { 
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 22px;
        }

        .kpi-grid tr {
            height: 84px;
        }


        .kpi-grid td {
            width: 25%;
            padding: 16px 16px;
            vertical-align: top;
            border: 1px solid #e2e8f0;
        }

        .kpi-label {
            font-size: 8.5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6b7280;
            font-weight: 700;
        }

        .kpi-value {
            font-size: 17px;
            font-weight: 700;
            color: #1e293b;
            margin-top: 3px;
        }

        .kpi-value.currency {
            color: #065f46;
        }

        .kpi-value.danger {
            color: #991b1b;
        }

        .kpi-value.warning {
            color: #92400e;
        }

        /* ── Data Tables ── */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5px;
        }

        .data-table thead th {
            background: #f1f5f9;
            border: 1px solid #dfe4ea;
            padding: 8px 10px;
            text-align: left;
            font-weight: 700;
            color: #334155;
            font-size: 8.5px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }

        .data-table tbody td {
            border: 1px solid #e2e8f0;
            padding: 7px 10px;
            color: #1f2937;
        }

        .data-table tbody tr:nth-child(even) {
            background: #f8fafc;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 9px;
            font-weight: 600;
        }

        .badge-red {
            background: #fee2e2;
            color: #b91c1c;
        }

        .badge-amber {
            background: #fef3c7;
            color: #92400e;
        }

        .badge-green {
            background: #dcfce7;
            color: #166534;
        }

        /* ── Bar Chart: Asset Condition ── */
        .bar-chart {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
        }

        .bar-chart-cell {
            width: 25%;
            text-align: center;
            vertical-align: bottom;
            padding: 0 18px 10px 18px;
            border-bottom: 1px solid #94a3b8;
        }

        .bar-chart-value {
            font-size: 10px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 5px;
        }

        .bar-chart-track {
            position: relative;
            width: 34px;
            margin: 0 auto;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
        }

        .bar-chart-fill {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
        }

        .bar-chart-label {
            margin-top: 7px;
            font-size: 8.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            color: #4b5563;
        }

        /* ── Grouped Bar Chart: Monthly Usage ── */
        .chart-legend {
            margin-bottom: 14px;
            font-size: 9px;
            color: #4b5563;
        }

        .legend-item {
            display: inline-block;
            margin-right: 18px;
        }

        .legend-swatch {
            display: inline-block;
            width: 8px;
            height: 8px;
            margin-right: 5px;
        }

        .grouped-bar-chart {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .grouped-bar-cell {
            text-align: center;
            vertical-align: bottom;
            padding: 0 5px 10px 5px;
            border-bottom: 1px solid #94a3b8;
        }

        .grouped-bar-group {
            width: 100%;
            border-collapse: collapse;
            margin: 0 auto;
        }

        .grouped-bar-track-cell {
            width: 33.33%;
            vertical-align: bottom;
            padding: 0 1.5px;
        }

        .grouped-bar-track {
            position: relative;
            width: 100%;
            max-width: 13px;
            margin: 0 auto;
            background: #f1f5f9;
        }

        .grouped-bar-fill {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
        }

        .grouped-bar-label {
            margin-top: 7px;
            font-size: 8.5px;
            font-weight: 700;
            color: #4b5563;
        }

        /* ── Monthly Stats Table (fallback / data reference) ── */
        .stats-summary-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5px;
            margin-top: 18px;
        }

        .stats-summary-table th {
            background: #f1f5f9;
            border: 1px solid #dfe4ea;
            padding: 6px 10px;
            text-align: left;
            font-weight: 700;
            color: #334155;
            font-size: 8.5px;
            text-transform: uppercase;
        }

        .stats-summary-table td {
            border: 1px solid #e2e8f0;
            padding: 6px 10px;
            color: #1f2937;
        }

        /* ── Borrower Analytics ── */
        .analytics-columns {
            width: 100%;
        }

        .analytics-columns td {
            width: 50%;
            vertical-align: top;
            padding: 0 8px;
        }

        .analytics-columns td:first-child {
            padding-left: 0;
        }

        .analytics-columns td:last-child {
            padding-right: 0;
        }

        .mini-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5px;
            margin-bottom: 16px;
        }

        .mini-table caption {
            text-align: left;
            font-weight: 700;
            font-size: 10.5px;
            color: #1e293b;
            padding-bottom: 7px;
        }

        .mini-table th {
            background: #f1f5f9;
            border: 1px solid #dfe4ea;
            padding: 5px 8px;
            text-align: left;
            font-weight: 700;
            font-size: 8.5px;
            text-transform: uppercase;
            color: #6b7280;
        }

        .mini-table td {
            border: 1px solid #e2e8f0;
            padding: 5px 8px;
            color: #1f2937;
        }

        /* ── Footer ── */
        .page-footer {
            position: fixed;
            bottom: 0.15in;
            left: 0.5in;
            right: 0.5in;
            text-align: center;
            font-size: 8px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 6px;
        }

        .page-footer .page-number:before {
            content: counter(page) " of " counter(pages);
        }

        /* ── Record limit note ── */
        .limit-note {
            font-size: 8.5px;
            color: #9ca3af;
            font-style: italic;
            margin-top: 6px;
        }

        /* ── Page break helper ── */
        .page-break {
            page-break-before: always;
        }
    </style>
</head>

<body>

    {{-- ── Page Header ── --}}
    <div class="page-header">
        <h1>Property Custodian Report</h1>
        <p class="subtitle">Asset management report generated from the Property Custodian System</p>
        <div class="meta-row">
            <span><strong>Generated:</strong> {{ $generatedAt }}</span>
            <span><strong>Period:</strong> {{ ucfirst($headerPeriod) }}</span>
            @if($category !== 'all')
                <span><strong>Category:</strong> {{ $categoryName }}</span>
            @endif
            <span><strong>Orientation:</strong> {{ ucfirst($orientation) }}</span>
            @if($recordLimit !== 'all')
                <span><strong>Record Limit:</strong> {{ $recordLimit }}</span>
            @endif
        </div>
    </div>

    @php $firstSectionRendered = false; @endphp

    {{-- ── Section: Executive Summary ── --}}
    @if(in_array('summary', $sections))
        <div class="section {{ $firstSectionRendered ? 'page-break' : '' }}">
            @php $firstSectionRendered = true; @endphp
            <h2 class="section-title">Executive Summary</h2>

            <table class="kpi-grid">
                <tr>
                    <td>
                        <div class="kpi-label">Total Assets</div>
                        <div class="kpi-value">{{ number_format($summary['totalAssets']) }}</div>
                    </td>
                    <td>
                        <div class="kpi-label">Total Borrow Requests</div>
                        <div class="kpi-value">{{ number_format($summary['totalBorrowRequests']) }}</div>
                    </td>
                    <td>
                        <div class="kpi-label">Approved Borrows</div>
                        <div class="kpi-value">{{ number_format($summary['approvedBorrows']) }}</div>
                    </td>
                    <td>
                        <div class="kpi-label">Returned</div>
                        <div class="kpi-value">{{ number_format($summary['returnedBorrows']) }}</div>
                    </td>
                </tr>
                <tr>
                    <td>
                        <div class="kpi-label">Overdue Items</div>
                        <div class="kpi-value danger">{{ number_format($summary['overdueItems']) }}</div>
                    </td>
                    <td>
                        <div class="kpi-label">Lost Assets</div>
                        <div class="kpi-value danger">{{ number_format($summary['lostAssets']) }}</div>
                    </td>
                    <td>
                        <div class="kpi-label">Defective</div>
                        <div class="kpi-value warning">{{ number_format($summary['defectiveAssets']) }}</div>
                    </td>
                    <td>
                        <div class="kpi-label">Asset Value</div>
                        <div class="kpi-value currency">₱{{ number_format($summary['totalAssetValue'], 2) }}</div>
                    </td>
                </tr>
                <tr>
                    <td>
                        <div class="kpi-label">Total Depreciation</div>
                        <div class="kpi-value">₱{{ number_format($summary['totalDepreciation'], 2) }}</div>
                    </td>
                    <td>
                        <div class="kpi-label">Estimated Value</div>
                        <div class="kpi-value currency">₱{{ number_format($summary['currentEstimatedValue'], 2) }}</div>
                    </td>
                    <td colspan="2">
                        <div class="kpi-label">Return Conditions</div>
                        <div style="margin-top: 6px; font-size: 10px; color: #1f2937;">
                            OK: {{ $summary['returnConditions']['ok'] }}
                            &nbsp;&nbsp;&nbsp; Defective: {{ $summary['returnConditions']['defective'] }}
                            &nbsp;&nbsp;&nbsp; Lost: {{ $summary['returnConditions']['lost'] }}
                        </div>
                    </td>
                </tr>
            </table>

            {{-- Asset Condition Breakdown — Bar Chart --}}
            @php
                $condConfig = [
                    'excellent' => ['label' => 'Excellent', 'color' => '#16a34a'],
                    'good' => ['label' => 'Good', 'color' => '#2563eb'],
                    'fair' => ['label' => 'Fair', 'color' => '#d97706'],
                    'poor' => ['label' => 'Poor', 'color' => '#dc2626'],
                ];
                $condChartHeight = 110;
                $condMax = max(max($summary['assetConditions']), 1);
            @endphp
            <p class="chart-title">Asset Condition Breakdown</p>
            <table class="bar-chart">
                <tr>
                    @foreach($condConfig as $key => $cfg)
                        @php
                            $val = $summary['assetConditions'][$key] ?? 0;
                            $barHeight = (int) round(($val / $condMax) * $condChartHeight);
                            if ($val > 0 && $barHeight < 2) {
                                $barHeight = 2;
                            }
                        @endphp
                        <td class="bar-chart-cell">
                            <div class="bar-chart-value">{{ $val }}</div>
                            <div class="bar-chart-track" style="height: {{ $condChartHeight }}px;">
                                <div class="bar-chart-fill"
                                    style="height: {{ $barHeight }}px; background: {{ $cfg['color'] }};"></div>
                            </div>
                            <div class="bar-chart-label">{{ $cfg['label'] }}</div>
                        </td>
                    @endforeach
                </tr>
            </table>
        </div>
    @endif

    {{-- ── Section: Monthly Usage Statistics ── --}}
    @if(in_array('usage_chart', $sections))
        <div class="section {{ $firstSectionRendered ? 'page-break' : '' }}">
            @php $firstSectionRendered = true; @endphp
            <h2 class="section-title">Monthly Usage Statistics</h2>

            @php
                $usageConfig = $usageMetric === 'borrows'
                    ? [
                        'pending' => ['label' => 'Pending', 'color' => '#d97706'],
                        'returned' => ['label' => 'Returned', 'color' => '#16a34a'],
                        'rejected' => ['label' => 'Rejected', 'color' => '#dc2626'],
                    ]
                    : [
                        'good' => ['label' => 'Good', 'color' => '#2563eb'],
                        'defective' => ['label' => 'Defective', 'color' => '#d97706'],
                        'lost' => ['label' => 'Lost', 'color' => '#dc2626'],
                    ];

                $usageChartHeight = 95;
                $usageMax = 1;
                foreach ($monthlyUsage as $point) {
                    foreach ($usageConfig as $mk => $mcfg) {
                        $usageMax = max($usageMax, $point[$mk] ?? 0);
                    }
                }
            @endphp

            <div class="chart-legend">
                @foreach($usageConfig as $mk => $mcfg)
                    <span class="legend-item">
                        <span class="legend-swatch" style="background: {{ $mcfg['color'] }};"></span>{{ $mcfg['label'] }}
                    </span>
                @endforeach
            </div>

            <table class="grouped-bar-chart">
                <tr>
                    @forelse($monthlyUsage as $point)
                        <td class="grouped-bar-cell">
                            <table class="grouped-bar-group">
                                <tr>
                                    @foreach($usageConfig as $mk => $mcfg)
                                        @php
                                            $val = $point[$mk] ?? 0;
                                            $barHeight = (int) round(($val / $usageMax) * $usageChartHeight);
                                            if ($val > 0 && $barHeight < 2) {
                                                $barHeight = 2;
                                            }
                                        @endphp
                                        <td class="grouped-bar-track-cell">
                                            <div class="grouped-bar-track" style="height: {{ $usageChartHeight }}px;">
                                                <div class="grouped-bar-fill"
                                                    style="height: {{ $barHeight }}px; background: {{ $mcfg['color'] }};"></div>
                                            </div>
                                        </td>
                                    @endforeach
                                </tr>
                            </table>
                            <div class="grouped-bar-label">{{ $point['label'] }}</div>
                        </td>
                    @empty
                        <td class="text-center">No usage data available.</td>
                    @endforelse
                </tr>
            </table>

            {{-- Underlying figures for reference --}}
            @if($usageMetric === 'borrows')
                <table class="stats-summary-table">
                    <thead>
                        <tr>
                            <th>Period</th>
                            <th class="text-right">Pending</th>
                            <th class="text-right">Returned</th>
                            <th class="text-right">Rejected</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($monthlyUsage as $point)
                            <tr>
                                <td>{{ $point['label'] }}</td>
                                <td class="text-right">{{ $point['pending'] ?? 0 }}</td>
                                <td class="text-right">{{ $point['returned'] ?? 0 }}</td>
                                <td class="text-right">{{ $point['rejected'] ?? 0 }}</td>
                                <td class="text-right"><strong>{{ $point['count'] }}</strong></td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @else
                <table class="stats-summary-table">
                    <thead>
                        <tr>
                            <th>Period</th>
                            <th class="text-right">Good</th>
                            <th class="text-right">Defective</th>
                            <th class="text-right">Lost</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($monthlyUsage as $point)
                            <tr>
                                <td>{{ $point['label'] }}</td>
                                <td class="text-right">{{ $point['good'] ?? 0 }}</td>
                                <td class="text-right">{{ $point['defective'] ?? 0 }}</td>
                                <td class="text-right">{{ $point['lost'] ?? 0 }}</td>
                                <td class="text-right"><strong>{{ $point['count'] }}</strong></td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>
    @endif

    {{-- ── Section: Asset Inventory Table ── --}}
    @if(in_array('assets', $sections))
        <div class="section {{ $firstSectionRendered ? 'page-break' : '' }}">
            @php $firstSectionRendered = true; @endphp
            <h2 class="section-title">Asset Inventory</h2>

            <table class="data-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Asset Tag</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th class="text-right">Cost</th>
                        <th class="text-right">Depr. Rate</th>
                        <th class="text-right">Total Depr.</th>
                        <th>Added</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($assets as $i => $asset)
                        <tr>
                            <td>{{ $i + 1 }}</td>
                            <td>{{ $asset->name }}</td>
                            <td>{{ $asset->asset_tag }}</td>
                            <td>{{ $asset->category?->name ?? '—' }}</td>
                            <td>{{ $asset->assetType?->name ?? '—' }}</td>
                            <td class="text-right">₱{{ number_format($asset->acquisition_cost, 2) }}</td>
                            <td class="text-right">{{ $asset->depreciation_rate ? $asset->depreciation_rate . '%' : '—' }}</td>
                            <td class="text-right">
                                @if($asset->depreciation_rate)
                                    ₱{{ number_format($asset->acquisition_cost * ($asset->depreciation_rate / 100), 2) }}
                                @else
                                    —
                                @endif
                            </td>
                            <td>{{ $asset->created_at?->format('M d, Y') }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="9" class="text-center">No assets found.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>

            @if($recordLimit !== 'all' && $assetsTotalCount > (int) $recordLimit)
                <p class="limit-note">Showing {{ count($assets) }} of {{ number_format($assetsTotalCount) }} total records.</p>
            @endif
        </div>
    @endif

    {{-- ── Section: Overdue Items Table ── --}}
    @if(in_array('overdue', $sections))
        <div class="section {{ $firstSectionRendered ? 'page-break' : '' }}">
            @php $firstSectionRendered = true; @endphp
            <h2 class="section-title">Overdue Items</h2>

            <table class="data-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Borrower</th>
                        <th>Asset</th>
                        <th>Asset Tag</th>
                        <th>Category</th>
                        <th>Expected Return</th>
                        <th class="text-right">Days Overdue</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($overdueItems as $i => $item)
                        <tr>
                            <td>{{ $i + 1 }}</td>
                            <td>{{ $item['borrower'] ?? '—' }}</td>
                            <td>{{ $item['asset_name'] ?? '—' }}</td>
                            <td>{{ $item['asset_tag'] ?? '—' }}</td>
                            <td>{{ $item['category'] ?? '—' }}</td>
                            <td>{{ \Carbon\Carbon::parse($item['expected_return_date'])->format('M d, Y') }}</td>
                            <td class="text-right">{{ $item['days_overdue'] }}
                                {{ $item['days_overdue'] === 1 ? 'day' : 'days' }}
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="7" class="text-center">No overdue items.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>

            @if($recordLimit !== 'all' && $overdueTotalCount > (int) $recordLimit)
                <p class="limit-note">Showing {{ count($overdueItems) }} of {{ number_format($overdueTotalCount) }} total
                    records.</p>
            @endif
        </div>
    @endif

    {{-- ── Section: Lost Items Table ── --}}
    @if(in_array('lost', $sections))
        <div class="section {{ $firstSectionRendered ? 'page-break' : '' }}">
            @php $firstSectionRendered = true; @endphp
            <h2 class="section-title">Lost Assets</h2>

            <table class="data-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Asset Name</th>
                        <th>Asset Tag</th>
                        <th>Category</th>
                        <th>Asset Type</th>
                        <th>Reported Lost</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($lostItems as $i => $item)
                        <tr>
                            <td>{{ $i + 1 }}</td>
                            <td>{{ $item['name'] }}</td>
                            <td>{{ $item['asset_tag'] }}</td>
                            <td>{{ $item['category'] ?? '—' }}</td>
                            <td>{{ $item['asset_type'] ?? '—' }}</td>
                            <td>{{ \Carbon\Carbon::parse($item['reported_at'])->format('M d, Y') }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" class="text-center">No lost items.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>

            @if($recordLimit !== 'all' && $lostTotalCount > (int) $recordLimit)
                <p class="limit-note">Showing {{ count($lostItems) }} of {{ number_format($lostTotalCount) }} total records.</p>
            @endif
        </div>
    @endif

    {{-- ── Section: Borrower Analytics ── --}}
    @if(in_array('borrowers', $sections))
        <div class="section {{ $firstSectionRendered ? 'page-break' : '' }}">
            @php $firstSectionRendered = true; @endphp
            <h2 class="section-title">Borrower Analytics</h2>

            <table class="analytics-columns">
                <tr>
                    <td>
                        <table class="mini-table">
                            <caption>Top Borrowers</caption>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Employee</th>
                                    <th class="text-right">Borrows</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($borrowerAnalytics['borrowers'] as $i => $b)
                                    <tr>
                                        <td class="p-1">{{ $i + 1 }}</td>
                                        <td>{{ $b['borrower'] }}</td>
                                        <td class="text-right">{{ $b['count'] }}</td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="3" class="text-center">No data</td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>

                        <table class="mini-table">
                            <caption>Top Returners</caption>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Employee</th>
                                    <th class="text-right">Returns</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($borrowerAnalytics['returners'] as $i => $b)
                                    <tr>
                                        <td>{{ $i + 1 }}</td>
                                        <td>{{ $b['borrower'] }}</td>
                                        <td class="text-right">{{ $b['count'] }}</td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="3" class="text-center">No data</td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </td>
                    <td>
                        <table class="mini-table">
                            <caption>On-Time Returners</caption>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Employee</th>
                                    <th class="text-right">Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($borrowerAnalytics['onTimeReturners'] as $i => $b)
                                    <tr>
                                        <td>{{ $i + 1 }}</td>
                                        <td>{{ $b['borrower'] }}</td>
                                        <td class="text-right">{{ $b['count'] }}</td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="3" class="text-center">No data</td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>

                        <table class="mini-table">
                            <caption>Defective Returns</caption>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Employee</th>
                                    <th class="text-right">Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($borrowerAnalytics['defectiveReturns'] as $i => $b)
                                    <tr>
                                        <td>{{ $i + 1 }}</td>
                                        <td>{{ $b['borrower'] }}</td>
                                        <td class="text-right">{{ $b['count'] }}</td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="3" class="text-center">No data</td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
    @endif

    {{-- ── Footer ── --}}
    <div class="page-footer">
        Property Custodian System &bull; Report generated on {{ $generatedAt }} &bull; Page <span
            class="page-number"></span>
    </div>

</body>

</html>