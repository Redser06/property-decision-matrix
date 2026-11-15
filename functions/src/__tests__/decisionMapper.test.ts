import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDecisionRequestPayload,
  mapDecisionResponse,
  type EvaluatePropertyDecisionInput,
} from '../decisionMapper.ts';

const SAMPLE_INPUT: EvaluatePropertyDecisionInput = {
  market: 'UK',
  property: {
    id: 'uk-prop-c',
    code: 'Property C',
    name: '7 Dartmouth Park Avenue',
    area: 'Highgate / Dartmouth Park, NW5',
    postcode: 'NW5 1JL',
    sourcePortal: 'Zoopla',
    askingPrice: 1_380_000,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2150,
    energyRating: 'Rating C (73)',
    tenure: 'Freehold',
    requiredWorksCost: 65_000,
    requiredWorksLabel: 'Light Interior Refresh',
    heatingUpgradeCost: 18_000,
    heatingUpgradeLabel: 'EPC C -> B',
    commuteMinutes: 26,
    commuteRoute: 'Northern Line to King’s Cross',
    ambientNoiseDb: 38,
    noiseDescription: 'Quiet tree-lined residential avenue',
    walkTitle: 'Hampstead Heath (5 min)',
    walkSubtitle: 'Swains Lane Bakery (2 min)',
    hiddenAmenities: ['Parliament Hill Lido (7 min)'],
    solarOrientation: 'Due South',
    winterSunHours: 7.8,
    solarDescription: 'Due South rear aspect',
    catchmentSchool: 'Brookfield Primary',
    catchmentProbability: 94,
    catchmentStatus: 'Deterministic',
    hasDedicatedWfhNook: true,
    hasOffStreetParkingOrEv: true,
    gardenLengthFt: 58,
    ceilingHeightM: 3.1,
    architecturalNote: 'Edwardian double-fronted brick',
    renovationIsCosmeticOnly: true,
    thirdBedroomSqft: 145,
  },
  household: {
    adults: '2 Adults',
    children: '2 Children',
    pets: '1 Dog',
    primaryCommuteTarget: 'King’s Cross',
    primaryCommuteMaxMins: 35,
    priorityCatchmentLabel: 'Brookfield Primary',
  },
  nonNegotiables: [
    {
      id: 'commute-35',
      title: 'True commute under 35 mins',
      subtitle: 'Door-to-desk rail corridor',
      enabled: true,
      strict: true,
    },
    {
      id: 'disabled-rule',
      title: 'Swimming pool',
      subtitle: 'Should be skipped when disabled',
      enabled: false,
      strict: false,
    },
  ],
  listingNotes: 'Surveyor confirmed clean roof timbers and dry cellar.',
  attachments: [
    {
      name: 'floorplan.png',
      mimeType: 'image/png',
      dataBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    },
  ],
};

test('buildDecisionRequestPayload targets gemini-decision-1 and omits disabled rules', () => {
  const req = buildDecisionRequestPayload(SAMPLE_INPUT);
  assert.equal(req.model, 'gemini-decision-1');
  assert.ok(Array.isArray(req.input));
  assert.equal(req.input.length, 2); // text + image
  assert.equal(req.input[1].type, 'image');
  assert.ok(req.questions.rule_commute_35 === undefined); // key uses hyphen from id
  assert.ok(req.questions['rule_commute-35']?.type === 'noul');
  assert.equal(req.questions['rule_disabled-rule'], undefined);
  assert.equal(req.questions.solar_orientation?.type, 'choice');
  assert.equal(req.questions.rubric_architectural_merit?.type, 'score');
});

test('mapDecisionResponse maps high-confidence PASS/FAIL, low-confidence REVIEW, choice, and 1-5 rubric scores', () => {
  const inputWithTwoRules: EvaluatePropertyDecisionInput = {
    ...SAMPLE_INPUT,
    nonNegotiables: [
      SAMPLE_INPUT.nonNegotiables[0],
      {
        id: 'damp-check',
        title: 'No active rising damp',
        subtitle: 'Survey verification',
        enabled: true,
        strict: true,
      },
    ],
  };

  const mapped = mapDecisionResponse(
    {
      'rule_commute-35': { type: 'noul', noul: 0.94, confidence: 0.94 },
      'rule_damp-check': { type: 'noul', noul: 0.56, confidence: 0.56 },
      cosmetic_only_works: { type: 'noul', noul: 0.89, confidence: 0.89 },
      solar_orientation: {
        type: 'choice',
        choice: 'South-West',
        confidence: 0.88,
        probabilities: { 'Due South': 0.08, 'South-West': 0.88, 'North-West': 0.04 },
      },
      rubric_architectural_merit: {
        type: 'score',
        score: 3.4,
        confidence: 0.85,
        legend: { '0': '1', '1': '2', '2': '3', '3': '4', '4': '5' },
        probabilities: { '0': 0.0, '1': 0.0, '2': 0.1, '3': 0.4, '4': 0.5 },
      },
    },
    inputWithTwoRules
  );

  assert.equal(mapped.ruleDecisions[0].status, 'PASS');
  assert.equal(mapped.ruleDecisions[1].status, 'REVIEW');
  assert.equal(mapped.solarClassification?.selected, 'South-West');
  assert.equal(mapped.rubricScores[0].expectedScore1to5, 4.4);
  assert.equal(mapped.suggestedPatch.solarOrientation, 'South-West');
  assert.equal(mapped.suggestedPatch.renovationIsCosmeticOnly, true);
});
