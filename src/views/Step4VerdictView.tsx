import React from 'react';
import type {
  BudgetConfig,
  ChecklistItem,
  DecisionWeights,
  EvaluatedProperty,
  HouseholdProfile,
  MarketMode,
  PortfolioEvaluation,
} from '../types/property.ts';
import { formatCurrency } from '../engine/decisionEngine.ts';

interface Step4VerdictViewProps {
  market: MarketMode;
  registryFootnote: string;
  budget: BudgetConfig;
  household: HouseholdProfile;
  weights: DecisionWeights;
  evaluation: PortfolioEvaluation;
  checklist: ChecklistItem[];
  onToggleChecklistItem: (id: string) => void;
  onInspectProperty: (propertyId: string) => void;
  onOpenToolkit: (mode: 'dossier' | 'offer-letter' | 'sensitivity') => void;
  onShare: () => void;
  onBackToComparison: () => void;
  onBackToWeights: () => void;
}

function getActionButtonLabel(item: EvaluatedProperty): string {
  if (item.verdictRole === 'WINNER') return 'Review Preferred Asset Audit';
  if (item.verdictRole === 'DISQUALIFIED') return 'Inspect Rejection Proof';
  return 'Inspect Secondary Profile';
}

export const Step4VerdictView: React.FC<Step4VerdictViewProps> = ({
  market,
  registryFootnote,
  budget,
  household,
  weights,
  evaluation,
  checklist,
  onToggleChecklistItem,
  onInspectProperty,
  onOpenToolkit,
  onShare,
  onBackToComparison,
  onBackToWeights,
}) => {
  const { winner, runnerUp, varianceToRunnerUp, confidenceCoefficient } = evaluation;
  const completedCount = checklist.filter((c) => c.done).length;
  const readinessPct =
    checklist.length === 0 ? 100 : Math.round((completedCount / checklist.length) * 100);
  const disqualifiedList = evaluation.evaluated.filter((e) => e.isDisqualified);

  const handleChecklistAction = (item: ChecklistItem) => {
    const label = (item.actionLabel ?? '').toLowerCase();
    if (label.includes('pack') || label.includes('dossier')) {
      onOpenToolkit('dossier');
      return;
    }
    if (label.includes('letter') || label.includes('offer')) {
      onOpenToolkit('offer-letter');
      return;
    }
    if (label.includes('sensitivity') || label.includes('stress')) {
      onOpenToolkit('sensitivity');
      return;
    }
    if (
      label.includes('audit') ||
      label.includes('inspect') ||
      label.includes('survey') ||
      label.includes('engineer')
    ) {
      onInspectProperty(winner.property.id);
      return;
    }
    onToggleChecklistItem(item.id);
  };

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12 py-8 space-y-8 pb-16">
      {/* Meta Confidence Strip */}
      <section className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-md px-4 py-2.5 text-xs font-mono text-slate-600 shadow-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            DETERMINISTIC VERDICT LOCKED
          </span>
          <span>Model: {household.modelCode}</span>
          <span>
            Confidence Coefficient:{' '}
            <strong className="text-slate-900 tabular-nums">
              {confidenceCoefficient.toFixed(3)}
            </strong>
          </span>
          <span className="hidden sm:inline">
            Eigenvector CR:{' '}
            <strong className="text-slate-900 tabular-nums">
              {evaluation.eigenvectorConsistency.toFixed(3)}
            </strong>
          </span>
          <span className="hidden md:inline">
            Sensitivity Index:{' '}
            <strong className="text-slate-900 tabular-nums">
              {evaluation.sensitivityScore.toFixed(1)}%
            </strong>
          </span>
        </div>
        <button
          type="button"
          onClick={onBackToComparison}
          className="text-slate-700 hover:text-slate-900 underline underline-offset-2 font-sans font-medium"
        >
          &larr; Return to Side-by-Side Comparison
        </button>
      </section>

      {/* Executive Verdict Hero Banner */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Narrative */}
          <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-emerald-600 text-white font-mono text-[11px] font-semibold uppercase tracking-wider">
                  Recommended Purchase · {winner.property.code}
                </span>
                <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px] font-medium">
                  {winner.verdictTag}
                </span>
                {disqualifiedList.length > 0 && (
                  <span className="px-2.5 py-1 rounded bg-rose-50 text-rose-800 border border-rose-200 font-mono text-[11px]">
                    {disqualifiedList.length} Candidate{disqualifiedList.length > 1 ? 's' : ''}{' '}
                    Eliminated by Strict Rules
                  </span>
                )}
              </div>

              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-slate-500">
                  {household.clientNames} · {winner.property.area} ({winner.property.postcode})
                </div>
                <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight mt-1">
                  Acquire {winner.property.name}
                </h1>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                {winner.property.name} achieves Pareto-optimal efficiency under your calibrated{' '}
                <strong className="text-slate-900">
                  {weights.headPercent}% Head / {100 - weights.headPercent}% Heart
                </strong>{' '}
                mandate—satisfying every strict household gate while preserving{' '}
                <strong className="font-mono text-emerald-700">
                  {winner.landedBuffer >= 0
                    ? `${formatCurrency(winner.landedBuffer, market)} landed headroom`
                    : `${formatCurrency(Math.abs(winner.landedBuffer), market)} shortfall`}
                </strong>{' '}
                under your {formatCurrency(budget.totalLandedCostCeiling, market)} all-in ceiling.{' '}
                {runnerUp
                  ? `It outranks ${runnerUp.property.name} (${runnerUp.property.code}) by +${varianceToRunnerUp.toFixed(1)} weighted points.`
                  : 'No other candidate passes all active non-negotiable gates.'}
              </p>
            </div>

            {/* 3 Quick Readouts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 rounded p-3 border border-slate-100">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  All-In Landed Cost
                </div>
                <div className="text-lg font-mono font-semibold text-slate-900 tabular-nums mt-0.5">
                  {formatCurrency(winner.totalLandedCost, market)}
                </div>
                <div
                  className={`text-xs font-mono mt-0.5 tabular-nums ${
                    winner.landedBuffer >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {winner.landedBuffer >= 0
                    ? `+${formatCurrency(winner.landedBuffer, market)} Under Cap`
                    : `-${formatCurrency(Math.abs(winner.landedBuffer), market)} Over Cap`}
                </div>
              </div>

              <div className="bg-slate-50 rounded p-3 border border-slate-100">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  Commute & Acoustics
                </div>
                <div className="text-lg font-mono font-semibold text-slate-900 tabular-nums mt-0.5">
                  {winner.property.commuteMinutes} mins · {winner.property.ambientNoiseDb} dBA
                </div>
                <div className="text-xs text-slate-600 mt-0.5 truncate">
                  {winner.property.walkTitle}
                </div>
              </div>

              <div className="bg-slate-50 rounded p-3 border border-slate-100">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  Daylight & Catchment
                </div>
                <div className="text-lg font-mono font-semibold text-slate-900 tabular-nums mt-0.5">
                  {winner.property.solarOrientation} ({winner.property.winterSunHours.toFixed(1)}h)
                </div>
                <div className="text-xs text-emerald-700 font-mono mt-0.5">
                  {winner.property.catchmentProbability}% {winner.property.catchmentStatus}
                </div>
              </div>
            </div>
          </div>

          {/* Right Composite Evaluation Score Card */}
          <div className="lg:col-span-4 bg-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-400">
                <span>Composite Evaluation</span>
                <span>Rank #1</span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-5xl font-mono font-bold tabular-nums text-white">
                  {winner.compositeScore.toFixed(1)}
                </span>
                <span className="text-sm font-mono text-slate-400">/ 100</span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-mono text-xs">
                {runnerUp
                  ? `+${varianceToRunnerUp.toFixed(1)} pts above ${runnerUp.property.code}`
                  : 'Sole Qualifying Candidate'}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300">Head / Financial Prudence</span>
                  <span className="font-mono font-semibold tabular-nums">
                    {winner.prudenceScore}/100
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${winner.prudenceScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300">Heart / Hidden Lifestyle Value</span>
                  <span className="font-mono font-semibold tabular-nums">
                    {winner.lifestyleScore}/100
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${winner.lifestyleScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300">Capital & Resale Resilience</span>
                  <span className="font-mono font-semibold tabular-nums">
                    {winner.capitalPreservationScore}/100
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-400 rounded-full"
                    style={{ width: `${winner.capitalPreservationScore}%` }}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onBackToWeights}
              className="w-full py-2 px-3 rounded border border-slate-700 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors"
            >
              Test Sensitivity on Head/Heart Axis
            </button>
          </div>
        </div>
      </section>

      {/* Deterministic Scoring Breakdown Cards */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
              Ranked Decision Ledger
            </div>
            <h2 className="font-editorial text-2xl font-semibold text-slate-900">
              Deterministic Scoring Breakdown
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {evaluation.qualifiedCount} of {evaluation.evaluated.length} properties pass all strict rules
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {evaluation.evaluated.map((item) => {
            const isWinner = item.verdictRole === 'WINNER';
            const isDisqualified = item.isDisqualified;

            return (
              <article
                key={item.property.id}
                className={`bg-white rounded-lg border p-5 flex flex-col justify-between space-y-5 ${
                  isWinner
                    ? 'border-emerald-500 ring-1 ring-emerald-500/20 shadow-sm'
                    : isDisqualified
                      ? 'border-rose-300 bg-rose-50/20'
                      : 'border-slate-200'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-mono text-[10px] font-semibold uppercase tracking-wider ${
                          isWinner
                            ? 'bg-emerald-100 text-emerald-800'
                            : isDisqualified
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isWinner
                          ? '#1 Winner'
                          : isDisqualified
                            ? 'Disqualified'
                            : `#${item.rank} Runner-Up`}
                      </span>
                      <h3 className="font-editorial text-xl font-semibold text-slate-900 mt-1.5">
                        {item.property.code} · {item.property.name}
                      </h3>
                      <div className="text-xs text-slate-500">
                        {item.property.area} · Asking{' '}
                        <span className="font-mono text-slate-700">
                          {formatCurrency(item.property.askingPrice, market)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
                        {item.compositeScore.toFixed(1)}
                      </div>
                      <div className="text-[10px] font-mono uppercase text-slate-400">
                        Composite
                      </div>
                    </div>
                  </div>

                  {/* Callout */}
                  <div
                    className={`rounded p-3 border text-xs leading-relaxed ${
                      isWinner
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : isDisqualified
                          ? 'bg-rose-50 border-rose-200 text-rose-950'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="font-semibold mb-1">{item.verdictCalloutTitle}</div>
                    <p>{item.verdictCalloutBody}</p>
                  </div>

                  {/* Failed strict gates if any */}
                  {item.failedStrictRules.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-rose-700 font-semibold">
                        Failed Non-Negotiables
                      </div>
                      {item.failedStrictRules.map((fr) => (
                        <div
                          key={fr.ruleId}
                          className="text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded px-2.5 py-1.5"
                        >
                          <span className="font-semibold">{fr.ruleTitle}:</span> {fr.evidence}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 text-center border-t border-slate-100 pt-3">
                    <div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Landed</div>
                      <div className="text-xs font-mono font-semibold text-slate-800 tabular-nums">
                        {formatCurrency(item.totalLandedCost, market, true)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Buffer</div>
                      <div
                        className={`text-xs font-mono font-semibold tabular-nums ${
                          item.landedBuffer >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {item.landedBuffer >= 0 ? '+' : '-'}
                        {formatCurrency(Math.abs(item.landedBuffer), market, true)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase">
                        Head/Heart
                      </div>
                      <div className="text-xs font-mono font-semibold text-slate-800 tabular-nums">
                        {item.prudenceScore}/{item.lifestyleScore}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onInspectProperty(item.property.id)}
                  className={`w-full py-2 px-3 rounded text-xs font-semibold transition-colors border ${
                    isWinner
                      ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
                      : isDisqualified
                        ? 'bg-white hover:bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                  }`}
                >
                  {getActionButtonLabel(item)}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {/* Trade-Off Analysis Matrix */}
      {evaluation.comparisons.length > 0 && (
        <section className="space-y-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
              Opportunity Cost & Head-to-Head Deltas
            </div>
            <h2 className="font-editorial text-2xl font-semibold text-slate-900">
              Trade-Off Analysis Matrix
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {evaluation.comparisons.map((comp) => (
              <div
                key={comp.targetId}
                className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded font-mono text-[11px] font-semibold uppercase tracking-wide ${
                      comp.badgeTone === 'winner-vs-disqualified'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {comp.badgeText}
                  </span>
                  <span className="text-xs font-mono text-slate-500">vs {comp.targetName}</span>
                </div>

                <div>
                  <h3 className="font-editorial text-xl font-semibold text-slate-900">
                    {comp.headline}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mt-1.5">{comp.summary}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  {comp.pills.map((pill) => (
                    <div
                      key={`${comp.targetId}-${pill.label}`}
                      className={`rounded border px-3 py-2 ${
                        pill.tone === 'positive'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : pill.tone === 'negative'
                            ? 'bg-rose-50 border-rose-200 text-rose-900'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="font-mono text-xs font-semibold tabular-nums">
                        {pill.label}
                      </div>
                      <div className="text-[11px] opacity-80 mt-0.5">{pill.sublabel}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pre-Offer Actionable Checklist + Execution Toolkit */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Checklist (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 font-semibold">
                Conveyancing & Offer Readiness
              </div>
              <h2 className="font-editorial text-2xl font-semibold text-slate-900">
                Pre-Offer Actionable Checklist
              </h2>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xl font-mono font-bold text-slate-900 tabular-nums">
                {readinessPct}%
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                {completedCount}/{checklist.length} gates verified
              </div>
            </div>
          </div>

          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-300"
              style={{ width: `${readinessPct}%` }}
            />
          </div>

          <div className="space-y-3">
            {checklist.map((item) => (
              <div
                key={item.id}
                className={`rounded-md border p-3.5 transition-colors flex items-start justify-between gap-3 ${
                  item.done
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <label className="flex items-start gap-3 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => onToggleChecklistItem(item.id)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          item.done ? 'line-through text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {item.title}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-600">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </label>

                {item.actionLabel && (
                  <button
                    type="button"
                    onClick={() => handleChecklistAction(item)}
                    className="shrink-0 px-2.5 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-medium text-slate-700 transition-colors"
                  >
                    {item.actionLabel}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Execution Toolkit (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-xs">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                Negotiation & Audit Deliverables
              </div>
              <h2 className="font-editorial text-2xl font-semibold text-slate-900">
                Execution Toolkit
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Generate reproducible buyer packs calibrated from your live landed budget and weighted scores.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => onOpenToolkit('dossier')}
                className="w-full text-left rounded-md border border-slate-200 hover:border-slate-900 p-4 transition-colors group bg-slate-50/50 hover:bg-white"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-emerald-700">
                      description
                    </span>
                    Executive Verdict Memorandum
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-slate-900">
                    arrow_forward
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Full scored rationale, non-negotiable pass/fail matrix, and hidden value ledger.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onOpenToolkit('offer-letter')}
                className="w-full text-left rounded-md border border-slate-200 hover:border-slate-900 p-4 transition-colors group bg-slate-50/50 hover:bg-white"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-slate-800">
                      mail
                    </span>
                    Offer Justification Letter
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-slate-900">
                    arrow_forward
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Evidence-backed opening bid framing deducting quantified upgrade & survey liabilities.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onOpenToolkit('sensitivity')}
                className="w-full text-left rounded-md border border-slate-200 hover:border-slate-900 p-4 transition-colors group bg-slate-50/50 hover:bg-white"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-amber-600">
                      table_chart
                    </span>
                    Dynamic Sensitivity Spreadsheet
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-slate-900">
                    arrow_forward
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  CSV-ready CapEx & Head/Heart sensitivity matrix showing winner flip thresholds.
                </p>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Dark CTA Closing Banner */}
      <section className="bg-slate-900 text-white rounded-lg p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-slate-800 shadow-lg">
        <div className="space-y-1.5 max-w-2xl">
          <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
            Ready for Partner Sign-Off & Broker Engagement
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-white">
            Lock In {winner.property.name} Strategy
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Share the live deterministic verdict with your partner, solicitor, or broker, or download the structured board pack.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded border border-slate-700 hover:bg-slate-800 text-xs sm:text-sm font-medium text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[17px]">share</span>
            Share Interactive Verdict
          </button>
          <button
            type="button"
            onClick={() => onOpenToolkit('offer-letter')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-semibold transition-colors"
          >
            Generate Offer Strategy Letter
          </button>
          <button
            type="button"
            onClick={() => onOpenToolkit('dossier')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-colors"
          >
            Export Full Board Dossier
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 font-mono">
        <span>{registryFootnote}</span>
        <span>
          NestVerdict Deterministic Engine · {household.modelCode} · {checklist.length} Pre-Offer Gates Tracked
        </span>
      </footer>
    </div>
  );
};
