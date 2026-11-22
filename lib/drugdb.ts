/**
 * DrugDB (drugdb.in) public medicine catalogue.
 *
 * The catalogue's public search endpoint is used without an API key, so any
 * medicine name can be looked up even when no Gemini key is configured. It
 * returns the brand name, manufacturer, composition (active salts), dosage
 * form, packaging and MRP. Data is catalogue-sourced (vendor records), so the
 * UI must present the MRP as a catalogue price to confirm against the pack,
 * never as a live pharmacy quote.
 */

export interface DrugDbProduct {
  id: string;
  name: string;
  manufacturer: string;
  composition: string;
  form: string;
  packaging: string;
  mrp: number;
  rxRequired: boolean;
  source: string;
  sourceUrl: string;
  /** Real product details from the catalogue's product record, when available. */
  details?: {
    benefits?: string;
    howToUse?: string;
    primaryUse?: string[];
  };
}

interface RawResult {
  product_id?: unknown;
  name?: unknown;
  manufacturer?: unknown;
  composition?: unknown;
  dosage_form?: unknown;
  packaging?: unknown;
  mrp?: unknown;
  rx_required?: unknown;
}

const ENDPOINT = 'https://drugdb.in/v1/search';
const TIMEOUT_MS = 8000;

/** Pick the record a user most likely meant: exact brand first, then prefixes. */
export function pickBestDrugDbResult(products: DrugDbProduct[], query: string): DrugDbProduct | null {
  if (!products.length) return null;
  const withComposition = products.filter((p) => p.composition.trim());
  const pool = withComposition.length ? withComposition : products;
  const q = query.toLowerCase().replace(/\s+/g, ' ').trim();
  const baseName = (name: string) => name
    .replace(/\s+(tablets?|capsules?|syrup|suspension|injection|eye drops?|ear drops?|nasal spray|cream|gel|ointment|inhaler|sachet|solution|lotion|powder|granules|drops?)$/i, '')
    .toLowerCase()
    .trim();
  const score = (p: DrugDbProduct) => {
    const base = baseName(p.name);
    if (base === q) return 0;
    if (p.name.toLowerCase().startsWith(q) || base.startsWith(q)) return 1;
    return 2;
  };
  const ranked = [...pool].sort((a, b) => score(a) - score(b) || a.name.length - b.name.length);
  return ranked[0] || null;
}

export async function lookupDrugDb(query: string, limit = 5): Promise<DrugDbProduct | null> {
  const term = query.trim();
  if (term.length < 2) return null;

  const url = new URL(ENDPOINT);
  url.searchParams.set('q', term);
  url.searchParams.set('limit', String(limit));

  // No API key: this is the public catalogue endpoint used by drugdb.in itself.
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Medicine catalogue responded ${response.status}.`);

  const data = (await response.json()) as { results?: RawResult[] };
  const results = Array.isArray(data.results) ? data.results : [];
  if (!results.length) return null;

  const mapped: DrugDbProduct[] = [];
  for (const raw of results) {
    const name = String(raw.name || '').trim();
    const mrp = Number(raw.mrp);
    if (!name || !Number.isFinite(mrp) || mrp <= 0) continue;
    mapped.push({
      id: String(raw.product_id || name),
      name,
      manufacturer: String(raw.manufacturer || 'Manufacturer not listed'),
      composition: String(raw.composition || ''),
      form: String(raw.dosage_form || ''),
      packaging: String(raw.packaging || ''),
      mrp,
      rxRequired: raw.rx_required === true,
      source: 'DrugDB public medicine catalogue (Common Drug Codes for India)',
      sourceUrl: 'https://drugdb.in/',
    });
  }
  if (!mapped.length) return null;
  const best = pickBestDrugDbResult(mapped, term);
  if (!best) return null;

  // Enrich with the product record: real "benefits" and "how to use" text so
  // the guide can explain a salt it does not cover in its bundled pharmacopoeia.
  // A failed detail call still leaves a usable name/salt/MRP result.
  try {
    const detailResponse = await fetch(`https://drugdb.in/v1/products/${encodeURIComponent(best.id)}`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (detailResponse.ok) {
      const detail = (await detailResponse.json()) as {
        primary_use?: unknown;
        details?: { benefits?: unknown; how_to_use?: unknown };
      };
      const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
      best.details = {
        benefits: text(detail.details?.benefits),
        howToUse: text(detail.details?.how_to_use),
        primaryUse: Array.isArray(detail.primary_use) ? detail.primary_use.map(String).filter(Boolean).slice(0, 4) : [],
      };
    }
  } catch { /* Keep the catalogue result without long-form details. */ }

  return best;
}
