<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Acknowledgement Receipt</title>
    <style>
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
            padding: 15mm;
        }

        .page-header {
            border-bottom: 2px solid #1e293b;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }

        .page-header .brand {
            font-size: 9px;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #6b7280;
        }

        .page-header h1 {
            font-size: 20px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #1e293b;
            margin-top: 2px;
        }

        .page-header .receipt-ref {
            float: right;
            text-align: right;
            font-size: 10px;
            color: #4b5563;
        }

        .section {
            margin-bottom: 16px;
        }

        .section-title {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 6px;
        }

        table.info {
            width: 100%;
            border-collapse: collapse;
        }

        table.info td {
            padding: 3px 0;
            vertical-align: top;
        }

        table.info .label {
            width: 130px;
            color: #6b7280;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        table.items {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
        }

        table.items th {
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            padding: 6px 8px;
            text-align: left;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #374151;
        }

        table.items td {
            border: 1px solid #d1d5db;
            padding: 6px 8px;
            vertical-align: top;
        }

        .statement {
            border: 1px solid #d1d5db;
            border-radius: 4px;
            padding: 12px 14px;
            font-size: 10px;
            color: #374151;
            margin-top: 6px;
        }

        .signatures {
            margin-top: 34px;
        }

        table.signatures {
            width: 100%;
            border-collapse: collapse;
        }

        table.signatures td {
            width: 50%;
            vertical-align: bottom;
            padding: 0 10px;
        }

        .signature-line {
            border-top: 1px solid #4b5563;
            padding-top: 6px;
            font-size: 9.5px;
            text-align: center;
            color: #111827;
            font-weight: 700;
        }

        .signature-caption {
            font-size: 8.5px;
            text-align: center;
            color: #6b7280;
            margin-top: 4px;
        }

        .footer {
            margin-top: 26px;
            padding-top: 10px;
            border-top: 1px solid #e5e7eb;
            font-size: 8.5px;
            color: #9ca3af;
            text-align: center;
        }
    </style>
</head>

<body>
    <div class="page-header">
        <div class="receipt-ref">
            Reference No.<br>
            <strong>{{ $borrow->receipt_number }}</strong>
        </div>
        <div class="brand">{{ config('app.name') }}</div>
        <h1>Acknowledgement Receipt</h1>
    </div>

    <div class="section">
        <div class="section-title">Received By</div>
        <table class="info">
            <tr>
                <td class="label">Borrower</td>
                <td><strong>{{ $borrow->borrower?->name ?? '—' }}</strong></td>
            </tr>
            <tr>
                <td class="label">Employee ID</td>
                <td>{{ $borrow->employee?->employee_id ?? '—' }}</td>
            </tr>
            <tr>
                <td class="label">Department</td>
                <td>{{ $borrow->employee?->department ?? '—' }}</td>
            </tr>
            <tr>
                <td class="label">Date Issued</td>
                <td>{{ optional($borrow->approved_at)?->format('F d, Y') ?? '—' }}</td>
            </tr>
            <tr>
                <td class="label">Expected Return</td>
                <td>{{ optional($borrow->expected_return_date)?->format('F d, Y') ?? '—' }}</td>
            </tr>
            <tr>
                <td class="label">Approved By</td>
                <td>{{ $borrow->approvedBy?->name ?? '—' }}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Item Received</div>
        <table class="items">
            <thead>
                <tr>
                    <th style="width: 90px">Asset Tag</th>
                    <th>Asset Name</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th style="width: 60px">Qty</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{{ $borrow->asset?->asset_tag ?? '—' }}</td>
                    <td>{{ $borrow->asset?->name ?? '—' }}</td>
                    <td>{{ $borrow->asset?->assetType?->name ?? '—' }}</td>
                    <td>{{ $borrow->asset?->category?->name ?? '—' }}</td>
                    <td>{{ $borrow->asset?->location?->name ?? '—' }}</td>
                    <td style="text-align: center">{{ $borrow->borrow_amount ?? 1 }}</td>
                </tr>
            </tbody>
        </table>

        @if ($borrow->remarks)
            <table class="info" style="margin-top: 8px">
                <tr>
                    <td class="label" style="padding-top: 6px">Purpose</td>
                    <td style="padding-top: 6px">{{ $borrow->remarks }}</td>
                </tr>
            </table>
        @endif
    </div>

    <div class="section">
        <div class="section-title">Acknowledgement</div>
        <div class="statement">
            I, <strong>{{ $borrow->borrower?->name ?? 'the undersigned' }}</strong>,
            hereby acknowledge receipt of the item(s) described above in good condition.
            I accept responsibility for the safekeeping and proper use of the item(s) and
            agree to return them to the property custodian on or before the expected return
            date indicated, or request an extension through the property custodian system.
            I understand that any loss, damage, or unauthorized use of the item(s) may be
            subject to applicable company policies.
        </div>
    </div>

    <div class="section signatures">
        <table class="signatures">
            <tr>
                <td>@if($borrow->borrower?->name)<div class="signature-line">{{ $borrow->borrower->name }}</div>@else<div class="signature-line">&nbsp;</div>@endif</td>
                <td><div class="signature-line">{{ $borrow->approvedBy?->name ?? '_____________' }}</div></td>
            </tr>
            <tr>
                <td class="signature-caption">Borrower's Signature over Printed Name / Date</td>
                <td class="signature-caption">Prepared &amp; Approved by Property Custodian / Date</td>
            </tr>
        </table>
    </div>

    <div class="footer">
        Generated by {{ config('app.name') }} on {{ $generatedAt }}
    </div>
</body>

</html>