import React, { useState } from 'react';
import type {
  BudgetConfig,
  EvaluatedProperty,
  HouseholdProfile,
  MarketMode,
  PortfolioEvaluation,
  PropertyCandidate,
} from '../types/property.ts';
import { calculateStampDuty, formatCurrency } from '../engine/decisionEngine.ts';
import { PropertyPhoto } from '../components/PropertyPhoto.tsx';

interface Step1IngestionViewProps {
  market: MarketMode;
  taxLabel: string;
  registryFootnote: string;
  properties: PropertyCandidate[];
  evaluation: PortfolioEvaluation;
  budget: BudgetConfig;
  household: HouseholdProfile;
  onIngestUrls: (
    rawUrls: string,
    replaceExisting?: boolean
  ) => Promise<{ added: number; message: string }>;
  onRemoveProperty: (id: string) => void;
  onResetDefaults: () => void;
  onUpdateBudget: (patch: Partial<BudgetConfig>) => void;
  onInspectProperty: (id: string) => void;
  onEditHousehold: () => void;
  onSaveDraft: () => void;
  onProceed: () => void;
}

export const Step1IngestionView: React.FC<Step1IngestionViewProps> = ({
  market,
  taxLabel,
  registryFootnote,
  properties,
  evaluation,
  budget,
  household,
  onIngestUrls,
  onRemoveProperty,
  onResetDefaults,
  onUpdateBudget,
  onInspectProperty,
  onEditHousehold,
  onSaveDraft,
  onProceed,
}) => {
  const [urlInput, setUrlInput] = useState(
    market === 'IE'
      ? 'https://www.daft.ie/for-sale/detached-house-12-clonskeagh-road-dublin-14/591234\nhttps://www.myhome.ie/residential/brochure/18-sandycove-avenue-west-dun-laoghaire-co-dublin/4902111'
      : 'https://www.rightmove.co.uk/properties/145892019#/?channel=RES_BUY'
  );
  const [ingestFeedback, setIngestFeedback] = useState<string | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [replaceShortlist, setReplaceShortlist] = useState(false);
  const [purchaseInputStr, setPurchaseInputStr] = useState<string | null>(null);
  const [landedInputStr, setLandedInputStr] = useState<string | null>(null);

  const currencyCode = market === 'IE' ? 'EUR' : 'GBP';
  const currencySymbol = market === 'IE' ? '€' : '£';

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isIngesting) return;
    setIsIngesting(true);
    setIngestFeedback('Fetching live listing details & photos via backend...');
    try {
      const res = await onIngestUrls(urlInput, replaceShortlist);
      setIngestFeedback(res.message);
      if (res.added > 0) {
        setUrlInput('');
      }
    } finally {
      setIsIngesting(false);
    }
  };

  const handleLoadSampleBatch = () => {
    const sample =
      market === 'IE'
        ? 'https://www.daft.ie/for-sale/detached-house-15-ballybrack-road-dalkey-co-dublin/5931044\nhttps://www.myhome.ie/residential/brochure/22-temple-road-rathmines-dublin-6/4918820'
        : 'https://www.rightmove.co.uk/properties/151290441/19-flask-walk-hampstead-nw3\nhttps://www.zoopla.co.uk/for-sale/details/68123991/44-elgin-crescent-notting-hill-w11';
    setUrlInput(sample);
    setIngestFeedback('2 sample URLs staged in box — click "Ingest Listing(s)" to parse both.');
  };

  // Use primary baseline property (or Property A) for Capital Stack visualization
  const baselineEval: EvaluatedProperty =
    evaluation.evaluated.find((e) => e.property.code === 'Property A') ?? evaluation.evaluated[0];
  const baselineAsking = baselineEval?.property.askingPrice ?? 1_450_000;
  const baselineStamp = baselineEval?.stampDuty ?? calculateStampDuty(baselineAsking, market);
  const legalAndContingency = 7_500 + budget.emergencyContingency;
  const allocatedCapital = baselineAsking + baselineStamp + budget.renovationBuffer + legalAndContingency;
  const unassignedBuffer = budget.totalLandedCostCeiling - allocatedCapital;
  const purchaseHeadroom = budget.targetPurchaseMax - baselineAsking;

  const pct = (val: number) => Math.max(2, Math.min(100, (val / Math.max(1, budget.totalLandedCostCeiling)) * 100));

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-8 pb-32">
      {/* Breadcrumb & Live Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
          <span>Portfolio Workspace</span>
          <span className="text-slate-300">/</span>
          <span>Residential Acquisitions</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold">{household.modelCode}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
          <span className="material-symbols-filled text-[14px]">sync</span>
          Live Synchronized
        </span>
      </div>

      {/* Hero Title */}
      <div className="border-b border-slate-200 pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Phase 01 // Baseline Configuration
          </span>
          <h1 className="font-editorial text-3xl sm:text-5xl font-medium tracking-tight text-slate-900 mt-1">
            {household.portfolioTitle}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl">
            Comparing {properties.length} candidate properties against your capital allocations &amp; lifestyle anchors.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white p-3.5 border border-slate-200 rounded-md self-start md:self-auto">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Active Model Staging
            </p>
            <p className="text-[13px] font-bold text-slate-900">
              {properties.length} Asset Matrix Loaded
            </p>
          </div>
          <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-900">
            <span className="material-symbols-outlined text-[22px]">domain</span>
          </div>
        </div>
      </div>

      {/* Property Ingestion Console */}
      <section className="mb-10">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">input</span>
              Property Ingestion Console
            </h2>
            <p className="text-xs text-slate-600">
              Paste 2+ listing URLs (Daft.ie, MyHome.ie, Rightmove, Zoopla) separated by line breaks or commas for automated extraction.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={replaceShortlist}
                onChange={(e) => setReplaceShortlist(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span>Replace existing shortlist</span>
            </label>
            <button
              type="button"
              onClick={handleLoadSampleBatch}
              className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded transition-colors"
            >
              + Load 2 Sample URLs
            </button>
            <button
              type="button"
              onClick={onResetDefaults}
              className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded transition-colors"
              title="Reset properties and budget back to preset defaults"
            >
              Reset Defaults
            </button>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded uppercase tracking-wider">
              {properties.length} Properties Staged
            </span>
          </div>
        </div>

        {/* Multi-URL Input Bar */}
        <form
          onSubmit={handleIngest}
          className="bg-white border border-slate-200 p-2.5 rounded-md shadow-xs mb-3 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
        >
          <div className="relative flex-1 w-full flex items-start">
            <div className="pl-3 pt-2.5 flex items-center pointer-events-none text-slate-500">
              <span className="material-symbols-outlined text-[20px]">link</span>
            </div>
            <textarea
              rows={2}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste 2+ property URLs (one per line): https://www.daft.ie/... , https://www.myhome.ie/..."
              className="w-full pl-3 pr-4 py-2 text-xs sm:text-sm border-0 focus:ring-0 focus:outline-none text-slate-900 placeholder:text-slate-400 bg-transparent resize-y font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isIngesting}
            className="w-full sm:w-auto px-5 py-3 bg-slate-900 text-white text-[13px] font-semibold rounded hover:bg-slate-800 disabled:opacity-60 flex items-center justify-center gap-2 shrink-0 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isIngesting ? 'progress_activity' : 'add_circle'}
            </span>
            <span>{isIngesting ? 'Extracting...' : 'Ingest Listing(s)'}</span>
          </button>
        </form>

        {ingestFeedback && (
          <div className="mb-5 px-3 py-2 rounded bg-slate-100 border border-slate-200 text-xs text-slate-800 flex items-center justify-between">
            <span>{ingestFeedback}</span>
            <button
              type="button"
              onClick={() => setIngestFeedback(null)}
              className="text-slate-500 hover:text-slate-900 font-semibold ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Side-by-Side Ingested Property Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {evaluation.evaluated.map((item) => {
            const { property, purchaseCeilingDelta, pricePerSqft } = item;
            const overPurchaseCap = purchaseCeilingDelta > 0;
            return (
              <article
                key={property.id}
                className="bg-white border border-slate-200 rounded-md hover:border-slate-400 transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <PropertyPhoto
                      imageUrl={property.imageUrl}
                      alt={property.name}
                      portal={property.sourcePortal}
                      postcode={property.postcode}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/85 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wider">
                        {property.code}
                      </span>
                    </div>
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                        <span className="material-symbols-filled text-[12px]">check_circle</span>
                        Ready
                      </span>
                      {properties.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemoveProperty(property.id)}
                          className="w-6 h-6 rounded bg-white/90 text-slate-700 hover:text-rose-700 flex items-center justify-center border border-slate-200"
                          title={`Remove ${property.name}`}
                          aria-label={`Remove ${property.name}`}
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      )}
                    </div>
                    <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur px-2.5 py-1 rounded text-slate-900 text-[11px] font-semibold border border-slate-200">
                      Ingested via {property.sourcePortal}
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
                      {property.name}
                    </h3>
                    <p className="text-xs text-slate-600 mb-4">
                      {property.area}, {property.postcode}
                    </p>

                    <div className="flex items-baseline justify-between border-b border-slate-200 pb-3 mb-3">
                      <span className="text-xs text-slate-600">Asking Price</span>
                      <div className="text-right">
                        <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                          {formatCurrency(property.askingPrice, market)}
                        </span>
                        {overPurchaseCap && (
                          <span className="block text-[10px] font-bold text-rose-700">
                            +{formatCurrency(purchaseCeilingDelta, market, true)} ceiling delta
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Specs Pill Array */}
                    <div className="grid grid-cols-3 gap-2 py-1 mb-4 text-center">
                      <div className="bg-slate-50 border border-slate-200/70 p-2 rounded">
                        <span className="block text-slate-500 text-[10px] font-semibold uppercase">
                          Bedrooms
                        </span>
                        <span className="text-xs font-bold text-slate-900">{property.bedrooms} Bed</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200/70 p-2 rounded">
                        <span className="block text-slate-500 text-[10px] font-semibold uppercase">
                          Bathrooms
                        </span>
                        <span className="text-xs font-bold text-slate-900">{property.bathrooms} Bath</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200/70 p-2 rounded">
                        <span className="block text-slate-500 text-[10px] font-semibold uppercase">
                          Internal
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {property.sqft.toLocaleString()} sqft
                        </span>
                      </div>
                    </div>

                    {/* Status Telemetry Chips */}
                    <div className="space-y-1.5 pt-1 text-xs text-slate-600">
                      <div className="flex items-center justify-between py-1 border-t border-slate-100">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>
                          Floor plans extracted
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700">100% Vectorized</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-t border-slate-100">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>
                          {market === 'IE' ? 'BER certificate loaded' : 'EPC certificate loaded'}
                        </span>
                        <span className="text-[10px] font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-900">
                          {property.energyRating}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-t border-slate-100">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>
                          Title deed boundary mapped
                        </span>
                        <span className="text-[10px] font-semibold text-slate-900">{property.tenure}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-xs text-slate-600 font-mono">
                    {currencySymbol}{pricePerSqft.toLocaleString()} / sqft
                  </span>
                  <button
                    type="button"
                    onClick={() => onInspectProperty(property.id)}
                    className="text-xs text-slate-900 font-semibold hover:underline flex items-center gap-1"
                  >
                    Inspect Data <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Dual-Budget Architecture Panel (8 Cols) & Household Profile (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-8 bg-white border border-slate-200 rounded-md p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-slate-900">
                  account_balance_wallet
                </span>
                <h2 className="text-lg font-semibold text-slate-900">
                  Dual-Budget Architecture Panel
                </h2>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Rigorous separation between acquisition ceiling and fully loaded capitalization reserves (stamp duty + works).
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-800 text-[11px] font-semibold rounded border border-slate-200 self-start">
              <span className="material-symbols-outlined text-[15px]">lock</span>
              {taxLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Purchase Price Max Ceiling */}
            <div className="bg-slate-50 p-5 rounded border border-slate-200">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Target Acquisition Max
                </span>
                <span
                  className={`text-xs font-semibold ${
                    purchaseHeadroom >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  Headroom: {purchaseHeadroom >= 0 ? '+' : ''}
                  {formatCurrency(purchaseHeadroom, market)}
                </span>
              </div>
              <div className="flex items-center justify-between mb-4 gap-2">
                <span className="font-editorial text-2xl font-bold text-slate-900 tabular-nums">
                  {formatCurrency(budget.targetPurchaseMax, market)}
                </span>
                <div className="flex items-center bg-white border border-slate-300 rounded px-2.5 py-1">
                  <span className="text-xs text-slate-500 mr-1.5">{currencyCode}</span>
                  <input
                    aria-label="Target Acquisition Max"
                    type="text"
                    value={purchaseInputStr ?? budget.targetPurchaseMax.toLocaleString('en-GB')}
                    onFocus={() => setPurchaseInputStr(String(budget.targetPurchaseMax))}
                    onChange={(e) => {
                      setPurchaseInputStr(e.target.value);
                      const cleaned = Number(e.target.value.replace(/[^0-9]/g, ''));
                      if (cleaned >= 500000 && cleaned <= 5000000) {
                        onUpdateBudget({ targetPurchaseMax: cleaned });
                      }
                    }}
                    onBlur={() => setPurchaseInputStr(null)}
                    className="w-24 text-right font-semibold text-sm text-slate-900 border-0 p-0 focus:ring-0 focus:outline-none font-mono"
                  />
                </div>
              </div>
              <input
                aria-label="Target Acquisition Max Slider"
                type="range"
                min={800000}
                max={2500000}
                step={25000}
                value={budget.targetPurchaseMax}
                onChange={(e) => onUpdateBudget({ targetPurchaseMax: Number(e.target.value) })}
                className="w-full nv-range"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1.5 font-medium">
                <span>{currencySymbol}0.8M</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(budget.targetPurchaseMax, market, true)} Anchor
                </span>
                <span>{currencySymbol}2.5M</span>
              </div>
            </div>

            {/* Total Landed Cost Ceiling */}
            <div className="bg-slate-50 p-5 rounded border border-slate-200">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Total Landed Cost Ceiling
                </span>
                <span className="text-xs font-semibold text-slate-700">All-Inclusive Cap</span>
              </div>
              <div className="flex items-center justify-between mb-4 gap-2">
                <span className="font-editorial text-2xl font-bold text-slate-900 tabular-nums">
                  {formatCurrency(budget.totalLandedCostCeiling, market)}
                </span>
                <div className="flex items-center bg-white border border-slate-300 rounded px-2.5 py-1">
                  <span className="text-xs text-slate-500 mr-1.5">{currencyCode}</span>
                  <input
                    aria-label="Total Landed Cost Ceiling"
                    type="text"
                    value={landedInputStr ?? budget.totalLandedCostCeiling.toLocaleString('en-GB')}
                    onFocus={() => setLandedInputStr(String(budget.totalLandedCostCeiling))}
                    onChange={(e) => {
                      setLandedInputStr(e.target.value);
                      const cleaned = Number(e.target.value.replace(/[^0-9]/g, ''));
                      if (cleaned >= 600000 && cleaned <= 6000000) {
                        onUpdateBudget({ totalLandedCostCeiling: cleaned });
                      }
                    }}
                    onBlur={() => setLandedInputStr(null)}
                    className="w-24 text-right font-semibold text-sm text-slate-900 border-0 p-0 focus:ring-0 focus:outline-none font-mono"
                  />
                </div>
              </div>
              <input
                aria-label="Total Landed Cost Ceiling Slider"
                type="range"
                min={1000000}
                max={3000000}
                step={25000}
                value={budget.totalLandedCostCeiling}
                onChange={(e) => onUpdateBudget({ totalLandedCostCeiling: Number(e.target.value) })}
                className="w-full nv-range"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1.5 font-medium">
                <span>{currencySymbol}1.0M</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(budget.totalLandedCostCeiling, market, true)} Max Landed
                </span>
                <span>{currencySymbol}3.0M</span>
              </div>
            </div>
          </div>

          {/* Capital Stack Allocation Visualization */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                Capital Stack Allocation Visualization ({baselineEval?.property.code ?? 'Baseline'})
              </span>
              <span
                className={`text-[11px] font-bold ${
                  unassignedBuffer >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                Allocated: {formatCurrency(allocatedCapital, market)} /{' '}
                {formatCurrency(budget.totalLandedCostCeiling, market)} (
                {unassignedBuffer >= 0
                  ? `${formatCurrency(unassignedBuffer, market)} Unassigned Buffer`
                  : `${formatCurrency(Math.abs(unassignedBuffer), market)} Overrun`}
                )
              </span>
            </div>

            <div className="h-6 w-full bg-slate-200 rounded overflow-hidden flex">
              <div
                className="bg-slate-900 transition-all"
                style={{ width: `${pct(baselineAsking)}%` }}
                title={`Base Asset: ${formatCurrency(baselineAsking, market)}`}
              />
              <div
                className="bg-slate-600 transition-all"
                style={{ width: `${pct(baselineStamp)}%` }}
                title={`Stamp Duty: ${formatCurrency(baselineStamp, market)}`}
              />
              <div
                className="bg-emerald-600 transition-all"
                style={{ width: `${pct(budget.renovationBuffer)}%` }}
                title={`Works Buffer: ${formatCurrency(budget.renovationBuffer, market)}`}
              />
              <div
                className="bg-slate-400 transition-all"
                style={{ width: `${pct(legalAndContingency)}%` }}
                title={`Legal & Contingency: ${formatCurrency(legalAndContingency, market)}`}
              />
              {unassignedBuffer > 0 && (
                <div
                  className="bg-emerald-200 border-l border-white transition-all"
                  style={{ width: `${pct(unassignedBuffer)}%` }}
                  title={`Buffer Headroom: ${formatCurrency(unassignedBuffer, market)}`}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-slate-900 rounded-xs" /> Asset Cost ({formatCurrency(baselineAsking, market, true)})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-slate-600 rounded-xs" /> Stamp Duty ({formatCurrency(baselineStamp, market, true)})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-emerald-600 rounded-xs" /> Works Buffer ({formatCurrency(budget.renovationBuffer, market, true)})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-slate-400 rounded-xs" /> Legal &amp; Contingency ({formatCurrency(legalAndContingency, market, true)})
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <span className="w-3 h-3 bg-emerald-200 border border-emerald-600 rounded-xs" /> Buffer Headroom ({formatCurrency(unassignedBuffer, market, true)})
              </span>
            </div>

            {/* Detailed Cost Breakdown Grid (with live Renovation & Contingency Steppers) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-[11px] text-slate-500 font-semibold block">
                  Stamp Duty ({market})
                </span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {formatCurrency(baselineStamp, market)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Primary residence rate</span>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-[11px] text-slate-500 font-semibold block">
                  Legal &amp; Survey Fees
                </span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {formatCurrency(7500, market)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Structural + conveyancing</span>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-semibold">Works Buffer</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateBudget({ renovationBuffer: Math.max(0, budget.renovationBuffer - 10000) })
                      }
                      className="w-4 h-4 rounded bg-white border border-slate-300 text-[10px] font-bold leading-none"
                      aria-label="Decrease renovation buffer"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateBudget({ renovationBuffer: budget.renovationBuffer + 10000 })}
                      className="w-4 h-4 rounded bg-white border border-slate-300 text-[10px] font-bold leading-none"
                      aria-label="Increase renovation buffer"
                    >
                      +
                    </button>
                  </div>
                </div>
                <span className="text-base font-bold font-mono text-slate-900">
                  {formatCurrency(budget.renovationBuffer, market)}
                </span>
                <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
                  Kitchen / BER upgrades
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-semibold">Contingency</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateBudget({ emergencyContingency: Math.max(0, budget.emergencyContingency - 5000) })
                      }
                      className="w-4 h-4 rounded bg-white border border-slate-300 text-[10px] font-bold leading-none"
                      aria-label="Decrease contingency"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateBudget({ emergencyContingency: budget.emergencyContingency + 5000 })
                      }
                      className="w-4 h-4 rounded bg-white border border-slate-300 text-[10px] font-bold leading-none"
                      aria-label="Increase contingency"
                    >
                      +
                    </button>
                  </div>
                </div>
                <span className="text-base font-bold font-mono text-slate-900">
                  {formatCurrency(budget.emergencyContingency, market)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Unforeseen roof / survey</span>
              </div>
            </div>
          </div>
        </section>

        {/* Household & Lifestyle Anchors (4 Cols) */}
        <section className="lg:col-span-4 bg-white border border-slate-200 rounded-md p-6 lg:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
              <span className="material-symbols-outlined text-[22px] text-slate-900">
                family_restroom
              </span>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Household &amp; Lifestyle Anchors
                </h2>
                <p className="text-xs text-slate-600">Constituent profile &amp; transit radii</p>
              </div>
            </div>

            <div className="mt-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
                Household Setup (Active Occupants)
              </span>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px] text-slate-800">person</span>
                    <span className="text-sm font-medium text-slate-900">{household.adults}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded">
                    {household.adultsTag}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px] text-slate-800">child_care</span>
                    <div>
                      <span className="text-sm font-medium text-slate-900 block">{household.children}</span>
                      <span className="text-[11px] text-emerald-700 font-medium">{household.childrenNote}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    {household.childrenTag}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px] text-slate-800">pets</span>
                    <span className="text-sm font-medium text-slate-900">{household.pets}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded">
                    {household.petsTag}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
                Transit &amp; Catchment Anchors
              </span>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded">
                  <div className="p-1.5 rounded bg-slate-900 text-white mt-0.5">
                    <span className="material-symbols-outlined text-[16px]">directions_subway</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">Primary Commute</span>
                      <span className="text-[11px] font-bold text-emerald-700">
                        &lt; {household.primaryCommuteMaxMins} mins
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{household.primaryCommuteTarget}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded">
                  <div className="p-1.5 rounded bg-slate-200 text-slate-900 mt-0.5">
                    <span className="material-symbols-outlined text-[16px]">train</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">Secondary Commute</span>
                      <span className="text-[11px] text-slate-600">{household.secondaryCommuteFreq}</span>
                    </div>
                    <p className="text-xs text-slate-600">{household.secondaryCommuteTarget}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded">
                  <div className="p-1.5 rounded bg-emerald-100 text-emerald-800 mt-0.5">
                    <span className="material-symbols-filled text-[16px]">school</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900">Priority Catchment</span>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                        {household.priorityCatchmentLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{household.priorityCatchmentNote}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onEditHousehold}
            className="w-full mt-6 py-2.5 px-3 border border-slate-200 text-slate-900 text-xs font-semibold rounded hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit Household Parameters
          </button>
        </section>
      </div>

      {/* Sticky Footer CTA Bar */}
      <aside className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 sm:px-6 lg:px-12 z-40 shadow-lg">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
            <span className="text-sm font-bold text-slate-900">
              {properties.length} Properties Staged • Budgets Calibrated
            </span>
            <span className="hidden lg:inline text-xs text-slate-600">{registryFootnote}</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onSaveDraft}
              className="hidden sm:inline-flex px-4 py-2 text-slate-800 text-xs font-semibold border border-slate-200 rounded hover:bg-slate-50 transition-colors"
            >
              Save Draft &amp; Pause
            </button>
            <button
              type="button"
              onClick={onProceed}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Proceed to Calibration Matrix</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
