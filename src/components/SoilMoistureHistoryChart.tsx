import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { 
  Droplets, 
  Droplet, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Layers, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Sparkles, 
  RefreshCw,
  Waves,
  CloudRain
} from 'lucide-react';
import { WeatherData, IrrigationZone } from '../types';

interface SoilMoistureHistoryChartProps {
  weather: WeatherData;
  zones?: IrrigationZone[];
  activeLocation?: string;
}

interface MoistureDataPoint {
  id: string;
  day: string;
  shortDate: string;
  fullDate: string;
  isToday: boolean;
  rootZoneMoisture: number; // 0-10cm depth (%)
  subsurfaceMoisture: number; // 10-30cm depth (%)
  zone1Moisture: number; // North Pivot (Maize)
  zone2Moisture: number; // South Slope (Soybeans)
  zone3Moisture: number; // East Orchard (Fruit)
  zone4Moisture: number; // Nursery Bed (High-Tunnel)
  irrigationLiters: number; // Liters applied
  rainfallMm: number; // Precipitation in mm
  soilTemp: number; // °C
  irrigationApplied: boolean;
}

export default function SoilMoistureHistoryChart({
  weather,
  zones = [],
  activeLocation
}: SoilMoistureHistoryChartProps) {
  // View mode: 'depths' (0-10cm vs 10-30cm) or 'zones' (Field Quadrants A-D)
  const [viewMode, setViewMode] = useState<'depths' | 'zones'>('depths');
  
  // Toggle showing threshold bands (Field Capacity & Stress Point)
  const [showThresholds, setShowThresholds] = useState<boolean>(true);

  // Toggle showing irrigation/rainfall recharge bars
  const [showRechargeEvents, setShowRechargeEvents] = useState<boolean>(true);

  // Selected single zone highlight in zone mode ('all' | 'zone-1' | 'zone-2' | 'zone-3' | 'zone-4')
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('all');

  // Generate 7-day realistic telemetry anchored to active weather
  const chartData = useMemo<MoistureDataPoint[]>(() => {
    const todayMoisture = weather.soilMoisture || 28;
    const todaySoilTemp = weather.soilTemp || 22;
    const isRainy = weather.dayType === 'Rainy';

    // 7 day labels counting back from today
    const now = new Date();
    const days: MoistureDataPoint[] = [];

    // Predefined variance pattern over the last 7 days leading to current moisture
    const varianceOffsets = [-4.5, -2.0, +3.2, +1.8, -1.2, -2.8, 0];
    const rainOffsets = [0, 0, 8.4, 3.2, 0, 0, isRainy ? 11.5 : 0];
    const irrigationVolumes = [450, 0, 0, 520, 0, 680, 440];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isToday = i === 0;

      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = d.getDate();
      const shortDate = `${monthName} ${dayNum}`;
      const fullDate = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      const offsetIdx = 6 - i;
      const baseVal = isToday 
        ? todayMoisture 
        : Math.max(14, Math.min(52, todayMoisture + varianceOffsets[offsetIdx]));

      const rootVal = Math.round(baseVal * 10) / 10;
      const subVal = Math.round((baseVal + 3.4) * 10) / 10; // Sub-surface retains slightly more moisture
      
      const rain = rainOffsets[offsetIdx];
      const irrig = irrigationVolumes[offsetIdx];

      // Quadrant zone variances based on crop root characteristics
      const z1 = Math.round((rootVal - 1.8) * 10) / 10; // North Pivot Maize
      const z2 = Math.round((rootVal + 2.4) * 10) / 10; // South Slope
      const z3 = Math.round((rootVal + 4.1) * 10) / 10; // Deep Citrus
      const z4 = Math.round((rootVal - 3.5) * 10) / 10; // Nursery (high drain)

      const sTemp = Math.round((todaySoilTemp + (i * 0.4 - 1.2)) * 10) / 10;

      days.push({
        id: `day-${i}`,
        day: isToday ? `${dayName} (Today)` : dayName,
        shortDate,
        fullDate,
        isToday,
        rootZoneMoisture: rootVal,
        subsurfaceMoisture: subVal,
        zone1Moisture: z1,
        zone2Moisture: z2,
        zone3Moisture: z3,
        zone4Moisture: z4,
        irrigationLiters: irrig,
        rainfallMm: rain,
        soilTemp: sTemp,
        irrigationApplied: irrig > 0
      });
    }

    return days;
  }, [weather.soilMoisture, weather.soilTemp, weather.dayType]);

  // Statistics
  const avgRootMoisture = useMemo(() => {
    if (chartData.length === 0) return 0;
    const sum = chartData.reduce((acc, curr) => acc + curr.rootZoneMoisture, 0);
    return Math.round((sum / chartData.length) * 10) / 10;
  }, [chartData]);

  const sevenDayDelta = useMemo(() => {
    if (chartData.length < 2) return 0;
    const first = chartData[0].rootZoneMoisture;
    const last = chartData[chartData.length - 1].rootZoneMoisture;
    return Math.round((last - first) * 10) / 10;
  }, [chartData]);

  const totalIrrigationLiters = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.irrigationLiters, 0);
  }, [chartData]);

  const totalRainfallMm = useMemo(() => {
    return Math.round(chartData.reduce((acc, curr) => acc + curr.rainfallMm, 0) * 10) / 10;
  }, [chartData]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: MoistureDataPoint = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 text-xs min-w-[210px] space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div>
            <span className="font-bold text-slate-100">{data.day}</span>
            <p className="text-[10px] text-slate-400">{data.fullDate}</p>
          </div>
          {data.isToday && (
            <span className="bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded">
              LIVE
            </span>
          )}
        </div>

        <div className="space-y-1.5 pt-0.5">
          {viewMode === 'depths' ? (
            <>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
                  Root Zone (0-10cm):
                </span>
                <span className="font-bold text-sky-300 text-sm">{data.rootZoneMoisture}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                  Sub-surface (10-30cm):
                </span>
                <span className="font-bold text-emerald-300">{data.subsurfaceMoisture}%</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-sky-300">Quadrant A (Maize):</span>
                <span className="font-bold">{data.zone1Moisture}%</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-emerald-300">Quadrant B (Soy):</span>
                <span className="font-bold">{data.zone2Moisture}%</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-indigo-300">Quadrant C (Orchard):</span>
                <span className="font-bold">{data.zone3Moisture}%</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-amber-300">Quadrant D (Nursery):</span>
                <span className="font-bold">{data.zone4Moisture}%</span>
              </div>
            </>
          )}

          {/* Environmental Telemetry */}
          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] space-y-1 text-slate-400">
            <div className="flex justify-between">
              <span>Soil Temperature:</span>
              <span className="text-slate-200 font-semibold">{data.soilTemp}°C</span>
            </div>
            {data.irrigationLiters > 0 && (
              <div className="flex justify-between text-sky-400 font-medium">
                <span>Irrigation Applied:</span>
                <span>+{data.irrigationLiters} L</span>
              </div>
            )}
            {data.rainfallMm > 0 && (
              <div className="flex justify-between text-blue-400 font-medium">
                <span>Rainfall Infiltration:</span>
                <span>+{data.rainfallMm} mm</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-5 md:p-6 space-y-6">
      
      {/* Header & Metric Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-slate-800 tracking-tight">7-Day Soil Moisture History & Dynamics</h4>
            <span className="text-xs text-slate-400 font-medium">·</span>
            <span className="text-xs text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md font-semibold">
              Volumetric Soil Water (VWC %)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Continuous multi-depth tensiometer trends for {activeLocation || weather.name} with automated irrigation events and agronomic saturation bounds.
          </p>
        </div>

        {/* View Mode & Threshold Toggles */}
        <div className="flex items-center flex-wrap gap-2 self-start lg:self-auto">
          {/* Depth vs Zones Segmented Control */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setViewMode('depths')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'depths'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-500" />
              Soil Depths (0-30cm)
            </button>
            <button
              onClick={() => setViewMode('zones')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'zones'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Droplets className="w-3.5 h-3.5 text-emerald-500" />
              Field Quadrants (A-D)
            </button>
          </div>

          {/* Toggle Thresholds */}
          <button
            onClick={() => setShowThresholds(!showThresholds)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              showThresholds
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>Target Bands (30-45%)</span>
          </button>

          {/* Toggle Recharge Events */}
          <button
            onClick={() => setShowRechargeEvents(!showRechargeEvents)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              showRechargeEvents
                ? 'bg-sky-50 text-sky-800 border-sky-200 font-semibold'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Water Deliveries</span>
          </button>
        </div>
      </div>

      {/* 4 Telemetry Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        
        {/* Card 1: Today's Moisture */}
        <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100">
          <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider block">
            Current Moisture
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-sky-900">{weather.soilMoisture}%</span>
            <span className={`text-xs font-bold flex items-center gap-0.5 ${
              sevenDayDelta >= 0 ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              {sevenDayDelta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {sevenDayDelta >= 0 ? `+${sevenDayDelta}%` : `${sevenDayDelta}%`}
            </span>
          </div>
          <p className="text-[10px] text-sky-800/80 mt-1">vs 7 days ago ({chartData[0]?.rootZoneMoisture}%)</p>
        </div>

        {/* Card 2: 7-Day Average */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            7-Day Mean Moisture
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-900">{avgRootMoisture}%</span>
            <span className="text-[11px] text-emerald-700 font-medium">Optimal</span>
          </div>
          <p className="text-[10px] text-emerald-800/80 mt-1">Holding capacity: 45% FC</p>
        </div>

        {/* Card 3: Total Applied Irrigation */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            7-Day Irrigation Input
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-800">{totalIrrigationLiters.toLocaleString()} L</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Applied across 4 field zones</p>
        </div>

        {/* Card 4: Rainfall Infiltration */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">
            Precipitation Inflow
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-indigo-900">{totalRainfallMm} mm</span>
          </div>
          <p className="text-[10px] text-indigo-800/80 mt-1">
            {totalRainfallMm > 0 ? 'Natural storm replenishment' : 'Dry atmospheric spell'}
          </p>
        </div>

      </div>

      {/* Recharts Visualization Canvas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 md:p-5 shadow-xs space-y-3">
        
        {/* Chart Header Legend & Band Indicators */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pb-2 border-b border-slate-100">
          <div className="flex items-center flex-wrap gap-4">
            {viewMode === 'depths' ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-sky-500 inline-block shadow-2xs" />
                  <span className="font-semibold text-slate-700">Root Zone Moisture (0-10cm)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-2xs" />
                  <span className="font-semibold text-slate-700">Sub-surface Moisture (10-30cm)</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                  <span>Q-A (Maize)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Q-B (Soy)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                  <span>Q-C (Citrus)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <span>Q-D (Nursery)</span>
                </div>
              </>
            )}

            {showRechargeEvents && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-200 inline-block" />
                <span>Water Recharge Volume (L)</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <span className="w-2 h-0.5 bg-emerald-500 inline-block" />
              Optimal: 30% - 45%
            </span>
            <span className="flex items-center gap-1 text-rose-600 font-medium">
              <span className="w-2 h-0.5 bg-rose-500 inline-block" />
              Stress: &lt; 20%
            </span>
          </div>
        </div>

        {/* Responsive Container */}
        <div className="h-72 sm:h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
            >
              <defs>
                {/* Sky blue gradient for Root Zone */}
                <linearGradient id="rootMoistureGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                </linearGradient>

                {/* Emerald gradient for Subsurface */}
                <linearGradient id="subMoistureGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

              <XAxis
                dataKey="shortDate"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                dy={8}
              />

              {/* Primary Y Axis: Soil Moisture % */}
              <YAxis
                yAxisId="moisture"
                domain={[10, 55]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(val) => `${val}%`}
              />

              {/* Secondary Y Axis for Recharge Volume (Optional) */}
              {showRechargeEvents && (
                <YAxis
                  yAxisId="volume"
                  orientation="right"
                  domain={[0, 1500]}
                  hide={true}
                />
              )}

              {/* Optimal Agronomic Range Reference Line (30%) */}
              {showThresholds && (
                <ReferenceLine
                  yAxisId="moisture"
                  y={30}
                  stroke="#10b981"
                  strokeDasharray="2 2"
                  strokeWidth={1}
                  label={{
                    value: 'Optimal Lower Bound (30%)',
                    position: 'insideBottomLeft',
                    fill: '#10b981',
                    fontSize: 10,
                    fontWeight: 'bold'
                  }}
                />
              )}

              {/* Stress Threshold Reference Line (20%) */}
              {showThresholds && (
                <ReferenceLine
                  yAxisId="moisture"
                  y={20}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Stress Threshold (20%)',
                    position: 'insideBottomRight',
                    fill: '#ef4444',
                    fontSize: 10,
                    fontWeight: 'bold'
                  }}
                />
              )}

              {/* Field Capacity Reference Line (45%) */}
              {showThresholds && (
                <ReferenceLine
                  yAxisId="moisture"
                  y={45}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Field Saturation Capacity (45%)',
                    position: 'insideTopRight',
                    fill: '#10b981',
                    fontSize: 10,
                    fontWeight: 'bold'
                  }}
                />
              )}

              <Tooltip content={<CustomTooltip />} />

              {/* Irrigation Deliveries as gentle background bars */}
              {showRechargeEvents && (
                <Bar
                  yAxisId="volume"
                  dataKey="irrigationLiters"
                  fill="#bae6fd"
                  opacity={0.6}
                  radius={[6, 6, 0, 0]}
                  barSize={18}
                />
              )}

              {/* Depth View Curves */}
              {viewMode === 'depths' && (
                <>
                  <Area
                    yAxisId="moisture"
                    type="monotone"
                    dataKey="rootZoneMoisture"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#rootMoistureGradient)"
                    activeDot={{ r: 6, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
                    dot={{ r: 3.5, fill: '#0284c7', strokeWidth: 0 }}
                  />

                  <Line
                    yAxisId="moisture"
                    type="monotone"
                    dataKey="subsurfaceMoisture"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </>
              )}

              {/* Quadrant Zone Curves */}
              {viewMode === 'zones' && (
                <>
                  {(selectedZoneFilter === 'all' || selectedZoneFilter === 'zone-1') && (
                    <Line
                      yAxisId="moisture"
                      type="monotone"
                      dataKey="zone1Moisture"
                      name="Q-A (Maize)"
                      stroke="#0284c7"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#0284c7' }}
                    />
                  )}
                  {(selectedZoneFilter === 'all' || selectedZoneFilter === 'zone-2') && (
                    <Line
                      yAxisId="moisture"
                      type="monotone"
                      dataKey="zone2Moisture"
                      name="Q-B (Soy)"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#10b981' }}
                    />
                  )}
                  {(selectedZoneFilter === 'all' || selectedZoneFilter === 'zone-3') && (
                    <Line
                      yAxisId="moisture"
                      type="monotone"
                      dataKey="zone3Moisture"
                      name="Q-C (Citrus)"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#6366f1' }}
                    />
                  )}
                  {(selectedZoneFilter === 'all' || selectedZoneFilter === 'zone-4') && (
                    <Line
                      yAxisId="moisture"
                      type="monotone"
                      dataKey="zone4Moisture"
                      name="Q-D (Nursery)"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#f59e0b' }}
                    />
                  )}
                </>
              )}

            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Interpretation Note */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              Moisture levels above 45% risk nutrient leaching; levels below 20% trigger Claire AI automated soak cycles.
            </span>
          </div>
          <span className="font-semibold text-slate-700">
            Last Tensiometer Pulse: <span className="text-emerald-600 font-bold">Just now (Live)</span>
          </span>
        </div>

      </div>

    </div>
  );
}
