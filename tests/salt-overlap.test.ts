import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkSaltFamilies, checkSaltOverlap } from '../lib/salt-overlap';
import type { Medicine } from '../lib/medpro';

const pack = (product: string, owner = 'Me'): Medicine => ({
  product,
  manufacturer: 'Test Pharma',
  strength: product.includes('Pantofix') ? '40 mg' : '20 mg',
  form: 'tablet',
  release: 'Immediate release',
  batch: 'B1',
  owner,
});

test('identical salts form an exact overlap group', () => {
  const groups = checkSaltOverlap([pack('Pantofix 40', 'Dad'), pack('Pantofix 40', 'Dad')]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].salt, 'Pantoprazole');
  assert.equal(groups[0].packs.length, 2);
});

test('same family with different salts is a family warning, not an exact overlap', () => {
  const meds = [pack('Pantofix 40', 'Dad'), pack('Omez', 'Mom')];
  const exact = checkSaltOverlap(meds);
  assert.equal(exact.length, 0);
  const families = checkSaltFamilies(meds);
  assert.equal(families.length, 1);
  assert.equal(families[0].family, 'Acid control (PPI)');
  assert.deepEqual(families[0].packs.map((p) => p.salt).sort(), ['Omeprazole', 'Pantoprazole']);
});

test('unknown medicine names are never flagged', () => {
  const meds = [pack('Randomxyz 999'), pack('Pantofix 40', 'Dad')];
  assert.equal(checkSaltOverlap(meds).length, 0);
  assert.equal(checkSaltFamilies(meds).length, 0);
});

test('identical salts inside one family are excluded from family warnings', () => {
  const families = checkSaltFamilies([pack('Pantofix 40', 'Dad'), pack('Pantofix 40', 'Dad')]);
  assert.equal(families.length, 0);
});

