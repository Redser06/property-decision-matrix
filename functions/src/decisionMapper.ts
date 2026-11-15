import type { GoogleGenAI } from '@google/genai';

export type CreateDecisionPayload = Parameters<GoogleGenAI['decisions']['create']>[0];
export type CreateDecisionResult = Awaited<ReturnType<GoogleGenAI['decisions']['create']>>;
export type DecisionAnswersMap = NonNullable<CreateDecisionResult['answers']>;
export type DecisionQuestion = CreateDecisionPayload['questions'][string];
export type DecisionInputBlock = Extract<CreateDecisionPayload['input'], Array<unknown>>[number];

export interface AttachmentInput {
  name?: string;
  mimeType: string;
  dataBase64: string;
}

export interface PropertySummaryInput {
  id: string;
  code: string;
  name: string;
  area: string;
  postcode: string;
  sourcePortal: string;
  askingPrice: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  energyRating: string;
  tenure: string;
  requiredWorksCost: number;
  requiredWorksLabel: string;
  heatingUpgradeCost: number;
  heatingUpgradeLabel: string;
  commuteMinutes: number;
  commuteRoute: string;
  ambientNoiseDb: number;
  noiseDescription: string;
  walkTitle: string;
  walkSubtitle: string;
  hiddenAmenities: string[];
  solarOrientation: string;
  winterSunHours: number;
  solarDescription: string;
  catchmentSchool: string;
  catchmentProbability: number;
  catchmentStatus: string;
  hasDedicatedWfhNook: boolean;
  hasOffStreetParkingOrEv: boolean;
  gardenLengthFt: number;
  ceilingHeightM: number;
  architecturalNote: string;
  renovationIsCosmeticOnly: boolean;
  thirdBedroomSqft: number;
}

export interface NonNegotiableInput {
  id: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  strict: boolean;
}

export interface HouseholdSummaryInput {
  adults: string;
  children: string;
  pets: string;
  primaryCommuteTarget: string;
  primaryCommuteMaxMins: number;
  priorityCatchmentLabel: string;
}

export interface EvaluatePropertyDecisionInput {
  market: 'IE' | 'UK';
  property: PropertySummaryInput;
  household: HouseholdSummaryInput;
  nonNegotiables: NonNegotiableInput[];
  listingNotes?: string;
  attachments?: AttachmentInput[];
}

export interface MappedRuleDecision {
  ruleId: string;
  ruleTitle: string;
  strict: boolean;
  probabilityYes: number;
  confidence: number;
  status: 'PASS' | 'REVIEW' | 'FAIL';
}

export interface MappedRubricScore {
  key: string;
  label: string;
  expectedScore1to5: number;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface PropertyDecisionAuditResult {
  model: 'gemini-decision-1';
  evaluatedAt: string;
  ruleDecisions: MappedRuleDecision[];
  solarClassification: {
    selected: string;
    confidence: number;
    probabilities: Record<string, number>;
  } | null;
  cosmeticOnlyWorks: {
    probabilityYes: number;
    confidence: number;
  } | null;
  rubricScores: MappedRubricScore[];
  suggestedPatch: {
    solarOrientation?: 'Due South' | 'South-East' | 'South-West' | 'East-West' | 'North-West';
    renovationIsCosmeticOnly?: boolean;
  };
}

const CONFIDENCE_REVIEW_THRESHOLD = 0.72;

const SOLAR_OPTIONS: Record<string, string> = {
  'Due South': 'Rear garden and main living elevation face directly South for maximum winter sunlight.',
  'South-East': 'Rear elevation faces South-East, capturing strong morning to midday sun.',
  'South-West': 'Rear elevation faces South-West, capturing afternoon and evening sunlight.',
  'East-West': 'Dual aspect East-West orientation with morning front light and afternoon rear light.',
  'North-West': 'Rear elevation faces North-West with limited direct winter solar gain.',
};

const RUBRIC_CRITERIA_5 = [
  '1/5 (Poor): Material defects, compromised layout, or clear shortfall against family benchmark.',
  '2/5 (Below Average): Noticeable compromises requiring compromise or costly remediation.',
  '3/5 (Acceptable): Solid, functional standard with minor trade-offs.',
  '4/5 (Strong): Above-market quality offering clear daily lifestyle upside.',
  '5/5 (Exceptional): Rare best-in-class asset with standout long-term desirability.',
];

export function buildDecisionRequestPayload(
  payload: EvaluatePropertyDecisionInput
): CreateDecisionPayload {
  const { property, household, nonNegotiables, listingNotes, attachments, market } = payload;
  const currency = market === 'IE' ? 'EUR' : 'GBP';

  const summaryText = [
    `PROPERTY CANDIDATE EVALUATION DOSSIER (${market})`,
    `Property: ${property.code} — ${property.name} (${property.area}, ${property.postcode})`,
    `Portal: ${property.sourcePortal} | Tenure: ${property.tenure} | Energy: ${property.energyRating}`,
    `Asking Price: ${currency} ${property.askingPrice.toLocaleString('en-US')}`,
    `Specs: ${property.bedrooms} bed, ${property.bathrooms} bath, ${property.sqft} sq ft, Bed 3: ${property.thirdBedroomSqft} sq ft, Ceiling: ${property.ceilingHeightM}m, Garden: ${property.gardenLengthFt} ft`,
    `Estimated Works: ${currency} ${property.requiredWorksCost.toLocaleString('en-US')} (${property.requiredWorksLabel}); Heating Upgrade: ${currency} ${property.heatingUpgradeCost.toLocaleString('en-US')} (${property.heatingUpgradeLabel}); Cosmetic-only flag: ${property.renovationIsCosmeticOnly}`,
    `Commute: ${property.commuteMinutes} min (${property.commuteRoute}) vs household max ${household.primaryCommuteMaxMins} min to ${household.primaryCommuteTarget}`,
    `Acoustics: ${property.ambientNoiseDb} dBA — ${property.noiseDescription}`,
    `Micro-Walkability & Hidden Amenities: ${property.walkTitle} — ${property.walkSubtitle}; Nearby: ${property.hiddenAmenities.join(', ')}`,
    `Solar & Daylight: ${property.solarOrientation}, ${property.winterSunHours}h winter sun — ${property.solarDescription}`,
    `Catchment: ${property.catchmentSchool} (${property.catchmentProbability}% — ${property.catchmentStatus}) vs priority ${household.priorityCatchmentLabel}`,
    `Household: ${household.adults}; ${household.children}; Pets: ${household.pets}`,
    `WFH Nook: ${property.hasDedicatedWfhNook} | Off-Street/EV: ${property.hasOffStreetParkingOrEv}`,
    `Architectural Note: ${property.architecturalNote}`,
    listingNotes && listingNotes.trim()
      ? `\nBUYER / SURVEY / LISTING EVIDENCE NOTES:\n${listingNotes.trim()}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  const inputBlocks: DecisionInputBlock[] = [
    { type: 'text', text: summaryText },
  ];

  for (const att of (attachments ?? []).slice(0, 4)) {
    const cleanBase64 = att.dataBase64.replace(/^data:[^;]+;base64,/, '').trim();
    if (!cleanBase64) continue;
    if (att.mimeType.startsWith('image/')) {
      inputBlocks.push({
        type: 'image',
        data: cleanBase64,
        mime_type: att.mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
      });
    } else if (att.mimeType === 'application/pdf') {
      inputBlocks.push({
        type: 'document',
        data: cleanBase64,
        mime_type: 'application/pdf',
      });
    }
  }

  const questions: Record<string, DecisionQuestion> = {};

  for (const rule of nonNegotiables.filter((r) => r.enabled)) {
    questions[`rule_${rule.id}`] = {
      type: 'noul',
      instructions: `Does this property satisfy the buyer's requirement: "${rule.title}" (${rule.subtitle})?`,
      criteria: {
        true_description: 'The property dossier and buyer evidence clearly satisfy this requirement.',
        false_description: 'The property fails, breaches, or materially conflicts with this requirement.',
      },
    };
  }

  questions.cosmetic_only_works = {
    type: 'noul',
    instructions:
      'Are the required post-purchase works limited to cosmetic/light upgrades rather than major structural, roof, underpinning, or full-gut remediation?',
    criteria: {
      true_description: 'Cosmetic refresh, light joinery, or routine thermal upgrades only.',
      false_description: 'Requires structural works, roof replacement, damp underpinning, or full refurbishment.',
    },
  };

  questions.solar_orientation = {
    type: 'choice',
    instructions:
      'Classify the most accurate rear garden / primary living solar orientation supported by the dossier and any attached floorplan or photos.',
    criteria: SOLAR_OPTIONS,
  };

  questions.rubric_architectural_merit = {
    type: 'score',
    instructions: 'Rate the architectural character, ceiling height, natural proportions, and build quality from 1 to 5.',
    criteria: RUBRIC_CRITERIA_5,
  };

  questions.rubric_natural_daylight = {
    type: 'score',
    instructions: 'Rate natural daylight and winter solar exposure potential from 1 to 5.',
    criteria: RUBRIC_CRITERIA_5,
  };

  questions.rubric_acoustic_quiet = {
    type: 'score',
    instructions: 'Rate street quietness and acoustic tranquility for family living from 1 to 5.',
    criteria: RUBRIC_CRITERIA_5,
  };

  questions.rubric_hidden_walk_value = {
    type: 'score',
    instructions: 'Rate unlisted micro-walkability, park/trail proximity, and local neighbourhood amenities from 1 to 5.',
    criteria: RUBRIC_CRITERIA_5,
  };

  return {
    model: 'gemini-decision-1',
    input: inputBlocks,
    questions,
  };
}

export function mapDecisionResponse(
  answers: DecisionAnswersMap | undefined,
  payload: EvaluatePropertyDecisionInput
): PropertyDecisionAuditResult {
  const safeAnswers = answers ?? {};
  const ruleDecisions: MappedRuleDecision[] = [];

  for (const rule of payload.nonNegotiables.filter((r) => r.enabled)) {
    const ans = safeAnswers[`rule_${rule.id}`];
    if (ans && ans.type === 'noul') {
      const status: 'PASS' | 'REVIEW' | 'FAIL' =
        ans.confidence < CONFIDENCE_REVIEW_THRESHOLD
          ? 'REVIEW'
          : ans.noul >= 0.5
            ? 'PASS'
            : 'FAIL';
      ruleDecisions.push({
        ruleId: rule.id,
        ruleTitle: rule.title,
        strict: rule.strict,
        probabilityYes: Number(ans.noul.toFixed(3)),
        confidence: Number(ans.confidence.toFixed(3)),
        status,
      });
    }
  }

  const solarAns = safeAnswers.solar_orientation;
  const solarClassification =
    solarAns && solarAns.type === 'choice'
      ? {
          selected: solarAns.choice,
          confidence: Number(solarAns.confidence.toFixed(3)),
          probabilities: solarAns.probabilities,
        }
      : null;

  const cosmeticAns = safeAnswers.cosmetic_only_works;
  const cosmeticOnlyWorks =
    cosmeticAns && cosmeticAns.type === 'noul'
      ? {
          probabilityYes: Number(cosmeticAns.noul.toFixed(3)),
          confidence: Number(cosmeticAns.confidence.toFixed(3)),
        }
      : null;

  const rubricMeta: { key: string; label: string }[] = [
    { key: 'rubric_architectural_merit', label: 'Architectural Character & Proportions' },
    { key: 'rubric_natural_daylight', label: 'Natural Daylight & Solar Gain' },
    { key: 'rubric_acoustic_quiet', label: 'Acoustic Quietness & Sanctuary' },
    { key: 'rubric_hidden_walk_value', label: 'Micro-Walkability & Hidden Value' },
  ];

  const rubricScores: MappedRubricScore[] = [];
  for (const item of rubricMeta) {
    const ans = safeAnswers[item.key];
    if (ans && ans.type === 'score') {
      // Score indices 0..4 map to 1..5 scale
      rubricScores.push({
        key: item.key,
        label: item.label,
        expectedScore1to5: Number((ans.score + 1).toFixed(2)),
        confidence: Number(ans.confidence.toFixed(3)),
        probabilities: ans.probabilities,
      });
    }
  }

  const suggestedPatch: PropertyDecisionAuditResult['suggestedPatch'] = {};
  if (
    solarClassification &&
    solarClassification.confidence >= CONFIDENCE_REVIEW_THRESHOLD &&
    solarClassification.selected in SOLAR_OPTIONS
  ) {
    suggestedPatch.solarOrientation = solarClassification.selected as
      | 'Due South'
      | 'South-East'
      | 'South-West'
      | 'East-West'
      | 'North-West';
  }
  if (cosmeticOnlyWorks && cosmeticOnlyWorks.confidence >= CONFIDENCE_REVIEW_THRESHOLD) {
    suggestedPatch.renovationIsCosmeticOnly = cosmeticOnlyWorks.probabilityYes >= 0.5;
  }

  return {
    model: 'gemini-decision-1',
    evaluatedAt: new Date().toISOString(),
    ruleDecisions,
    solarClassification,
    cosmeticOnlyWorks,
    rubricScores,
    suggestedPatch,
  };
}
