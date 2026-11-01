import { NextResponse } from 'next/server';
import { hasLiveSearch, resolveMedicine } from '@/lib/medicine-resolver';
import { loadOfflineSnapshot, batchStatus } from '@/lib/offline-medical';

export const runtime = 'nodejs';

/**
 * Resolve results (including honest 404s) are cached in memory so repeated or
 * spammy queries cannot burn through Gemini's free quota of 500 grounded
 * searches/day. Prices change rarely; CDSCO batch checks here run off the
 * bundled snapshot, so a short-lived cache cannot stale them out.
 */
type CachedResponse = { body: Record<string, unknown>; status: number; at: string };
const resolveCache = new Map<string, CachedResponse>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h for successful resolutions
const NEGATIVE_TTL_MS = 60 * 60 * 1000; // 1h for unknown-medicine 404s
const CACHE_MAX = 500;

function cacheGet(key: string, ttl: number): CachedResponse | null {
  const hit = resolveCache.get(key);
  if (!hit) return null;
  if (Date.now() - new Date(hit.at).getTime() > ttl) {
    resolveCache.delete(key);
    return null;
  }
  return hit;
}

function cacheSet(key: string, entry: CachedResponse): void {
  while (resolveCache.size >= CACHE_MAX) {
    const oldest = resolveCache.keys().next().value;
    if (oldest === undefined) break;
    resolveCache.delete(oldest);
  }
  resolveCache.set(key, entry);
}

function cacheKey(q: string, batch: string): string {
  return `${q.trim().toLowerCase()}|${batch.trim().toUpperCase()}`;
}

interface CdscoCheck {
  checked: boolean;
  state: 'matching-alert' | 'confirmation-needed' | 'no-match' | 'not-checked';
  label: { en: string; hi: string };
  recordCount?: number;
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
}

async function resolveWithAlerts(q: string, batch: string): Promise<{ body: Record<string, unknown>; status: number }> {
  try {
    const key = cacheKey(q, batch);
    const cached = cacheGet(key, resolveCache.get(key)?.body.error ? NEGATIVE_TTL_MS : CACHE_TTL_MS);
    if (cached) {
      return {
        body: { ...cached.body, cachedSince: cached.at },
        status: cached.status,
      };
    }

    // 1. Resolve medicine, generic alternative, and prices
    const resolved = await resolveMedicine(q);

    if (!resolved) {
      const notFound = hasLiveSearch()
        ? {
          body: {
            success: false,
            error: 'This does not appear to be a recognized medicine. Please check the spelling and try again.',
            errorHi: 'यह कोई मान्यता प्राप्त दवा नहीं लगती। कृपया नाम जाँचें और दोबारा प्रयास करें।',
          },
        }
        // Without the live provider only curated entries are searchable; denying that the
        // medicine exists would be a false claim about a real product.
        : {
          body: {
            success: false,
            error: 'This medicine is not in the bundled list of popular Indian medicines. Live search for any medicine is currently not configured on the server (missing GEMINI_API_KEY). Try a popular brand such as Augmentin 625, Pan-D or Dolo 650.',
            errorHi: 'यह दवा बंडल की लोकप्रिय दवाओं की सूची में नहीं है। किसी भी दवा की लाइव खोज अभी सर्वर पर सेट नहीं है (GEMINI_API_KEY गायब)। Augmentin 625, Pan-D या Dolo 650 जैसे लोकप्रिय नाम आज़माएँ।',
          },
        };
      cacheSet(key, { body: notFound.body, status: 404, at: new Date().toISOString() });
      return { ...notFound, status: 404 };
    }

    // 2. Cross-check batch against official CDSCO alerts
    let cdscoCheck: CdscoCheck = {
      checked: false,
      state: 'not-checked',
      label: { en: 'No batch provided to check', hi: 'बैच नंबर दर्ज नहीं किया गया' },
    };

    if (batch) {
      try {
        const snapshot = await loadOfflineSnapshot();
        const checkedCount = snapshot.records.length.toLocaleString('en-IN');
        const status = batchStatus(
          { product: q, batch, manufacturer: resolved.manufacturer, form: resolved.form, release: 'Unknown', strength: resolved.strength },
          snapshot.records,
          false
        );

        if (status.state === 'matching-alert') {
          // Quote the exact matched record from the scoped search, never a batch-only lookup:
          // two unrelated products can share a batch number.
          const exact = status.matches.find((m) => m.match === 'exact');
          if (exact) {
            cdscoCheck = {
              checked: true,
              state: 'matching-alert',
              recordCount: snapshot.records.length,
              label: {
                en: 'CRITICAL ALERT: Matching CDSCO Defective / Spurious Record Found!',
                hi: 'चेतावनी: यह बैच CDSCO द्वारा घटिया/नकली रिपोर्ट में दर्ज पाया गया है!',
              },
              matchedRecord: {
                id: exact.record.id,
                kind: exact.record.kind,
                batch: exact.record.batch,
                product: exact.record.product,
                manufacturer: exact.record.manufacturer,
                issue: exact.record.issue || 'Not stated in the official record',
                laboratory: exact.record.laboratory || 'Not stated in the official record',
                period: exact.record.period,
                reportedDate: exact.record.reportedDate,
                sourceUrl: exact.record.sourceUrl,
              },
            };
          } else {
            cdscoCheck = {
              checked: true,
              state: 'confirmation-needed',
              recordCount: snapshot.records.length,
              label: {
                en: 'Partial Batch Match: Verify full pack details against official report',
                hi: 'आंशिक मिलान: कृपया पूरे पैक का मिलान सरकारी रिपोर्ट से करें',
              },
            };
          }
        } else if (status.state === 'confirmation-needed') {
          cdscoCheck = {
            checked: true,
            state: 'confirmation-needed',
            recordCount: snapshot.records.length,
            label: {
              en: 'Partial Batch Match: Verify full pack details against official report',
              hi: 'आंशिक मिलान: कृपया पूरे पैक का मिलान सरकारी रिपोर्ट से करें',
            },
          };
        } else {
          cdscoCheck = {
            checked: true,
            state: 'no-match',
            recordCount: snapshot.records.length,
            label: {
              en: `No Defective / Spurious Alert found for this batch in ${checkedCount} checked CDSCO records`,
              hi: `${checkedCount} सरकारी CDSCO रिकॉर्ड में इस बैच पर कोई डिफेक्टिव अलर्ट नहीं मिला`,
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

    const body: Record<string, unknown> = {
      success: true,
      data: {
        resolved,
        cdsco: cdscoCheck,
        checkedAt: new Date().toISOString(),
      },
    };
    cacheSet(key, { body, status: 200, at: String((body.data as { checkedAt: string }).checkedAt) });
    return { body, status: 200 };
  } catch (err) {
    // Errors are not cached: a transient snapshot/provider outage must not pin.
    return {
      body: { error: err instanceof Error ? err.message : 'Medicine resolver unavailable' },
      status: 500,
    };
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const batch = (url.searchParams.get('batch') || '').trim();

  if (!q) {
    return NextResponse.json({ error: 'Please provide a medicine name in q parameter' }, { status: 400 });
  }

  const result = await resolveWithAlerts(q, batch);
  return NextResponse.json(result.body, { status: result.status, headers: { 'cache-control': 'no-store' } });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { q?: string; query?: string; batch?: string };
    const q = (body.q || body.query || '').trim();
    const batch = (body.batch || '').trim();

    if (!q) {
      return NextResponse.json({ error: 'Please provide medicine query' }, { status: 400 });
    }

    // Call the shared handler directly; a self-fetch to "localhost" fails on any
    // non-default port and adds an avoidable network hop.
    const result = await resolveWithAlerts(q, batch);
    return NextResponse.json(result.body, { status: result.status, headers: { 'cache-control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }
}
