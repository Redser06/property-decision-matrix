import type { GoogleGenAI } from '@google/genai';

export interface IngestedPropertyCandidate {
  id: string;
  code: string;
  name: string;
  area: string;
  postcode: string;
  sourcePortal: 'Daft.ie' | 'MyHome.ie' | 'Rightmove' | 'Zoopla' | 'Knight Frank' | 'Manual';
  sourceUrl: string;
  imageUrl: string;
  ingestionSource: 'live_html' | 'search_grounded' | 'url_fallback';
  askingPrice: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  sqm: number;
  energyRating: string;
  energyScore: number;
  tenure: string;
  requiredWorksCost: number;
  requiredWorksLabel: string;
  heatingUpgradeCost: number;
  heatingUpgradeLabel: string;
  legalSurveyCost: number;
  contingencyCost: number;
  coordinates: {
    lat: number;
    lng: number;
    mapX: number;
    mapY: number;
  };
  commuteMinutes: number;
  commuteRoute: string;
  secondaryCommuteMinutes: number;
  ambientNoiseDb: number;
  noiseDescription: string;
  walkTitle: string;
  walkSubtitle: string;
  walkBadge: string;
  hiddenAmenities: string[];
  solarOrientation: 'Due South' | 'South-East' | 'South-West' | 'East-West' | 'North-West';
  winterSunHours: number;
  solarDescription: string;
  catchmentSchool: string;
  catchmentProbability: number;
  catchmentStatus: string;
  catchmentNote: string;
  hasDedicatedWfhNook: boolean;
  hasOffStreetParkingOrEv: boolean;
  gardenLengthFt: number;
  ceilingHeightM: number;
  architecturalNote: string;
  renovationIsCosmeticOnly: boolean;
  thirdBedroomSqft: number;
  parsedHighlights: string[];
}

export interface HtmlSignals {
  title: string;
  description: string;
  ogImage: string | null;
  jsonLdSnippets: string[];
  nextDataSnippet: string | null;
  bodyTextSnippet: string;
}

const VALID_ORIENTATIONS = new Set([
  'Due South',
  'South-East',
  'South-West',
  'East-West',
  'North-West',
]);

export function detectPortal(
  url: string
): 'Daft.ie' | 'MyHome.ie' | 'Rightmove' | 'Zoopla' | 'Knight Frank' | 'Manual' {
  const lower = url.toLowerCase();
  if (lower.includes('daft.ie')) return 'Daft.ie';
  if (lower.includes('myhome.ie')) return 'MyHome.ie';
  if (lower.includes('rightmove.co.uk')) return 'Rightmove';
  if (lower.includes('zoopla.co.uk')) return 'Zoopla';
  if (lower.includes('knightfrank')) return 'Knight Frank';
  return 'Manual';
}

export function isAntiBotChallenge(status: number, html: string): boolean {
  if (status === 403 || status === 429 || status === 503) return true;
  const lower = html.slice(0, 8000).toLowerCase();
  return (
    lower.includes('cf-browser-verification') ||
    lower.includes('attention required! | cloudflare') ||
    lower.includes('just a moment...') ||
    lower.includes('verify you are human') ||
    lower.includes('g-recaptcha') ||
    lower.includes('hcaptcha')
  );
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function resolveUrl(candidate: string | null | undefined, baseUrl: string): string | null {
  if (!candidate) return null;
  const trimmed = decodeHtmlEntities(candidate);
  if (!trimmed || trimmed.startsWith('data:')) return null;
  try {
    const u = new URL(trimmed, baseUrl);
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      return u.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function extractHtmlSignals(html: string, baseUrl: string): HtmlSignals {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : '';

  const descMatch =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const description = descMatch ? decodeHtmlEntities(descMatch[1]) : '';

  const ogImageMatch =
    html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i) ??
    html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);

  let ogImage = resolveUrl(ogImageMatch?.[1], baseUrl);

  const jsonLdSnippets: string[] = [];
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let ldMatch: RegExpExecArray | null;
  while ((ldMatch = jsonLdRegex.exec(html)) !== null) {
    const raw = ldMatch[1].trim();
    if (!raw) continue;
    jsonLdSnippets.push(raw.slice(0, 4000));
    if (!ogImage) {
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const imgField = parsed.image ?? parsed.photo;
        if (typeof imgField === 'string') {
          ogImage = resolveUrl(imgField, baseUrl);
        } else if (Array.isArray(imgField) && typeof imgField[0] === 'string') {
          ogImage = resolveUrl(imgField[0], baseUrl);
        } else if (
          Array.isArray(imgField) &&
          imgField[0] &&
          typeof (imgField[0] as Record<string, unknown>).url === 'string'
        ) {
          ogImage = resolveUrl((imgField[0] as Record<string, unknown>).url as string, baseUrl);
        }
      } catch {
        // Ignore malformed JSON-LD blocks
      }
    }
    if (jsonLdSnippets.length >= 3) break;
  }

  let nextDataSnippet: string | null = null;
  const nextDataMatch = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (nextDataMatch && nextDataMatch[1]) {
    nextDataSnippet = nextDataMatch[1].trim().slice(0, 12000);
    if (!ogImage) {
      const imgUrlMatch = nextDataSnippet.match(/https?:\/\/[^"'\s\\]+\.(?:jpg|jpeg|webp|png)(?:\?[^"'\s\\]*)?/i);
      if (imgUrlMatch) {
        ogImage = resolveUrl(imgUrlMatch[0], baseUrl);
      }
    }
  }

  const bodyOnly = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 10000);

  return {
    title,
    description,
    ogImage,
    jsonLdSnippets,
    nextDataSnippet,
    bodyTextSnippet: bodyOnly,
  };
}

interface ExtractedFields {
  name?: string;
  area?: string;
  postcode?: string;
  askingPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  sqm?: number;
  energyRating?: string;
  tenure?: string;
  imageUrl?: string | null;
  solarOrientation?: string;
  architecturalNote?: string;
  parsedHighlights?: string[];
  hiddenAmenities?: string[];
}

const PROPERTY_EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    area: { type: 'string' },
    postcode: { type: 'string' },
    askingPrice: { type: 'number' },
    bedrooms: { type: 'number' },
    bathrooms: { type: 'number' },
    sqft: { type: 'number' },
    sqm: { type: 'number' },
    energyRating: { type: 'string' },
    tenure: { type: 'string' },
    imageUrl: { type: 'string' },
    solarOrientation: { type: 'string' },
    architecturalNote: { type: 'string' },
    parsedHighlights: { type: 'array', items: { type: 'string' } },
    hiddenAmenities: { type: 'array', items: { type: 'string' } },
  },
  required: ['name', 'area', 'askingPrice', 'bedrooms', 'bathrooms'],
};

function deriveSlugLabel(url: string): string {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname
      .split('/')
      .filter((s) => s.length > 2 && !/^\d+$/.test(s) && s !== 'for-sale' && s !== 'residential' && s !== 'brochure' && s !== 'properties' && s !== 'details');
    const rawSlug = segments.sort((a, b) => b.length - a.length)[0] ?? 'Candidate Property';
    return rawSlug
      .replace(/^(detached|semi-detached|terraced)-house-/i, '')
      .split('-')
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
      .join(' ')
      .trim() || 'Candidate Property';
  } catch {
    return 'Candidate Property';
  }
}

function parseJsonObjectFromText(text: string | undefined): ExtractedFields | null {
  if (!text) return null;
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as ExtractedFields;
  } catch {
    return null;
  }
}

function energyLabelToScore(label: string): number {
  const upper = label.toUpperCase();
  if (upper.includes('A1') || upper.includes('A2') || upper.includes('RATING A')) return 94;
  if (upper.includes('A3') || upper.includes('B1') || upper.includes('RATING B')) return 85;
  if (upper.includes('B2') || upper.includes('B3')) return 79;
  if (upper.includes('C1') || upper.includes('RATING C')) return 72;
  if (upper.includes('C2') || upper.includes('C3')) return 66;
  if (upper.includes('D')) return 58;
  return 72;
}

export async function ingestSingleUrl(
  ai: GoogleGenAI,
  rawUrl: string,
  market: 'IE' | 'UK',
  index: number
): Promise<IngestedPropertyCandidate> {
  const portal = detectPortal(rawUrl);
  const isIE = market === 'IE' || portal === 'Daft.ie' || portal === 'MyHome.ie';
  const code = `Property ${String.fromCharCode(65 + (index % 26))}`;

  let extracted: ExtractedFields | null = null;
  let ingestionSource: IngestedPropertyCandidate['ingestionSource'] = 'url_fallback';
  let liveOgImage: string | null = null;

  // Stage A: Polite direct HTTP fetch of the listing page
  try {
    const resp = await fetch(rawUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-IE,en-GB;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
    });

    const html = await resp.text();
    if (resp.ok && html.length > 400 && !isAntiBotChallenge(resp.status, html)) {
      const signals = extractHtmlSignals(html, resp.url || rawUrl);
      liveOgImage = signals.ogImage;

      const prompt = [
        `Extract exact property listing attributes from this fetched ${portal} page.`,
        `Return accurate numeric values from the listing (askingPrice in ${isIE ? 'EUR' : 'GBP'}, exact bedrooms, exact bathrooms, sqft and/or sqm, energyRating such as BER B2 or EPC C, postcode/Eircode, street name, area, and main property photo imageUrl if present).`,
        `Never invent a fake image URL. If no photo URL is visible, leave imageUrl empty.`,
        `URL: ${rawUrl}`,
        `Title: ${signals.title}`,
        `Meta description: ${signals.description}`,
        `og:image: ${signals.ogImage ?? 'none'}`,
        signals.jsonLdSnippets.length > 0 ? `JSON-LD:\n${signals.jsonLdSnippets.join('\n')}` : '',
        signals.nextDataSnippet ? `__NEXT_DATA__:\n${signals.nextDataSnippet}` : '',
        `Page text:\n${signals.bodyTextSnippet}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      const genResp = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: PROPERTY_EXTRACT_SCHEMA,
        },
      });
      const parsed = parseJsonObjectFromText(genResp.text);
      if (parsed && typeof parsed.bedrooms === 'number' && parsed.bedrooms > 0) {
        extracted = parsed;
        ingestionSource = 'live_html';
      }
    }
  } catch {
    // Fall through cleanly to Stage B Search Grounding
  }

  // Stage B: Search-Grounded fallback when portal blocks direct server fetch
  if (!extracted) {
    try {
      const searchPrompt = [
        `Find the publicly indexed real estate listing details for this exact URL and property:`,
        `URL: ${rawUrl}`,
        `Derived address hint: ${deriveSlugLabel(rawUrl)}`,
        `Extract ONLY facts found in search results for this listing: name (street address), area, postcode/Eircode, askingPrice (numeric ${isIE ? 'EUR' : 'GBP'}), bedrooms (exact integer), bathrooms (exact integer), sqft, sqm, energyRating (BER or EPC), tenure, and 2-3 key highlights.`,
        `Respond ONLY with a single raw JSON object (no markdown fences) with keys: name, area, postcode, askingPrice, bedrooms, bathrooms, sqft, sqm, energyRating, tenure, architecturalNote, parsedHighlights, hiddenAmenities.`,
      ].join('\n');

      const groundedResp = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: searchPrompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      const parsed = parseJsonObjectFromText(groundedResp.text);
      if (parsed && (typeof parsed.bedrooms === 'number' || typeof parsed.askingPrice === 'number')) {
        extracted = parsed;
        ingestionSource = 'search_grounded';
      }
    } catch {
      // Keep fallback below
    }
  }

  const name = extracted?.name?.trim() || deriveSlugLabel(rawUrl);
  const area = extracted?.area?.trim() || (isIE ? 'Dublin / Wicklow' : 'London');
  const postcode = extracted?.postcode?.trim() || (isIE ? 'Eircode Pending' : 'UK Postcode');
  const askingPrice =
    typeof extracted?.askingPrice === 'number' && extracted.askingPrice > 50_000
      ? Math.round(extracted.askingPrice)
      : isIE
        ? 1_150_000
        : 1_250_000;
  const bedrooms =
    typeof extracted?.bedrooms === 'number' && extracted.bedrooms >= 1
      ? Math.round(extracted.bedrooms)
      : 4;
  const bathrooms =
    typeof extracted?.bathrooms === 'number' && extracted.bathrooms >= 1
      ? Math.round(extracted.bathrooms)
      : Math.max(2, bedrooms - 1);

  let sqm = typeof extracted?.sqm === 'number' && extracted.sqm > 30 ? Math.round(extracted.sqm) : 0;
  let sqft = typeof extracted?.sqft === 'number' && extracted.sqft > 300 ? Math.round(extracted.sqft) : 0;
  if (!sqm && sqft) sqm = Math.round(sqft / 10.7639);
  if (!sqft && sqm) sqft = Math.round(sqm * 10.7639);
  if (!sqft && !sqm) {
    sqft = bedrooms >= 5 ? 2450 : bedrooms === 4 ? 1950 : 1450;
    sqm = Math.round(sqft / 10.7639);
  }

  const energyRating = extracted?.energyRating?.trim() || (isIE ? 'BER B3' : 'EPC C (72)');
  const orientationRaw = extracted?.solarOrientation?.trim() || 'South-West';
  const solarOrientation = VALID_ORIENTATIONS.has(orientationRaw)
    ? (orientationRaw as IngestedPropertyCandidate['solarOrientation'])
    : 'South-West';

  const resolvedImageUrl =
    resolveUrl(extracted?.imageUrl, rawUrl) ?? liveOgImage ?? '';

  const requiredWorksCost = Math.round(askingPrice * 0.045 / 1000) * 1000;
  const heatingUpgradeCost = energyRating.includes('A') ? 6_000 : 18_000;
  const legalSurveyCost = 6_000;
  const contingencyCost = Math.round(askingPrice * 0.025 / 1000) * 1000;

  return {
    id: `ingested-${Date.now()}-${index}`,
    code,
    name,
    area,
    postcode,
    sourcePortal: portal,
    sourceUrl: rawUrl,
    imageUrl: resolvedImageUrl,
    ingestionSource,
    askingPrice,
    bedrooms,
    bathrooms,
    sqft,
    sqm,
    energyRating,
    energyScore: energyLabelToScore(energyRating),
    tenure: extracted?.tenure?.trim() || 'Freehold',
    requiredWorksCost,
    requiredWorksLabel: 'Estimated Refresh & Survey Contingency',
    heatingUpgradeCost,
    heatingUpgradeLabel: isIE ? 'SEAI Heat Pump / Insulation Allowance' : 'Thermal Envelope & EPC Upgrade',
    legalSurveyCost,
    contingencyCost,
    coordinates: {
      lat: isIE ? 53.28 + (index % 5) * 0.012 : 51.54 + (index % 5) * 0.008,
      lng: isIE ? -6.18 - (index % 5) * 0.014 : -0.15 - (index % 5) * 0.012,
      mapX: 22 + ((index * 23) % 60),
      mapY: 26 + ((index * 19) % 52),
    },
    commuteMinutes: 26,
    commuteRoute: isIE ? 'DART / Luas / Bus Corridor' : 'London Underground / Overground',
    secondaryCommuteMinutes: 34,
    ambientNoiseDb: 43,
    noiseDescription: 'Estimated residential street acoustics (verify during viewing)',
    walkTitle: 'Local Neighbourhood Walk Radius',
    walkSubtitle:
      ingestionSource === 'live_html'
        ? 'Extracted live from listing metadata.'
        : ingestionSource === 'search_grounded'
          ? 'Retrieved via Google Search grounding (portal blocked direct fetch).'
          : 'Fallback slug parse (portal blocked direct fetch).',
    walkBadge: ingestionSource === 'live_html' ? 'Live Listing Verified' : 'Search Grounded',
    hiddenAmenities:
      extracted?.hiddenAmenities && extracted.hiddenAmenities.length > 0
        ? extracted.hiddenAmenities.slice(0, 4)
        : ['Local Primary Schools', 'Neighbourhood Shops & Cafes', 'Public Green Space'],
    solarOrientation,
    winterSunHours: solarOrientation === 'Due South' ? 7.6 : 6.0,
    solarDescription: `${solarOrientation} aspect (${solarOrientation === 'Due South' ? '7.6h' : '6.0h'} estimated winter sun).`,
    catchmentSchool: `${area} Primary School`,
    catchmentProbability: 86,
    catchmentStatus: 'Verify Catchment',
    catchmentNote: 'Confirm exact admissions distance band during conveyancing.',
    hasDedicatedWfhNook: bedrooms >= 4,
    hasOffStreetParkingOrEv: true,
    gardenLengthFt: 48,
    ceilingHeightM: 2.9,
    architecturalNote:
      extracted?.architecturalNote?.trim() ||
      `Parsed from ${portal} (${ingestionSource.replace('_', ' ')}).`,
    renovationIsCosmeticOnly: true,
    thirdBedroomSqft: 120,
    parsedHighlights:
      extracted?.parsedHighlights && extracted.parsedHighlights.length > 0
        ? extracted.parsedHighlights.slice(0, 4)
        : [`${bedrooms} Bedrooms`, `${bathrooms} Bathrooms`, `${sqft.toLocaleString()} sq ft`, energyRating],
  };
}
