import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceDot
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Sprout,
  Activity,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Droplets,
  Sun,
  ShieldCheck,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Filter
} from 'lucide-react';
import { WeatherData, Project, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface GrowthCycleYieldProjectionChartProps {
  weather: WeatherData | null;
  activeLocation?: string;
  user?: User | null;
  projects?: Project[];
  className?: string;
}

interface HistoricalLogSummary {
  season: string;
  crop: string;
  targetYield: number; // tons/ha
  actualYield: number; // tons/ha
  profit: number;
}

interface GrowthStageDataPoint {
  day: number;
  stageName: string;
  stageCode: string;
  projectedYield: number; // Tons/Ha
  historicalAvgYield: number;
  historicalBestYield: number;
  stressedYield: number;
  optimizedYield: number;
  rangeMin: number;
  rangeMax: number;
  biomassAccumulationPct: number;
  waterDemand: 'Low' | 'Moderate' | 'Critical' | 'High';
  managementTip: string;
}

// Built-in regional default planting logs if user has no custom logs yet
const DEFAULT_HISTORICAL_LOGS: HistoricalLogSummary[] = [
  { season: '2023 Autumn', crop: 'Maize', targetYield: 4.5, actualYield: 4.8, profit: 1450 },
  { season: '2024 Long Rains', crop: 'Maize', targetYield: 5.0, actualYield: 5.3, profit: 1820 },
  { season: '2024 Short Rains', crop: 'Maize', targetYield: 4.2, actualYield: 3.9, profit: 750 },
  { season: '2023 Autumn', crop: 'Wheat', targetYield: 4.2, actualYield: 4.5, profit: 1200 },
  { season: '2024 Winter', crop: 'Wheat', targetYield: 4.6, actualYield: 4.7, profit: 1350 },
  { season: '2024 Summer', crop: 'Roma Tomatoes', targetYield: 18.0, actualYield: 19.5, profit: 3450 },
  { season: '2024 Autumn', crop: 'Beans', targetYield: 2.2, actualYield: 2.4, profit: 890 },
  { season: '2025 Long Rains', crop: 'Beans', targetYield: 2.5, actualYield: 2.6, profit: 1050 },
  { season: '2024 Short Rains', crop: 'Soybean', targetYield: 2.8, actualYield: 2.9, profit: 980 },
];

export default function GrowthCycleYieldProjectionChart({
  weather,
  activeLocation,
  user,
  projects = [],
  className = ''
}: GrowthCycleYieldProjectionChartProps) {
  const [historicalLogs, setHistoricalLogs] = useState<HistoricalLogSummary[]>(DEFAULT_HISTORICAL_LOGS);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [selectedCrop, setSelectedCrop] = useState<string>('Maize');
  const [simulationScenario, setSimulationScenario] = useState<'baseline' | 'optimized' | 'stressed'>('baseline');
  const [showConfidenceBand, setShowConfidenceBand] = useState<boolean>(true);
  const [showHistoricalBenchmark, setShowHistoricalBenchmark] = useState<boolean>(true);
  const [showPeakCeiling, setShowPeakCeiling] = useState<boolean>(true);
  const [activeStageHover, setActiveStageHover] = useState<GrowthStageDataPoint | null>(null);

  // Fetch real historical logs from backend
  useEffect(() => {
    const fetchUserLogs = async () => {
      setIsLoadingLogs(true);
      try {
        const headers: Record<string, string> = {};
        if (user?.id) {
          headers['x-user-id'] = user.id;
        }
        const res = await fetch('/api/yield-logs', { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.logs && data.logs.length > 0) {
            const parsed = data.logs.map((l: any) => {
              const actualMatch = String(l.actual || '').match(/[\d.]+/);
              const targetMatch = String(l.target || '').match(/[\d.]+/);
              const profitNum = parseFloat(String(l.profit || '0').replace(/[^0-9.-]/g, ''));
              return {
                season: l.season || 'Historical Season',
                crop: l.crop || 'Maize',
                targetYield: targetMatch ? parseFloat(targetMatch[0]) : 4.5,
                actualYield: actualMatch ? parseFloat(actualMatch[0]) : 4.8,
                profit: isNaN(profitNum) ? 0 : profitNum
              };
            });
            setHistoricalLogs(parsed);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user historical logs for yield projection:', err);
      } finally {
        setIsLoadingLogs(false);
      }
    };

    fetchUserLogs();
  }, [user?.id]);

  // Extract unique crop names from historical logs and active projects
  const availableCrops = useMemo(() => {
    const crops = new Set<string>();
    // From historical logs
    historicalLogs.forEach(l => {
      if (l.crop) crops.add(l.crop.trim());
    });
    // From registered projects
    projects.forEach(p => {
      if (p.crop) crops.add(p.crop.trim());
    });
    if (crops.size === 0) {
      crops.add('Maize');
      crops.add('Wheat');
      crops.add('Beans');
    }
    return Array.from(crops);
  }, [historicalLogs, projects]);

  // Ensure selected crop is valid
  useEffect(() => {
    if (!availableCrops.includes(selectedCrop) && availableCrops.length > 0) {
      setSelectedCrop(availableCrops[0]);
    }
  }, [availableCrops, selectedCrop]);

  // Calculate historical statistics for selected crop
  const cropStats = useMemo(() => {
    const matching = historicalLogs.filter(
      l => l.crop.toLowerCase().includes(selectedCrop.toLowerCase()) || selectedCrop.toLowerCase().includes(l.crop.toLowerCase())
    );
    const validLogs = matching.length > 0 ? matching : historicalLogs.slice(0, 4);

    const count = validLogs.length;
    const avgActual = validLogs.reduce((acc, l) => acc + l.actualYield, 0) / count;
    const avgTarget = validLogs.reduce((acc, l) => acc + l.targetYield, 0) / count;
    const bestActual = Math.max(...validLogs.map(l => l.actualYield));
    const lowestActual = Math.min(...validLogs.map(l => l.actualYield));

    return {
      count,
      avgActual: parseFloat(avgActual.toFixed(2)),
      avgTarget: parseFloat(avgTarget.toFixed(2)),
      bestActual: parseFloat(bestActual.toFixed(2)),
      lowestActual: parseFloat(lowestActual.toFixed(2)),
      seasons: validLogs.map(l => l.season)
    };
  }, [historicalLogs, selectedCrop]);

  // Current microclimate influence factor
  const microclimateImpact = useMemo(() => {
    if (!weather) return { yieldMultiplier: 1.0, gddPace: 1.0, desc: 'Nominal baseline microclimate' };

    let multiplier = 1.0;
    // Soil moisture impact
    if (weather.soilMoisture >= 30 && weather.soilMoisture <= 55) {
      multiplier += 0.06; // Optimal root hydration
    } else if (weather.soilMoisture < 20) {
      multiplier -= 0.12; // Root tension / water deficit
    }

    // Temperature & GDD impact
    if (weather.temp >= 20 && weather.temp <= 28) {
      multiplier += 0.04; // Ideal photosynthetic efficiency
    } else if (weather.temp > 32) {
      multiplier -= 0.08; // High canopy transpiration stress
    }

    // Weather condition factor
    if (weather.dayType === 'Rainy') {
      multiplier += 0.02;
    }

    const gddPace = weather.temp > 24 ? 1.15 : weather.temp < 18 ? 0.9 : 1.0;

    return {
      yieldMultiplier: parseFloat(multiplier.toFixed(2)),
      gddPace: parseFloat(gddPace.toFixed(2)),
      desc: multiplier >= 1.05 
        ? 'Favorable microclimate accelerating biomass velocity'
        : multiplier <= 0.92
          ? 'Microclimate stress dampening potential yield accumulation'
          : 'Stable baseline climatic conditions'
    };
  }, [weather]);

  // Generate Growth Cycle timeline points (from Sowing Day 0 to Harvest Day 120)
  const growthCycleData: GrowthStageDataPoint[] = useMemo(() => {
    const baseTargetYield = cropStats.avgActual || 4.5;
    const peakYield = cropStats.bestActual || baseTargetYield * 1.18;

    // Projected harvest yield based on current microclimate and scenario
    let finalProjected = baseTargetYield * microclimateImpact.yieldMultiplier;
    if (simulationScenario === 'optimized') finalProjected *= 1.15;
    if (simulationScenario === 'stressed') finalProjected *= 0.80;

    const stagesDef = [
      { day: 0, code: 'V0', name: 'Sowing & Imbibition', factor: 0.0, water: 'Low', tip: 'Ensure seed-to-soil contact and seedbed moisture at 10cm depth.' },
      { day: 14, code: 'VE', name: 'Germination & Emergence', factor: 0.05, water: 'Moderate', tip: 'Monitor uniform coleoptile emergence and soil crusting.' },
      { day: 28, code: 'V3', name: 'Early Vegetative / Tillering', factor: 0.16, water: 'Moderate', tip: 'Apply early nitrogen side-dress and weed root barriers.' },
      { day: 45, code: 'V6', name: 'Rapid Canopy Expansion', factor: 0.35, water: 'High', tip: 'Leaf Area Index peaks; maximize solar radiation capture.' },
      { day: 65, code: 'R1', name: 'Flowering & Pollination', factor: 0.62, water: 'Critical', tip: 'Peak moisture sensitivity! Prevent thermal stress to protect ovules.' },
      { day: 85, code: 'R3', name: 'Grain Fill & Pod Bulking', factor: 0.85, water: 'High', tip: 'Nutrient mobilization into seeds; check upper canopy leaf health.' },
      { day: 105, code: 'R5', name: 'Dough & Pre-Maturity', factor: 0.96, water: 'Moderate', tip: 'Dry matter accumulation complete; natural leaf senescence begins.' },
      { day: 120, code: 'R6', name: 'Physiological Harvest Maturity', factor: 1.0, water: 'Low', tip: 'Black layer formation; check kernel moisture for harvest window.' }
    ];

    return stagesDef.map(st => {
      const projected = parseFloat((finalProjected * st.factor).toFixed(2));
      const historicalAvg = parseFloat((baseTargetYield * st.factor).toFixed(2));
      const historicalBest = parseFloat((peakYield * st.factor).toFixed(2));
      const stressed = parseFloat((baseTargetYield * 0.78 * st.factor).toFixed(2));
      const optimized = parseFloat((baseTargetYield * 1.16 * st.factor).toFixed(2));

      return {
        day: st.day,
        stageName: st.name,
        stageCode: st.code,
        projectedYield: projected,
        historicalAvgYield: historicalAvg,
        historicalBestYield: historicalBest,
        stressedYield: stressed,
        optimizedYield: optimized,
        rangeMin: Math.min(stressed, projected * 0.92),
        rangeMax: Math.max(optimized, projected * 1.08),
        biomassAccumulationPct: Math.round(st.factor * 100),
        waterDemand: st.water as any,
        managementTip: st.tip
      };
    });
  }, [cropStats, microclimateImpact, simulationScenario]);

  // Current active day based on weather/GDD modeling (e.g. Day 48)
  const currentGrowthDay = useMemo(() => {
    if (!weather) return 45;
    // Estimate phenological day from soil moisture & temperature
    const baseDay = Math.round((weather.temp * 1.6 + weather.soilMoisture * 0.5) % 80) + 20;
    return Math.min(105, Math.max(15, baseDay));
  }, [weather]);

  const currentStage = useMemo(() => {
    return growthCycleData.reduce((prev, curr) => {
      return (curr.day <= currentGrowthDay) ? curr : prev;
    }, growthCycleData[0]);
  }, [growthCycleData, currentGrowthDay]);

  const finalProjectedValue = growthCycleData[growthCycleData.length - 1]?.projectedYield || 4.5;
  const yieldVarianceVsHistorical = parseFloat((((finalProjectedValue - cropStats.avgActual) / cropStats.avgActual) * 100).toFixed(1));

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`bg-white border border-emerald-100/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6 ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
              Expected Growth Cycles & Yield Projection
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                Recharts Model
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-sans">
            Phenological dry-matter biomass trajectory calibrated against historical harvest records & active microclimate telemetry.
          </p>
        </div>

        {/* Crop Selector & Scenario Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Crop Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs">
            <Sprout className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] font-bold text-slate-400 uppercase">Crop:</span>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-transparent font-bold text-slate-800 text-xs outline-none cursor-pointer"
            >
              {availableCrops.map(crop => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>
          </div>

          {/* Scenario Buttons */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSimulationScenario('baseline')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                simulationScenario === 'baseline'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Baseline
            </button>
            <button
              type="button"
              onClick={() => setSimulationScenario('optimized')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                simulationScenario === 'optimized'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Optimal (+15%)
            </button>
            <button
              type="button"
              onClick={() => setSimulationScenario('stressed')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                simulationScenario === 'stressed'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-amber-700'
              }`}
            >
              <Sun className="w-3 h-3" />
              Heat Stress (-20%)
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary Stat KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* KPI 1: Projected Final Yield */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-emerald-50/20 border border-emerald-100 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Projected Harvest Yield
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-800 tracking-tight">
              {finalProjectedValue.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-emerald-600">Tons/Ha</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold">
            {yieldVarianceVsHistorical >= 0 ? (
              <span className="text-emerald-600 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                +{yieldVarianceVsHistorical}% vs Historical
              </span>
            ) : (
              <span className="text-amber-600 flex items-center">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                {yieldVarianceVsHistorical}% vs Historical
              </span>
            )}
          </div>
        </div>

        {/* KPI 2: Historical Baseline */}
        <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Historical Actual Average
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              {cropStats.avgActual.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-slate-500">Tons/Ha</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            Peak Harvest: <strong className="text-slate-700">{cropStats.bestActual} T/Ha</strong> ({cropStats.count} cycles)
          </p>
        </div>

        {/* KPI 3: Current Phenological Phase */}
        <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Active Cycle Phase (Day {currentGrowthDay})
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-bold text-sky-900 tracking-tight truncate">
              {currentStage.stageCode} • {currentStage.stageName}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-sky-700 font-medium">
            <Droplets className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span>Water Demand: <strong>{currentStage.waterDemand}</strong></span>
          </div>
        </div>

        {/* KPI 4: Climate Acceleration Factor */}
        <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Microclimate Modulator
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-amber-900 tracking-tight">
              {microclimateImpact.yieldMultiplier}x
            </span>
            <span className="text-xs font-bold text-amber-700 font-mono">({microclimateImpact.gddPace}x GDD)</span>
          </div>
          <p className="text-[11px] text-amber-800 truncate" title={microclimateImpact.desc}>
            {microclimateImpact.desc}
          </p>
        </div>
      </div>

      {/* Main Recharts Line Chart Container */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            📈 Cumulative Growth Cycle Yield Curve (0 to 120 Days After Sowing)
          </span>

          {/* Interactive Layer Checkboxes */}
          <div className="flex items-center gap-3 text-[11px] text-slate-600 flex-wrap">
            <label className="inline-flex items-center gap-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showConfidenceBand}
                onChange={(e) => setShowConfidenceBand(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
              />
              <span>Projected Range Band</span>
            </label>

            <label className="inline-flex items-center gap-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showHistoricalBenchmark}
                onChange={(e) => setShowHistoricalBenchmark(e.target.checked)}
                className="rounded border-slate-300 text-slate-600 focus:ring-slate-500 w-3.5 h-3.5"
              />
              <span>Past Seasons Average</span>
            </label>

            <label className="inline-flex items-center gap-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPeakCeiling}
                onChange={(e) => setShowPeakCeiling(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
              />
              <span>Historical Peak</span>
            </label>
          </div>
        </div>

        {/* Responsive Chart */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={growthCycleData}
              margin={{ top: 10, right: 25, left: -10, bottom: 20 }}
              onMouseMove={(e: any) => {
                if (e && e.activePayload && e.activePayload.length > 0) {
                  setActiveStageHover(e.activePayload[0].payload as GrowthStageDataPoint);
                }
              }}
              onMouseLeave={() => setActiveStageHover(null)}
            >
              <defs>
                <linearGradient id="projectionBandGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="projectedLineGlow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="50%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />

              <XAxis
                dataKey="day"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                tickFormatter={(day) => `Day ${day}`}
              />

              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val} T`}
                domain={[0, 'auto']}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload as GrowthStageDataPoint;
                    return (
                      <div className="bg-slate-950/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-white/15 text-xs space-y-2 max-w-xs z-50">
                        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                          <span className="font-bold text-emerald-400">
                            {dataPoint.stageCode} • {dataPoint.stageName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-300">
                            Day {dataPoint.day} / 120
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300">Projected Yield:</span>
                            <span className="font-bold text-emerald-400 font-mono text-sm">
                              {dataPoint.projectedYield} Tons/Ha
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-400">Historical Avg:</span>
                            <span className="font-mono text-slate-300">
                              {dataPoint.historicalAvgYield} Tons/Ha
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-400">Biomass Velocity:</span>
                            <span className="font-mono text-amber-300">
                              {dataPoint.biomassAccumulationPct}% Total Biomass
                            </span>
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-white/10 text-[10px] space-y-1">
                          <div className="flex items-center gap-1 text-sky-300 font-semibold">
                            <Droplets className="w-3 h-3" />
                            <span>Water Sensitivity: {dataPoint.waterDemand}</span>
                          </div>
                          <p className="text-slate-300 font-sans leading-relaxed">
                            {dataPoint.managementTip}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Legend
                verticalAlign="bottom"
                height={28}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              />

              {/* Shaded Area for Yield Confidence Interval Range */}
              {showConfidenceBand && (
                <Area
                  type="monotone"
                  dataKey="rangeMax"
                  stroke="none"
                  fill="url(#projectionBandGradient)"
                  name="Projected Potential Range"
                />
              )}

              {/* Historical Average Line (Dotted Slate) */}
              {showHistoricalBenchmark && (
                <Line
                  type="monotone"
                  dataKey="historicalAvgYield"
                  stroke="#64748B"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#64748B', strokeWidth: 1, stroke: '#FFFFFF' }}
                  name="Historical Seasons Avg"
                />
              )}

              {/* Historical Best Peak Season (Dashed Amber) */}
              {showPeakCeiling && (
                <Line
                  type="monotone"
                  dataKey="historicalBestYield"
                  stroke="#F59E0B"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                  name="Historical Best Season"
                />
              )}

              {/* Active Projected Growth Cycle Line (Solid Emerald) */}
              <Line
                type="monotone"
                dataKey="projectedYield"
                stroke="url(#projectedLineGlow)"
                strokeWidth={3}
                dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#FFFFFF' }}
                activeDot={{ r: 7, fill: '#10B981', stroke: '#FFFFFF', strokeWidth: 2 }}
                name={`Projected Yield (${selectedCrop})`}
              />

              {/* Reference line marking current crop growth stage in the cycle */}
              <ReferenceLine
                x={currentStage.day}
                stroke="#0284C7"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  value: `Today: ${currentStage.stageCode}`,
                  position: 'top',
                  fill: '#0284C7',
                  fontSize: 10,
                  fontWeight: 'bold'
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Phenological Stage Milestone Navigator Bar */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            🌱 Growth Cycle Milestones & Management Protocol
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Click milestone to inspect requirements
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {growthCycleData.map((st) => {
            const isCurrent = st.stageCode === currentStage.stageCode;
            const isHovered = activeStageHover?.stageCode === st.stageCode;
            return (
              <div
                key={st.stageCode}
                onMouseEnter={() => setActiveStageHover(st)}
                onMouseLeave={() => setActiveStageHover(null)}
                className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-400/30'
                    : isHovered
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-slate-50/70 border-slate-100 hover:bg-white hover:border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    isCurrent ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {st.stageCode}
                  </span>
                  <span className="text-[9px] font-mono font-semibold text-slate-400">
                    D{st.day}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-800 truncate" title={st.stageName}>
                  {st.stageName}
                </p>
                <div className="text-[10px] font-mono text-emerald-700 font-extrabold mt-1">
                  {st.projectedYield} T/Ha
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Action Advisory Box for Current Stage */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-white to-sky-50/40 border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 bg-emerald-600 text-white rounded-lg shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-xs">
                Active Protocol ({currentStage.stageName}):
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-semibold">
                Water Demand: {currentStage.waterDemand}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed font-sans text-xs">
              {currentStage.managementTip}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Estimated Harvest Window</span>
          <span className="text-xs font-bold text-emerald-800 font-mono">
            ~{120 - currentGrowthDay} Days Remaining
          </span>
        </div>
      </div>
    </motion.div>
  );
}
