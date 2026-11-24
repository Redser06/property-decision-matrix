import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authorizeHttpRequest,
  handleEvaluatePropertyDecisions,
  handleIngestPropertyUrls,
  isLocalDevRuntime,
  isOriginAllowed,
  resolveAllowedOrigins,
  type AccessConfig,
  type HandlerDeps,
  type HttpRequest,
  type HttpResponse,
  type VerifiedIdentity,
} from '../functionHttp.ts';

const ALLOWED_UID = 'uid-allowed';
const OTHER_UID = 'uid-other';
const ALLOWED_EMAIL = 'allowed@example.com';

function identity(overrides: Partial<VerifiedIdentity> = {}): VerifiedIdentity {
  return {
    uid: ALLOWED_UID,
    email: ALLOWED_EMAIL,
    emailVerified: true,
    ...overrides,
  };
}

function createResponse(): HttpResponse & {
  statusCode: number;
  body: unknown;
  ended: boolean;
  headers: Map<string, string>;
} {
  const headers = new Map<string, string>();
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    ended: false,
    headers,
    setHeader(name: string, value: string | number | readonly string[]) {
      headers.set(name.toLowerCase(), String(value));
    },
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
    },
    end() {
      res.ended = true;
    },
  };
  return res;
}

function createRequest(
  method: string,
  body: unknown,
  headers: Record<string, string> = {}
): HttpRequest {
  const normalized = new Map<string, string>();
  for (const [name, value] of Object.entries(headers)) {
    normalized.set(name.toLowerCase(), value);
  }
  return {
    method,
    body,
    get(name: string) {
      return normalized.get(name.toLowerCase());
    },
  };
}

function baseConfig(overrides: Partial<AccessConfig> = {}): AccessConfig {
  return {
    allowedUids: ALLOWED_UID,
    allowedEmails: '',
    allowedOrigins: 'https://app.example.com',
    allowLocalDevOrigins: false,
    geminiApiKey: 'test-key',
    ...overrides,
  };
}

function createDeps(overrides: Partial<HandlerDeps> = {}): HandlerDeps & {
  calls: { verify: string[]; ingest: number; evaluate: number };
} {
  const calls = { verify: [] as string[], ingest: 0, evaluate: 0 };
  const deps: HandlerDeps & { calls: typeof calls } = {
    calls,
    verifyIdToken: async (token) => {
      calls.verify.push(token);
      if (token === 'good-token') return identity();
      if (token === 'other-token') return identity({ uid: OTHER_UID, email: 'other@example.com' });
      if (token === 'unverified-token') {
        return identity({ uid: OTHER_UID, email: ALLOWED_EMAIL, emailVerified: false });
      }
      if (token === 'email-token') {
        return identity({ uid: OTHER_UID, email: 'Allowed@Example.com', emailVerified: true });
      }
      throw new Error('invalid token');
    },
    readAccessConfig: () => baseConfig(),
    ingestUrls: async () => {
      calls.ingest += 1;
      return [{ id: 'property-1' }];
    },
    evaluateDecision: async () => {
      calls.evaluate += 1;
      return { model: 'gemini-decision-1' };
    },
    ...overrides,
  };
  return deps;
}

const ingestBody = {
  urls: ['https://example.com/listing'],
  market: 'IE' as const,
  existingCount: 0,
};

const decisionBody = {
  property: { id: 'property-1' },
  household: { adults: '2 Adults' },
  nonNegotiables: [],
};

test('no token is 401 and does not call downstream work', async () => {
  for (const invoke of [handleIngestPropertyUrls, handleEvaluatePropertyDecisions]) {
    const deps = createDeps();
    const res = createResponse();
    await invoke(createRequest('POST', invoke === handleIngestPropertyUrls ? ingestBody : decisionBody), res, deps);
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, {
      ok: false,
      code: 'UNAUTHENTICATED',
      error: 'Missing or invalid authorization token.',
    });
    assert.equal(deps.calls.verify.length, 0);
    assert.equal(deps.calls.ingest, 0);
    assert.equal(deps.calls.evaluate, 0);
  }
});

test('invalid token is 401 and does not call downstream work', async () => {
  for (const invoke of [handleIngestPropertyUrls, handleEvaluatePropertyDecisions]) {
    const deps = createDeps();
    const res = createResponse();
    await invoke(
      createRequest('POST', invoke === handleIngestPropertyUrls ? ingestBody : decisionBody, {
        authorization: 'Bearer not-a-real-token',
      }),
      res,
      deps
    );
    assert.equal(res.statusCode, 401);
    assert.equal((res.body as { code?: string }).code, 'UNAUTHENTICATED');
    assert.deepEqual(deps.calls.verify, ['not-a-real-token']);
    assert.equal(deps.calls.ingest, 0);
    assert.equal(deps.calls.evaluate, 0);
  }
});

test('valid token for a non-allowlisted user is 403', async () => {
  for (const invoke of [handleIngestPropertyUrls, handleEvaluatePropertyDecisions]) {
    const deps = createDeps();
    const res = createResponse();
    await invoke(
      createRequest('POST', invoke === handleIngestPropertyUrls ? ingestBody : decisionBody, {
        authorization: 'Bearer other-token',
      }),
      res,
      deps
    );
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { ok: false, code: 'FORBIDDEN', error: 'Forbidden.' });
    assert.equal(deps.calls.ingest, 0);
    assert.equal(deps.calls.evaluate, 0);
  }
});

test('allowlisted uid succeeds and mocks downstream work', async () => {
  const ingestDeps = createDeps();
  const ingestRes = createResponse();
  await handleIngestPropertyUrls(
    createRequest('POST', ingestBody, { authorization: 'Bearer good-token' }),
    ingestRes,
    ingestDeps
  );
  assert.equal(ingestRes.statusCode, 200);
  assert.equal((ingestRes.body as { ok: boolean }).ok, true);
  assert.deepEqual((ingestRes.body as { properties: unknown }).properties, [{ id: 'property-1' }]);
  assert.equal(ingestDeps.calls.ingest, 1);
  assert.deepEqual(ingestDeps.calls.verify, ['good-token']);

  const decisionDeps = createDeps();
  const decisionRes = createResponse();
  await handleEvaluatePropertyDecisions(
    createRequest('POST', decisionBody, { authorization: 'Bearer good-token' }),
    decisionRes,
    decisionDeps
  );
  assert.equal(decisionRes.statusCode, 200);
  assert.equal((decisionRes.body as { ok: boolean }).ok, true);
  assert.deepEqual((decisionRes.body as { audit: unknown }).audit, { model: 'gemini-decision-1' });
  assert.equal(decisionDeps.calls.evaluate, 1);
});

test('empty allowlist fails closed with 403 for a valid token', async () => {
  const deps = createDeps({
    readAccessConfig: () => baseConfig({ allowedUids: ' , ', allowedEmails: '' }),
  });
  const res = createResponse();
  await handleIngestPropertyUrls(
    createRequest('POST', ingestBody, { authorization: 'Bearer good-token' }),
    res,
    deps
  );
  assert.equal(res.statusCode, 403);
  assert.equal(deps.calls.ingest, 0);
});

test('verified allowlisted email succeeds when the uid is not listed', async () => {
  const deps = createDeps({
    readAccessConfig: () => baseConfig({ allowedUids: '', allowedEmails: 'allowed@example.com' }),
  });
  const res = createResponse();
  await handleEvaluatePropertyDecisions(
    createRequest('POST', decisionBody, { authorization: 'Bearer email-token' }),
    res,
    deps
  );
  assert.equal(res.statusCode, 200);
  assert.equal(deps.calls.evaluate, 1);
});

test('unverified email on the allowlist is forbidden', async () => {
  const deps = createDeps({
    readAccessConfig: () => baseConfig({ allowedUids: '', allowedEmails: ALLOWED_EMAIL }),
  });
  const res = createResponse();
  await handleIngestPropertyUrls(
    createRequest('POST', ingestBody, { authorization: 'Bearer unverified-token' }),
    res,
    deps
  );
  assert.equal(res.statusCode, 403);
  assert.equal(deps.calls.ingest, 0);
});

test('malformed authorization scheme is 401 without verifying', async () => {
  const deps = createDeps();
  const res = createResponse();
  await handleIngestPropertyUrls(
    createRequest('POST', ingestBody, { authorization: 'Token good-token' }),
    res,
    deps
  );
  assert.equal(res.statusCode, 401);
  assert.equal(deps.calls.verify.length, 0);
});

test('CORS reflects configured origins and localhost only in dev', async () => {
  assert.equal(isOriginAllowed('https://app.example.com', resolveAllowedOrigins('https://app.example.com', false)), true);
  assert.equal(isOriginAllowed('http://localhost:5178', resolveAllowedOrigins('https://app.example.com', false)), false);
  assert.equal(isOriginAllowed('http://localhost:5178', resolveAllowedOrigins('https://app.example.com', true)), true);
  assert.equal(isOriginAllowed('http://127.0.0.1:5000', resolveAllowedOrigins('', true)), true);
  assert.equal(isOriginAllowed('https://evil.example.com', resolveAllowedOrigins('https://app.example.com', true)), false);
  assert.equal(isOriginAllowed('http://localhost.evil.com', resolveAllowedOrigins('', true)), false);
  assert.equal(
    isOriginAllowed('https://app.example.com\r\nhttps://evil.example.com', resolveAllowedOrigins('https://app.example.com', false)),
    false
  );

  const prod = createDeps();
  const prodRes = createResponse();
  await handleIngestPropertyUrls(
    createRequest('POST', ingestBody, {
      authorization: 'Bearer good-token',
      origin: 'http://localhost:5178',
    }),
    prodRes,
    prod
  );
  assert.equal(prodRes.headers.get('access-control-allow-origin'), undefined);

  const dev = createDeps({
    readAccessConfig: () => baseConfig({ allowLocalDevOrigins: true }),
  });
  const devRes = createResponse();
  await handleIngestPropertyUrls(
    createRequest('POST', ingestBody, {
      authorization: 'Bearer good-token',
      origin: 'http://localhost:5178',
    }),
    devRes,
    dev
  );
  assert.equal(devRes.headers.get('access-control-allow-origin'), 'http://localhost:5178');

  const appRes = createResponse();
  await handleEvaluatePropertyDecisions(
    createRequest('OPTIONS', {}, { origin: 'https://app.example.com' }),
    appRes,
    createDeps()
  );
  assert.equal(appRes.statusCode, 204);
  assert.equal(appRes.ended, true);
  assert.equal(appRes.headers.get('access-control-allow-origin'), 'https://app.example.com');
  assert.match(appRes.headers.get('access-control-allow-headers') ?? '', /Authorization/);
});

test('local dev origins follow the emulator environment only', () => {
  assert.equal(isLocalDevRuntime({ FUNCTIONS_EMULATOR: 'true' }), true);
  assert.equal(isLocalDevRuntime({ FIREBASE_EMULATOR_HUB: '127.0.0.1:4400' }), true);
  assert.equal(isLocalDevRuntime({ NODE_ENV: 'development' }), false);
  assert.equal(isLocalDevRuntime({}), false);
});

test('authorizeHttpRequest fails closed when both lists are unset', async () => {
  const decision = await authorizeHttpRequest(
    'Bearer good-token',
    async () => identity(),
    undefined,
    '   '
  );
  assert.equal(decision.ok, false);
  if (!decision.ok) assert.equal(decision.status, 403);
});
