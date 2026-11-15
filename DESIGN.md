---
name: Architectural Valuation
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#2f1500'
  on-tertiary-container: '#c76c00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Newsreader
    fontSize: 48px
    fontWeight: '500'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 36px
    fontWeight: '500'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Newsreader
    fontSize: 26px
    fontWeight: '500'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 3rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
This design system embodies an authoritative, architectural fintech aesthetic engineered for high-stakes real estate decisions. The target audience comprises discerning property investors, prospective homeowners, and analytical wealth advisors who demand structural clarity, rigorous data integrity, and institutional trust. 

The aesthetic synthesizes modern corporate minimalism with high-end editorial gravitas. It rejects playful, bubbly tech tropes in favor of razor-sharp spatial rhythm, disciplined typography, and structured matrices. The visual language conveys quiet confidence, precision engineering, and unbiased analytical clarity, rendering multi-variable property trade-offs immediate, visceral, and incontestable.

## Colors
The palette balances an authoritative architectural foundation with surgical analytic accents.

- **Primary Canvas & Slate Neutrals**: Anchored by `#0F172A` (deep slate navy) for authoritative structural chrome, primary typography, and decisive actions. `#1E293B` serves as secondary text and card headers. Backgrounds transition through warm stone and architectural linen (`#F8F9FA` page canvas, `#F1F5F9` recessed wells), while elevated surfaces utilize pure `#FFFFFF` bounded by crisp slate borders (`#E2E8F0`).
- **Semantic Valuation Accents**:
  - **Verdict / Fit / Value**: Emerald `#059669` and vibrant sage `#10B981` highlight high ROI, positive equity margins, and optimal fit parameters.
  - **Trade-off / Risk**: Terracotta Amber `#D97706` and Crimson Rose `#E11D48` signal fiscal exposure, regulatory risks, and structural concessions.
  - **Interactive & Synthesis**: Refined royal blue `#3B82F6` and deep indigo reserve exclusively for interactive controls, focus rings, and analytical toggle states.

Surfaces rely on clean contrast ratios; semantic colors are deployed with extreme restraint to prevent dashboard fatigue and preserve immediate scanning velocity.

## Typography
The typographical hierarchy blends high-end editorial prestige with utilitarian data density. 

- **Display & Executive Summaries (Newsreader)**: Primary section headers, key valuation conclusions, and property thesis overviews utilize Newsreader. Its literary stroke contrast brings the authority of an institutional market report or private wealth dossier.
- **Analytical Engine & UI (Inter)**: Tabular data, property matrices, input fields, navigation, and interactive controls rely on Inter. Inter provides optimal optical tracking at micro scales and renders tabular numerals with mechanical precision.
- **Data Labels & Microcopy**: All sub-metric keys and status tags use upper-case or tight semi-bold tracking to delineate analytical keys from primary valuation values.

## Layout & Spacing
The layout model employs a structured 12-column grid optimized for horizontal data comparison, side-by-side card matrices, and executive summaries.

- **Grid Discipline**:
  - **Desktop (>= 1280px)**: 12-column layout with 48px canvas margins and 24px column gutters. Comparison matrices align across identical column footprints (e.g., 3 properties across 4 columns each, or 2 properties across 5 columns with a 2-column sticky summary rail).
  - **Tablet (768px - 1279px)**: 8-column layout with 24px margins and 16px gutters. Comparison matrices switch to horizontally swipeable columnar decks with a fixed parameter spine.
  - **Mobile (< 768px)**: 4-column layout with 16px margins and 12px gutters. Data attributes reflow vertically or support unified side-by-side toggle segmenting.
- **Rhythm**: Element spacing adheres strictly to a baseline 4px/8px scale, prioritizing dense vertical grouping within logical property modules and generous architectural breathing room between analytical categories.

## Elevation & Depth
Depth is communicated through architectural layering, surface tonal variance, and low-contrast outlines rather than heavy skeuomorphic shadows.

- **Surface Tiers**:
  - **Base Canvas**: Soft stone linen (`#F8F9FA`) defines the foundational plane.
  - **Recessed Wells**: Sub-metrics, secondary comparison bars, and passive calculation zones rest on `#F1F5F9`.
  - **Raised Analysis Cards**: Primary property tiles and comparison cells use crisp pure `#FFFFFF` bounded by a 1px border of `#E2E8F0`.
- **Shadow System**:
  - **Resting Cards**: No diffuse shadows; purely perimeter-defined by `#E2E8F0` borders for surgical planar separation.
  - **Hovered / Selected Comparison Cards**: Subtle lift using an architectural shadow tinted with the primary slate tone: `0 4px 16px -2px rgba(15, 23, 42, 0.06), 0 1px 2px 0 rgba(15, 23, 42, 0.04)`.
  - **Overlays / Drawers**: Deep atmospheric containment using `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)` combined with a frosted backdrop (`backdrop-filter: blur(8px); background: rgba(15, 23, 42, 0.3)`).

## Shapes
A disciplined, architectural radius structure governs all surfaces:
- **Base Components**: Inputs, buttons, segmented controls, and data chips adopt a tight 4px (`0.25rem`) radius, expressing structural solidity and crisp alignment.
- **Card Containers & Panels**: Analytical cards and side-by-side comparison modules use 8px (`0.5rem`, `rounded-lg`).
- **Modals & Drawers**: Deep structural containers cap at 12px (`0.75rem`, `rounded-xl`).
- **Data Pills & Metric Badges**: Analytical badges maintain full-pill rounding only when designating atomic classification (e.g., status tags, score badges), clearly separating operational tags from geometric UI surfaces.

## Components

### Buttons & Interactive Controls
- **Primary Action**: Solid `#0F172A` with pure white text, 4px radius, 1px subtle border in `#1E293B`. Hover shifts to `#1E293B` with micro-lift.
- **Secondary / Ghost**: Pure white background, 1px `#E2E8F0` border, `#0F172A` text. Hover applies `#F1F5F9` background.
- **Semantic Directives**: Valuation-specific actions use muted emerald or amber tints with 1px structural borders rather than saturated fills.

### Analytical Data Pills
- **Verdict & Fit Badges**: Rendered in soft emerald wash (`#ECFDF5`) with `#059669` typography and 1px `#A7F3D0` perimeter border.
- **Exposure & Risk Badges**: Soft amber/terracotta wash (`#FFFBEB`) with `#D97706` typography and 1px `#FDE68A` perimeter border.
- **Micro-Metric Labels**: Uppercase tabular data tags rendered on `#F1F5F9` with `#475569` text.

### Dual-Budget Comparison Bars
- Visual comparative bars feature stacked dual tracks on a `#E2E8F0` trough.
- **Baseline Allocation**: Depicted in solid `#0F172A` or `#3B82F6`.
- **Delta / Variance**: Depicted via patterned or distinct emerald (`#10B981`) for savings/value and crimson (`#E11D48`) for cost overages.
- Metric endpoints feature sharp vertical hairline dividers marking target budget vs. actual property requirements.

### Side-by-Side Comparison Matrices
- Cards are anchored horizontally with synchronized row heights.
- Top property header features property photography overlaid with an editorial serif title, verdict tag, and total score pill.
- Row elements alternate with micro-hairlines (`#F1F5F9`) and maintain strict vertical baseline alignment across sibling cards.
- "Winner" or "Optimal Verdict" columns highlight with an active 2px border in `#059669` and a discrete top badge, without visually displacing neighbor cards.

### Input Fields & Selectors
- Neutral slate frame (`#CBD5E1`), pure white interior, crisp 4px corners. Focus transitions border to `#3B82F6` accompanied by a 3px soft blue ring (`rgba(59, 130, 246, 0.15)`).
- Prefix and suffix labels (e.g., currency symbols, square footage units) are anchored in fixed `#F8F9FA` recessed blocks.