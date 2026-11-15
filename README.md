# NestVerdict — Property Decision Matrix

**NestVerdict** is an analytical web application that helps prospective home buyers weigh 2+ shortlisted properties across both **financial ("Head") discipline** and **emotional / lifestyle ("Heart") value**. It reconciles asking price against total landed acquisition cost (stamp duty, required structural works, energy upgrades, legal/survey, and contingency), surfaces hidden neighbourhood telemetry (micro-walks, acoustic decibels, solar winter daylight, and school catchment probability), plots candidates on an interactive geospatial map, runs deterministic non-negotiable pass/fail rules, and outputs an explainable Executive Verdict with exportable buyer packs.

---

## Core Capabilities & Workflow (4 Steps)

Built directly from the 4 Stitch screens in project `11696032478071407323` (*Property Decision Matrix*) and its **Architectural Valuation** design system (`DESIGN.md`):

1. **Step 1 — Property Ingestion & Budget Setup (`src/views/Step1IngestionView.tsx`)**
   - Batch-ingest 2+ listing URLs (`Daft.ie`, `MyHome.ie`, `Rightmove`, `Zoopla`, `Knight Frank`) with duplicate filtering and instant listing metadata parsing.
   - Configure both **Purchase Ceiling** (`targetPurchaseMax`) and **Total Landed Cost Ceiling** (`totalLandedCostCeiling`), plus Renovation Buffer and Emergency Contingency, with a stacked Capital Stack Breakdown bar.
   - Configure Household & Life Setup (`HouseholdModal`) — occupants, primary & secondary commute targets, max commute threshold, and school catchment priority.
   - Instant top-bar market switcher between **Ireland (`IE • €` EUR — South Dublin & Wicklow, Daft/MyHome, Irish Revenue Stamp Duty 1% / 2% / 6%, BER)** and **United Kingdom (`UK • £` GBP — North London Stitch Reference, Rightmove/Zoopla/Knight Frank, UK SDLT, EPC)**.

2. **Step 2 — Values & Weighting Matrix (`src/views/Step2CalibrationView.tsx`)**
   - Interactive **Head vs. Heart Macro Equilibrium** slider rebalancing financial prudence vs. hidden lifestyle upside in real time.
   - Toggleable **Tier 1 Non-Negotiables** with independent `Enabled` and `Strict (Zero-Tolerance)` gates, plus `+ Add Rule` for custom household constraints.
   - **Tier 2 Weighted Priorities (1x–5x)** covering Budget Safety Buffer, Garden & Solar Orientation, Acoustic Quietness, Architectural Character, Micro-Walkability, and Energy Efficiency, plus toggleable **Acceptable Trade-Offs / Compromises**.
   - Live right-rail Dynamic Ranking Preview showing immediate score & rank shifts as weights move.

3. **Step 3 — Multi-Property Comparison & Hidden Value (`src/views/Step3ComparisonView.tsx`)**
   - Side-by-side candidate cards sorted canonically (`A / B / C`) or ranked dynamically by Composite Score.
   - Embedded interactive **Geospatial Map (`src/components/PropertyMapPanel.tsx`)** with clickable parcel pins, selectable walkability radius rings, transit corridor overlays, and school catchment zones.
   - **The Hidden Value Engine Matrix** comparing true commute minutes, ambient street decibels (dBA), unlisted local amenities, winter solar hours, school catchment probability, and deterministic rule pass/review/fail badges.
   - **Landed Cost & Renovation Gap Architecture** table with inline `-15k` / `+15k` Works Stress-Test controls to see live buffer erosion or winner changes.

4. **Step 4 — Deterministic Executive Verdict (`src/views/Step4VerdictView.tsx`)**
   - Ranked Executive Verdict Hero Banner with Composite Score, Head / Heart / Capital Preservation sub-scores, confidence coefficient, and variance to runner-up.
   - Side-by-side **Deterministic Scoring Breakdown** and quantified **Trade-Off Analysis Matrix** (`Winner vs Runner-Up`, `Winner vs Disqualified`).
   - Interactive **Pre-Offer Actionable Checklist** with live readiness percentage and direct links to parcel audits and deliverables.
   - **Execution Toolkit (`src/components/Modals.tsx`)** generating copy/download-ready **Executive Verdict Memorandum (`.md`)**, **Offer Justification Letter (`.md`)**, and **Dynamic Sensitivity Spreadsheet (`.csv`)**.

---

## Stack & Project Layout

- **Framework**: React 19 + TypeScript + Vite 8 + Tailwind CSS v4
- **Font System**: Newsreader (editorial headings), Inter (UI), JetBrains Mono (tabular figures), Material Symbols Outlined
- **Testing**: Node native TypeScript test runner (`node --experimental-strip-types --test`)

```text
property-decision-matrix/
├── DESIGN.md                              # "Architectural Valuation" design tokens & rules
├── index.html                             # Google Fonts + Material Symbols + page shell
├── public/
│   ├── images/                            # Local bundled property & advisor JPEG photos
│   └── stitch-screens/                    # Reference Stitch PNGs from project 11696032478071407323
├── src/
│   ├── types/property.ts                  # Canonical domain types
│   ├── data/presets.ts                    # IRISH_PRESET (IE EUR) & LONDON_PRESET (UK GBP)
│   ├── engine/
│   │   ├── decisionEngine.ts              # Stamp duty/SDLT, URL parser, deterministic scorer
│   │   └── __tests__/decisionEngine.test.ts
│   ├── components/
│   │   ├── TopNavBar.tsx
│   │   ├── PropertyMapPanel.tsx
│   │   └── Modals.tsx
│   ├── views/
│   │   ├── Step1IngestionView.tsx
│   │   ├── Step2CalibrationView.tsx
│   │   ├── Step3ComparisonView.tsx
│   │   └── Step4VerdictView.tsx
│   ├── App.tsx                            # Shared workspace state + localStorage persistence
│   └── main.tsx
└── agent-handoff/
    └── AGENT_INSTRUCTIONS.md              # Empirical production handoff dossier
```

---

## Local Development, Testing & Deployment

```bash
# Install dependencies
npm install

# Run local dev server on port 5178
npm run dev

# Run TypeScript typecheck
npm run typecheck

# Run deterministic decision engine unit tests (9 tests)
npm test

# Production build
npm run build

# Deploy to Firebase Hosting Preview Channel
npx firebase-tools hosting:channel:deploy property-decision-matrix-preview --project rapid-prototyping-4134c
```
