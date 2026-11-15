import React, { useState } from 'react';
import type { EvaluatedProperty, MarketMode } from '../types/property.ts';
import { formatCurrency } from '../engine/decisionEngine.ts';

interface PropertyMapPanelProps {
  evaluated: EvaluatedProperty[];
  market: MarketMode;
  onInspectProperty: (propertyId: string) => void;
}

export const PropertyMapPanel: React.FC<PropertyMapPanelProps> = ({
  evaluated,
  market,
  onInspectProperty,
}) => {
  const [selectedId, setSelectedId] = useState<string>(evaluated[0]?.property.id ?? '');
  const [showWalkRings, setShowWalkRings] = useState(true);
  const [showTransit, setShowTransit] = useState(true);
  const [showCatchmentZones, setShowCatchmentZones] = useState(true);

  const selected =
    evaluated.find((e) => e.property.id === selectedId) ?? evaluated[0];

  if (!selected) return null;

  const isIE = market === 'IE';

  return (
    <section className="bg-white border border-slate-200 rounded-lg p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">map</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Geospatial Comparison &amp; Hidden Amenity Map
            </h2>
            <p className="text-xs text-slate-600">
              Comparing candidate addresses across unlisted walks, rapid transit corridors, and school catchment radii.
            </p>
          </div>
        </div>

        {/* Map Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowWalkRings((v) => !v)}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors ${
              showWalkRings
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            5 &amp; 10m Walk Radii
          </button>
          <button
            type="button"
            onClick={() => setShowTransit((v) => !v)}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors ${
              showTransit
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            {isIE ? 'DART / Luas Spine' : 'Tube / Rail Links'}
          </button>
          <button
            type="button"
            onClick={() => setShowCatchmentZones((v) => !v)}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors ${
              showCatchmentZones
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            School Catchments
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 8 Columns: Architectural Cartography Canvas */}
        <div className="lg:col-span-8 relative rounded-lg border border-slate-200 bg-[#f1f5f9] overflow-hidden min-h-[380px]">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-full min-h-[380px] block select-none"
            aria-label="Candidate property comparison map"
          >
            {/* Subtle architectural grid */}
            <defs>
              <pattern id="map-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.35" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="#f8fafc" />
            <rect width="100" height="100" fill="url(#map-grid)" />

            {/* Parkland / Coast / Heath Ecological Zones */}
            {isIE ? (
              <>
                {/* Irish Sea Coastline on Right */}
                <path
                  d="M 85 0 C 82 22, 87 48, 84 72 C 81 88, 86 95, 88 100 L 100 100 L 100 0 Z"
                  fill="#dbeafe"
                  opacity="0.7"
                />
                {/* Dodder River & Park Belt */}
                <path
                  d="M 8 54 Q 35 46, 62 58 T 86 42"
                  fill="none"
                  stroke="#a7f3d0"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  opacity="0.85"
                />
                {/* Coastal Cliff Walk & Woodland */}
                <ellipse cx="77" cy="70" rx="10" ry="12" fill="#d1fae5" opacity="0.65" />
                <text x="89" y="52" fontSize="2.4" fill="#3b82f6" fontWeight="600" transform="rotate(90 89 52)">
                  IRISH SEA / CLIFF WALK
                </text>
                <text x="16" y="49" fontSize="2.2" fill="#059669" fontWeight="600">
                  Dodder Greenway Trail
                </text>
              </>
            ) : (
              <>
                {/* Hampstead Heath */}
                <ellipse cx="72" cy="24" rx="16" ry="13" fill="#d1fae5" opacity="0.75" />
                {/* Regent's Park & Canal */}
                <ellipse cx="29" cy="68" rx="14" ry="10" fill="#d1fae5" opacity="0.7" />
                <path
                  d="M 10 56 Q 32 62, 65 55 T 95 60"
                  fill="none"
                  stroke="#93c5fd"
                  strokeWidth="1.6"
                  opacity="0.85"
                />
                <text x="64" y="18" fontSize="2.4" fill="#059669" fontWeight="600">
                  HAMPSTEAD HEATH
                </text>
                <text x="19" y="74" fontSize="2.2" fill="#059669" fontWeight="600">
                  Regent&apos;s Park &amp; Canal Towpath
                </text>
              </>
            )}

            {/* Transit Spine */}
            {showTransit && (
              <g>
                <path
                  d={isIE ? 'M 26 20 L 32 54 L 68 62 L 80 76' : 'M 18 32 L 34 60 L 62 46 L 76 28'}
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="0.75"
                  strokeDasharray="1.8 1.2"
                  opacity="0.65"
                />
                <circle cx={isIE ? 32 : 34} cy={isIE ? 54 : 60} r="1.2" fill="#0f172a" />
                <circle cx={isIE ? 80 : 76} cy={isIE ? 76 : 28} r="1.2" fill="#0f172a" />
                <text x={isIE ? 35 : 53} y={isIE ? 51 : 44} fontSize="2.1" fill="#334155" fontWeight="600">
                  {isIE ? 'Luas / DART Express Spine' : "Direct Line to King's Cross"}
                </text>
              </g>
            )}

            {/* School Catchment Polygons */}
            {showCatchmentZones &&
              evaluated.map((item) => {
                const { mapX, mapY } = item.property.coordinates;
                const isSafe = item.property.catchmentProbability >= 85;
                return (
                  <circle
                    key={`catch-${item.property.id}`}
                    cx={mapX}
                    cy={mapY}
                    r={isSafe ? 12 : 8}
                    fill={isSafe ? 'rgba(5, 150, 105, 0.08)' : 'rgba(217, 119, 6, 0.08)'}
                    stroke={isSafe ? '#059669' : '#d97706'}
                    strokeWidth="0.4"
                    strokeDasharray="1 1"
                  />
                );
              })}

            {/* Walkability Concentric Rings around Selected Property */}
            {showWalkRings && (
              <g>
                <circle
                  cx={selected.property.coordinates.mapX}
                  cy={selected.property.coordinates.mapY}
                  r="8"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="0.45"
                  opacity="0.7"
                />
                <circle
                  cx={selected.property.coordinates.mapX}
                  cy={selected.property.coordinates.mapY}
                  r="15"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="0.35"
                  strokeDasharray="1.2 1.2"
                  opacity="0.5"
                />
              </g>
            )}
          </svg>

          {/* Interactive HTML Pins overlaid accurately on SVG percentage coordinates */}
          {evaluated.map((item) => {
            const isSelected = item.property.id === selected.property.id;
            const letter = item.property.code.replace('Property ', '');
            const pinColor =
              item.verdictRole === 'WINNER'
                ? 'bg-emerald-600 text-white border-emerald-800'
                : item.verdictRole === 'DISQUALIFIED'
                  ? 'bg-rose-600 text-white border-rose-800'
                  : 'bg-slate-900 text-white border-slate-700';

            return (
              <button
                key={item.property.id}
                type="button"
                onClick={() => setSelectedId(item.property.id)}
                style={{
                  left: `${item.property.coordinates.mapX}%`,
                  top: `${item.property.coordinates.mapY}%`,
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-transform ${
                  isSelected ? 'scale-110 z-20' : 'z-10 hover:scale-105'
                }`}
              >
                <div
                  className={`px-2 py-1 rounded shadow-md border text-[11px] font-bold flex items-center gap-1.5 ${pinColor} ${
                    isSelected ? 'ring-4 ring-blue-500/30' : ''
                  }`}
                >
                  <span className="font-mono">{letter}</span>
                  <span className="hidden sm:inline font-medium">
                    {formatCurrency(item.property.askingPrice, market, true)}
                  </span>
                </div>
                <span className="mt-1 px-1.5 py-0.5 rounded bg-white/95 border border-slate-200 text-[10px] font-semibold text-slate-900 shadow-sm whitespace-nowrap">
                  {item.property.name}
                </span>
              </button>
            );
          })}

          {/* Map Legend Bar */}
          <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur border border-slate-200 rounded px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex flex-wrap items-center gap-3 text-slate-600">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Winner
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900" /> Runner-Up
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Disqualified
              </span>
            </div>
            <span className="font-mono text-slate-500">
              Selected GPS: {selected.property.coordinates.lat.toFixed(4)},{' '}
              {selected.property.coordinates.lng.toFixed(4)}
            </span>
          </div>
        </div>

        {/* Right 4 Columns: Parsed Portal & Unlisted Amenity Telemetry */}
        <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-lg p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {selected.property.sourcePortal} • {selected.property.postcode}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {selected.property.name}
                </h3>
                <p className="text-xs text-slate-600">{selected.property.area}</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold font-mono text-slate-900">
                  {selected.compositeScore.toFixed(1)}
                </span>
                <span className="block text-[10px] font-semibold uppercase text-slate-500">
                  Index
                </span>
              </div>
            </div>

            {/* Key Parsed Specs */}
            <div className="grid grid-cols-3 gap-2 my-3 text-center">
              <div className="bg-white border border-slate-200 rounded p-2">
                <span className="block text-[10px] text-slate-500 uppercase">Size</span>
                <span className="text-xs font-bold text-slate-900">{selected.property.sqm} sqm</span>
              </div>
              <div className="bg-white border border-slate-200 rounded p-2">
                <span className="block text-[10px] text-slate-500 uppercase">Energy</span>
                <span className="text-xs font-bold text-slate-900">{selected.property.energyRating}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded p-2">
                <span className="block text-[10px] text-slate-500 uppercase">Quietness</span>
                <span className="text-xs font-bold text-slate-900">{selected.property.ambientNoiseDb} dB</span>
              </div>
            </div>

            {/* Hidden Value Amenities */}
            <div className="mt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-2">
                Unlisted Walks &amp; Hidden Local Value
              </span>
              <ul className="space-y-1.5">
                {selected.property.hiddenAmenities.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-xs text-slate-700 bg-white border border-slate-200 rounded px-2.5 py-1.5"
                  >
                    <span className="material-symbols-outlined text-[15px] text-emerald-600">
                      directions_walk
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 p-3 rounded bg-white border border-slate-200 text-xs text-slate-600">
              <strong className="text-slate-900 block mb-0.5">Transit Telemetry:</strong>
              {selected.property.commuteRoute} ({selected.property.commuteMinutes} min)
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => onInspectProperty(selected.property.id)}
              className="flex-1 py-2 px-3 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800 transition-colors"
            >
              Inspect &amp; Edit Property
            </button>
            <a
              href={selected.property.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="py-2 px-3 border border-slate-200 bg-white text-slate-700 text-xs font-semibold rounded hover:bg-slate-100 transition-colors"
            >
              Source URL ↗
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
