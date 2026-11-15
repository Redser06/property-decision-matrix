import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenAI } from '@google/genai';
import {
  buildDecisionRequestPayload,
  mapDecisionResponse,
  type EvaluatePropertyDecisionInput,
} from './decisionMapper.js';
import { ingestSingleUrl } from './ingestMapper.js';

const geminiApiKey = defineSecret('GEMINI_API_KEY');

export const evaluatePropertyDecisions = onRequest(
  {
    region: 'europe-west2',
    cors: true,
    secrets: [geminiApiKey],
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' });
      return;
    }

    const body = req.body as Partial<EvaluatePropertyDecisionInput> | undefined;
    if (!body || !body.property || !body.household || !Array.isArray(body.nonNegotiables)) {
      res.status(400).json({
        ok: false,
        error: 'Invalid payload: property, household, and nonNegotiables[] are required.',
      });
      return;
    }

    const apiKey = geminiApiKey.value() || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({
        ok: false,
        code: 'MISSING_GEMINI_API_KEY',
        error: 'GEMINI_API_KEY secret is not configured on the Firebase Functions backend.',
      });
      return;
    }

    try {
      const start = Date.now();
      const ai = new GoogleGenAI({ apiVersion: 'v1beta', apiKey });
      const decisionInput: EvaluatePropertyDecisionInput = {
        market: body.market === 'UK' ? 'UK' : 'IE',
        property: body.property,
        household: body.household,
        nonNegotiables: body.nonNegotiables,
        listingNotes: body.listingNotes,
        attachments: body.attachments,
      };

      const requestPayload = buildDecisionRequestPayload(decisionInput);
      const response = await ai.decisions.create(requestPayload);
      const audit = mapDecisionResponse(response.answers, decisionInput);

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
);

export const ingestPropertyUrls = onRequest(
  {
    region: 'europe-west2',
    cors: true,
    secrets: [geminiApiKey],
    timeoutSeconds: 60,
    memory: '512MiB',
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' });
      return;
    }

    const body = req.body as {
      urls?: string[];
      market?: 'IE' | 'UK';
      existingCount?: number;
    } | undefined;

    const urls = Array.isArray(body?.urls)
      ? body.urls.map((u) => String(u).trim()).filter((u) => /^https?:\/\//i.test(u)).slice(0, 8)
      : [];

    if (urls.length === 0) {
      res.status(400).json({ ok: false, error: 'Provide at least one valid http(s) URL in urls[].' });
      return;
    }

    const apiKey = geminiApiKey.value() || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({
        ok: false,
        code: 'MISSING_GEMINI_API_KEY',
        error: 'GEMINI_API_KEY secret is not configured on the Firebase Functions backend.',
      });
      return;
    }

    try {
      const market: 'IE' | 'UK' = body?.market === 'UK' ? 'UK' : 'IE';
      const existingCount = typeof body?.existingCount === 'number' ? body.existingCount : 0;
      const ai = new GoogleGenAI({ apiVersion: 'v1beta', apiKey });

      const properties = await Promise.all(
        urls.map((u, idx) => ingestSingleUrl(ai, u, market, existingCount + idx))
      );

      res.status(200).json({
        ok: true,
        properties,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to ingest property URLs';
      res.status(502).json({ ok: false, error: message });
    }
  }
);
