import React from 'react';
import type { MarketMode, StepId } from '../types/property.ts';
import { AuthButton } from '../auth/AuthButton.tsx';

interface TopNavBarProps {
  activeStep: StepId;
  onSelectStep: (step: StepId) => void;
  market: MarketMode;
  onSwitchMarket: (market: MarketMode) => void;
  portfolioTitle: string;
  alertCount: number;
  savedAtLabel: string | null;
  onOpenTune: () => void;
  onOpenAlerts: () => void;
  onShare: () => void;
  onOpenExport: () => void;
  onSaveProject: () => void;
}

const STEPS: { id: StepId; label: string }[] = [
  { id: 1, label: '1. Ingestion & Budget' },
  { id: 2, label: '2. Calibration Matrix' },
  { id: 3, label: '3. Comparison & Reveal' },
  { id: 4, label: '4. Executive Verdict' },
];

export const TopNavBar: React.FC<TopNavBarProps> = ({
  activeStep,
  onSelectStep,
  market,
  onSwitchMarket,
  portfolioTitle,
  alertCount,
  savedAtLabel,
  onOpenTune,
  onOpenAlerts,
  onShare,
  onOpenExport,
  onSaveProject,
}) => {
  return (
    <header className="bg-white border-b border-[#e2e8f0] sticky top-0 z-50">
      <div className="flex justify-between items-center w-full px-4 sm:px-6 lg:px-8 h-16 max-w-[1440px] mx-auto gap-4">
        {/* Brand & Market Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onSelectStep(1)}
            className="font-editorial text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 shrink-0 whitespace-nowrap"
          >
            <span className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-sans text-sm font-bold shrink-0">
              N
            </span>
            <span>NestVerdict</span>
          </button>

          <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-slate-200 shrink-0">
            <div className="inline-flex rounded border border-slate-200 bg-slate-50 p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => onSwitchMarket('IE')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors whitespace-nowrap ${
                  market === 'IE'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to South Dublin & Wicklow Daft.ie / MyHome.ie portfolio"
              >
                IE • €
              </button>
              <button
                type="button"
                onClick={() => onSwitchMarket('UK')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors whitespace-nowrap ${
                  market === 'UK'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to North London Stitch reference portfolio"
              >
                UK • £
              </button>
            </div>
            <span className="hidden 2xl:inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 truncate max-w-[160px] ml-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              <span className="truncate">{portfolioTitle}</span>
            </span>
          </div>
        </div>

        {/* 4-Step Linear Navigation */}
        <nav className="hidden xl:flex items-center gap-5 2xl:gap-7 shrink-0" aria-label="Decision steps">
          {STEPS.map((step) => {
            const isActive = activeStep === step.id;
            const isCompleted = step.id < activeStep;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onSelectStep(step.id)}
                className={`pb-1 text-[13px] font-semibold flex items-center gap-1.5 transition-colors border-b-2 whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {isCompleted && (
                  <span className="material-symbols-filled text-[15px] text-emerald-600">
                    check_circle
                  </span>
                )}
                {!isCompleted && isActive && (
                  <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                    {step.id}
                  </span>
                )}
                <span>{step.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Trailing Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="xl:hidden inline-flex rounded border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => onSwitchMarket('IE')}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                market === 'IE' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              IE
            </button>
            <button
              type="button"
              onClick={() => onSwitchMarket('UK')}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                market === 'UK' ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              UK
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-0.5 border-r border-slate-200 pr-2 mr-1">
            <button
              type="button"
              onClick={onOpenTune}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
              title="Edit Household & Budget Parameters"
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </button>
            <button
              type="button"
              onClick={onOpenAlerts}
              className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
              title="Deterministic Rule Alerts"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {alertCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-600" />
              )}
            </button>
            <button
              type="button"
              onClick={onShare}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
              title="Copy Shareable Verdict Link"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenExport}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white text-slate-900 text-xs font-semibold rounded hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export Dossier</span>
          </button>

          <AuthButton />

          <button
            type="button"
            onClick={onSaveProject}
            className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            title={savedAtLabel ? `Last saved ${savedAtLabel}` : 'Save model state locally'}
          >
            <span className="material-symbols-outlined text-[15px]">bookmark</span>
            <span>{savedAtLabel ? 'Saved' : 'Save Project'}</span>
          </button>

          <div className="hidden sm:block w-8 h-8 rounded-full border border-slate-200 overflow-hidden ml-1 shrink-0">
            <img
              src="/images/advisor-avatar.jpg"
              alt="Advisor profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Stepper Bar */}
      <div className="flex xl:hidden border-t border-slate-100 bg-slate-50 px-3 sm:px-6 py-1.5 gap-2 overflow-x-auto">
        {STEPS.map((step) => {
          const isActive = activeStep === step.id;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelectStep(step.id)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap transition-colors ${
                isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white'
              }`}
            >
              {step.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
