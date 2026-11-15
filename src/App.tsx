import React, { useEffect, useMemo, useState } from 'react';
import type {
  BudgetConfig,
  ChecklistItem,
  DecisionWeights,
  HouseholdProfile,
  MarketMode,
  PropertyCandidate,
  StepId,
} from './types/property.ts';
import { getPreset } from './data/presets.ts';
import {
  evaluatePortfolio,
  formatCurrency,
  parsePropertyUrls,
  splitPropertyUrlInput,
} from './engine/decisionEngine.ts';
import {
  ingestPropertyUrlsViaBackend,
  type GeminiDecisionAuditResult,
} from './engine/decisionApiClient.ts';
import { TopNavBar } from './components/TopNavBar.tsx';
import { ExportToolkitModal, HouseholdModal, PropertyAuditModal } from './components/Modals.tsx';
import { Step1IngestionView } from './views/Step1IngestionView.tsx';
import { Step2CalibrationView } from './views/Step2CalibrationView.tsx';
import { Step3ComparisonView } from './views/Step3ComparisonView.tsx';
import { Step4VerdictView } from './views/Step4VerdictView.tsx';

const STORAGE_KEY = 'nestverdict_workspace_v1';

interface MarketWorkspaceState {
  budget: BudgetConfig;
  household: HouseholdProfile;
  weights: DecisionWeights;
  properties: PropertyCandidate[];
  checklist: ChecklistItem[];
}

interface PersistedAppState {
  market: MarketMode;
  activeStep: StepId;
  workspaces: Record<MarketMode, MarketWorkspaceState>;
}

function buildWorkspaceFromPreset(mode: MarketMode): MarketWorkspaceState {
  const preset = getPreset(mode);
  return {
    budget: { ...preset.budget },
    household: { ...preset.household },
    weights: {
      headPercent: preset.weights.headPercent,
      nonNegotiables: preset.weights.nonNegotiables.map((r) => ({ ...r })),
      priorityWeights: { ...preset.weights.priorityWeights },
      compromises: { ...preset.weights.compromises },
    },
    properties: preset.properties.map((p) => ({
      ...p,
      coordinates: { ...p.coordinates },
      hiddenAmenities: [...p.hiddenAmenities],
      parsedHighlights: [...p.parsedHighlights],
    })),
    checklist: preset.checklist.map((c) => ({ ...c })),
  };
}

function loadInitialState(): PersistedAppState {
  const defaultState: PersistedAppState = {
    market: 'IE',
    activeStep: 1,
    workspaces: {
      IE: buildWorkspaceFromPreset('IE'),
      UK: buildWorkspaceFromPreset('UK'),
    },
  };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<PersistedAppState>;
    if (!parsed || (parsed.market !== 'IE' && parsed.market !== 'UK')) {
      return defaultState;
    }
    const step = parsed.activeStep;
    const validStep: StepId = step === 1 || step === 2 || step === 3 || step === 4 ? step : 1;
    return {
      market: parsed.market,
      activeStep: validStep,
      workspaces: {
        IE:
          parsed.workspaces?.IE && Array.isArray(parsed.workspaces.IE.properties)
            ? parsed.workspaces.IE
            : defaultState.workspaces.IE,
        UK:
          parsed.workspaces?.UK && Array.isArray(parsed.workspaces.UK.properties)
            ? parsed.workspaces.UK
            : defaultState.workspaces.UK,
      },
    };
  } catch {
    return defaultState;
  }
}

export function App(): React.ReactElement {
  const [appState, setAppState] = useState<PersistedAppState>(() => loadInitialState());
  const [savedAtLabel, setSavedAtLabel] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [inspectedPropertyId, setInspectedPropertyId] = useState<string | null>(null);
  const [isHouseholdModalOpen, setIsHouseholdModalOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [toolkitMode, setToolkitMode] = useState<'dossier' | 'offer-letter' | 'sensitivity' | null>(
    null
  );
  const [decisionAudits, setDecisionAudits] = useState<Record<string, GeminiDecisionAuditResult>>({});

  const { market, activeStep } = appState;
  const workspace = appState.workspaces[market];
  const presetMeta = getPreset(market);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timer = window.setTimeout(() => setToastMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch {
      // Ignore storage quota errors cleanly
    }
  }, [appState]);

  const updateCurrentWorkspace = (
    updater: (prev: MarketWorkspaceState) => MarketWorkspaceState
  ) => {
    setAppState((prev) => ({
      ...prev,
      workspaces: {
        ...prev.workspaces,
        [prev.market]: updater(prev.workspaces[prev.market]),
      },
    }));
  };

  const evaluation = useMemo(
    () =>
      evaluatePortfolio(
        workspace.properties,
        workspace.budget,
        workspace.weights,
        workspace.household,
        market
      ),
    [workspace.properties, workspace.budget, workspace.weights, workspace.household, market]
  );

  const alerts = useMemo(() => {
    const list: {
      id: string;
      propertyId: string;
      propertyLabel: string;
      severity: 'critical' | 'warning';
      title: string;
      detail: string;
    }[] = [];

    for (const item of evaluation.evaluated) {
      if (item.landedBuffer < 0) {
        list.push({
          id: `cap-${item.property.id}`,
          propertyId: item.property.id,
          propertyLabel: `${item.property.code} · ${item.property.name}`,
          severity: 'critical',
          title: 'Total Landed Cost Cap Breach',
          detail: `Exceeds all-in ceiling by ${formatCurrency(
            Math.abs(item.landedBuffer),
            market
          )} (Landed ${formatCurrency(item.totalLandedCost, market)}).`,
        });
      }
      for (const rc of item.ruleChecks) {
        if (rc.status === 'FAIL') {
          list.push({
            id: `fail-${item.property.id}-${rc.ruleId}`,
            propertyId: item.property.id,
            propertyLabel: `${item.property.code} · ${item.property.name}`,
            severity: rc.strict ? 'critical' : 'warning',
            title: `${rc.strict ? 'Strict Gate Fail' : 'Rule Fail'}: ${rc.ruleTitle}`,
            detail: rc.evidence,
          });
        } else if (rc.status === 'REVIEW') {
          list.push({
            id: `rev-${item.property.id}-${rc.ruleId}`,
            propertyId: item.property.id,
            propertyLabel: `${item.property.code} · ${item.property.name}`,
            severity: 'warning',
            title: `Manual Verification Needed: ${rc.ruleTitle}`,
            detail: rc.evidence,
          });
        }
      }
    }
    return list;
  }, [evaluation.evaluated, market]);

  const handleSelectStep = (step: StepId) => {
    setAppState((prev) => ({ ...prev, activeStep: step }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchMarket = (nextMarket: MarketMode) => {
    if (nextMarket === market) return;
    setInspectedPropertyId(null);
    setAppState((prev) => ({ ...prev, market: nextMarket }));
    showToast(
      nextMarket === 'IE'
        ? 'Switched to Ireland (€ EUR · Daft / MyHome · Irish Stamp Duty)'
        : 'Switched to UK (£ GBP · Rightmove / Zoopla · UK SDLT)'
    );
  };

  const handleIngestUrls = async (
    rawUrls: string,
    replaceExisting = false
  ): Promise<{ added: number; message: string }> => {
    const candidates = splitPropertyUrlInput(rawUrls);
    const existingSet = replaceExisting
      ? new Set<string>()
      : new Set(workspace.properties.map((p) => p.sourceUrl));
    const uniqueUrls = candidates.filter((u) => {
      try {
        const normalized = new URL(u).toString();
        return !existingSet.has(normalized);
      } catch {
        return false;
      }
    });

    if (uniqueUrls.length === 0) {
      return {
        added: 0,
        message: 'No new valid URLs found (empty input or duplicates already in shortlist).',
      };
    }

    const baseCount = replaceExisting ? 0 : workspace.properties.length;

    try {
      const liveParsed = await ingestPropertyUrlsViaBackend(
        uniqueUrls,
        market,
        baseCount
      );
      updateCurrentWorkspace((prev) => ({
        ...prev,
        properties: replaceExisting ? liveParsed : [...prev.properties, ...liveParsed],
      }));
      if (replaceExisting) {
        setDecisionAudits({});
      }

      const liveCount = liveParsed.filter((p) => p.ingestionSource === 'live_html').length;
      const groundedCount = liveParsed.filter((p) => p.ingestionSource === 'search_grounded').length;
      const msg = `${replaceExisting ? 'Replaced shortlist with' : 'Ingested'} ${liveParsed.length} listing${liveParsed.length > 1 ? 's' : ''} (${liveCount} live HTML, ${groundedCount} search-grounded).`;
      showToast(msg);
      return { added: liveParsed.length, message: msg };
    } catch {
      const fallback = parsePropertyUrls(
        rawUrls,
        market,
        baseCount,
        replaceExisting ? [] : workspace.properties.map((p) => p.sourceUrl)
      );
      if (fallback.length === 0) {
        return {
          added: 0,
          message: 'Unable to parse URLs.',
        };
      }
      updateCurrentWorkspace((prev) => ({
        ...prev,
        properties: replaceExisting ? fallback : [...prev.properties, ...fallback],
      }));
      if (replaceExisting) {
        setDecisionAudits({});
      }
      const msg = `Backend unreachable — ${replaceExisting ? 'replaced shortlist with' : 'parsed'} ${fallback.length} listing(s) via offline URL fallback.`;
      showToast(msg);
      return { added: fallback.length, message: msg };
    }
  };

  const handleRemoveProperty = (id: string) => {
    const removed = workspace.properties.find((p) => p.id === id);
    updateCurrentWorkspace((prev) => ({
      ...prev,
      properties: prev.properties.filter((p) => p.id !== id),
    }));
    if (inspectedPropertyId === id) {
      setInspectedPropertyId(null);
    }
    if (removed) {
      showToast(`Removed ${removed.code} · ${removed.name} from shortlist.`);
    }
  };

  const handleClearAllProperties = () => {
    updateCurrentWorkspace((prev) => ({
      ...prev,
      properties: [],
    }));
    setInspectedPropertyId(null);
    setDecisionAudits({});
    showToast('Cleared active property shortlist.');
  };

  const handleUpdateProperty = (id: string, patch: Partial<PropertyCandidate>) => {
    updateCurrentWorkspace((prev) => ({
      ...prev,
      properties: prev.properties.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  };

  const handleUpdateBudget = (patch: Partial<BudgetConfig>) => {
    updateCurrentWorkspace((prev) => ({
      ...prev,
      budget: { ...prev.budget, ...patch },
    }));
  };

  const handleUpdateHousehold = (patch: Partial<HouseholdProfile>) => {
    updateCurrentWorkspace((prev) => ({
      ...prev,
      household: { ...prev.household, ...patch },
    }));
    showToast('Updated household profile and life constraints.');
  };

  const handleUpdateWeights = (patch: Partial<DecisionWeights>) => {
    updateCurrentWorkspace((prev) => ({
      ...prev,
      weights: { ...prev.weights, ...patch },
    }));
  };

  const handleToggleRuleEnabled = (ruleId: string) => {
    updateCurrentWorkspace((prev) => ({
      ...prev,
      weights: {
        ...prev.weights,
        nonNegotiables: prev.weights.nonNegotiables.map((r) =>
          r.id === ruleId ? { ...r, enabled: !r.enabled } : r
        ),
      },
    }));
  };

  const handleToggleRuleStrict = (ruleId: string) => {
    updateCurrentWorkspace((prev) => ({
      ...prev,
      weights: {
        ...prev.weights,
        nonNegotiables: prev.weights.nonNegotiables.map((r) =>
          r.id === ruleId ? { ...r, strict: !r.strict } : r
        ),
      },
    }));
  };

  const handleAddNonNegotiable = (title: string, subtitle: string) => {
    const newId = `rule-custom-${Date.now()}`;
    updateCurrentWorkspace((prev) => ({
      ...prev,
      weights: {
        ...prev.weights,
        nonNegotiables: [
          ...prev.weights.nonNegotiables,
          { id: newId, title, subtitle, enabled: true, strict: true },
        ],
      },
    }));
    showToast(`Added strict non-negotiable gate: ${title}`);
  };

  const handleResetDefaults = () => {
    updateCurrentWorkspace(() => buildWorkspaceFromPreset(market));
    showToast(`Reset ${presetMeta.shortLabel} calibration & shortlist to neutral defaults.`);
  };

  const handleToggleChecklistItem = (id: string) => {
    updateCurrentWorkspace((prev) => ({
      ...prev,
      checklist: prev.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)),
    }));
  };

  const handleSaveProject = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setSavedAtLabel(`${hh}:${mm}`);
      showToast(`Portfolio snapshot saved locally at ${hh}:${mm}.`);
    } catch {
      showToast('Unable to access browser localStorage.');
    }
  };

  const handleShareVerdict = () => {
    const winner = evaluation.winner;
    if (!winner) {
      showToast('Add at least 1 property before sharing an executive verdict.');
      return;
    }
    const summaryText = [
      `NestVerdict Executive Summary (${workspace.household.portfolioTitle})`,
      `Recommended Asset: ${winner.property.code} · ${winner.property.name}`,
      `Composite Score: ${winner.compositeScore.toFixed(1)}/100 (${workspace.weights.headPercent}% Head / ${100 - workspace.weights.headPercent}% Heart)`,
      `Total Landed Cost: ${formatCurrency(winner.totalLandedCost, market)} (Buffer: ${winner.landedBuffer >= 0 ? '+' : '-'}${formatCurrency(Math.abs(winner.landedBuffer), market)})`,
      `Active Candidates Evaluated: ${evaluation.evaluated.length}`,
    ].join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(summaryText)
        .then(() => showToast('Copied shareable executive verdict summary to clipboard.'))
        .catch(() => setToolkitMode('dossier'));
    } else {
      setToolkitMode('dossier');
    }
  };

  const inspectedEval = inspectedPropertyId
    ? evaluation.evaluated.find((e) => e.property.id === inspectedPropertyId) ?? null
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] text-slate-900">
      <TopNavBar
        activeStep={activeStep}
        onSelectStep={handleSelectStep}
        market={market}
        onSwitchMarket={handleSwitchMarket}
        portfolioTitle={workspace.household.portfolioTitle}
        alertCount={alerts.length}
        savedAtLabel={savedAtLabel}
        onOpenTune={() => handleSelectStep(2)}
        onOpenAlerts={() => setIsAlertsModalOpen(true)}
        onShare={handleShareVerdict}
        onOpenExport={() => setToolkitMode('dossier')}
        onSaveProject={handleSaveProject}
      />

      <main className="flex-1">
        {activeStep === 1 && (
          <Step1IngestionView
            key={`step1-${market}`}
            market={market}
            taxLabel={presetMeta.taxLabel}
            registryFootnote={presetMeta.registryFootnote}
            properties={workspace.properties}
            evaluation={evaluation}
            budget={workspace.budget}
            household={workspace.household}
            onIngestUrls={handleIngestUrls}
            onRemoveProperty={handleRemoveProperty}
            onClearAllProperties={handleClearAllProperties}
            onResetDefaults={handleResetDefaults}
            onUpdateBudget={handleUpdateBudget}
            onInspectProperty={(id) => setInspectedPropertyId(id)}
            onEditHousehold={() => setIsHouseholdModalOpen(true)}
            onSaveDraft={handleSaveProject}
            onProceed={() => handleSelectStep(2)}
          />
        )}

        {activeStep !== 1 && workspace.properties.length === 0 && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
              <span className="material-symbols-outlined text-4xl text-slate-400">home_work</span>
              <h2 className="mt-3 font-editorial text-2xl font-semibold text-slate-900">
                Your shortlist is currently empty
              </h2>
              <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                Add at least 2 property URLs from {presetMeta.label} portals to run the deterministic scorecard, side-by-side comparison, and executive verdict.
              </p>
              <button
                type="button"
                onClick={() => handleSelectStep(1)}
                className="mt-5 inline-flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Go to Step 1 to add 2+ URLs
              </button>
            </div>
          </div>
        )}

        {activeStep === 2 && workspace.properties.length > 0 && (
          <Step2CalibrationView
            key={`step2-${market}`}
            market={market}
            weights={workspace.weights}
            budget={workspace.budget}
            household={workspace.household}
            evaluation={evaluation}
            onUpdateWeights={handleUpdateWeights}
            onToggleRuleEnabled={handleToggleRuleEnabled}
            onToggleRuleStrict={handleToggleRuleStrict}
            onAddNonNegotiable={handleAddNonNegotiable}
            onResetDefaults={handleResetDefaults}
            onProceed={() => handleSelectStep(3)}
          />
        )}

        {activeStep === 3 && workspace.properties.length > 0 && (
          <Step3ComparisonView
            key={`step3-${market}`}
            market={market}
            taxLabel={presetMeta.taxLabel}
            budget={workspace.budget}
            household={workspace.household}
            weights={workspace.weights}
            evaluation={evaluation}
            onInspectProperty={(id) => setInspectedPropertyId(id)}
            onUpdateProperty={handleUpdateProperty}
            onBackToCalibration={() => handleSelectStep(2)}
            onProceed={() => handleSelectStep(4)}
          />
        )}

        {activeStep === 4 && workspace.properties.length > 0 && (
          <Step4VerdictView
            key={`step4-${market}`}
            market={market}
            registryFootnote={presetMeta.registryFootnote}
            budget={workspace.budget}
            household={workspace.household}
            weights={workspace.weights}
            evaluation={evaluation}
            checklist={workspace.checklist}
            onToggleChecklistItem={handleToggleChecklistItem}
            onInspectProperty={(id) => setInspectedPropertyId(id)}
            onOpenToolkit={(mode) => setToolkitMode(mode)}
            onShare={handleShareVerdict}
            onBackToComparison={() => handleSelectStep(3)}
            onBackToWeights={() => handleSelectStep(2)}
          />
        )}
      </main>

      {/* Modals */}
      {inspectedEval && (
        <PropertyAuditModal
          evaluated={inspectedEval}
          market={market}
          household={workspace.household}
          nonNegotiables={workspace.weights.nonNegotiables}
          existingAudit={decisionAudits[inspectedEval.property.id] ?? null}
          onAuditComplete={(propertyId, audit) => {
            setDecisionAudits((prev) => ({ ...prev, [propertyId]: audit }));
            showToast(`Completed Gemini Decision-1 audit for ${inspectedEval.property.code}.`);
          }}
          onClose={() => setInspectedPropertyId(null)}
          onUpdateProperty={handleUpdateProperty}
        />
      )}

      {isHouseholdModalOpen && (
        <HouseholdModal
          household={workspace.household}
          onClose={() => setIsHouseholdModalOpen(false)}
          onSave={handleUpdateHousehold}
        />
      )}

      {toolkitMode && (
        <ExportToolkitModal
          mode={toolkitMode}
          evaluation={evaluation}
          market={market}
          clientNames={workspace.household.clientNames}
          onClose={() => setToolkitMode(null)}
        />
      )}

      {isAlertsModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[2px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Deterministic Risk & Gate Exceptions"
        >
          <div className="bg-white rounded-lg border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-rose-700 font-semibold">
                  Deterministic Exception Ledger
                </div>
                <h2 className="font-editorial text-xl font-semibold text-slate-900">
                  Active Alerts & Gate Breaches ({alerts.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAlertsModalOpen(false)}
                className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900"
                aria-label="Close alerts modal"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {alerts.length === 0 ? (
                <div className="rounded border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  Zero active budget breaches or non-negotiable gate failures across all{' '}
                  {evaluation.evaluated.length} properties.
                </div>
              ) : (
                alerts.map((al) => (
                  <div
                    key={al.id}
                    className={`rounded-md border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      al.severity === 'critical'
                        ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                        : 'bg-amber-50/70 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                            al.severity === 'critical'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {al.severity === 'critical' ? 'Critical Breach' : 'Warning'}
                        </span>
                        <span className="text-xs font-mono font-semibold">{al.propertyLabel}</span>
                      </div>
                      <div className="text-sm font-semibold">{al.title}</div>
                      <p className="text-xs opacity-90">{al.detail}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAlertsModalOpen(false);
                        setInspectedPropertyId(al.propertyId);
                      }}
                      className="shrink-0 px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-800"
                    >
                      Inspect Parcel
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsAlertsModalOpen(false);
                  handleSelectStep(2);
                }}
                className="text-xs font-medium text-slate-700 hover:text-slate-900 underline"
              >
                Calibrate Non-Negotiable Rules &rarr;
              </button>
              <button
                type="button"
                onClick={() => setIsAlertsModalOpen(false)}
                className="px-4 py-1.5 rounded bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Non-blocking Toast */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-20 right-4 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-md shadow-xl border border-slate-700 flex items-center gap-3 max-w-md"
        >
          <span className="material-symbols-outlined text-[16px] text-emerald-400">
            check_circle
          </span>
          <span className="flex-1">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white"
            aria-label="Dismiss notification"
          >
            <span className="material-symbols-outlined text-[15px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
