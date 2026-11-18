import { findMedicineAlternative, formulationFor } from './offline-medical';
import type { Medicine } from './carely';

export interface SaltOverlapPack {
  product: string;
  owner: string;
  strength: string;
}

export interface SaltOverlapGroup {
  salt: string;
  packs: SaltOverlapPack[];
}

/**
 * Resolve the active salt of a saved pack via the curated formulation list.
 * Strict formulationFor() runs first (exact salt + strength + form + release);
 * brand-name matching through findMedicineAlternative() covers packs whose
 * name is a known brand (Pan-D, Dolo 650...). Unknown names return null and
 * are never flagged — absence of mapping is not evidence of a duplicate.
 */
function saltOf(m: Medicine): string | null {
  const f = formulationFor(m) || findMedicineAlternative(m.product);
  return f ? f.salt : null;
}

export function checkSaltOverlap(medicines: Medicine[]): SaltOverlapGroup[] {
  const map = new Map<string, SaltOverlapPack[]>();
  for (const m of medicines) {
    const salt = saltOf(m);
    if (!salt) continue;
    const list = map.get(salt) || [];
    list.push({
      product: m.product,
      owner: (m.owner || 'Me').trim() || 'Me',
      strength: m.strength || '',
    });
    map.set(salt, list);
  }
  return Array.from(map.entries())
    .filter(([, packs]) => packs.length >= 2)
    .map(([salt, packs]) => ({ salt, packs }));
}
