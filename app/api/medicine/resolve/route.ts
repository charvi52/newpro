import { NextResponse } from 'next/server';
import { resolveMedicine } from '@/lib/medicine-resolver';
import { loadOfflineSnapshot, batchStatus } from '@/lib/offline-medical';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const batch = (url.searchParams.get('batch') || '').trim();

  if (!q) {
    return NextResponse.json({ error: 'Please provide a medicine name in q parameter' }, { status: 400 });
  }

  try {
    // 1. Resolve medicine, generic alternative, and prices
    const resolved = await resolveMedicine(q);

    if (!resolved) {
      return NextResponse.json({
        success: false,
        error: 'This does not appear to be a recognized medicine. Please check the spelling and try again.',
        errorHi: 'यह कोई मान्यता प्राप्त दवा नहीं लगती। कृपया नाम जाँचें और दोबारा प्रयास करें।',
      }, { status: 404 });
    }

    // 2. Cross-check batch against official CDSCO alerts
    let cdscoCheck: {
      checked: boolean;
      state: 'matching-alert' | 'confirmation-needed' | 'no-match' | 'not-checked';
      label: { en: string; hi: string };
      matchedRecord?: {
        id: string;
        kind: string;
        batch: string;
        product: string;
        manufacturer: string;
        issue: string;
        laboratory: string;
        period: string;
        reportedDate?: string;
        sourceUrl: string;
      };
    } = {
      checked: false,
      state: 'not-checked',
      label: { en: 'No batch provided to check', hi: 'बैच नंबर दर्ज नहीं किया गया' },
    };

    if (batch) {
      try {
        const snapshot = await loadOfflineSnapshot();
        const status = batchStatus(
          { product: q, batch, manufacturer: resolved.manufacturer, form: resolved.form, release: 'Unknown', strength: resolved.strength },
          snapshot.records,
          false
        );

        const matched = snapshot.records.find(
          (r) => r.batch.trim().toLowerCase() === batch.trim().toLowerCase()
        );

        if (status.state === 'matching-alert' && matched) {
          cdscoCheck = {
            checked: true,
            state: 'matching-alert',
            label: {
              en: 'CRITICAL ALERT: Matching CDSCO Defective / Spurious Record Found!',
              hi: 'चेतावनी: यह बैच CDSCO द्वारा घटिया/नकली रिपोर्ट में दर्ज पाया गया है!',
            },
            matchedRecord: {
              id: matched.id,
              kind: matched.kind,
              batch: matched.batch,
              product: matched.product,
              manufacturer: matched.manufacturer,
              issue: matched.issue || 'Failed Government Quality Standards (NSQ)',
              laboratory: matched.laboratory || 'Government Drug Testing Laboratory',
              period: matched.period,
              reportedDate: matched.reportedDate,
              sourceUrl: matched.sourceUrl,
            },
          };
        } else if (status.state === 'confirmation-needed') {
          cdscoCheck = {
            checked: true,
            state: 'confirmation-needed',
            label: {
              en: 'Partial Batch Match: Verify full pack details against official report',
              hi: 'आंशिक मिलान: कृपया पूरे पैक का मिलान सरकारी रिपोर्ट से करें',
            },
          };
        } else {
          cdscoCheck = {
            checked: true,
            state: 'no-match',
            label: {
              en: 'No Defective / Spurious Alert found for this batch in 7,900+ checked CDSCO records',
              hi: '7,900+ सरकारी CDSCO रिकॉर्ड में इस बैच पर कोई डिफेक्टिव अलर्ट नहीं मिला',
            },
          };
        }
      } catch {
        cdscoCheck = {
          checked: false,
          state: 'not-checked',
          label: { en: 'CDSCO snapshot temporarily unavailable', hi: 'CDSCO रिकॉर्ड अभी उपलब्ध नहीं हैं' },
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        resolved,
        cdsco: cdscoCheck,
        checkedAt: new Date().toISOString(),
      },
    }, { headers: { 'cache-control': 'no-store' } });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Medicine resolver unavailable',
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { q?: string; query?: string; batch?: string };
    const q = (body.q || body.query || '').trim();
    const batch = (body.batch || '').trim();

    if (!q) {
      return NextResponse.json({ error: 'Please provide medicine query' }, { status: 400 });
    }

    // Reuse GET logic via internal fetch or invoke directly
    const url = new URL('http://localhost/api/medicine/resolve');
    url.searchParams.set('q', q);
    if (batch) url.searchParams.set('batch', batch);
    return GET(new Request(url.toString()));
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }
}
