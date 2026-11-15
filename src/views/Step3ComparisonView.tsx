import React, { useState } from 'react';
import type {
  BudgetConfig,
  DecisionWeights,
  EvaluatedProperty,
  HouseholdProfile,
  MarketMode,
  PortfolioEvaluation,
  PropertyCandidate,
} from '../types/property.ts';
import { formatCurrency } from '../engine/decisionEngine.ts';
import { PropertyMapPanel } from '../components/PropertyMapPanel.tsx';
import { PropertyPhoto } from '../components/PropertyPhoto.tsx';

interface Step3ComparisonViewProps {
  market: MarketMode;
  taxLabel: string;
  budget: BudgetConfig;
  household: HouseholdProfile;
  weights: DecisionWeights;
  evaluation: PortfolioEvaluation;
  onInspectProperty: (propertyId: string) => void;
  onUpdateProperty: (propertyId: string, patch: Partial<PropertyCandidate>) => void;
  onBackToCalibration: () => void;
  onProceed: () => void;
}

function getCatchmentBadgeStyle(status: string): string {
  const upper = status.toUpperCase();
  if (upper.includes('BREACH') || upper.includes('FAIL') || upper.includes('OUTSIDE') || upper.includes('RISK')) {
    return 'bg-rose-50 text-rose-800 border-rose-200';
  }
  if (upper.includes('BORDER') || upper.includes('REVIEW') || upper.includes('WAIT')) {
    return 'bg-amber-50 text-amber-800 border-amber-200';
  }
  return 'bg-emerald-50 text-emerald-800 border-emerald-200';
}

function getRuleChipStyle(status: 'PASS' | 'REVIEW' | 'FAIL'): string {
  if (status === 'FAIL') {
    return 'bg-rose-50 text-rose-800 border-rose-200';
  }
  if (status === 'REVIEW') {
    return 'bg-amber-50 text-amber-800 border-amber-200';
  }
  return 'bg-emerald-50 text-emerald-800 border-emerald-200';
}

export const Step3ComparisonView: React.FC<Step3ComparisonViewProps> = ({
  market,
  taxLabel,
  budget,
  household,
  weights,
  evaluation,
  onInspectProperty,
  onUpdateProperty,
  onBackToCalibration,
  onProceed,
}) => {
  const [sortMode, setSortMode] = useState<'canonical' | 'score'>('canonical');
  const [showFullRuleEvidence, setShowFullRuleEvidence] = useState(false);

  const displayedList: EvaluatedProperty[] =
    sortMode === 'score'
      ? evaluation.evaluated
      : [...evaluation.evaluated].sort((a, b) =>
          a.property.code.localeCompare(b.property.code)
        );

  const isIE = market === 'IE';
  const gridColsClass =
    displayedList.length <= 2
      ? 'lg:grid-cols-2'
      : displayedList.length === 3
        ? 'lg:grid-cols-3'
        : 'lg:grid-cols-3';

  const preferred = evaluation.winner;
  const disqualifiedCount = evaluation.evaluated.filter((e) => e.isDisqualified).length;

  const adjustWorksCost = (item: EvaluatedProperty, delta: number) => {
    const nextWorks = Math.max(0, item.property.requiredWorksCost + delta);
    onUpdateProperty(item.property.id, { requiredWorksCost: nextWorks });
  };

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12 py-8 space-y-8 pb-28">
      {/* Header & Financial Anchor Pills */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-200 pb-6">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-[11px] font-mono uppercase tracking-wider text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Phase 03 · Side-by-Side Comparison & Hidden Value Engine
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
            Multi-Property Comparison & Hidden Value Reveal
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Deterministic comparison for <span className="font-medium text-slate-900">{household.portfolioTitle}</span> across{' '}
            <span className="font-mono font-medium text-slate-900">{displayedList.length}</span> candidates, reconciling purchase-plus-works landed exposure against unlisted local amenity value and strict household criteria ({weights.headPercent}% Head / {100 - weights.headPercent}% Heart).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="bg-white border border-slate-200 rounded-md px-3.5 py-2 shadow-xs">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Total Landed Capital Cap
            </div>
            <div className="text-lg font-mono font-semibold text-slate-900 tabular-nums">
              {formatCurrency(budget.totalLandedCostCeiling, market)}
            </div>
          </div>

          <div
            className={`border rounded-md px-3.5 py-2 shadow-xs ${
              preferred.landedBuffer >= 0
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-rose-50 border-rose-200'
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-600">
              Leader Reconciled Delta ({preferred.property.code})
            </div>
            <div
              className={`text-lg font-mono font-semibold tabular-nums ${
                preferred.landedBuffer >= 0 ? 'text-emerald-800' : 'text-rose-800'
              }`}
            >
              {preferred.landedBuffer >= 0 ? '+' : '-'}
              {formatCurrency(Math.abs(preferred.landedBuffer), market)}
            </div>
          </div>

          <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setSortMode('canonical')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                sortMode === 'canonical'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Order A/B/C
            </button>
            <button
              type="button"
              onClick={() => setSortMode('score')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                sortMode === 'score'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rank by Score
            </button>
          </div>
        </div>
      </section>

      {/* Side-by-Side Property Cards */}
      <section className={`grid grid-cols-1 ${gridColsClass} gap-6`}>
        {displayedList.map((item) => {
          const { property } = item;
          const isWinner = item.verdictRole === 'WINNER';
          const isDisqualified = item.isDisqualified;
          const capUtilizationPct = Math.min(
            125,
            Math.round((item.totalLandedCost / Math.max(1, budget.totalLandedCostCeiling)) * 100)
          );

          return (
            <article
              key={property.id}
              className={`bg-white rounded-lg border flex flex-col overflow-hidden transition-shadow ${
                isWinner
                  ? 'border-emerald-500 ring-1 ring-emerald-500/20 shadow-sm'
                  : isDisqualified
                    ? 'border-rose-300 shadow-xs'
                    : 'border-slate-200 shadow-xs'
              }`}
            >
              {/* Photo + Overlays */}
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                <PropertyPhoto
                  imageUrl={property.imageUrl}
                  alt={property.name}
                  portal={property.sourcePortal}
                  postcode={property.postcode}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-slate-900/90 text-white font-mono text-[11px] font-semibold">
                    {property.code}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/90 text-slate-900 font-mono text-[11px]">
                    {property.sourcePortal}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2.5 py-0.5 rounded font-mono text-[11px] font-semibold uppercase tracking-wide shadow-xs ${
                      isWinner
                        ? 'bg-emerald-600 text-white'
                        : isDisqualified
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-500 text-white'
                    }`}
                  >
                    {isWinner
                      ? 'Optimal Value Anchor'
                      : isDisqualified
                        ? 'Strict Gate Fail'
                        : `Rank #${item.rank} Runner-Up`}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                  <div>
                    <div className="text-xs font-mono text-slate-200">
                      {property.area} · {property.postcode}
                    </div>
                    <h2 className="font-editorial text-xl font-semibold leading-tight">
                      {property.name}
                    </h2>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-[10px] font-mono uppercase text-slate-200">Score</div>
                    <div className="text-xl font-mono font-bold tabular-nums">
                      {item.compositeScore.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  {/* Specs Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 border-b border-slate-100 pb-3">
                    <span className="font-medium text-slate-800">
                      {property.bedrooms} Bed · {property.bathrooms} Bath ·{' '}
                      {isIE
                        ? `${property.sqm} m² (${property.sqft.toLocaleString()} sq ft)`
                        : `${property.sqft.toLocaleString()} sq ft (${property.sqm} m²)`}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-700">
                      {isIE ? 'BER' : 'EPC'} {property.energyRating} · {property.tenure}
                    </span>
                  </div>

                  {/* Financial Reconciliation */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded p-2.5 border border-slate-100">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                        Asking Price
                      </div>
                      <div className="text-base font-mono font-semibold text-slate-900 tabular-nums mt-0.5">
                        {formatCurrency(property.askingPrice, market)}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5 tabular-nums">
                        {isIE
                          ? `${formatCurrency(item.pricePerSqm, market)}/m²`
                          : `${formatCurrency(item.pricePerSqft, market)}/sq ft`}
                      </div>
                    </div>

                    <div
                      className={`rounded p-2.5 border ${
                        item.landedBuffer >= 0
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : 'bg-rose-50/70 border-rose-200'
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-600">
                        Est. Total Landed
                      </div>
                      <div className="text-base font-mono font-semibold text-slate-900 tabular-nums mt-0.5">
                        {formatCurrency(item.totalLandedCost, market)}
                      </div>
                      <div
                        className={`text-[11px] font-mono font-medium mt-0.5 tabular-nums ${
                          item.landedBuffer >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {item.landedBuffer >= 0
                          ? `+${formatCurrency(item.landedBuffer, market)} Headroom`
                          : `-${formatCurrency(Math.abs(item.landedBuffer), market)} Breach`}
                      </div>
                    </div>
                  </div>

                  {/* Cap Utilization Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>Capital Ceiling Utilization</span>
                      <span className="tabular-nums font-medium text-slate-700">
                        {capUtilizationPct}% of {formatCurrency(budget.totalLandedCostCeiling, market, true)}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          item.landedBuffer >= 0 ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                        style={{ width: `${Math.min(100, capUtilizationPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Head vs Heart Sub-Scores */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="text-center border border-slate-100 rounded py-1.5 px-1">
                      <div className="text-[10px] font-mono text-slate-500 uppercase">Head</div>
                      <div className="text-sm font-mono font-semibold text-slate-900 tabular-nums">
                        {item.prudenceScore}
                      </div>
                    </div>
                    <div className="text-center border border-slate-100 rounded py-1.5 px-1">
                      <div className="text-[10px] font-mono text-slate-500 uppercase">Heart</div>
                      <div className="text-sm font-mono font-semibold text-slate-900 tabular-nums">
                        {item.lifestyleScore}
                      </div>
                    </div>
                    <div className="text-center border border-slate-100 rounded py-1.5 px-1">
                      <div className="text-[10px] font-mono text-slate-500 uppercase">Capital</div>
                      <div className="text-sm font-mono font-semibold text-slate-900 tabular-nums">
                        {item.capitalPreservationScore}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {item.verdictCalloutBody}
                  </p>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onInspectProperty(property.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">fact_check</span>
                    Audit & Edit Works
                  </button>
                  {property.sourceUrl.startsWith('http') ? (
                    <a
                      href={property.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
                      title={`Open source listing (${property.sourcePortal})`}
                    >
                      <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Interactive Geospatial Map Panel */}
      <PropertyMapPanel
        evaluated={displayedList}
        market={market}
        onInspectProperty={onInspectProperty}
      />

      {/* The Hidden Value Engine Matrix */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 font-semibold">
              Unlisted Local Intelligence & Deterministic Screening
            </div>
            <h2 className="font-editorial text-2xl font-semibold text-slate-900 mt-0.5">
              The Hidden Value Engine
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowFullRuleEvidence((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]">
              {showFullRuleEvidence ? 'unfold_less' : 'unfold_more'}
            </span>
            {showFullRuleEvidence ? 'Compact Rule Evidence' : 'Expand All Rule Evidence'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/40">
                <th className="py-3.5 px-5 text-xs font-mono uppercase tracking-wider text-slate-500 w-56">
                  Hidden Value Dimension
                </th>
                {displayedList.map((item) => (
                  <th
                    key={item.property.id}
                    className="py-3.5 px-5 border-l border-slate-200 align-top"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-slate-900">
                        {item.property.code} · {item.property.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                          item.verdictRole === 'WINNER'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.isDisqualified
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.compositeScore.toFixed(1)}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {/* Row 1: True Commute & Ambient Quietness */}
              <tr>
                <td className="py-4 px-5 align-top bg-slate-50/30">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <span className="material-symbols-outlined text-[18px] text-slate-700">
                      train
                    </span>
                    Commute & Acoustics
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Door-to-door rail against {household.primaryCommuteMaxMins}m cap, secondary commute, and ambient street decibels.
                  </p>
                </td>
                {displayedList.map((item) => {
                  const p = item.property;
                  const commuteOver = p.commuteMinutes > household.primaryCommuteMaxMins;
                  return (
                    <td key={p.id} className="py-4 px-5 border-l border-slate-200 align-top space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`font-mono font-semibold tabular-nums ${
                            commuteOver ? 'text-rose-700' : 'text-emerald-700'
                          }`}
                        >
                          {p.commuteMinutes} min primary
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[11px] border ${
                            p.ambientNoiseDb <= 42
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : p.ambientNoiseDb <= 50
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {p.ambientNoiseDb} dBA
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 font-medium">{p.commuteRoute}</div>
                      <div className="text-xs text-slate-500">
                        Secondary ({household.secondaryCommuteTarget}):{' '}
                        <span className="font-mono text-slate-700">
                          {p.secondaryCommuteMinutes} min
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{p.noiseDescription}</p>
                    </td>
                  );
                })}
              </tr>

              {/* Row 2: Micro-Walkability & Unlisted Culture */}
              <tr>
                <td className="py-4 px-5 align-top bg-slate-50/30">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <span className="material-symbols-outlined text-[18px] text-emerald-700">
                      park
                    </span>
                    Micro-Walks & Unlisted Culture
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Car-free loop access, green corridors, and neighbourhood gems omitted by portals.
                  </p>
                </td>
                {displayedList.map((item) => {
                  const p = item.property;
                  return (
                    <td key={p.id} className="py-4 px-5 border-l border-slate-200 align-top space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">{p.walkTitle}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[11px]">
                          {p.walkBadge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{p.walkSubtitle}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {p.hiddenAmenities.map((amenity) => (
                          <span
                            key={amenity}
                            className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Row 3: Solar Orientation & Architectural Merit */}
              <tr>
                <td className="py-4 px-5 align-top bg-slate-50/30">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <span className="material-symbols-outlined text-[18px] text-amber-600">
                      wb_sunny
                    </span>
                    Solar Exposure & Character
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Winter sun hours, garden depth, ceiling height, and architectural build quality.
                  </p>
                </td>
                {displayedList.map((item) => {
                  const p = item.property;
                  return (
                    <td key={p.id} className="py-4 px-5 border-l border-slate-200 align-top space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">{p.solarOrientation}</span>
                        <span className="font-mono text-xs text-amber-700 font-semibold tabular-nums">
                          {p.winterSunHours.toFixed(1)}h winter sun
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{p.solarDescription}</p>
                      <div className="text-xs font-mono text-slate-600">
                        {p.gardenLengthFt} ft garden · {p.ceilingHeightM.toFixed(1)}m ceilings
                      </div>
                      <p className="text-xs text-slate-500 italic">{p.architecturalNote}</p>
                    </td>
                  );
                })}
              </tr>

              {/* Row 4: School Catchment & Liveability */}
              <tr>
                <td className="py-4 px-5 align-top bg-slate-50/30">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <span className="material-symbols-outlined text-[18px] text-slate-700">
                      school
                    </span>
                    Catchment & Daily Setup
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Admission probability for {household.priorityCatchmentLabel}, WFH study, and EV/parking.
                  </p>
                </td>
                {displayedList.map((item) => {
                  const p = item.property;
                  return (
                    <td key={p.id} className="py-4 px-5 border-l border-slate-200 align-top space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">{p.catchmentSchool}</span>
                        <span
                          className={`px-2 py-0.5 rounded border font-mono text-[11px] font-semibold tabular-nums ${getCatchmentBadgeStyle(
                            p.catchmentStatus
                          )}`}
                        >
                          {p.catchmentProbability}% · {p.catchmentStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{p.catchmentNote}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-mono">
                        <span
                          className={`px-2 py-0.5 rounded border ${
                            p.hasDedicatedWfhNook
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {p.hasDedicatedWfhNook ? 'WFH Nook Yes' : 'No Dedicated WFH'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded border ${
                            p.hasOffStreetParkingOrEv
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {p.hasOffStreetParkingOrEv ? 'Off-Street / EV' : 'Street Permit Only'}
                        </span>
                        <span className="px-2 py-0.5 rounded border bg-slate-50 text-slate-700 border-slate-200">
                          Bed 3: {p.thirdBedroomSqft} sq ft
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Row 5: Deterministic Needs vs Wants Check */}
              <tr>
                <td className="py-4 px-5 align-top bg-slate-50/30">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <span className="material-symbols-outlined text-[18px] text-slate-900">
                      gavel
                    </span>
                    Deterministic Rule Gate
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Active calibration gates checked deterministically against parcel evidence.
                  </p>
                </td>
                {displayedList.map((item) => (
                  <td key={item.property.id} className="py-4 px-5 border-l border-slate-200 align-top">
                    {item.ruleChecks.length === 0 ? (
                      <span className="text-xs text-slate-400">
                        No active non-negotiables enabled.
                      </span>
                    ) : (
                      <div className="space-y-2">
                        {item.ruleChecks.map((rc) => (
                          <div
                            key={rc.ruleId}
                            className={`rounded border px-2.5 py-1.5 text-xs ${getRuleChipStyle(rc.status)}`}
                          >
                            <div className="flex items-center justify-between gap-2 font-medium">
                              <span>
                                {rc.ruleTitle}
                                {rc.strict ? ' (Strict)' : ''}
                              </span>
                              <span className="font-mono font-bold text-[10px]">
                                {rc.status}
                              </span>
                            </div>
                            {(showFullRuleEvidence || rc.status !== 'PASS') && (
                              <div className="text-[11px] opacity-90 mt-1">{rc.evidence}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Landed Cost & Renovation Gap Architecture */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Stress-Test Total Acquisition Liability
            </div>
            <h2 className="font-editorial text-2xl font-semibold text-slate-900 mt-0.5">
              Landed Cost & Renovation Gap Architecture
            </h2>
          </div>
          <div className="text-xs font-mono text-slate-500">
            Target Landed Ceiling:{' '}
            <span className="font-semibold text-slate-900">
              {formatCurrency(budget.totalLandedCostCeiling, market)}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/40 text-xs font-mono uppercase tracking-wider text-slate-500">
                <th className="py-3 px-5 w-56">Capital Line Item</th>
                {displayedList.map((item) => (
                  <th key={item.property.id} className="py-3 px-5 border-l border-slate-200">
                    {item.property.code} · {item.property.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm tabular-nums">
              <tr>
                <td className="py-3 px-5 font-medium text-slate-700">1. Asking / Guide Price</td>
                {displayedList.map((item) => (
                  <td key={item.property.id} className="py-3 px-5 border-l border-slate-200 font-mono">
                    {formatCurrency(item.property.askingPrice, market)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-5 font-medium text-slate-700">
                  2. {taxLabel}
                </td>
                {displayedList.map((item) => (
                  <td key={item.property.id} className="py-3 px-5 border-l border-slate-200 font-mono text-slate-700">
                    {formatCurrency(item.stampDuty, market)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-5 font-medium text-slate-700">
                  3. Required Structural & Finish Works
                </td>
                {displayedList.map((item) => (
                  <td key={item.property.id} className="py-3 px-5 border-l border-slate-200">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold text-slate-900">
                        {formatCurrency(item.property.requiredWorksCost, market)}
                      </span>
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => adjustWorksCost(item, -15000)}
                          className="px-1.5 py-0.5 rounded border border-slate-200 hover:bg-slate-100 font-mono text-[11px] text-slate-700"
                          title="Reduce estimated works by 15k"
                        >
                          -15k
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustWorksCost(item, 15000)}
                          className="px-1.5 py-0.5 rounded border border-slate-200 hover:bg-slate-100 font-mono text-[11px] text-slate-700"
                          title="Stress-test +15k extra works overrun"
                        >
                          +15k
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {item.property.requiredWorksLabel}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-5 font-medium text-slate-700">
                  4. Thermal / Energy Retrofit
                </td>
                {displayedList.map((item) => (
                  <td key={item.property.id} className="py-3 px-5 border-l border-slate-200">
                    <div className="font-mono text-slate-800">
                      {formatCurrency(item.property.heatingUpgradeCost, market)}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {item.property.heatingUpgradeLabel}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-5 font-medium text-slate-700">
                  5. Legal, Survey & Reserve Contingency
                </td>
                {displayedList.map((item) => (
                  <td key={item.property.id} className="py-3 px-5 border-l border-slate-200 font-mono text-slate-700">
                    {formatCurrency(
                      item.property.legalSurveyCost + item.property.contingencyCost,
                      market
                    )}
                  </td>
                ))}
              </tr>
              <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                <td className="py-3.5 px-5 text-slate-900">Reconciled All-In Landed Cost</td>
                {displayedList.map((item) => (
                  <td key={item.property.id} className="py-3.5 px-5 border-l border-slate-200 font-mono">
                    <div className="text-base text-slate-900">
                      {formatCurrency(item.totalLandedCost, market)}
                    </div>
                    <div
                      className={`text-xs mt-0.5 ${
                        item.landedBuffer >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {item.landedBuffer >= 0
                        ? `+${formatCurrency(item.landedBuffer, market)} remaining headroom`
                        : `-${formatCurrency(Math.abs(item.landedBuffer), market)} over total cap`}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-4 left-4 right-4 z-30 max-w-6xl mx-auto">
        <div className="bg-slate-900 text-white rounded-lg shadow-xl border border-slate-800 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex w-10 h-10 rounded bg-emerald-500/20 border border-emerald-400/30 items-center justify-center text-emerald-300 font-mono font-bold">
              {preferred.property.code}
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Current Deterministic Leader · {disqualifiedCount} Disqualified
              </div>
              <div className="text-sm font-medium text-white flex flex-wrap items-center gap-2">
                <span>{preferred.property.name}</span>
                <span className="font-mono text-emerald-300 tabular-nums">
                  {preferred.compositeScore.toFixed(1)}/100
                </span>
                <span className="text-slate-400">·</span>
                <span className="font-mono text-xs text-slate-300 tabular-nums">
                  Landed {formatCurrency(preferred.totalLandedCost, market)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={onBackToCalibration}
              className="px-3.5 py-2 rounded border border-slate-700 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors"
            >
              &larr; Re-Calibrate Weights
            </button>
            <button
              type="button"
              onClick={onProceed}
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm"
            >
              Synthesize Executive Verdict
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
