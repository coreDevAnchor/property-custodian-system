<?php

namespace App\Http\Controllers\Custodian;

use App\Http\Controllers\Controller;
use App\Models\ActivityLogs;
use App\Models\Asset;
use App\Models\BorrowRequest;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ReceiptController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $perPage = (int) $request->input('per_page', 10);

        $receipts = BorrowRequest::with([
            'asset.category',
            'asset.location',
            'asset.assetType',
            'employee',
            'borrower',
        ])
            ->where('status', 'borrowed')
            ->whereNull('receipt_printed_at')
            ->whereNotNull('approved_at')
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas(
                        'borrower',
                        fn ($u) => $u->caseInsensitiveLike('name', "%{$search}%")
                    )
                        ->orWhereHas('asset', function ($a) use ($search) {
                            $a->caseInsensitiveLike('name', "%{$search}%")
                                ->orCaseInsensitiveLike('asset_tag', "%{$search}%");
                        })
                        ->orWhereHas('employee', function ($e) use ($search) {
                            $e->caseInsensitiveLike('department', "%{$search}%")
                                ->orCaseInsensitiveLike('employee_id', "%{$search}%");
                        });
                });
            })
            ->latest('approved_at')
            ->paginate($perPage)
            ->withQueryString();

        $receipts->getCollection()->append('receipt_number');

        return Inertia::render('custodian/receipts', [
            'receipts' => $receipts,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function print(BorrowRequest $borrowRequest)
    {
        $borrowRequest->load([
            'asset.category',
            'asset.location',
            'asset.assetType',
            'employee',
            'borrower',
            'approvedBy',
        ]);

        if ($borrowRequest->status !== 'borrowed') {
            abort(404);
        }

        $pdf = Pdf::loadView('receipts.acknowledgement', [
            'borrow' => $borrowRequest,
            'generatedAt' => now()->format('F d, Y h:i A'),
        ])->setPaper('a4');

        $assetTag = $borrowRequest->asset?->asset_tag ?? 'asset';
        $filename = 'acknowledgement_receipt_'.str_replace('/', '-', $assetTag).'_'.$borrowRequest->id.'.pdf';

        return $pdf->stream($filename);
    }

    public function markPrinted(BorrowRequest $borrowRequest)
    {
        if ($borrowRequest->status !== 'borrowed') {
            abort(404);
        }

        $custodian = Auth::user();

        if ($custodian instanceof User && $borrowRequest->receipt_printed_at === null) {
            $borrowRequest->update([
                'receipt_printed_at' => now(),
                'receipt_printed_by' => $custodian->id,
            ]);

            $asset = $borrowRequest->asset;

            if ($asset instanceof Asset) {
                ActivityLogs::record(
                    $asset,
                    'receipt_printed',
                    "Acknowledgement receipt marked as printed for {$borrowRequest->borrower?->name} ({$asset->name}).",
                    ['borrow_request_id' => $borrowRequest->id],
                );
            }
        }

        return back();
    }
}
