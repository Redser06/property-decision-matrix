import React, { useState } from 'react';
import type {
  BudgetConfig,
  DecisionWeights,
  HouseholdProfile,
  MarketMode,
  PortfolioEvaluation,
  PriorityWeights,
} from '../types/property.ts';
import { formatCurrency } from '../engine/decisionEngine.ts';

interface Step2CalibrationViewProps {
  market: MarketMode;
  weights: DecisionWeights;
  budget: BudgetConfig;
  household: HouseholdProfile;
  evaluation: PortfolioEvaluation;
  onUpdateWeights: (patch: Partial<DecisionWeights>) => void;
  onToggleRuleEnabled: (ruleId: string) => void;
  onToggleRuleStrict: (ruleId: string) => void;
  onAddNonNegotiable: (title: string, subtitle: string) => void;
  onResetDefaults: () => void;
  onProceed: () => void;
}

const PRIORITY_ITEMS: {
  key: keyof PriorityWeights;
  title: string;
  subtitle: string;
}[] = [
  {
    key: 'budgetBuffer',
    title: 'Landed Budget Safety Buffer (>30k left post-works)',
    subtitle: 'Retains cash reserves post stamp-duty, surveyor snags, and legal fees',
  },
  {
    key: 'gardenSolar',
    title: 'Private South or West-facing outdoor garden space',
    subtitle: 'Guaranteed solar altitude in shoulder seasons; minimum 45ft lawn or courtyard',
  },
  {
    key: 'acousticQuiet',
    title: 'Acoustic tranquility & street noise index (<48dB ambient)',
    subtitle: 'Environmental noise mapping cross-referenced with evening ambient sound profile',
  },
  {
    key: 'architecturalChar',
    title: 'Architectural character, ceiling height & natural daylighting',
    subtitle: '>2.8m ceiling heights, period joinery proportions, and unobstructed aspect',
  },
  {
    key: 'microWalkability',
    title: 'Micro-walkability to independent bakery, greenway & park',
    subtitle: '8-minute continuous pedestrian footpaths without major arterial crossings',
  },
  {
    key: 'energyEfficiency',
    title: 'Energy efficiency / Low heat-loss retrofit potential',
    subtitle: 'High BER/EPC band or clean retrofit runway for heat pump & solar PV',
  },
];

function weightBadge(val: number): { label: string; cls: string } {
  if (val >= 5) return { label: 'Weight 5x (Critical)', cls: 'bg-rose-100 text-rose-800' };
  if (val === 4) return { label: 'Weight 4x (High)', cls: 'bg-slate-200 text-slate-900' };
  if (val === 3) return { label: 'Weight 3x (Medium)', cls: 'bg-slate-100 text-slate-700' };
  if (val === 2) return { label: 'Weight 2x (Moderate)', cls: 'bg-slate-100 text-slate-600' };
  return { label: 'Weight 1x (Low)', cls: 'bg-slate-100 text-slate-500' };
}

export const Step2CalibrationView: React.FC<Step2CalibrationViewProps> = ({
  market,
  weights,
  budget,
  household,
  evaluation,
  onUpdateWeights,
  onToggleRuleEnabled,
  onToggleRuleStrict,
  onAddNonNegotiable,
  onResetDefaults,
  onProceed,
}) => {
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [showAddRule, setShowAddRule] = useState(false);

  const head = weights.headPercent;
  const heart = 100 - head;

  const personaDesc =
    head >= 70
      ? 'Strict Financial Discipline: Capital buffer & downside protection govern rank'
      : head >= 55
        ? 'Analytical Leaning: High budget discipline with selective comfort premiums'
        : head >= 45
          ? 'Balanced Equilibrium: Equal weight on financial safety and daily joy'
          : 'Experiential Priority: Architectural daylight, walks & lifestyle lead';

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleTitle.trim()) return;
    onAddNonNegotiable(newRuleTitle.trim(), 'Custom household dealbreaker enforced during verdict gate');
    setNewRuleTitle('');
    setShowAddRule(false);
  };

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12 py-8 pb-28">
      {/* Header Section */}
      <div className="mb-8 border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
              Step 2: Model Configuration
            </span>
            <span className="text-slate-500 text-[11px] font-semibold">• Stage Calibration</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-medium text-slate-900 tracking-tight">
            Calibrate Decision Weights: Head vs. Heart
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 max-w-3xl">
            Tune the mathematical weighting matrix between deterministic financial prudence and visceral lifestyle aspirations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Matrix Calibration Engine v3.4
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5 animate-pulse" />
            Dynamic Normalization
          </span>
        </div>
      </div>

      {/* Macro Equilibrium Allocation (Head vs Heart) */}
      <section className="bg-white border border-slate-200 rounded-md p-6 mb-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-900 text-[22px]">balance</span>
              <h2 className="text-lg font-semibold text-slate-900">Macro Equilibrium Allocation</h2>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Global polarity anchor governing baseline sensitivity across capital preservation vs. experiential upside.
            </p>
          </div>

          <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded border border-emerald-200 bg-emerald-50/40 text-slate-900">
            <span className="material-symbols-filled text-[18px] text-emerald-600">verified</span>
            <div>
              <span className="block text-emerald-700 uppercase font-bold text-[10px] tracking-wider">
                Calculated Persona
              </span>
              <span className="text-xs font-semibold text-slate-900">{personaDesc}</span>
            </div>
          </div>
        </div>

        <div className="pt-6">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-xs bg-slate-900" />
              <span className="text-sm font-bold text-slate-900 tabular-nums">
                {head}% Prudence (Head)
              </span>
              <span className="text-xs text-slate-500">(Deterministic ROI &amp; Capital Moat)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">(Visceral Affinity &amp; Architecture)</span>
              <span className="text-sm font-bold text-slate-900 tabular-nums">
                {heart}% Emotion (Heart)
              </span>
              <span className="w-3 h-3 rounded-xs bg-emerald-600" />
            </div>
          </div>

          {/* Dual Stacked Bar */}
          <div className="relative w-full h-4 bg-slate-100 rounded-xs overflow-hidden flex items-center">
            <div className="h-full bg-slate-900 transition-all duration-150" style={{ width: `${head}%` }} />
            <div className="h-full bg-emerald-300 transition-all duration-150" style={{ width: `${heart}%` }} />
            <div
              className="absolute top-0 bottom-0 w-1 bg-white -translate-x-1/2 z-10"
              style={{ left: `${head}%` }}
            />
          </div>

          <input
            aria-label="Head versus Heart ratio calibration"
            type="range"
            min={10}
            max={90}
            step={1}
            value={head}
            onChange={(e) => onUpdateWeights({ headPercent: Number(e.target.value) })}
            className="w-full mt-3 nv-range"
          />

          <div className="grid grid-cols-3 text-center mt-3 text-[11px] font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => onUpdateWeights({ headPercent: 80 })}
              className={`text-left hover:text-slate-900 ${head === 80 ? 'text-slate-900 font-bold underline' : ''}`}
            >
              Strict Conservative (80 / 20)
            </button>
            <button
              type="button"
              onClick={() => onUpdateWeights({ headPercent: 62 })}
              className={`text-center hover:text-slate-900 ${head === 62 ? 'text-slate-900 font-bold underline' : ''}`}
            >
              Balanced Prudence (62 / 38)
            </button>
            <button
              type="button"
              onClick={() => onUpdateWeights({ headPercent: 30 })}
              className={`text-right hover:text-slate-900 ${head === 30 ? 'text-slate-900 font-bold underline' : ''}`}
            >
              Experiential Priority (30 / 70)
            </button>
          </div>
        </div>
      </section>

      {/* Two Column Operational Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Cols: 3-Tier Priority Architecture */}
        <div className="lg:col-span-8 space-y-8">
          {/* Tier 1: Non-Negotiables */}
          <section className="bg-white border border-slate-200 rounded-md p-6 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold uppercase tracking-wider">
                    Tier 1 Architecture
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Non-Negotiables (Zero-Tolerance Dealbreakers)
                  </h3>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Any asset breaching a single locked constraint is automatically flagged or disqualified in the verdict.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddRule((v) => !v)}
                  className="px-2.5 py-1 rounded border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  + Add Rule
                </button>
                <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                  {weights.nonNegotiables.filter((r) => r.enabled).length} Active Directives
                </span>
              </div>
            </div>

            {showAddRule && (
              <form onSubmit={handleAddRule} className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newRuleTitle}
                  onChange={(e) => setNewRuleTitle(e.target.value)}
                  placeholder="e.g., Walking distance to DART / Tube under 10 minutes"
                  className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold"
                >
                  Add
                </button>
              </form>
            )}

            <div className="space-y-3">
              {weights.nonNegotiables.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-3.5 border rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    rule.enabled
                      ? 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
                      : 'border-slate-100 bg-white opacity-60'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleRuleEnabled(rule.id)}
                    className="flex items-start sm:items-center gap-3 text-left flex-1"
                  >
                    <span
                      className={`material-symbols-filled text-[20px] mt-0.5 sm:mt-0 ${
                        rule.enabled ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {rule.enabled ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{rule.title}</h4>
                      <p className="text-xs text-slate-600">{rule.subtitle}</p>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleRuleStrict(rule.id)}
                      className={`px-2.5 py-1 rounded border text-[10px] font-bold uppercase flex items-center gap-1 transition-colors ${
                        rule.strict
                          ? 'bg-white text-slate-900 border-slate-300'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                      title="Toggle between Strict Dealbreaker vs Advisory Review"
                    >
                      <span>{rule.strict ? 'Strict: True' : 'Advisory'}</span>
                      <span className="material-symbols-outlined text-[14px]">
                        {rule.strict ? 'lock' : 'lock_open'}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tier 2: Weighted Lifestyle & Practical Priorities */}
          <section className="bg-white border border-slate-200 rounded-md p-6 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-6 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-900 text-[10px] font-bold uppercase tracking-wider">
                    Tier 2 Matrix
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Weighted Lifestyle &amp; Practical Priorities
                  </h3>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Dynamic variable multipliers applied to normalized attribute deltas across candidate properties.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Scale: 1x (Low) → 5x (Decisive)
              </span>
            </div>

            <div className="space-y-5">
              {PRIORITY_ITEMS.map((item) => {
                const value = weights.priorityWeights[item.key];
                const badge = weightBadge(value);
                return (
                  <div
                    key={item.key}
                    className="p-4 border border-slate-200 rounded hover:border-slate-300 transition-colors bg-slate-50/50"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{item.subtitle}</p>
                      </div>
                      <span className="text-sm font-bold text-slate-900 font-mono shrink-0">
                        {value}.0x Multiplier
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-[11px] font-semibold text-slate-500 w-6">1x</span>
                      <input
                        aria-label={item.title}
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={value}
                        onChange={(e) =>
                          onUpdateWeights({
                            priorityWeights: {
                              ...weights.priorityWeights,
                              [item.key]: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full nv-range"
                      />
                      <span className="text-[11px] font-bold text-slate-900 w-6 text-right">5x</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Tier 3: Acceptable Compromises */}
          <section className="bg-white border border-slate-200 rounded-md p-6 shadow-xs">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                  Tier 3 Flexibilities
                </span>
                <h3 className="text-lg font-semibold text-slate-900">
                  Acceptable Compromises &amp; Trade-Off Permissions
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Active toggles unlock hidden value premiums by permitting calculated concessions in specific categories.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateWeights({
                    compromises: {
                      ...weights.compromises,
                      cosmeticRenovationOk: !weights.compromises.cosmeticRenovationOk,
                    },
                  })
                }
                className={`p-4 border-2 rounded text-left flex items-start justify-between gap-4 transition-colors ${
                  weights.compromises.cosmeticRenovationOk
                    ? 'border-emerald-500/50 bg-emerald-50/40'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-700 text-[20px]">handyman</span>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Willing to undertake cosmetic kitchen/bath renovations
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Relaxes turn-key condition penalty; rewards properties with strong structural bones &amp; cash headroom.
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                    weights.compromises.cosmeticRenovationOk
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {weights.compromises.cosmeticRenovationOk ? 'Toggled On' : 'Toggled Off'}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onUpdateWeights({
                    compromises: {
                      ...weights.compromises,
                      smallerThirdBedroomOk: !weights.compromises.smallerThirdBedroomOk,
                    },
                  })
                }
                className={`p-4 border-2 rounded text-left flex items-start justify-between gap-4 transition-colors ${
                  weights.compromises.smallerThirdBedroomOk
                    ? 'border-emerald-500/50 bg-emerald-50/40'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-700 text-[20px]">
                      bedroom_child
                    </span>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Willing to accept smaller 3rd bedroom / nursery
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Floor area threshold relaxed from 105 sqft to 80 sqft for tertiary room or nursery.
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                    weights.compromises.smallerThirdBedroomOk
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {weights.compromises.smallerThirdBedroomOk ? 'Toggled On' : 'Toggled Off'}
                </span>
              </button>
            </div>
          </section>
        </div>

        {/* Right 4 Cols: Live Matrix Impact Preview (Sticky Rail) */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
          <div className="bg-white border-2 border-slate-200 rounded-md p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Live Model Impact
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mt-0.5">Dynamic Ranking Preview</h3>
              </div>
              <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-900 text-xs font-semibold">
                {evaluation.evaluated.length} Candidates
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-3 mb-5">
              How current <strong className="text-slate-900">{head}/{heart}</strong> weights immediately rank your portfolio:
            </p>

            <div className="space-y-4">
              {evaluation.evaluated.map((item) => {
                const isWinner = item.verdictRole === 'WINNER';
                const isDisq = item.isDisqualified;
                return (
                  <div
                    key={item.property.id}
                    className={`p-4 rounded relative transition-all ${
                      isWinner
                        ? 'border-2 border-emerald-600 bg-emerald-50/30'
                        : 'border border-slate-200 bg-white'
                    }`}
                  >
                    {isWinner && (
                      <div className="absolute -top-3 right-4 px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-filled text-[12px]">military_tech</span>
                        Optimal Fit
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                              isWinner
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-900'
                            }`}
                          >
                            {item.rank}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">{item.property.name}</h4>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {item.property.area} • {formatCurrency(item.property.askingPrice, market)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`text-lg font-bold font-mono ${
                            isWinner
                              ? 'text-emerald-700'
                              : isDisq
                                ? 'text-rose-700'
                                : 'text-slate-900'
                          }`}
                        >
                          {item.compositeScore.toFixed(1)}
                        </span>
                        <span className="block text-[10px] font-semibold text-slate-500 uppercase">
                          Index
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-xs">
                      {isWinner ? (
                        <>
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <span className="material-symbols-outlined text-[15px]">verified</span>
                            Prudence Champion
                          </span>
                          <span className="text-slate-600 font-mono">
                            {formatCurrency(item.landedBuffer, market, true)} Buffer
                          </span>
                        </>
                      ) : isDisq ? (
                        <>
                          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                            <span className="material-symbols-outlined text-[15px]">warning</span>
                            Constraint Breach
                          </span>
                          <span className="text-rose-700 font-medium">
                            {item.landedBuffer < 0 ? 'Exceeds landed cap' : 'Strict rule fail'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-600">Balanced contender</span>
                          <span className="text-slate-900 font-medium">
                            {item.property.commuteMinutes} min door-to-door
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-3 rounded bg-slate-50 border border-slate-200 flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-900 text-[20px]">analytics</span>
              <div className="text-[11px]">
                <span className="font-bold text-slate-900 block">
                  Eigenvector Consistency: {evaluation.eigenvectorConsistency}
                </span>
                <p className="text-slate-600">
                  Weight vector verified with zero circular logic discrepancies.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-md p-5 text-xs space-y-3">
            <div className="flex justify-between text-slate-600">
              <span>Primary Client:</span>
              <span className="font-semibold text-slate-900">{household.clientNames}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Approved Landed Cap:</span>
              <span className="font-semibold font-mono text-slate-900">
                {formatCurrency(budget.totalLandedCostCeiling, market)} All-In
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Calibration Checkpoint:</span>
              <span className="font-mono text-slate-900 font-semibold">{household.modelCode}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Sticky Footer CTA Bar */}
      <footer className="bg-white/95 backdrop-blur border-t border-slate-200 fixed bottom-0 inset-x-0 z-40 py-3.5 px-4 sm:px-6 lg:px-12 shadow-lg">
        <div className="max-w-[1440px] w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-700 text-[22px]">tune</span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Weights normalized across {weights.nonNegotiables.length + 6} criteria
              </p>
              <p className="text-xs text-slate-600">
                Sensitivity score: {evaluation.sensitivityScore}/10 • Ready for multi-variable trade-off simulation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onResetDefaults}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded text-xs font-semibold text-slate-800 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">replay</span>
              <span>Reset to Neutral Defaults</span>
            </button>
            <button
              type="button"
              onClick={onProceed}
              className="px-6 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-2 flex-1 sm:flex-none"
            >
              <span>Run Deep Comparison &amp; Reveal Hidden Value</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
