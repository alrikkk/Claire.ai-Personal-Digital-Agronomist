import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  Sparkles,
  TrendingUp,
  Brain,
  Sprout,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  ShieldAlert,
  HelpCircle,
  X,
  RefreshCw,
  Sliders,
  Download,
  Share2,
  ArrowUpRight,
  ArrowRight,
  Layers,
  Activity,
  Zap,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { showToast } from '../types';

export interface ForecastCycle {
  cycleNumber: number;
  cycleLabel: string;
  season: string;
  shortSeason: string;
  crop: string;
  predictedYield: number;
  lowerBound: number;
  upperBound: number;
  confidenceIntervalSpan: number;
  targetYield: number;
  projectedProfit: number;
  formattedProfit: string;
  confidenceScore: number;
  recommendedAction: string;
}

export interface ForecastResponse {
  success: boolean;
  targetCrop: string;
  scenario: string;
  scenarioDescription: string;
  historicalSeasonsCount: number;
  historicalAvgYield: number;
  historicalAvgTarget: number;
  historicalAvgProfit: number;
  trendSlope: number;
  forecastHorizonCycles: number;
  projections: ForecastCycle[];
  aiInsights: {
    summaryRationale: string;
    confidenceIndex: number;
    growthVelocityPct: number;
    keyRiskFactors: string[];
    recommendedInterventions: string[];
    soilHealthTrend: string;
  };
  generatedAt: string;
}

interface YieldAiForecastModalProps {
  logs: Array<{ season: string; crop: string; target: string; actual: string; status: string; profit: string }>;
  onClose: () => void;
}

export default function YieldAiForecastModal({ logs, onClose }: YieldAiForecastModalProps) {
  const [selectedCrop, setSelectedCrop] = useState<string>('ALL');
  const [selectedScenario, setSelectedScenario] = useState<'baseline' | 'optimized' | 'drought' | 'regenerative'>('baseline');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'cycle_cards'>('chart');

  // Extract unique crop options
  const availableCrops = Array.from(new Set(logs.map((l) => l.crop))).filter(Boolean);

  // Fetch or trigger forecast model
  const fetchForecast = async (crop = selectedCrop, scenario = selectedScenario) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/yield-logs/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logs,
          crop,
          scenario
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setForecastData(data);
      } else {
        throw new Error(data.error || 'Failed to generate forecast.');
      }
    } catch (err: any) {
      console.error('[AI Yield Forecast error]:', err);
      setError(err?.message || 'Unable to connect to AI Forecasting Engine.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast(selectedCrop, selectedScenario);
  }, [selectedCrop, selectedScenario]);

  // Combine historical logs and 3-cycle predictions into a continuous Recharts dataset
  const combinedRechartsData = React.useMemo(() => {
    const dataPoints: any[] = [];

    // Filter historical logs
    const filteredLogs = logs.filter((l) => selectedCrop === 'ALL' || l.crop === selectedCrop);

    // Add historical items
    filteredLogs.forEach((l, idx) => {
      const targetNum = parseFloat((l.target.match(/[\d.]+/) || ['0'])[0]);
      const actualNum = parseFloat((l.actual.match(/[\d.]+/) || ['0'])[0]);
      const profitNum = parseFloat(l.profit.replace(/[^0-9.-]/g, '')) * (l.profit.includes('-') ? -1 : 1);

      dataPoints.push({
        season: l.season,
        crop: l.crop,
        type: 'HISTORICAL',
        actual: actualNum,
        target: targetNum,
        forecast: null,
        lowerBound: null,
        upperBound: null,
        ciRange: null,
        profit: isNaN(profitNum) ? 0 : profitNum,
        profitFormatted: l.profit,
        status: l.status,
        isForecast: false
      });
    });

    // Bridge the last historical point with the start of forecast for visual continuity
    if (filteredLogs.length > 0 && forecastData?.projections?.length) {
      const lastHist = dataPoints[dataPoints.length - 1];
      lastHist.forecast = lastHist.actual;
      lastHist.lowerBound = lastHist.actual;
      lastHist.upperBound = lastHist.actual;
    }

    // Add 3-cycle forecast items
    if (forecastData?.projections) {
      forecastData.projections.forEach((p) => {
        dataPoints.push({
          season: p.season,
          crop: p.crop,
          type: 'PROJECTED_FORECAST',
          actual: null,
          target: p.targetYield,
          forecast: p.predictedYield,
          lowerBound: p.lowerBound,
          upperBound: p.upperBound,
          ciRange: [p.lowerBound, p.upperBound],
          profit: p.projectedProfit,
          profitFormatted: p.formattedProfit,
          status: 'AI Forecasted',
          confidenceScore: p.confidenceScore,
          recommendedAction: p.recommendedAction,
          isForecast: true
        });
      });
    }

    return dataPoints;
  }, [logs, selectedCrop, forecastData]);

  // Custom Tooltip for Forecast Recharts
  const CustomForecastTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-4 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-2.5 backdrop-blur-md min-w-[240px]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-700/80 pb-2">
            <span className="font-bold text-sky-400">{data.season}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              data.isForecast ? 'bg-purple-900/80 text-purple-200 border border-purple-500/50' : 'bg-slate-800 text-slate-300'
            }`}>
              {data.isForecast ? '🤖 AI Forecast' : 'Historical'}
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            {data.isForecast ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-purple-300 font-sans font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" /> Predicted Yield:
                  </span>
                  <span className="text-purple-300 font-extrabold text-sm">{data.forecast} tons/ha</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">95% Confidence Interval:</span>
                  <span className="text-slate-200 font-bold">{data.lowerBound} &ndash; {data.upperBound} t/ha</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Target Benchmark:</span>
                  <span className="text-sky-300 font-bold">{data.target} tons/ha</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Confidence Model:</span>
                  <span className="text-emerald-400 font-bold">{data.confidenceScore}%</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-1.5 mt-1">
                  <span className="text-slate-400">Forecasted Net Profit:</span>
                  <span className={data.profit >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {data.profitFormatted}
                  </span>
                </div>
                {data.recommendedAction && (
                  <div className="pt-1 text-[10px] text-slate-300 font-sans leading-relaxed border-t border-slate-800">
                    <span className="text-amber-400 font-bold block mb-0.5">🌱 Agronomic Action:</span>
                    {data.recommendedAction}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Target Goal:</span>
                  <span className="text-sky-300 font-bold">{data.target} tons/ha</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Harvest Yield:</span>
                  <span className="text-emerald-400 font-extrabold">{data.actual} tons/ha</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-1.5">
                  <span className="text-slate-400">Economic Return:</span>
                  <span className={data.profit >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {data.profitFormatted}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Export report
  const handleExportForecast = () => {
    if (!forecastData) return;
    const content = `CLAIRE.AI - 3-HARVEST CYCLE AI YIELD FORECAST REPORT
Generated: ${new Date().toLocaleString()}
Target Crop: ${forecastData.targetCrop}
Scenario: ${forecastData.scenarioDescription}
Confidence Index: ${forecastData.aiInsights.confidenceIndex}%
Growth Velocity: ${forecastData.aiInsights.growthVelocityPct}%

SUMMARY RATIONALE:
${forecastData.aiInsights.summaryRationale}

3-CYCLE PROJECTIONS:
${forecastData.projections.map((p) => `
- ${p.season}
  Predicted Harvest: ${p.predictedYield} tons/ha (95% CI: ${p.lowerBound} - ${p.upperBound} t/ha)
  Target Goal: ${p.targetYield} tons/ha
  Projected Profit: ${p.formattedProfit}
  Confidence Score: ${p.confidenceScore}%
  Agronomic Action: ${p.recommendedAction}
`).join('')}

KEY RISK FACTORS:
${forecastData.aiInsights.keyRiskFactors.map((r, i) => `${i + 1}. ${r}`).join('\n')}

RECOMMENDED INTERVENTIONS:
${forecastData.aiInsights.recommendedInterventions.map((r, i) => `${i + 1}. ${r}`).join('\n')}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yield_forecast_3_cycles_${forecastData.targetCrop.toLowerCase().replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded AI Yield Forecast report!', 'success');
  };

  return (
    <div
      id="yield_ai_forecast_modal"
      className="bg-white rounded-3xl border border-purple-200 shadow-2xl overflow-hidden flex flex-col w-full max-w-5xl max-h-[92vh]"
    >
      {/* Header Banner */}
      <div className="p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-purple-800/60">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30 text-white font-bold">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2 text-white">
                <span>AI Yield Forecast & Trend Projection</span>
                <span className="text-[10px] bg-purple-500/30 border border-purple-400/40 text-purple-200 px-2 py-0.5 rounded-full font-mono font-bold">
                  Next 3 Harvest Cycles
                </span>
              </h3>
            </div>
            <p className="text-xs text-purple-200/80 mt-0.5">
              Gemini & AutoML Tabular time-series predictive modeling based on historical yield logs, climate signals, and soil dynamics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportForecast}
            disabled={!forecastData}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-800/60 hover:bg-purple-700/80 text-purple-100 text-xs font-bold transition-all border border-purple-600/40 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-slate-50/40">
        
        {/* Controls & Scenario Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Crop Selector */}
            <div className="space-y-1">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Crop Variety</span>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="h-8 bg-slate-50 border border-slate-200 rounded-lg px-2.5 text-xs text-slate-800 font-bold outline-none focus:border-purple-400 cursor-pointer"
              >
                <option value="ALL">All Crops Portfolio</option>
                {availableCrops.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Scenario Selector */}
            <div className="space-y-1">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Climatic & Ag Scenario</span>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedScenario('baseline')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-[11px] ${
                    selectedScenario === 'baseline' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Standard Baseline
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedScenario('optimized')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-[11px] ${
                    selectedScenario === 'optimized' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ⚡ Bio-Optimized (+16%)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedScenario('drought')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-[11px] ${
                    selectedScenario === 'drought' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ☀️ Drought Stress (-18%)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedScenario('regenerative')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-[11px] ${
                    selectedScenario === 'regenerative' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🍂 Regenerative (+8%)
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fetchForecast(selectedCrop, selectedScenario)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Re-run Forecast Model</span>
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4 bg-white rounded-3xl border border-slate-200 shadow-xs">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-slate-800">Synthesizing Machine Learning Time-Series & Soil Vectors...</p>
              <p className="text-xs text-slate-500">Evaluating historical crop logs across the next 3 seasonal cycles.</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-rose-700 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>Forecasting Model Alert</span>
            </div>
            <p className="text-xs text-rose-600">{error}</p>
            <button
              type="button"
              onClick={() => fetchForecast()}
              className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : forecastData ? (
          <>
            {/* Top 4 KPI Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-xs">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Projected Cycle +3 Yield</span>
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <div className="text-xl font-extrabold text-purple-900 font-mono mt-1">
                  {forecastData.projections[2]?.predictedYield}{' '}
                  <span className="text-xs text-slate-500 font-sans font-normal">tons/ha</span>
                </div>
                <div className="text-[11px] text-purple-600 mt-0.5 font-bold flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>
                    {forecastData.aiInsights.growthVelocityPct >= 0 ? '+' : ''}
                    {forecastData.aiInsights.growthVelocityPct}% trajectory
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>AI Model Confidence</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="text-xl font-extrabold text-emerald-600 font-mono mt-1">
                  {forecastData.aiInsights.confidenceIndex}%
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  High Statistical Reliability
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Forecast Horizon</span>
                  <Calendar className="w-3.5 h-3.5 text-sky-500" />
                </div>
                <div className="text-xl font-extrabold text-slate-800 font-mono mt-1">
                  3 Harvest Cycles
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  {forecastData.projections[0]?.shortSeason} &ndash; {forecastData.projections[2]?.shortSeason}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>3-Cycle Cumulative Profit</span>
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                {(() => {
                  const totalProfit = forecastData.projections.reduce((acc, curr) => acc + curr.projectedProfit, 0);
                  return (
                    <>
                      <div className={`text-xl font-extrabold font-mono mt-1 ${totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {totalProfit >= 0 ? `+$${totalProfit.toLocaleString()}` : `-$${Math.abs(totalProfit).toLocaleString()}`}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        Forecasted Net Farm Return
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Recharts Interactive Time-Series Forecast Visualization */}
            <div className="bg-white border border-purple-100 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    Continuous Historical-to-Forecast Yield Trend (tons/ha)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Solid lines display historical actual yields; dashed purple line displays AI 3-harvest cycle projection with 95% confidence band.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2.5 py-1 rounded-lg border border-purple-200">
                    Scenario: {forecastData.scenarioDescription}
                  </span>
                </div>
              </div>

              {/* Chart Canvas */}
              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={combinedRechartsData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="forecastAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.03} />
                      </linearGradient>
                      <linearGradient id="actualAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="season"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      unit=" t/ha"
                    />
                    <Tooltip content={<CustomForecastTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                    {/* Historical Baseline Reference */}
                    <ReferenceLine
                      y={forecastData.historicalAvgYield}
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                      label={{
                        value: `Hist Avg: ${forecastData.historicalAvgYield} t/ha`,
                        fill: '#64748b',
                        fontSize: 10,
                        position: 'insideBottomRight'
                      }}
                    />

                    {/* Historical Yield Line */}
                    <Line
                      type="monotone"
                      dataKey="actual"
                      name="Historical Actual Yield (t/ha)"
                      stroke="#0284c7"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#0284c7' }}
                      connectNulls={false}
                    />

                    {/* Target Benchmark Line */}
                    <Line
                      type="monotone"
                      dataKey="target"
                      name="Target Benchmark (t/ha)"
                      stroke="#64748b"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      dot={false}
                    />

                    {/* Forecast Upper/Lower Confidence Band Area */}
                    <Area
                      type="monotone"
                      dataKey="upperBound"
                      name="95% Upper Bound (t/ha)"
                      stroke="transparent"
                      fill="url(#forecastAreaGrad)"
                      connectNulls={true}
                    />
                    <Area
                      type="monotone"
                      dataKey="lowerBound"
                      name="95% Lower Bound (t/ha)"
                      stroke="transparent"
                      fill="#ffffff"
                      connectNulls={true}
                    />

                    {/* AI Forecast Projected Trendline */}
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      name="🤖 AI Projected Forecast (t/ha)"
                      stroke="#8b5cf6"
                      strokeWidth={3.5}
                      strokeDasharray="5 5"
                      dot={{ r: 6, fill: '#7c3aed', stroke: '#ffffff', strokeWidth: 2 }}
                      connectNulls={true}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cycle by Cycle Breakdown Cards */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Next 3 Harvest Cycles Detail Matrix
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {forecastData.projections.map((cycle) => (
                  <div
                    key={cycle.cycleNumber}
                    className="p-5 rounded-2xl bg-white border border-purple-100 shadow-sm space-y-3 relative overflow-hidden group hover:border-purple-300 transition-all"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -z-0 pointer-events-none group-hover:scale-110 transition-transform" />

                    <div className="flex items-center justify-between relative z-10">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800">
                        {cycle.cycleLabel}
                      </span>
                      <span className="text-xs font-bold text-slate-400 font-mono">
                        {cycle.confidenceScore}% Confidence
                      </span>
                    </div>

                    <div className="relative z-10">
                      <h5 className="font-extrabold text-slate-800 text-sm">{cycle.shortSeason}</h5>
                      <span className="text-xs text-slate-500">{cycle.crop}</span>
                    </div>

                    <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-1 relative z-10 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Predicted Yield:</span>
                        <span className="font-extrabold text-purple-900 font-mono text-sm">
                          {cycle.predictedYield} tons/ha
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">95% Range:</span>
                        <span className="text-slate-600 font-mono font-bold">
                          {cycle.lowerBound} &ndash; {cycle.upperBound} t/ha
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] pt-1 border-t border-purple-100">
                        <span className="text-slate-400">Net Return:</span>
                        <span className={`font-mono font-bold ${cycle.projectedProfit >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {cycle.formattedProfit}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 relative z-10 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                      <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block mb-0.5">
                        Agronomic Protocol
                      </span>
                      {cycle.recommendedAction}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Strategic Advisory & Risk Factors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Summary Rationale */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>AI Agronomic Forecasting Rationale</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {forecastData.aiInsights.summaryRationale}
                </p>
                <div className="p-2.5 bg-emerald-50 border border-emerald-200/60 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Soil Health Trajectory:</strong> {forecastData.aiInsights.soilHealthTrend}
                  </span>
                </div>
              </div>

              {/* Risk Mitigation & Interventions */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>Key Risk Factors & Prescribed Interventions</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {forecastData.aiInsights.keyRiskFactors.slice(0, 2).map((risk, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-600 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      <span>{risk}</span>
                    </div>
                  ))}
                  {forecastData.aiInsights.recommendedInterventions.slice(0, 2).map((action, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-emerald-700 text-[11px] font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Modal Footer */}
      <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
        <span className="text-xs text-slate-500 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          Projections incorporate regression slope, weather stress factors, and 95% confidence variance bands.
        </span>

        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer transition-colors"
        >
          Close Forecast
        </button>
      </div>
    </div>
  );
}
