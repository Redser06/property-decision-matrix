import type {
  HouseholdProfile,
  MarketMode,
  NonNegotiableRule,
  PropertyCandidate,
} from '../types/property.ts';

export interface DecisionAttachment {
  name: string;
  mimeType: string;
  dataBase64: string;
}

export interface GeminiMappedRuleDecision {
  ruleId: string;
  ruleTitle: string;
  strict: boolean;
  probabilityYes: number;
  confidence: number;
  status: 'PASS' | 'REVIEW' | 'FAIL';
}

export interface GeminiMappedRubricScore {
  key: string;
  label: string;
  expectedScore1to5: number;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface GeminiDecisionAuditResult {
  model: 'gemini-decision-1';
  evaluatedAt: string;
  latencyMs?: number;
  ruleDecisions: GeminiMappedRuleDecision[];
  solarClassification: {
    selected: string;
    confidence: number;
    probabilities: Record<string, number>;
  } | null;
  cosmeticOnlyWorks: {
    probabilityYes: number;
    confidence: number;
  } | null;
  rubricScores: GeminiMappedRubricScore[];
  suggestedPatch: Partial<PropertyCandidate>;
}

interface ApiSuccessResponse {
  ok: true;
  latencyMs: number;
  audit: GeminiDecisionAuditResult;
}

interface ApiErrorResponse {
  ok: false;
  code?: string;
  error?: string;
}

export async function runGeminiDecisionAudit(params: {
  market: MarketMode;
  property: PropertyCandidate;
  household: HouseholdProfile;
  nonNegotiables: NonNegotiableRule[];
  listingNotes?: string;
  attachments?: DecisionAttachment[];
}): Promise<GeminiDecisionAuditResult> {
  const response = await fetch('/api/evaluate-decisions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      market: params.market,
      property: params.property,
      household: {
        adults: params.household.adults,
        children: params.household.children,
        pets: params.household.pets,
        primaryCommuteTarget: params.household.primaryCommuteTarget,
        primaryCommuteMaxMins: params.household.primaryCommuteMaxMins,
        priorityCatchmentLabel: params.household.priorityCatchmentLabel,
      },
      nonNegotiables: params.nonNegotiables,
      listingNotes: params.listingNotes,
      attachments: params.attachments,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiSuccessResponse
    | ApiErrorResponse
    | null;

  if (!response.ok || !payload || !payload.ok) {
    const errMsg =
      payload && 'error' in payload && payload.error
        ? payload.error
        : `Decision backend returned HTTP ${response.status}.`;
    throw new Error(errMsg);
  }

  return {
    ...payload.audit,
    latencyMs: payload.latencyMs,
  };
}
