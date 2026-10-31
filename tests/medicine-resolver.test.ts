import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveMedicine, checkDrugInteractions, evaluateExpiry } from '../lib/medicine-resolver';

test('resolveMedicine correctly resolves popular Indian brand Augmentin 625 to generic PMBJP alternative', async () => {
  const res = await resolveMedicine('Augmentin 625');
  assert.ok(res, 'Augmentin 625 must resolve (not null)');
  assert.ok(/amox/i.test(res.salt));
  assert.ok(res.savingsPercent >= 30, 'Savings should be 30% or higher');
  assert.ok(res.genericPrice < res.brandPrice, 'Jan Aushadhi price must be lower than brand');
  assert.ok(res.purpose.hi.length > 5, 'Hindi purpose must be populated');
});

test('resolveMedicine correctly resolves Pan-D to Pantoprazole + Domperidone with high savings', async () => {
  const res = await resolveMedicine('Pan-D');
  assert.ok(res, 'Pan-D must resolve (not null)');
  assert.ok(/pantoprazole/i.test(res.salt));
  assert.ok(res.genericPrice < res.brandPrice);
});

test('resolveMedicine rejects fake non-existent medicine queries', async () => {
  const res = await resolveMedicine('SomeFakeWordXYZ123456');
  assert.equal(res, null, 'Fake non-existent medicine must return null');
});

test('checkDrugInteractions catches dangerous blood pressure + potassium combination', () => {
  const meds = [
    { product: 'Telma 40' },
    { product: 'Potassium Chloride' },
  ];
  const interactions = checkDrugInteractions(meds);
  assert.equal(interactions.length, 1);
  assert.equal(interactions[0].severity, 'severe');
  assert.ok(interactions[0].title.en.includes('Potassium'));
});

test('checkDrugInteractions catches dual paracetamol overdose risk', () => {
  const meds = [
    { product: 'Dolo 650' },
    { product: 'Combiflam' },
  ];
  const interactions = checkDrugInteractions(meds);
  assert.ok(interactions.length >= 1);
  assert.ok(interactions.some(i => i.title.en.includes('Paracetamol')));
});

test('checkDrugInteractions reports 0 conflicts for safe combinations or single medicine', () => {
  const single = [{ product: 'Shelcal 500' }];
  assert.equal(checkDrugInteractions(single).length, 0);

  const safePair = [{ product: 'Shelcal 500' }, { product: 'Liv 52' }];
  assert.equal(checkDrugInteractions(safePair).length, 0);
});

test('evaluateExpiry accurately flags expired, expiring soon, and safe dates', () => {
  const expired = evaluateExpiry('2020-01');
  assert.equal(expired.status, 'expired');
  assert.equal(expired.color, '#b91c1c');

  const futureYear = new Date().getFullYear() + 2;
  const safe = evaluateExpiry(`${futureYear}-06`);
  assert.equal(safe.status, 'safe');
  assert.equal(safe.color, '#047857');

  const missing = evaluateExpiry('');
  assert.equal(missing.status, 'unknown');
});
