import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateStampDuty,
  evaluatePortfolio,
  parsePropertyUrls,
  splitPropertyUrlInput,
} from '../decisionEngine.ts';
import { IRISH_PRESET, LONDON_PRESET } from '../../data/presets.ts';

test('splitPropertyUrlInput parses 2+ URLs separated by newlines or commas', () => {
  const raw = `
    https://www.daft.ie/for-sale/detached-house-12-clonskeagh-road-dublin-14/591234,
    https://www.myhome.ie/residential/brochure/18-sandycove-avenue-west-dublin/4902111
  `;
  const urls = splitPropertyUrlInput(raw);
  assert.equal(urls.length, 2);
  assert.match(urls[0], /daft\.ie/);
  assert.match(urls[1], /myhome\.ie/);
});

test('parsePropertyUrls extracts portal, street name, and deterministic hidden telemetry for Daft.ie and MyHome.ie', () => {
  const raw = `https://www.daft.ie/for-sale/detached-house-12-clonskeagh-road-dublin-14/591234\nhttps://www.myhome.ie/residential/brochure/18-sandycove-avenue-dublin/4902111`;
  const parsed = parsePropertyUrls(raw, 'IE', 3, []);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].sourcePortal, 'Daft.ie');
  assert.equal(parsed[0].code, 'Property D');
  assert.match(parsed[0].name, /12 Clonskeagh/i);
  assert.equal(parsed[1].sourcePortal, 'MyHome.ie');
  assert.equal(parsed[1].code, 'Property E');
  assert.ok(parsed[0].hiddenAmenities.length >= 3);
  assert.ok(parsed[0].askingPrice > 0);
});

test('calculateStampDuty implements Irish Revenue tiers accurately', () => {
  // 1% of €1,000,000 = €10,000 + 2% of €450,000 = €9,000 => €19,000
  assert.equal(calculateStampDuty(1_450_000, 'IE'), 19_000);
  // 1% of €1,000,000 = €10,000 + 2% of €500,000 = €10,000 + 6% of €125,000 = €7,500 => €27,500
  assert.equal(calculateStampDuty(1_625_000, 'IE'), 27_500);
});

test('evaluatePortfolio ranks Dartmouth Park Ave #1 and disqualifies Chepstow Villas on UK Stitch preset', () => {
  const res = evaluatePortfolio(
    LONDON_PRESET.properties,
    LONDON_PRESET.budget,
    LONDON_PRESET.weights,
    LONDON_PRESET.household,
    'UK'
  );
  assert.ok(res.winner);
  assert.equal(res.winner.property.id, 'uk-prop-c');
  assert.equal(res.winner.verdictRole, 'WINNER');
  assert.equal(res.winner.landedBuffer, 152_000);
  const chepstow = res.evaluated.find((e) => e.property.id === 'uk-prop-b');
  assert.ok(chepstow);
  assert.equal(chepstow.isDisqualified, true);
  assert.equal(chepstow.landedBuffer, -145_000);
  assert.ok(res.comparisons.length === 2);
});

test('evaluatePortfolio ranks Burnaby Park #1 on Irish preset and responds to budget tightening', () => {
  const baseline = evaluatePortfolio(
    IRISH_PRESET.properties,
    IRISH_PRESET.budget,
    IRISH_PRESET.weights,
    IRISH_PRESET.household,
    'IE'
  );
  assert.ok(baseline.winner);
  assert.equal(baseline.winner.property.id, 'ie-prop-c');
  assert.ok(baseline.winner.landedBuffer > 100_000);

  // Tighten landed ceiling below all properties -> all fail landed budget ceiling
  const tight = evaluatePortfolio(
    IRISH_PRESET.properties,
    { ...IRISH_PRESET.budget, totalLandedCostCeiling: 1_200_000 },
    IRISH_PRESET.weights,
    IRISH_PRESET.household,
    'IE'
  );
  assert.equal(tight.qualifiedCount, 0);
  assert.ok(tight.evaluated.every((e) => e.isDisqualified));
});

test('evaluatePortfolio responds deterministically to Head vs Heart macro equilibrium changes', () => {
  const headHeavy = evaluatePortfolio(
    IRISH_PRESET.properties,
    IRISH_PRESET.budget,
    { ...IRISH_PRESET.weights, headPercent: 90 },
    IRISH_PRESET.household,
    'IE'
  );
  const heartHeavy = evaluatePortfolio(
    IRISH_PRESET.properties,
    IRISH_PRESET.budget,
    { ...IRISH_PRESET.weights, headPercent: 15 },
    IRISH_PRESET.household,
    'IE'
  );
  assert.ok(headHeavy.winner && heartHeavy.winner);
  assert.notEqual(headHeavy.winner.compositeScore, heartHeavy.winner.compositeScore);
});

test('calculateStampDuty implements UK SDLT tiers and exact Stitch landed reconciliation', () => {
  assert.equal(calculateStampDuty(1_380_000, 'UK'), 79_250);
  assert.equal(calculateStampDuty(1_450_000, 'UK'), 86_250);
  assert.equal(calculateStampDuty(1_625_000, 'UK'), 106_250);

  const ukEval = evaluatePortfolio(
    LONDON_PRESET.properties,
    LONDON_PRESET.budget,
    LONDON_PRESET.weights,
    LONDON_PRESET.household,
    'UK'
  );
  const byId = Object.fromEntries(ukEval.evaluated.map((e) => [e.property.id, e]));
  assert.equal(byId['uk-prop-a'].totalLandedCost, 1_692_000);
  assert.equal(byId['uk-prop-a'].landedBuffer, 58_000);
  assert.equal(byId['uk-prop-b'].totalLandedCost, 1_895_000);
  assert.equal(byId['uk-prop-b'].landedBuffer, -145_000);
  assert.equal(byId['uk-prop-c'].totalLandedCost, 1_598_000);
  assert.equal(byId['uk-prop-c'].landedBuffer, 152_000);
});

test('parsePropertyUrls deduplicates existing URLs and parses Rightmove/Zoopla listings', () => {
  const existing = ['https://www.rightmove.co.uk/properties/151290441/19-flask-walk-hampstead-nw3'];
  const raw = `${existing[0]}\nhttps://www.zoopla.co.uk/for-sale/details/68123991/44-elgin-crescent-notting-hill-w11\nnot-a-valid-url`;
  const parsed = parsePropertyUrls(raw, 'UK', 3, existing);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].sourcePortal, 'Zoopla');
  assert.equal(parsed[0].code, 'Property D');
});

test('relaxing strict flag on custom non-negotiables and raising budget ceiling transitions disqualification cleanly', () => {
  const baseline = evaluatePortfolio(
    LONDON_PRESET.properties,
    LONDON_PRESET.budget,
    LONDON_PRESET.weights,
    LONDON_PRESET.household,
    'UK'
  );
  const baseChepstow = baseline.evaluated.find((e) => e.property.id === 'uk-prop-b');
  assert.ok(baseChepstow && baseChepstow.failedStrictRules.length >= 1);

  const relaxedWeights = {
    ...LONDON_PRESET.weights,
    nonNegotiables: LONDON_PRESET.weights.nonNegotiables.map((r) => ({
      ...r,
      strict: false,
    })),
  };
  const relaxed = evaluatePortfolio(
    LONDON_PRESET.properties,
    LONDON_PRESET.budget,
    relaxedWeights,
    LONDON_PRESET.household,
    'UK'
  );
  // Intrinsic landed-budget-ceiling guardrail still blocks UK Property B until budget ceiling is raised
  const relaxedChepstow = relaxed.evaluated.find((e) => e.property.id === 'uk-prop-b');
  assert.deepEqual(
    relaxedChepstow?.failedStrictRules.map((r) => r.ruleId),
    ['landed-budget-ceiling']
  );

  const withRaisedCeiling = evaluatePortfolio(
    LONDON_PRESET.properties,
    { ...LONDON_PRESET.budget, totalLandedCostCeiling: 1_950_000 },
    relaxedWeights,
    LONDON_PRESET.household,
    'UK'
  );
  assert.equal(withRaisedCeiling.qualifiedCount, LONDON_PRESET.properties.length);
  assert.ok(withRaisedCeiling.evaluated.every((e) => !e.isDisqualified));
});

test('evaluatePortfolio returns empty evaluation when shortlist is empty', () => {
  const empty = evaluatePortfolio([], LONDON_PRESET.budget, LONDON_PRESET.weights, LONDON_PRESET.household, 'UK');
  assert.equal(empty.evaluated.length, 0);
  assert.equal(empty.winner, null);
  assert.equal(empty.runnerUp, null);
  assert.equal(empty.qualifiedCount, 0);
  assert.deepEqual(empty.comparisons, []);
});

test('agreedPrice overrides askingPrice for stamp duty, landed cost, and ceiling delta', () => {
  const baseProp = { ...IRISH_PRESET.properties[0], askingPrice: 1_150_000 };
  const agreedProp = { ...baseProp, agreedPrice: 1_165_000 };

  const baseEval = evaluatePortfolio([baseProp], IRISH_PRESET.budget, IRISH_PRESET.weights, IRISH_PRESET.household, 'IE');
  const agreedEval = evaluatePortfolio([agreedProp], IRISH_PRESET.budget, IRISH_PRESET.weights, IRISH_PRESET.household, 'IE');

  const expectedStampDelta = calculateStampDuty(1_165_000, 'IE') - calculateStampDuty(1_150_000, 'IE');
  assert.equal(agreedEval.evaluated[0].stampDuty - baseEval.evaluated[0].stampDuty, expectedStampDelta);
  assert.equal(
    agreedEval.evaluated[0].totalLandedCost - baseEval.evaluated[0].totalLandedCost,
    15_000 + expectedStampDelta
  );
  assert.equal(
    agreedEval.evaluated[0].purchaseCeilingDelta - baseEval.evaluated[0].purchaseCeilingDelta,
    15_000
  );
});

test('customPriorityFactors and customFactorScores shift lifestyleScore deterministically', () => {
  const factorId = 'factor-sea-swim';
  const weightsWithCustom = {
    ...IRISH_PRESET.weights,
    customPriorityFactors: [
      { id: factorId, title: 'Sea swimming distance', subtitle: 'Under 10 min walk', weight: 5 },
    ],
  };
  const lowFit = { ...IRISH_PRESET.properties[0], customFactorScores: { [factorId]: 2 } };
  const highFit = { ...IRISH_PRESET.properties[0], customFactorScores: { [factorId]: 10 } };

  const lowEval = evaluatePortfolio([lowFit], IRISH_PRESET.budget, weightsWithCustom, IRISH_PRESET.household, 'IE');
  const highEval = evaluatePortfolio([highFit], IRISH_PRESET.budget, weightsWithCustom, IRISH_PRESET.household, 'IE');

  assert.ok(highEval.evaluated[0].lifestyleScore > lowEval.evaluated[0].lifestyleScore);
  assert.ok(highEval.evaluated[0].compositeScore > lowEval.evaluated[0].compositeScore);
});
