import React, { useState } from 'react';
import type {
  EvaluatedProperty,
  HouseholdProfile,
  MarketMode,
  PortfolioEvaluation,
  PropertyCandidate,
} from '../types/property.ts';
import { formatCurrency } from '../engine/decisionEngine.ts';

interface PropertyModalProps {
  evaluated: EvaluatedProperty;
  market: MarketMode;
  onClose: () => void;
  onUpdateProperty: (id: string, patch: Partial<PropertyCandidate>) => void;
}

export const PropertyAuditModal: React.FC<PropertyModalProps> = ({
  evaluated,
  market,
  onClose,
  onUpdateProperty,
}) => {
  const { property } = evaluated;
  const [askingPrice, setAskingPrice] = useState(property.askingPrice);
  const [requiredWorksCost, setRequiredWorksCost] = useState(property.requiredWorksCost);
  const [heatingUpgradeCost, setHeatingUpgradeCost] = useState(property.heatingUpgradeCost);
  const [commuteMinutes, setCommuteMinutes] = useState(property.commuteMinutes);
  const [catchmentProbability, setCatchmentProbability] = useState(property.catchmentProbability);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProperty(property.id, {
      askingPrice: Math.max(100000, Number(askingPrice) || property.askingPrice),
      requiredWorksCost: Math.max(0, Number(requiredWorksCost) || 0),
      heatingUpgradeCost: Math.max(0, Number(heatingUpgradeCost) || 0),
      commuteMinutes: Math.max(1, Number(commuteMinutes) || property.commuteMinutes),
      catchmentProbability: Math.min(100, Math.max(1, Number(catchmentProbability) || 50)),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Audit ${property.name}`}
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-start justify-between p-6 border-b border-slate-200">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {property.code} • {property.sourcePortal} • {evaluated.verdictTag}
            </span>
            <h3 className="font-editorial text-2xl font-bold text-slate-900 mt-1">
              {property.name} ({property.area}, {property.postcode})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Deterministic Rule Audit */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Deterministic Needs vs. Wants Audit
            </h4>
            <div className="space-y-2">
              {evaluated.ruleChecks.map((chk) => (
                <div
                  key={chk.ruleId}
                  className={`flex items-center justify-between p-3 rounded border text-xs ${
                    chk.status === 'PASS'
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : chk.status === 'REVIEW'
                        ? 'bg-amber-50 border-amber-200 text-amber-950'
                        : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  <div>
                    <span className="font-semibold block">{chk.ruleTitle}</span>
                    <span className="text-[11px] opacity-80">{chk.evidence}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase bg-white border border-current">
                    {chk.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stress-Test Cost & Telemetry Inputs */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Adjust Parsed Inputs &amp; Recompute Live
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  Asking / Offer Price ({market === 'IE' ? '€' : '£'})
                </span>
                <input
                  type="number"
                  step={5000}
                  value={askingPrice}
                  onChange={(e) => setAskingPrice(Number(e.target.value))}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm font-mono"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  Required Works Estimate ({market === 'IE' ? '€' : '£'})
                </span>
                <input
                  type="number"
                  step={2500}
                  value={requiredWorksCost}
                  onChange={(e) => setRequiredWorksCost(Number(e.target.value))}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm font-mono"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  Heating / Energy Upgrade ({market === 'IE' ? '€' : '£'})
                </span>
                <input
                  type="number"
                  step={1000}
                  value={heatingUpgradeCost}
                  onChange={(e) => setHeatingUpgradeCost(Number(e.target.value))}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm font-mono"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  Door-to-Desk Commute (mins)
                </span>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={commuteMinutes}
                  onChange={(e) => setCommuteMinutes(Number(e.target.value))}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm font-mono"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  School Catchment Certainty ({catchmentProbability}%)
                </span>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={catchmentProbability}
                  onChange={(e) => setCatchmentProbability(Number(e.target.value))}
                  className="w-full nv-range"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-600">
              Current Total Landed Cost:{' '}
              <strong className="font-mono text-slate-900">
                {formatCurrency(evaluated.totalLandedCost, market)}
              </strong>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
              >
                Apply &amp; Re-Score
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

interface HouseholdModalProps {
  household: HouseholdProfile;
  onClose: () => void;
  onSave: (patch: Partial<HouseholdProfile>) => void;
}

export const HouseholdModal: React.FC<HouseholdModalProps> = ({
  household,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState(household);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Edit household parameters"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h3 className="font-editorial text-2xl font-bold text-slate-900">
              Household &amp; Lifestyle Anchors
            </h3>
            <p className="text-xs text-slate-600">
              Changes immediately update deterministic commute &amp; catchment rule gates.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-semibold text-slate-700 block mb-1">Household / Clients</span>
              <input
                type="text"
                value={form.clientNames}
                onChange={(e) => setForm({ ...form, clientNames: e.target.value })}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700 block mb-1">Adults Setup</span>
              <input
                type="text"
                value={form.adults}
                onChange={(e) => setForm({ ...form, adults: e.target.value })}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700 block mb-1">Children &amp; School Horizon</span>
              <input
                type="text"
                value={form.children}
                onChange={(e) => setForm({ ...form, children: e.target.value })}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700 block mb-1">Pets / Garden Requirement</span>
              <input
                type="text"
                value={form.pets}
                onChange={(e) => setForm({ ...form, pets: e.target.value })}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700 block mb-1">Primary Commute Destination</span>
              <input
                type="text"
                value={form.primaryCommuteTarget}
                onChange={(e) => setForm({ ...form, primaryCommuteTarget: e.target.value })}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700 block mb-1">
                Max Primary Commute (Minutes)
              </span>
              <input
                type="number"
                min={10}
                max={90}
                value={form.primaryCommuteMaxMins}
                onChange={(e) =>
                  setForm({ ...form, primaryCommuteMaxMins: Math.max(10, Number(e.target.value) || 35) })
                }
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm font-mono"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
            >
              Save Household Setup
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export type ExportMode = 'dossier' | 'offer-letter' | 'sensitivity';

interface ExportModalProps {
  mode: ExportMode;
  evaluation: PortfolioEvaluation;
  market: MarketMode;
  clientNames: string;
  onClose: () => void;
}

export const ExportToolkitModal: React.FC<ExportModalProps> = ({
  mode,
  evaluation,
  market,
  clientNames,
  onClose,
}) => {
  const [rateShockPct, setRateShockPct] = useState(1.0);
  const [worksOverrunPct, setWorksOverrunPct] = useState(15);
  const [copied, setCopied] = useState(false);

  const { winner } = evaluation;
  const currency = market === 'IE' ? '€' : '£';
  const suggestedBid = Math.round(winner.property.askingPrice * 0.982 / 5000) * 5000;

  const memorandumText = `# NestVerdict Executive Decision Memorandum
Client Household: ${clientNames}
Recommended Acquisition: ${winner.property.name} (${winner.property.area}, ${winner.property.postcode})
Source Portal: ${winner.property.sourcePortal} (${winner.property.sourceUrl})
Composite Decision Index: ${winner.compositeScore.toFixed(1)} / 100 (Confidence Coefficient: ${evaluation.confidenceCoefficient})

FINANCIAL & LANDED CAPITAL SUMMARY
- Asking Price: ${formatCurrency(winner.property.askingPrice, market)}
- Stamp Duty: ${formatCurrency(winner.stampDuty, market)}
- Estimated Works + Energy Upgrade: ${formatCurrency(winner.property.requiredWorksCost + winner.property.heatingUpgradeCost, market)}
- Legal, Survey & Contingency: ${formatCurrency(winner.property.legalSurveyCost + winner.property.contingencyCost, market)}
- Total Landed Cost: ${formatCurrency(winner.totalLandedCost, market)}
- Remaining Budget Buffer: ${formatCurrency(winner.landedBuffer, market)}

RANKED CANDIDATES
${evaluation.evaluated
  .map(
    (e) =>
      `#${e.rank} ${e.property.name} (${e.property.postcode}) — Score ${e.compositeScore.toFixed(1)}/100 | Landed ${formatCurrency(e.totalLandedCost, market)} | Buffer ${formatCurrency(e.landedBuffer, market)} | ${e.verdictTag}`
  )
  .join('\n')}`;

  const offerLetterText = `Subject: Formal Offer Proposal — ${winner.property.name}, ${winner.property.area}

Dear Selling Agent,

Following our viewing and independent cost-and-catchment assessment, ${clientNames} are pleased to submit a formal, chain-ready offer of ${formatCurrency(suggestedBid, market)} for ${winner.property.name}.

Key supporting considerations:
1. Immediate works & energy envelope upgrades estimated at ${formatCurrency(winner.property.requiredWorksCost + winner.property.heatingUpgradeCost, market)} (${winner.property.energyRating}).
2. Verified financing and full cash reserves covering acquisition, stamp duty (${formatCurrency(winner.stampDuty, market)}), and legal completion without reliance on speculative bridging.
3. Readiness to instruct engineer/surveyor and solicitor immediately upon booking deposit acceptance.

Kind regards,
${clientNames}`;

  const csvRows = [
    ['Property', 'Portal', 'AskingPrice', 'StampDuty', 'WorksAndUpgrades', 'TotalLandedCost', 'OverrunStressCost', 'BufferAfterStress', 'CompositeScore', 'Verdict'].join(','),
    ...evaluation.evaluated.map((e) => {
      const works = e.property.requiredWorksCost + e.property.heatingUpgradeCost;
      const stressedWorks = Math.round(works * (1 + worksOverrunPct / 100));
      const stressedLanded = e.totalLandedCost - works + stressedWorks;
      const stressedBuffer = e.landedBuffer - (stressedWorks - works);
      return [
        `"${e.property.name}"`,
        e.property.sourcePortal,
        e.property.askingPrice,
        e.stampDuty,
        works,
        e.totalLandedCost,
        stressedLanded,
        stressedBuffer,
        e.compositeScore,
        e.verdictRole,
      ].join(',');
    }),
  ].join('\n');

  const activeText =
    mode === 'offer-letter' ? offerLetterText : mode === 'sensitivity' ? csvRows : memorandumText;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const ext = mode === 'sensitivity' ? 'csv' : 'txt';
    const blob = new Blob([activeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nestverdict-${mode}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Execution toolkit export"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              NestVerdict Execution Toolkit
            </span>
            <h3 className="font-editorial text-2xl font-bold text-slate-900 mt-0.5">
              {mode === 'offer-letter'
                ? 'Offer Justification Letter'
                : mode === 'sensitivity'
                  ? 'Dynamic Sensitivity Stress Model'
                  : 'Executive Verdict Memorandum'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {mode === 'sensitivity' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  Mortgage Rate Shock (+{rateShockPct.toFixed(2)}%)
                </span>
                <input
                  type="range"
                  min={0}
                  max={2.5}
                  step={0.25}
                  value={rateShockPct}
                  onChange={(e) => setRateShockPct(Number(e.target.value))}
                  className="w-full nv-range"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  Renovation Builder Overrun (+{worksOverrunPct}%)
                </span>
                <input
                  type="range"
                  min={0}
                  max={40}
                  step={5}
                  value={worksOverrunPct}
                  onChange={(e) => setWorksOverrunPct(Number(e.target.value))}
                  className="w-full nv-range"
                />
              </label>

              <div className="sm:col-span-2 overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="py-2 pr-3">Property</th>
                      <th className="py-2 pr-3">Base Landed</th>
                      <th className="py-2 pr-3">Stressed Landed (+{worksOverrunPct}% works)</th>
                      <th className="py-2 pr-3">Residual Cushion</th>
                      <th className="py-2">Monthly Rate Delta (80% LTV)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {evaluation.evaluated.map((e) => {
                      const works = e.property.requiredWorksCost + e.property.heatingUpgradeCost;
                      const extraWorks = Math.round((works * worksOverrunPct) / 100);
                      const stressedBuffer = e.landedBuffer - extraWorks;
                      const monthlyRateHit = Math.round((e.property.askingPrice * 0.8 * (rateShockPct / 100)) / 12);
                      return (
                        <tr key={e.property.id}>
                          <td className="py-2 pr-3 font-sans font-semibold text-slate-900">{e.property.name}</td>
                          <td className="py-2 pr-3">{formatCurrency(e.totalLandedCost, market)}</td>
                          <td className="py-2 pr-3">{formatCurrency(e.totalLandedCost + extraWorks, market)}</td>
                          <td
                            className={`py-2 pr-3 font-bold ${
                              stressedBuffer >= 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {formatCurrency(stressedBuffer, market)}
                          </td>
                          <td className="py-2 text-slate-700">+{currency}{monthlyRateHit.toLocaleString()}/mo</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <pre className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs font-mono text-slate-800 whitespace-pre-wrap overflow-x-auto leading-relaxed">
            {activeText}
          </pre>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 border border-slate-200 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              Print / Save PDF
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2 border border-slate-200 rounded text-xs font-semibold text-slate-800 hover:bg-slate-50"
              >
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
              >
                Download .{mode === 'sensitivity' ? 'csv' : 'txt'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
