import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanCatalogueBrand, drugDbToResolved, parseComposition } from '../lib/medicine-resolver';
import { pickBestDrugDbResult, type DrugDbProduct } from '../lib/drugdb';

const dolo: DrugDbProduct = {
  id: 'DDID9KTH4EA3',
  name: 'Dolo 650 Tablet',
  manufacturer: 'Micro Labs Ltd',
  composition: 'Paracetamol (650mg)',
  form: 'Tablet',
  packaging: 'strip of 15 tablets',
  mrp: 32.28,
  rxRequired: false,
  source: 'DrugDB public medicine catalogue (Common Drug Codes for India)',
  sourceUrl: 'https://drugdb.in/',
};

test('parseComposition separates single salts and combinations', () => {
  assert.deepEqual(parseComposition('Paracetamol (650mg)'), { salt: 'Paracetamol', strength: '650mg' });
  assert.deepEqual(parseComposition('Amoxicillin (500mg) + Clavulanic Acid (125mg)'), {
    salt: 'Amoxicillin + Clavulanic Acid',
    strength: '500mg + 125mg',
  });
  assert.deepEqual(parseComposition('Atropine (0.01% w/v)'), { salt: 'Atropine', strength: '0.01% w/v' });
});

test('cleanCatalogueBrand strips dosage form suffixes', () => {
  assert.equal(cleanCatalogueBrand('Dolo 650 Tablet'), 'Dolo 650');
  assert.equal(cleanCatalogueBrand('Myatro 0.01% Eye Drop'), 'Myatro 0.01%');
  assert.equal(cleanCatalogueBrand('Zerodol Tablet'), 'Zerodol');
});

test('catalogue result keeps the real MRP and labels it as catalogue data', () => {
  const result = drugDbToResolved('Dolo 650', dolo);
  assert.equal(result.brand, 'Dolo 650');
  assert.equal(result.salt, 'Paracetamol');
  assert.equal(result.strength, '650mg');
  assert.equal(result.manufacturer, 'Micro Labs Ltd');
  assert.equal(result.brandPrice, 32.28);
  assert.equal(result.catalogue, true);
  // Catalogue MRP is source-backed, but the UI still asks to match the pack price.
  assert.equal(result.priceVerified, true);
  assert.equal(result.sourceUrl, 'https://drugdb.in/');
  // Paracetamol 650 mg is covered by the curated Jan Aushadhi comparison.
  assert.ok(result.genericPrice > 0);
  assert.ok(result.janAushadhiName.length > 0);
});

test('a different strength is never presented as a cheaper alternative', () => {
  // The curated Paracetamol generic is 650 mg; a 250 mg pack is not comparable.
  const weak = drugDbToResolved('Dolo 250', { ...dolo, name: 'Dolo 250 Tablet', composition: 'Paracetamol (250mg)' });
  assert.equal(weak.genericPrice, 0);
  assert.equal(weak.janAushadhiName, '');
});

test('unknown salts get honest guidance instead of invented uses', () => {
  const unknown: DrugDbProduct = {
    ...dolo,
    name: 'Testazep 10 Tablet',
    composition: 'Testazepine (10mg)',
  };
  const result = drugDbToResolved('Testazep', unknown);
  assert.match(result.purpose.en, /does not cover this salt/);
  assert.match(result.timing.en, /prescription/);
  assert.equal(result.genericPrice, 0);
});

test('catalogue product details explain a salt missing from the bundled guide', () => {
  const clinda: DrugDbProduct = {
    ...dolo,
    id: 'DDIDP9WF7YN2',
    name: 'Clindamycin Phosphate Gel',
    composition: 'Clindamycin (1% w/w)',
    form: 'Gel',
    mrp: 84.38,
    details: {
      benefits: 'In Treatment of Acne Clindamycin Phosphate Gel is an antibiotic that works by stopping the growth of bacteria causing acne on your skin.',
      howToUse: 'This medicine is for external use only. Use it in the dose and duration as advised by your doctor.',
      primaryUse: ['Bacterial infections', 'Treatment of Acne'],
    },
  };
  const result = drugDbToResolved('Clindamycin', clinda);
  assert.match(result.purpose.en, /Acne/);
  assert.match(result.purpose.hi, /Acne/);
  assert.match(result.timing.en, /external use/);
  assert.equal(result.catalogue, true);
});

test('catalogue ranking prefers the exact brand over combination packs', () => {
  const products: DrugDbProduct[] = [
    { ...dolo, id: 'a', name: 'Okacet-L Tablet', composition: 'Levocetirizine (5mg)' },
    { ...dolo, id: 'b', name: 'Okacet Tablet', composition: 'Cetirizine (10mg)' },
  ];
  assert.equal(pickBestDrugDbResult(products, 'Okacet')?.name, 'Okacet Tablet');
});

test('a record without a composition loses to one that has it', () => {
  const products: DrugDbProduct[] = [
    { ...dolo, id: 'a', name: 'Combiflam', composition: '' },
    { ...dolo, id: 'b', name: 'Combiflam Tablet', composition: 'Ibuprofen (400mg) + Paracetamol (325mg)' },
  ];
  assert.equal(pickBestDrugDbResult(products, 'Combiflam')?.id, 'b');
});
