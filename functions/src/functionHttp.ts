import type { EvaluatePropertyDecisionInput } from './decisionMapper.js';

/**
 * HTTP auth and CORS for the property functions.
 * Allowlists are comma-separated params. An empty or unset allowlist denies every caller.
 */

export interface VerifiedIdentity {
  uid: string;
  email?: string;
  emailVerified: boolean;
}

export interface AccessConfig {
  allowedUids: string;
  allowedEmails: string;
  allowedOrigins: string;
  allowLocalDevOrigins: boolean;
  geminiApiKey: string;
}

export interface HandlerDeps {
  verifyIdToken: (token: string) => Promise<VerifiedIdentity>;
  readAccessConfig: () => AccessConfig;
  ingestUrls: (
    urls: string[],
    market: 'IE' | 'UK',
    existingCount: number,
    apiKey: string
  ) => Promise<unknown[]>;
  evaluateDecision: (input: EvaluatePropertyDecisionInput, apiKey: string) => Promise<unknown>;
}

export interface HttpRequest {
  method: string;
  body?: unknown;
  get(name: string): string | undefined;
}

export interface HttpResponse {
  setHeader(name: string, value: string | number | readonly string[]): void;
  status(code: number): HttpResponse;
  json(body: unknown): void;
  end(): void;
}

const LOCAL_DEV_ORIGIN = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d{1,5})?$/;

const UNAUTHENTICATED = {
  ok: false as const,
  code: 'UNAUTHENTICATED',
  error: 'Missing or invalid authorization token.',
};

const FORBIDDEN = {
  ok: false as const,
  code: 'FORBIDDEN',
  error: 'Forbidden.',
};

export function isLocalDevRuntime(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.FUNCTIONS_EMULATOR === 'true' || Boolean(env.FIREBASE_EMULATOR_HUB);
}

export function parseCsvList(raw: string | undefined, lowercase: boolean): Set<string> {
  if (!raw) return new Set();
  const values = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => (lowercase ? part.toLowerCase() : part));
  return new Set(values);
}

export function resolveAllowedOrigins(
  configuredRaw: string | undefined,
  allowLocalDevOrigins: boolean
): Array<string | RegExp> {
  const configured = [...parseCsvList(configuredRaw, false)]
    .map(normalizeOrigin)
    .filter((origin) => origin.length > 0);
  if (!allowLocalDevOrigins) return configured;
  return [...configured, LOCAL_DEV_ORIGIN];
}

export function isOriginAllowed(origin: string, rules: Array<string | RegExp>): boolean {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  return rules.some((rule) => (typeof rule === 'string' ? rule === normalized : rule.test(normalized)));
}

export function readBearerToken(authorization: string | undefined): string | null {
  if (!authorization) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(authorization.trim());
  if (!match) return null;
  return match[1] ?? null;
}

export async function authorizeHttpRequest(
  authorizationHeader: string | undefined,
  verifyIdToken: (token: string) => Promise<VerifiedIdentity>,
  allowedUidsRaw: string | undefined,
  allowedEmailsRaw: string | undefined
): Promise<{ ok: true; uid: string } | { ok: false; status: 401 | 403; body: typeof UNAUTHENTICATED | typeof FORBIDDEN }> {
  const token = readBearerToken(authorizationHeader);
  if (!token) {
    return { ok: false, status: 401, body: UNAUTHENTICATED };
  }

  let identity: VerifiedIdentity;
  try {
    identity = await verifyIdToken(token);
  } catch {
    return { ok: false, status: 401, body: UNAUTHENTICATED };
  }

  const uid = typeof identity?.uid === 'string' ? identity.uid.trim() : '';
  if (!uid) {
    return { ok: false, status: 401, body: UNAUTHENTICATED };
  }

  const allowedUids = parseCsvList(allowedUidsRaw, false);
  const allowedEmails = parseCsvList(allowedEmailsRaw, true);
  if (allowedUids.size === 0 && allowedEmails.size === 0) {
    return { ok: false, status: 403, body: FORBIDDEN };
  }

  if (allowedUids.has(uid)) {
    return { ok: true, uid };
  }

  const email = identity.email?.trim().toLowerCase() ?? '';
  if (email && identity.emailVerified === true && allowedEmails.has(email)) {
    return { ok: true, uid };
  }

  return { ok: false, status: 403, body: FORBIDDEN };
}

function normalizeOrigin(origin: string): string {
  const trimmed = origin.trim().replace(/\/+$/, '');
  if (trimmed.length === 0 || /[\u0000-\u001F\u007F]/.test(trimmed)) return '';
  return trimmed;
}

function requestHeader(req: HttpRequest, name: string): string | undefined {
  const value = req.get(name);
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Reflects only configured origins. Returns true when the response is complete (OPTIONS). */
export function applyRequestCors(
  req: HttpRequest,
  res: HttpResponse,
  rules: Array<string | RegExp>
): boolean {
  const origin = requestHeader(req, 'origin');
  if (origin && isOriginAllowed(origin, rules)) {
    res.setHeader('Access-Control-Allow-Origin', normalizeOrigin(origin));
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Max-Age', '3600');
  }

  if (req.method.toUpperCase() === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

async function gateRequest(
  req: HttpRequest,
  res: HttpResponse,
  deps: HandlerDeps
): Promise<{ ok: true; apiKey: string } | { ok: false }> {
  const config = deps.readAccessConfig();
  const rules = resolveAllowedOrigins(config.allowedOrigins, config.allowLocalDevOrigins);
  if (applyRequestCors(req, res, rules)) {
    return { ok: false };
  }

  const auth = await authorizeHttpRequest(
    requestHeader(req, 'authorization'),
    deps.verifyIdToken,
    config.allowedUids,
    config.allowedEmails
  );
  if (!auth.ok) {
    res.status(auth.status).json(auth.body);
    return { ok: false };
  }

  if (req.method.toUpperCase() !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' });
    return { ok: false };
  }

  return { ok: true, apiKey: config.geminiApiKey };
}

function missingApiKey(res: HttpResponse): void {
  res.status(503).json({
    ok: false,
    code: 'MISSING_GEMINI_API_KEY',
    error: 'GEMINI_API_KEY secret is not configured on the Firebase Functions backend.',
  });
}

export async function handleEvaluatePropertyDecisions(
  req: HttpRequest,
  res: HttpResponse,
  deps: HandlerDeps
): Promise<void> {
  const gate = await gateRequest(req, res, deps);
  if (!gate.ok) return;

  const body = req.body as Partial<EvaluatePropertyDecisionInput> | undefined;
  if (!body || !body.property || !body.household || !Array.isArray(body.nonNegotiables)) {
    res.status(400).json({
      ok: false,
      error: 'Invalid payload: property, household, and nonNegotiables[] are required.',
    });
    return;
  }

  if (!gate.apiKey) {
    missingApiKey(res);
    return;
  }

  try {
    const start = Date.now();
    const decisionInput: EvaluatePropertyDecisionInput = {
      market: body.market === 'UK' ? 'UK' : 'IE',
      property: body.property,
      household: body.household,
      nonNegotiables: body.nonNegotiables,
      listingNotes: body.listingNotes,
      attachments: body.attachments,
    };
    const audit = await deps.evaluateDecision(decisionInput, gate.apiKey);
    res.status(200).json({
      ok: true,
      latencyMs: Date.now() - start,
      audit,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error calling Gemini Decisions API';
    res.status(502).json({
      ok: false,
      error: message,
    });
  }
}

export async function handleIngestPropertyUrls(
  req: HttpRequest,
  res: HttpResponse,
  deps: HandlerDeps
): Promise<void> {
  const gate = await gateRequest(req, res, deps);
  if (!gate.ok) return;

  const body = req.body as
    | {
        urls?: string[];
        market?: 'IE' | 'UK';
        existingCount?: number;
      }
    | undefined;

  const urls = Array.isArray(body?.urls)
    ? body.urls
        .map((u) => String(u).trim())
        .filter((u) => /^https?:\/\//i.test(u))
        .slice(0, 8)
    : [];

  if (urls.length === 0) {
    res.status(400).json({ ok: false, error: 'Provide at least one valid http(s) URL in urls[].' });
    return;
  }

  if (!gate.apiKey) {
    missingApiKey(res);
    return;
  }

  try {
    const market: 'IE' | 'UK' = body?.market === 'UK' ? 'UK' : 'IE';
    const existingCount = typeof body?.existingCount === 'number' ? body.existingCount : 0;
    const properties = await deps.ingestUrls(urls, market, existingCount, gate.apiKey);
    res.status(200).json({
      ok: true,
      properties,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to ingest property URLs';
    res.status(502).json({ ok: false, error: message });
  }
}
