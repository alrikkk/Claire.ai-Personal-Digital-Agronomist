import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  AreaChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  BarChart2,
  Activity,
  Sprout,
  Filter,
  Sparkles,
  DollarSign,
  Target,
  Award,
  Layers,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion } from 'motion/react';

export interface YieldLogDataPoint {
  id?: string;
  season: string;
  crop: string;
  target: string;
  actual: string;
  status: string;
  profit: string;
}

interface YieldTrendsVisualizationProps {
  logs: YieldLogDataPoint[];
  onSelectCropFilter?: (crop: string) => void;
}

// Numerical extractor helper
const parseYieldValue = (valStr: string): number => {
  if (!valStr) return 0;
  const match = valStr.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
};

// Profit value extractor helper
const parseProfitValue = (profitStr: string): number => {
  if (!profitStr) return 0;
  const rawNum = profitStr.replace(/[^0-9.-]/g, '');
  const isNegative = profitStr.includes('-');
  const parsed = parseFloat(rawNum);
  return isNaN(parsed) ? 0 : parsed * (isNegative ? -1 : 1);
};

export default function YieldTrendsVisualization({ logs, onSelectCropFilter }: YieldTrendsVisualizationProps) {
  // Chart visual modes
  const [chartMode, setChartMode] = useState<'trend' | 'variance' | 'cultivars' | 'economics'>('trend');
  const [selectedCrop, setSelectedCrop] = useState<string>('ALL');
  const [showMovingAvg, setShowMovingAvg] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<'ALL' | 'RECENT_4' | 'RECENT_6'>('ALL');

  // Extract unique crops
  const availableCrops = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.crop))).filter(Boolean);
  }, [logs]);

  // Process & filter sequential data
  const filteredLogs = useMemo(() => {
    let list = logs.filter((l) => selectedCrop === 'ALL' || l.crop === selectedCrop);
    if (timeRange === 'RECENT_4') {
      list = list.slice(-4);
    } else if (timeRange === 'RECENT_6') {
      list = list.slice(-6);
    }
    return list;
  }, [logs, selectedCrop, timeRange]);

  // Transform logs into recharts dataset
  const chartData = useMemo(() => {
    return filteredLogs.map((log, index) => {
      const targetVal = parseYieldValue(log.target);
      const actualVal = parseYieldValue(log.actual);
      const varianceVal = parseFloat((actualVal - targetVal).toFixed(2));
      const variancePct = targetVal > 0 ? parseFloat((((actualVal - targetVal) / targetVal) * 100).toFixed(1)) : 0;
      const profitVal = parseProfitValue(log.profit);

      // Calculate 3-period moving average if enough previous data
      let movingAvg = actualVal;
      if (index >= 2) {
        const p1 = parseYieldValue(filteredLogs[index - 2].actual);
        const p2 = parseYieldValue(filteredLogs[index - 1].actual);
        movingAvg = parseFloat(((p1 + p2 + actualVal) / 3).toFixed(2));
      } else if (index === 1) {
        const p1 = parseYieldValue(filteredLogs[index - 1].actual);
        movingAvg = parseFloat(((p1 + actualVal) / 2).toFixed(2));
      }

      // Calculate yield efficiency index (Actual / Target * 100)
      const efficiencyIndex = targetVal > 0 ? parseFloat(((actualVal / targetVal) * 100).toFixed(1)) : 100;

      return {
        id: log.id || `idx-${index}`,
        season: log.season,
        crop: log.crop,
        target: targetVal,
        actual: actualVal,
        variance: varianceVal,
        variancePct,
        profit: profitVal,
        profitFormatted: log.profit,
        movingAvg,
        efficiencyIndex,
        status: log.status,
        periodIndex: index + 1
      };
    });
  }, [filteredLogs]);

  // Cultivar aggregated comparison data
  const cultivarComparisonData = useMemo(() => {
    const map = new Map<string, { totalActual: number; totalTarget: number; count: number; totalProfit: number }>();
    logs.forEach((log) => {
      const crop = log.crop || 'Unknown';
      const actual = parseYieldValue(log.actual);
      const target = parseYieldValue(log.target);
      const profit = parseProfitValue(log.profit);

      const curr = map.get(crop) || { totalActual: 0, totalTarget: 0, count: 0, totalProfit: 0 };
      curr.totalActual += actual;
      curr.totalTarget += target;
      curr.totalProfit += profit;
      curr.count += 1;
      map.set(crop, curr);
    });

    return Array.from(map.entries()).map(([crop, val]) => {
      const avgActual = parseFloat((val.totalActual / val.count).toFixed(2));
      const avgTarget = parseFloat((val.totalTarget / val.count).toFixed(2));
      const avgProfit = Math.round(val.totalProfit / val.count);
      const achievementRate = avgTarget > 0 ? parseFloat(((avgActual / avgTarget) * 100).toFixed(1)) : 100;
      return {
        crop,
        avgActual,
        avgTarget,
        avgProfit,
        achievementRate,
        seasonsCount: val.count
      };
    }).sort((a, b) => b.avgActual - a.avgActual);
  }, [logs]);

  // Key Statistics & Productivity Patterns
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        avgYield: 0,
        peakYield: 0,
        peakSeason: 'N/A',
        troughYield: 0,
        troughSeason: 'N/A',
        targetAchievement: 0,
        netProfit: 0,
        growthTrend: 0,
        stabilityScore: 'N/A',
        topCultivar: 'N/A',
        optimalSeasonsRatio: 0
      };
    }

    const totalActual = chartData.reduce((sum, d) => sum + d.actual, 0);
    const avgYield = parseFloat((totalActual / chartData.length).toFixed(2));

    let peak = chartData[0];
    let trough = chartData[0];
    chartData.forEach((d) => {
      if (d.actual > peak.actual) peak = d;
      if (d.actual < trough.actual) trough = d;
    });

    const netProfit = chartData.reduce((sum, d) => sum + d.profit, 0);
    const avgAchievement = parseFloat(
      (chartData.reduce((sum, d) => sum + d.efficiencyIndex, 0) / chartData.length).toFixed(1)
    );

    // Calculate growth trend between first half and second half
    let growthTrend = 0;
    if (chartData.length >= 2) {
      const firstVal = chartData[0].actual;
      const lastVal = chartData[chartData.length - 1].actual;
      if (firstVal > 0) {
        growthTrend = parseFloat((((lastVal - firstVal) / firstVal) * 100).toFixed(1));
      }
    }

    // Standard deviation for stability index
    const varianceSum = chartData.reduce((sum, d) => sum + Math.pow(d.actual - avgYield, 2), 0);
    const stdDev = Math.sqrt(varianceSum / chartData.length);
    const cv = avgYield > 0 ? (stdDev / avgYield) * 100 : 0;
    const stabilityScore = cv < 15 ? 'High (Consistent)' : cv < 30 ? 'Moderate' : 'High Volatility';

    // Best cultivar by average yield
    const topCultivar = cultivarComparisonData[0]?.crop || 'N/A';

    // Optimal status count
    const optimalCount = chartData.filter((d) => d.status.toLowerCase().includes('optimal') || d.variance >= 0).length;
    const optimalSeasonsRatio = Math.round((optimalCount / chartData.length) * 100);

    return {
      avgYield,
      peakYield: peak.actual,
      peakSeason: `${peak.season} (${peak.crop})`,
      troughYield: trough.actual,
      troughSeason: `${trough.season} (${trough.crop})`,
      targetAchievement: avgAchievement,
      netProfit,
      growthTrend,
      stabilityScore,
      topCultivar,
      optimalSeasonsRatio
    };
  }, [chartData, cultivarComparisonData]);

  // Custom Chart Tooltips
  const CustomTrendsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-4 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-2.5 backdrop-blur-md min-w-[220px]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-700/80 pb-2">
            <span className="font-bold text-sky-400">{data.season}</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold border border-slate-700">
              {data.crop}
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400 flex items-center gap-1">
                <Target className="w-3 h-3 text-sky-400" /> Target:
              </span>
              <span className="text-slate-200 font-bold">{data.target} tons/ha</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400 flex items-center gap-1">
                <Sprout className="w-3 h-3 text-emerald-400" /> Harvested:
              </span>
              <span className="text-emerald-400 font-extrabold">{data.actual} tons/ha</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Yield Delta:</span>
              <span className={data.variance >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {data.variance >= 0 ? `+${data.variance}` : data.variance} t/ha ({data.variancePct >= 0 ? `+${data.variancePct}%` : `${data.variancePct}%`})
              </span>
            </div>
            {data.movingAvg && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">3-Season Moving Avg:</span>
                <span className="text-amber-300 font-bold">{data.movingAvg} t/ha</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-1.5 mt-1">
              <span className="text-slate-400">Economic Return:</span>
              <span className={data.profit >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {data.profitFormatted || `$${data.profit.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomCultivarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-2 backdrop-blur-md">
          <div className="font-bold text-sky-400 border-b border-slate-700/80 pb-1.5 flex items-center justify-between gap-3">
            <span>{data.crop}</span>
            <span className="text-[10px] text-slate-400 font-normal">{data.seasonsCount} Season Log(s)</span>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Avg Harvest Yield:</span>
              <span className="text-emerald-400 font-bold">{data.avgActual} tons/ha</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Avg Target Goal:</span>
              <span className="text-sky-300 font-bold">{data.avgTarget} tons/ha</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Target Fulfillment:</span>
              <span className="text-amber-300 font-bold">{data.achievementRate}%</span>
            </div>
            <div className="flex justify-between gap-4 border-t border-slate-800 pt-1">
              <span className="text-slate-400">Avg Net Return:</span>
              <span className={data.avgProfit >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {data.avgProfit >= 0 ? `+$${data.avgProfit.toLocaleString()}` : `-$${Math.abs(data.avgProfit).toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="recharts_yield_visualization_container" className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm space-y-6">
      
      {/* Header Section with Mode Switcher and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h4 className="font-extrabold text-slate-800 text-base">
              Historical Crop Yield Trends & Productivity Analytics
            </h4>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-10">
            Interactive time-series visualizations powered by Recharts to identify seasonal yield trajectory, target compliance, and cultivar stability.
          </p>
        </div>

        {/* View Controls & Filter Toolbars */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Crop Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCrop}
              onChange={(e) => {
                setSelectedCrop(e.target.value);
                if (onSelectCropFilter) onSelectCropFilter(e.target.value);
              }}
              className="bg-transparent text-slate-700 font-bold outline-none cursor-pointer text-xs"
            >
              <option value="ALL">All Crops ({logs.length} records)</option>
              {availableCrops.map((crop) => (
                <option key={crop} value={crop}>
                  {crop}
                </option>
              ))}
            </select>
          </div>

          {/* Time Window Filter */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setTimeRange('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] font-bold ${
                timeRange === 'ALL' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('RECENT_6')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] font-bold ${
                timeRange === 'RECENT_6' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Last 6
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('RECENT_4')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] font-bold ${
                timeRange === 'RECENT_4' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Last 4
            </button>
          </div>

          {/* Chart Mode Switcher Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setChartMode('trend')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                chartMode === 'trend' ? 'bg-white text-sky-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Yield Timeline
            </button>
            <button
              type="button"
              onClick={() => setChartMode('variance')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                chartMode === 'variance' ? 'bg-white text-sky-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Surplus / Deficit
            </button>
            <button
              type="button"
              onClick={() => setChartMode('cultivars')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                chartMode === 'cultivars' ? 'bg-white text-sky-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Cultivar Compare
            </button>
            <button
              type="button"
              onClick={() => setChartMode('economics')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                chartMode === 'economics' ? 'bg-white text-sky-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Net Returns ($)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Productivity Badges Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Average Yield</span>
            <Sprout className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-lg font-extrabold text-slate-800 font-mono mt-1">
            {stats.avgYield} <span className="text-xs text-slate-500 font-sans font-normal">t/ha</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
            <span>Across {chartData.length} recorded season(s)</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Target Achievement</span>
            <Target className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-lg font-extrabold text-sky-600 font-mono mt-1">
            {stats.targetAchievement}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
            <span>{stats.optimalSeasonsRatio}% of harvests met/beat goal</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Trajectory Trend</span>
            {stats.growthTrend >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
            )}
          </div>
          <div className={`text-lg font-extrabold font-mono mt-1 ${stats.growthTrend >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {stats.growthTrend >= 0 ? `+${stats.growthTrend}%` : `${stats.growthTrend}%`}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
            <span>Overall productivity direction</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Cumulative Profit</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className={`text-lg font-extrabold font-mono mt-1 ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {stats.netProfit >= 0 ? `+$${stats.netProfit.toLocaleString()}` : `-$${Math.abs(stats.netProfit).toLocaleString()}`}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
            <span>Stability: <strong className="text-slate-700">{stats.stabilityScore}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Interactive Recharts Canvas */}
      <div className="h-80 w-full pt-2">
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs font-medium space-y-2 border border-dashed border-slate-200 rounded-2xl">
            <Info className="w-6 h-6 text-slate-300" />
            <p>No historical yield log entries found for current filter.</p>
          </div>
        ) : chartMode === 'trend' ? (
          /* Mode 1: Composed Area + Line Chart with Target and Moving Average */
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="yieldAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="barYieldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="season" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} unit=" t/ha" />
              <Tooltip content={<CustomTrendsTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              
              <ReferenceLine
                y={stats.avgYield}
                label={{
                  value: `Historical Avg: ${stats.avgYield} t/ha`,
                  fill: '#64748b',
                  fontSize: 10,
                  position: 'insideTopRight'
                }}
                stroke="#94a3b8"
                strokeDasharray="4 4"
              />

              {/* Shaded Area for actual harvest */}
              <Area
                type="monotone"
                dataKey="actual"
                name="Yield Density (tons/ha)"
                fill="url(#yieldAreaGradient)"
                stroke="transparent"
              />

              {/* Bar for discrete harvest event */}
              <Bar
                dataKey="actual"
                name="Actual Harvest (tons/ha)"
                fill="url(#barYieldGrad)"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />

              {/* Target Yield benchmark line */}
              <Line
                type="monotone"
                dataKey="target"
                name="Expected Target (tons/ha)"
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
              />

              {/* Optional 3-Season Moving Average Trendline */}
              {showMovingAvg && (
                <Line
                  type="monotone"
                  dataKey="movingAvg"
                  name="3-Season Moving Trend"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10b981' }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        ) : chartMode === 'variance' ? (
          /* Mode 2: Diverging Bar Chart showing Yield Surplus vs Deficit */
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="season" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} unit=" t/ha" />
              <Tooltip content={<CustomTrendsTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
              <Bar dataKey="variance" name="Surplus / Deficit vs Target (tons/ha)" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.variance >= 0 ? '#10b981' : '#f43f5e'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : chartMode === 'cultivars' ? (
          /* Mode 3: Cultivar Comparative Analysis */
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cultivarComparisonData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="crop" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} unit=" t/ha" />
              <Tooltip content={<CustomCultivarTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="avgActual" name="Avg Harvest Yield (t/ha)" fill="#0ea5e9" radius={[6, 6, 0, 0]} maxBarSize={44} />
              <Bar dataKey="avgTarget" name="Avg Target Goal (t/ha)" fill="#cbd5e1" radius={[6, 6, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          /* Mode 4: Net Economic Returns */
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 15, left: -5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="season" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} unit=" $" />
              <Tooltip content={<CustomTrendsTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="profit"
                name="Net Economic Profit / Loss ($)"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Trajectory Pattern Insights Grid */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-3">
          <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Peak Yield Period</span>
            <p className="text-xs font-bold text-emerald-950 mt-0.5">{stats.peakSeason}</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">Recorded high of {stats.peakYield} tons/ha under optimal seasonal management.</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-100 flex items-start gap-3">
          <div className="w-7 h-7 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">Top Performing Cultivar</span>
            <p className="text-xs font-bold text-sky-950 mt-0.5">{stats.topCultivar}</p>
            <p className="text-[11px] text-sky-700 mt-0.5">Demonstrates the highest average output and harvest consistency in your soil portfolio.</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
          <div className="w-7 h-7 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Productivity Pattern</span>
            <p className="text-xs font-bold text-slate-800 mt-0.5">
              {stats.growthTrend >= 0 ? `+${stats.growthTrend}% Upward Trajectory` : `${stats.growthTrend}% Yield Variance`}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              3-Season moving average indicates {stats.growthTrend >= 0 ? 'sustained yield enhancement' : 'weather volatility exposure'}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
