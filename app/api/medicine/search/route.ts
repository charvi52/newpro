import { NextResponse } from 'next/server';
import { cachedSearch, saveSearch } from '@/lib/catalog-db';

export const runtime = 'nodejs';

/** "Paracetamol (650mg) + Caffeine (30mg)" → two ingredient rows. */
function parseIngredients(composition: string) {
  const rows: Array<{ name: string; strength: string; unit: string }> = [];
  const re = /([A-Za-z][A-Za-z0-9 .+\-/]*?)\s*\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(composition)) !== null) {
    const name = match[1].trim();
    if (!name) continue;
    const raw = match[2].trim();
    const unit = (raw.match(/[a-z%µ/]+/i) || [''])[0];
    rows.push({ name, strength: raw.replace(/[a-z%µ/]+/i, '').trim(), unit });
  }
  return rows;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') || '').trim().slice(0, 100);
  if (query.length < 2) return NextResponse.json({ records: [], message: 'Enter at least two letters.' });
  try {
    const cached = await cachedSearch(query.toLowerCase().replace(/\s+/g, ' '));
    if (cached?.length) return NextResponse.json({ records: cached, source: 'Cached catalogue records', cached: true }, { headers: { 'cache-control': 'no-store' } });
  } catch { /* Keep live search available during temporary database issues. */ }

  try {
    // Public, keyless catalogue endpoint. The old /search path returns the HTML
    // app shell instead of JSON, which made every lookup fail with a 502.
    const upstream = new URL('https://drugdb.in/v1/search');
    upstream.searchParams.set('q', query);
    upstream.searchParams.set('limit', '8');
    const response = await fetch(upstream, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Medicine catalogue responded ${response.status}.`);
    const data = await response.json() as {
      results?: Array<{
        product_id?: string; name?: string; manufacturer?: string;
        composition?: string; dosage_form?: string; mrp?: number;
        packaging?: string; rx_required?: boolean;
      }>;
    };
    const records = (Array.isArray(data.results) ? data.results : []).slice(0, 8).map((r) => ({
      id: String(r.product_id || r.name || ''),
      name: String(r.name || ''),
      brand: String(r.name || ''),
      generic: String(r.composition || ''),
      manufacturer: String(r.manufacturer || ''),
      form: String(r.dosage_form || ''),
      packaging: String(r.packaging || ''),
      mrp: Number(r.mrp) || undefined,
      rxRequired: r.rx_required === true,
      ingredients: parseIngredients(String(r.composition || '')),
      licenseStatus: r.rx_required === true ? 'Prescription required' : 'Not marked prescription-only',
      updatedAt: '',
      source: 'DrugDB public medicine catalogue (Common Drug Codes for India)',
      sourceUrl: 'https://drugdb.in/',
    })).filter((r) => r.name);
    try { await saveSearch(records); } catch { /* Catalogue lookup can work without the optional cache. */ }
    return NextResponse.json({ records, total: records.length, source: 'DrugDB public medicine catalogue (Common Drug Codes for India)' }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ records: [], error: 'catalogue_unavailable', message: error instanceof Error ? error.message : 'The medicine catalogue could not be reached.' }, { status: 502 });
  }
}
