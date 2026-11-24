import { findMedicineAlternative, formulationFor } from './offline-medical';
import type { Medicine } from './medpro';

export interface SaltOverlapPack {
  product: string;
  owner: string;
  strength: string;
}

export interface SaltOverlapGroup {
  salt: string;
  packs: SaltOverlapPack[];
}

export interface SaltFamilyGroup {
  family: string;
  packs: { product: string; owner: string; salt: string; strength: string }[];
}

/**
 * Therapeutic families for "somewhat same salt" detection: different salts
 * that treat the same condition and are usually NOT meant to be combined.
 * A family is listed only when the curated list covers two or more of its
 * salts — single-salt families can never overlap.
 */
const FAMILIES: Record<string, string> = {
  Pantoprazole: 'Acid control (PPI)',
  Omeprazole: 'Acid control (PPI)',
  Rabeprazole: 'Acid control (PPI)',
  Ibuprofen: 'Pain/inflammation (NSAID)',
  Diclofenac: 'Pain/inflammation (NSAID)',
  Cetirizine: 'Allergy relief (antihistamine)',
  'Montelukast + Levocetirizine': 'Allergy relief (antihistamine)',
};

export function checkSaltFamilies(medicines: Medicine[]): SaltFamilyGroup[] {
  const map = new Map<string, SaltFamilyGroup['packs']>();
  for (const m of medicines) {
    const salt = saltOf(m);
    if (!salt) continue;
    const family = FAMILIES[salt];
    if (!family) continue;
    const list = map.get(family) || [];
    list.push({
      product: m.product,
      owner: (m.owner || 'Me').trim() || 'Me',
      salt,
      strength: m.strength || '',
    });
    map.set(family, list);
  }
  // Only report families whose packs use MORE THAN ONE distinct salt —
  // identical salts are already reported by checkSaltOverlap().
  return Array.from(map.entries())
    .filter(([, packs]) => new Set(packs.map((p) => p.salt)).size > 1)
    .map(([family, packs]) => ({ family, packs }));
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

