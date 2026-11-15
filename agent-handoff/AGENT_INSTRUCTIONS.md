# NestVerdict — Downstream Production Handoff Dossier

This dossier documents the empirical implementation status of the **NestVerdict** prototype (`property-decision-matrix`) as built in `/Users/conorredmond/projects/Rapid-Prototypes/property-decision-matrix`, separating verified working modules from prototype seams so a production team can upgrade storage, listing ingestion, and geospatial APIs cleanly.

---

## Empirical Status Table

| Capability / Area | Status | Notes & Evidence |
| :--- | :--- | :--- |
| **Deterministic Scoring Engine** (`src/engine/decisionEngine.ts`) | **WORKS** | Computes Irish Revenue Stamp Duty (`1%` / `2%` / `6%` bands) and UK SDLT tiers, Total Landed Cost, Head (`prudenceScore`), Heart (`lifestyleScore`), Capital Preservation, strict rule disqualification, Pareto trade-off deltas, and confidence metrics. Verified by 9 passing unit tests (`npm test`). |
| **Dual Market Presets (`IE • €` & `UK • £`)** (`src/data/presets.ts`) | **WORKS** | Switching markets in `TopNavBar` swaps currency formatting, tax schedule labels, household context, and shortlisted portfolios (`7 Burnaby Park` IE default; exact `£1,692,000 / £1,895,000 / £1,598,000` UK Stitch parity). |
| **Head vs. Heart Calibration & Rule Gates** (`Step2CalibrationView.tsx`) | **WORKS** | Adjusting `headPercent`, priority weights (`1x–5x`), acceptable compromises, or toggling `Enabled` / `Strict` flags or adding custom non-negotiables updates all ranks, disqualified tags, and composite scores synchronously. |
| **Side-by-Side Matrix & Works Stress-Test** (`Step3ComparisonView.tsx`) | **WORKS** | Displays A/B/C cards, Hidden Value Engine table, Landed Cost waterfall, and working `+15k` / `-15k` required works buttons plus full `PropertyAuditModal` editing. Verified live in Chromium across desktop and tablet viewports. |
| **Executive Verdict, Checklist & Exports** (`Step4VerdictView.tsx`, `Modals.tsx`) | **WORKS** | Pre-Offer Checklist toggles update readiness % cleanly; Execution Toolkit exports structured Markdown (`.md`) Executive Memorandum, Offer Justification Letter, and CSV (`.csv`) Dynamic Sensitivity Matrix via clipboard or browser download. |
| **Client-Side Workspace Persistence** (`App.tsx`) | **WORKS (Local Only)** | State persists across reloads in browser `localStorage` (`nestverdict_workspace_v1`) partitioned per market (`IE` / `UK`). |
| **Property Listing URL Ingestion** (`parsePropertyUrls` in `decisionEngine.ts`) | **STUBBED / DETERMINISTIC HEURISTIC** | Parses portal domain (`Daft.ie`, `MyHome.ie`, `Rightmove`, `Zoopla`, `Knight Frank`), extracts street/slug tokens cleanly, deduplicates URLs, and assigns deterministic hashed telemetry (asking price, BER/EPC, solar orientation, hidden walks) rather than making live outbound HTTP requests or scraping behind portal WAF/anti-bot controls. |
| **Geospatial Map Visualization** (`PropertyMapPanel.tsx`) | **STUBBED (Client SVG Cartography)** | Renders an interactive stylized vector neighborhood map with clickable pins, selectable walk rings, transit overlays, and catchment polygons derived from `coordinates.mapX/mapY`. Not wired to live Google Maps / Mapbox tiles or Isochrone routing APIs yet. |
| **Hidden Neighbourhood Telemetry** (Walks, Acoustics, Catchment) | **STUBBED / PRESET + SEEDED** | Rich domain model (`PropertyCandidate`) and UI surfaces exist and are editable via `PropertyAuditModal`, but unlisted amenities, ambient dBA, winter sun hours, and school catchment probabilities currently come from curated presets (`presets.ts`) and deterministic URL hashes rather than external GIS / Census / OpenStreetMap / Ofsted / CSO datasets. |
| **Multi-User Auth, Backend Database & URL Sharing** | **ABSENT** | `Share Interactive Verdict` copies a plain-text formatted summary to clipboard rather than minting a persisted server-side share link (`/v/:id`). No Firebase Auth, Firestore, or Postgres/Supabase persistence exists yet. |

---

## Architectural Seams for Productionization

1. **Replace `parsePropertyUrls()` with a Backend Extraction Pipeline**:
   - Keep `PropertyCandidate` (`src/types/property.ts`) as the canonical target DTO.
   - Move extraction into a server-side endpoint (`POST /api/listings/ingest`) backed by approved portal partner feeds, Firecrawl/headless extraction where permitted, or structured PDF brochure / Eircode / UPRN upload + `gemini-3.8-flash` structured JSON extraction (avoiding CORS and client-side rate limits).

2. **Enrich Hidden Value Telemetry via Real Spatial APIs**:
   - Replace synthetic `coordinates.mapX/mapY` with live Mapbox / Google Maps Platform rendering (`lat`/`lng` already exist on every `PropertyCandidate.coordinates`).
   - Populate `hiddenAmenities`, `walkTitle`, and `commuteMinutes` using Google Routes / OTP transit isochrones and Overpass / Google Places API queries around the geocoded parcel.
   - Enrich `winterSunHours` / `solarOrientation` from building footprint polygons + Open-Meteo / SunCalc irradiance azimuths.
   - Replace `catchmentProbability` strings with official Irish Department of Education / UK DfE catchment & distance band tables.

3. **Replace `localStorage` with Multi-User Workspace Persistence**:
   - Persist `MarketWorkspaceState` (or normalized `portfolios`, `candidates`, `calibrations`, `checklist_items`) in Cloud Firestore or Postgres with per-user / partner ACLs so shared verdict URLs (`/verdict/:shareId`) stay live across buyers, partners, and solicitors.

4. **Server-Side PDF / Pack Rendering**:
   - Currently `ExportToolkitModal` exports clean `.md` and `.csv` downloads. Add server-side or print-stylesheet PDF compilation for formal bank/broker submissions.

---

## Downstream Agent Kickoff Prompt

> You are hardening **NestVerdict** (`/Users/conorredmond/projects/Rapid-Prototypes/property-decision-matrix`) from an approved frontend prototype to a production application. Start by reading `README.md`, `DESIGN.md`, `src/types/property.ts`, and `src/engine/decisionEngine.ts`. Preserve the deterministic scoring math (`evaluatePortfolio`, `calculateStampDuty`), test suite (`npm test`), and the "Architectural Valuation" UI layout across Steps 1–4. First priority: stand up a backend API (Node/TypeScript or Cloud Functions) implementing `POST /api/listings/ingest` to geocode real addresses/listings and enrich walkability/transit/daylight telemetry into `PropertyCandidate`, replace the SVG map in `src/components/PropertyMapPanel.tsx` with an interactive tile map consuming `coordinates.lat`/`lng`, and persist shared decision portfolios in database storage behind authentication.
