import type {
  HouseholdProfile,
  MarketMode,
  NonNegotiableRule,
  PropertyCandidate,
} from '../types/property.ts';
import { getIdToken } from '../auth/firebaseAuth.ts';

export class BackendAuthError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'BackendAuthError';
    this.status = status;
  }
}

async function authorizedJsonHeaders(): Promise<Record<string, string>> {
  try {
    const token = await getIdToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Sign in required before calling the property backend.';
    throw new BackendAuthError(message, 401);
  }
}

function errorMessage(payload: ApiErrorResponse | null, status: number, fallback: string): string {
  if (payload && payload.error) return payload.error;
  return `${fallback} HTTP ${status}.`;
}

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
    headers: await authorizedJsonHeaders(),
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

  if (response.status === 401 || response.status === 403 || !response.ok || !payload || !payload.ok) {
    const errMsg = errorMessage(
      payload && !payload.ok ? payload : null,
      response.status,
      'Decision backend returned'
    );
    if (response.status === 401 || response.status === 403) {
      throw new BackendAuthError(errMsg, response.status);
    }
    throw new Error(errMsg);
  }

  return {
    ...payload.audit,
    latencyMs: payload.latencyMs,
  };
}

interface IngestSuccessResponse {
  ok: true;
  properties: PropertyCandidate[];
}

export async function ingestPropertyUrlsViaBackend(
  urls: string[],
  market: MarketMode,
  existingCount: number
): Promise<PropertyCandidate[]> {
  const response = await fetch('/api/ingest-urls', {
    method: 'POST',
    headers: await authorizedJsonHeaders(),
    body: JSON.stringify({ urls, market, existingCount }),
  });

  const payload = (await response.json().catch(() => null)) as
    | IngestSuccessResponse
    | ApiErrorResponse
    | null;

  if (
    response.status === 401 ||
    response.status === 403 ||
    !response.ok ||
    !payload ||
    !payload.ok ||
    !Array.isArray(payload.properties)
  ) {
    const errMsg = errorMessage(
      payload && 'error' in payload ? payload : null,
      response.status,
      'Listing ingestion backend returned'
    );
    if (response.status === 401 || response.status === 403) {
      throw new BackendAuthError(errMsg, response.status);
    }
    throw new Error(errMsg);
  }

  return payload.properties;
}
