import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { GoogleGenAI } from '@google/genai';
import {
  buildDecisionRequestPayload,
  mapDecisionResponse,
  type EvaluatePropertyDecisionInput,
} from './decisionMapper.js';
import { ingestSingleUrl } from './ingestMapper.js';
import {
  handleEvaluatePropertyDecisions,
  handleIngestPropertyUrls,
  isLocalDevRuntime,
  type AccessConfig,
  type HandlerDeps,
} from './functionHttp.js';

const geminiApiKey = defineSecret('GEMINI_API_KEY');

/** Comma-separated Firebase Auth UIDs. Empty or unset denies every caller. */
const allowedUids = defineString('ALLOWED_UIDS', {
  default: '',
  description:
    'Comma-separated Firebase Auth UIDs allowed to call ingestPropertyUrls and evaluatePropertyDecisions. Empty denies all callers.',
});

/** Comma-separated verified emails. Empty or unset denies every caller unless ALLOWED_UIDS matches. */
const allowedEmails = defineString('ALLOWED_EMAILS', {
  default: '',
  description:
    'Comma-separated verified emails allowed to call the property functions. Ignored unless email_verified is true. Both allowlists empty denies all callers.',
});

/** Comma-separated browser origins. Does not accept a wildcard. */
const allowedOrigins = defineString('ALLOWED_ORIGINS', {
  default: '',
  description:
    'Comma-separated browser origins allowed to call the property functions. Localhost is added only in the Functions emulator.',
});

function readParam(param: { value: () => string }): string {
  try {
    return param.value() || '';
  } catch {
    return '';
  }
}

function readAccessConfig(): AccessConfig {
  return {
    allowedUids: readParam(allowedUids),
    allowedEmails: readParam(allowedEmails),
    allowedOrigins: readParam(allowedOrigins),
    allowLocalDevOrigins: isLocalDevRuntime(),
    geminiApiKey: readParam(geminiApiKey) || process.env.GEMINI_API_KEY || '',
  };
}

function ensureAdminApp(): void {
  if (getApps().length === 0) {
    initializeApp();
  }
}

const deps: HandlerDeps = {
  verifyIdToken: async (token) => {
    ensureAdminApp();
    const decoded = await getAuth().verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email,
      emailVerified: decoded.email_verified === true,
    };
  },
  readAccessConfig,
  ingestUrls: async (urls, market, existingCount, apiKey) => {
    const ai = new GoogleGenAI({ apiVersion: 'v1beta', apiKey });
    return Promise.all(urls.map((url, idx) => ingestSingleUrl(ai, url, market, existingCount + idx)));
  },
  evaluateDecision: async (input: EvaluatePropertyDecisionInput, apiKey) => {
    const ai = new GoogleGenAI({ apiVersion: 'v1beta', apiKey });
    const requestPayload = buildDecisionRequestPayload(input);
    const response = await ai.decisions.create(requestPayload);
    return mapDecisionResponse(response.answers, input);
  },
};

const sharedOptions = {
  region: 'europe-west2' as const,
  // Open CORS is disabled. applyRequestCors reflects ALLOWED_ORIGINS only.
  cors: false as const,
  secrets: [geminiApiKey],
};

export const evaluatePropertyDecisions = onRequest(
  {
    ...sharedOptions,
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  (req, res) => handleEvaluatePropertyDecisions(req, res, deps)
);

export const ingestPropertyUrls = onRequest(
  {
    ...sharedOptions,
    timeoutSeconds: 60,
    memory: '512MiB',
  },
  (req, res) => handleIngestPropertyUrls(req, res, deps)
);
