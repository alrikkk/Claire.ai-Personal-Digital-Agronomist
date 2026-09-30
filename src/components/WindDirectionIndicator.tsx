import React, { useState } from 'react';
import { Compass, Wind, ShieldAlert, CheckCircle2, AlertTriangle, ArrowUp, Navigation2, RefreshCw } from 'lucide-react';
import { parseWindData, WindInfo } from '../utils/windUtils';

interface WindDirectionIndicatorProps {
  windSpeed: number;
  windDirection?: number;
  windGusts?: number;
  cityName?: string;
  size?: 'compact' | 'standard' | 'mini';
  showDetails?: boolean;
  className?: string;
}

export default function WindDirectionIndicator({
  windSpeed,
  windDirection,
  windGusts,
  cityName = '',
  size = 'standard',
  showDetails = true,
  className = '',
}: WindDirectionIndicatorProps) {
  // Allow user to test dynamic wind shifts in UI
  const [simulatedAngleOffset, setSimulatedAngleOffset] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [indicatorMode, setIndicatorMode] = useState<'meteorological' | 'vector'>('meteorological');

  const baseWindInfo: WindInfo = parseWindData(windSpeed, windDirection, windGusts, cityName);

  // If simulation is active, apply offset
  const activeAngle = ((baseWindInfo.directionDegrees + simulatedAngleOffset) % 360 + 360) % 360;
  const windInfo: WindInfo = isSimulating
    ? parseWindData(windSpeed, activeAngle, windGusts, cityName)
    : baseWindInfo;

  // Meteorological wind direction: angle from which wind is coming (0° = North wind blowing South)
  // Vector mode: direction wind is heading towards (180° opposite)
  const rotationAngle = indicatorMode === 'meteorological' 
    ? windInfo.directionDegrees 
    : (windInfo.directionDegrees + 180) % 360;

  // Mini version (for table headers / compact cards)
  if (size === 'mini') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 border border-sky-100 text-sky-800 ${className}`} title={`Wind from ${windInfo.directionDegrees}° ${windInfo.compassPoint} at ${windInfo.speedKmH} km/h`}>
        <div 
          className="w-3.5 h-3.5 flex items-center justify-center transition-transform duration-700 ease-out shrink-0 text-sky-600"
          style={{ transform: `rotate(${rotationAngle}deg)` }}
        >
          <Navigation2 className="w-3 h-3 fill-sky-500" />
        </div>
        <span className="font-bold text-[11px]">{windInfo.compassPoint}</span>
        <span className="text-[10px] text-sky-600/80 font-mono">{windInfo.directionDegrees}°</span>
      </div>
    );
  }

  // Compact version (for Side-by-Side comparison cards)
  if (size === 'compact') {
    return (
      <div className={`flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 ${className}`}>
        {/* Compact Rotating Compass */}
        <div className="relative w-12 h-12 shrink-0 flex items-center justify-center bg-white rounded-full border border-sky-100 shadow-inner">
          {/* Compass cardinal dots */}
          <span className="absolute top-1 text-[8px] font-bold text-rose-500">N</span>
          <span className="absolute right-1 text-[7px] font-semibold text-slate-400">E</span>
          <span className="absolute bottom-1 text-[7px] font-semibold text-slate-400">S</span>
          <span className="absolute left-1 text-[7px] font-semibold text-slate-400">W</span>

          {/* Rotating Arrow Needle */}
          <div 
            className="w-8 h-8 flex items-center justify-center transition-transform duration-700 ease-out"
            style={{ transform: `rotate(${rotationAngle}deg)` }}
          >
            <div className="relative flex flex-col items-center">
              {/* Arrow Head */}
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[9px] border-b-sky-500 drop-shadow-sm" />
              {/* Center Pin */}
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700 my-0.5 border border-white" />
              {/* Tail fin */}
              <div className="w-1 h-2 bg-slate-300 rounded-b-sm" />
            </div>
          </div>
        </div>

        {/* Text telemetry */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-800">{windInfo.compassPoint} ({windInfo.directionDegrees}°)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-700 font-medium">
              {windInfo.beaufortScale}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 truncate mt-0.5">
            Speed: <span className="font-semibold text-slate-700">{windInfo.speedKmH} km/h</span> • Gusts: <span className="text-slate-600">{windInfo.gustsKmH} km/h</span>
          </p>
        </div>
      </div>
    );
  }

  // Standard full-fidelity version (for Bento Wind Card)
  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Upper readout & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-sky-50 rounded-lg text-sky-600">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              Live Wind Direction & Vector
              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded-md font-semibold border border-sky-100/80">
                REAL-TIME
              </span>
            </h4>
            <p className="text-[10px] text-slate-400 font-sans">
              Dynamic aerodynamic vane with 16-point azimuth resolution
            </p>
          </div>
        </div>

        {/* Mode & Simulation Toggle */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIndicatorMode(m => m === 'meteorological' ? 'vector' : 'meteorological')}
            className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors cursor-pointer flex items-center gap-1"
            title={indicatorMode === 'meteorological' ? 'Showing Origin (From)' : 'Showing Destination (Flow Vector)'}
          >
            {indicatorMode === 'meteorological' ? 'From Origin' : 'Flow Vector'}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSimulating(prev => !prev);
              if (!isSimulating) {
                setSimulatedAngleOffset(prev => (prev + 45) % 360);
              } else {
                setSimulatedAngleOffset(0);
              }
            }}
            className={`p-1 rounded-lg border text-xs transition-colors cursor-pointer flex items-center gap-1 ${
              isSimulating
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
            title="Simulate dynamic wind vane shift"
          >
            <RefreshCw className={`w-3 h-3 ${isSimulating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Visual Display: Dial + Core Telemetry */}
      <div className="flex flex-col sm:flex-row items-center gap-5 bg-gradient-to-br from-slate-50/70 via-sky-50/30 to-slate-50/40 p-4 rounded-2xl border border-sky-100/60">
        {/* Compass Rose Dial */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center select-none">
          {/* Animated breeze pulse rings (pulses faster with higher wind speed) */}
          <div 
            className="absolute inset-0 rounded-full border border-sky-200/50 animate-ping pointer-events-none"
            style={{ 
              animationDuration: `${Math.max(1.2, 4 - (windInfo.speedKmH / 15))}s`,
              opacity: Math.min(0.7, 0.2 + (windInfo.speedKmH / 50))
            }}
          />

          {/* Outer Compass Bezel */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white to-slate-100 border-2 border-slate-200 shadow-md flex items-center justify-center">
            {/* SVG Tick Marks & Ring */}
            <svg className="absolute inset-0 w-full h-full p-1" viewBox="0 0 100 100">
              {/* Outer dial ring */}
              <circle cx="50" cy="50" r="46" fill="none" stroke="#E2E8F0" strokeWidth="1" />
              <circle cx="50" cy="50" r="39" fill="none" stroke="#F1F5F9" strokeWidth="0.75" />

              {/* Major and Minor Ticks around 360 degrees */}
              {Array.from({ length: 36 }).map((_, i) => {
                const angle = i * 10;
                const isCardinal = angle % 90 === 0;
                const isIntercardinal = angle % 45 === 0 && !isCardinal;
                const tickLength = isCardinal ? 6 : isIntercardinal ? 4 : 2.5;
                const strokeColor = isCardinal ? '#64748B' : isIntercardinal ? '#94A3B8' : '#CBD5E1';
                const strokeW = isCardinal ? 1.5 : 0.8;

                const rad = (angle - 90) * (Math.PI / 180);
                const x1 = 50 + 44 * Math.cos(rad);
                const y1 = 50 + 44 * Math.sin(rad);
                const x2 = 50 + (44 - tickLength) * Math.cos(rad);
                const y2 = 50 + (44 - tickLength) * Math.sin(rad);

                return (
                  <line
                    key={angle}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={strokeColor}
                    strokeWidth={strokeW}
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Dynamic Arc showing wind direction quadrant */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#0EA5E9"
                strokeWidth="1.5"
                strokeDasharray="16 260"
                transform={`rotate(${rotationAngle - 8} 50 50)`}
                className="opacity-70 transition-transform duration-700 ease-out"
              />
            </svg>

            {/* Cardinal Labels */}
            <div className="absolute top-2 flex flex-col items-center">
              <span className="text-[11px] font-black text-rose-600 leading-none">N</span>
              <div className="w-1 h-1 rounded-full bg-rose-500 mt-0.5" />
            </div>
            <div className="absolute right-2.5 flex items-center">
              <span className="text-[10px] font-bold text-slate-500 leading-none">E</span>
            </div>
            <div className="absolute bottom-2 flex flex-col items-center">
              <div className="w-1 h-1 rounded-full bg-slate-400 mb-0.5" />
              <span className="text-[10px] font-bold text-slate-500 leading-none">S</span>
            </div>
            <div className="absolute left-2.5 flex items-center">
              <span className="text-[10px] font-bold text-slate-500 leading-none">W</span>
            </div>

            {/* Intercardinal Labels (subtle) */}
            <span className="absolute top-5 right-5 text-[8px] font-semibold text-slate-400">NE</span>
            <span className="absolute bottom-5 right-5 text-[8px] font-semibold text-slate-400">SE</span>
            <span className="absolute bottom-5 left-5 text-[8px] font-semibold text-slate-400">SW</span>
            <span className="absolute top-5 left-5 text-[8px] font-semibold text-slate-400">NW</span>

            {/* High-Fidelity Rotating Aerodynamic Needle */}
            <div
              className="absolute w-full h-full flex items-center justify-center transition-transform duration-700 ease-out z-10 pointer-events-none"
              style={{ transform: `rotate(${rotationAngle}deg)` }}
            >
              <div className="relative w-10 h-28 flex flex-col items-center justify-between">
                {/* Needle Head (Points into wind / vector) */}
                <div className="flex flex-col items-center drop-shadow-md">
                  {/* Triangular Arrowhead */}
                  <svg width="22" height="34" viewBox="0 0 22 34" fill="none">
                    <defs>
                      <linearGradient id="needleHeadGrad" x1="0" y1="0" x2="22" y2="34" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#38BDF8" />
                        <stop offset="0.5" stopColor="#0284C7" />
                        <stop offset="1" stopColor="#0369A1" />
                      </linearGradient>
                      <linearGradient id="needleFacetGrad" x1="11" y1="0" x2="22" y2="34" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#0284C7" />
                        <stop offset="1" stopColor="#075985" />
                      </linearGradient>
                    </defs>
                    {/* Left half arrowhead */}
                    <path d="M11 0 L0 34 L11 26 Z" fill="url(#needleHeadGrad)" />
                    {/* Right half arrowhead (faceted lighting) */}
                    <path d="M11 0 L22 34 L11 26 Z" fill="url(#needleFacetGrad)" />
                    {/* Top tip highlight */}
                    <polygon points="11,0 8,12 11,9 14,12" fill="#BAE6FD" />
                  </svg>
                </div>

                {/* Center Hub & Axis */}
                <div className="w-5 h-5 rounded-full bg-gradient-to-b from-white to-slate-200 border-2 border-slate-600 shadow flex items-center justify-center z-20">
                  <div className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
                </div>

                {/* Counterweight Tail Fins */}
                <div className="flex flex-col items-center drop-shadow-sm">
                  <svg width="18" height="24" viewBox="0 0 18 24" fill="none">
                    {/* Aerodynamic tail feathers */}
                    <path d="M9 0 L1 24 L9 18 L17 24 Z" fill="#94A3B8" />
                    <line x1="9" y1="0" x2="9" y2="18" stroke="#64748B" strokeWidth="1" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Inner Center Degree Display Badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0">
              <span className="text-[10px] font-mono font-bold text-slate-800">{windInfo.directionDegrees}°</span>
            </div>
          </div>
        </div>

        {/* Readout Telemetry & Microclimate Insight */}
        <div className="flex-1 space-y-2.5 min-w-0">
          <div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {windInfo.compassPoint}
              </span>
              <span className="text-base font-bold text-sky-600 font-mono">
                {windInfo.directionDegrees}°
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({windInfo.compassName})
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-1 font-sans flex items-center gap-1.5 flex-wrap">
              <span>Origin: <strong className="text-slate-800 font-semibold">{windInfo.compassPoint}</strong></span>
              <span className="text-slate-300">•</span>
              <span>Flows towards: <strong className="text-slate-800 font-semibold">{windInfo.oppositePoint}</strong></span>
            </p>
          </div>

          {/* Velocity & Beaufort stats */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-sky-100/70">
            <div className="bg-white/90 p-2 rounded-xl border border-sky-50 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Canopy Velocity</span>
              <span className="font-extrabold text-slate-800 text-sm">{windInfo.speedKmH} km/h</span>
              <span className="text-[10px] text-sky-600 block font-medium">{windInfo.beaufortScale}</span>
            </div>
            <div className="bg-white/90 p-2 rounded-xl border border-sky-50 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Peak Wind Gusts</span>
              <span className="font-extrabold text-slate-800 text-sm">{windInfo.gustsKmH} km/h</span>
              <span className="text-[10px] text-slate-500 block font-medium">Sonic Anemometer</span>
            </div>
          </div>

          {/* Interactive Simulation Slider when active */}
          {isSimulating && (
            <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/80 space-y-1 animate-fadeIn">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-amber-800">Dynamic Angle Test:</span>
                <span className="font-mono font-bold text-amber-900">{activeAngle}° ({windInfo.compassPoint})</span>
              </div>
              <input
                type="range"
                min="0"
                max="359"
                value={activeAngle}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setSimulatedAngleOffset(val - baseWindInfo.directionDegrees);
                }}
                className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
            </div>
          )}
        </div>
      </div>

      {/* Agronomic Spray Drift Alert Pill */}
      {showDetails && (
        <div 
          className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs transition-colors ${
            windInfo.spraySafety === 'ideal'
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : windInfo.spraySafety === 'caution'
                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                : 'bg-rose-50/70 border-rose-200 text-rose-900'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {windInfo.spraySafety === 'ideal' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : windInfo.spraySafety === 'caution' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            )}
          </div>
          <div className="space-y-0.5 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-bold text-[11px] uppercase tracking-wider">
                {windInfo.sprayStatusLabel}
              </span>
              <span className="text-[10px] font-mono opacity-80">
                Drift Buffer: {windInfo.speedKmH < 15 ? 'Standard (10m)' : 'Extended (30m+)'}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90 font-sans">
              {windInfo.sprayAdvisory}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
