import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Sparkles,
  TrendingUp,
  Clock,
  Droplets,
  Thermometer,
  ShieldAlert,
  Sprout,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Sun,
  Flame,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Compass,
  Wind,
  Info,
  CalendarCheck,
  CalendarDays,
  Activity,
  Award,
  Zap,
  Filter,
  Sliders,
  ChevronDown,
  Loader2,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ReferenceDot,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { WeatherData, Project, User, showToast, CropGrowthPredictionResult, GrowthStageTimelineItem } from '../types';

interface CropGrowthPredictionModuleProps {
  weather: WeatherData | null;
  activeLocation?: string;
  user?: User | null;
  projects?: Project[];
  className?: string;
}

const COMMON_CROPS = [
  { name: 'Maize', defaultVariety: 'DKC 90-89 Drought-Shield', category: 'Cereals', baseDays: 110, icon: '🌽' },
  { name: 'Wheat', defaultVariety: 'HD-2967 High-Harvest', category: 'Cereals', baseDays: 125, icon: '🌾' },
  { name: 'Tomatoes', defaultVariety: 'Ansal F1 Heat-Resistant', category: 'Vegetables', baseDays: 85, icon: '🍅' },
  { name: 'Soybean', defaultVariety: 'JS-335 Nitrogen-Fixer', category: 'Legumes', baseDays: 95, icon: '🌱' },
  { name: 'Beans', defaultVariety: 'KAT B1 Rosecoco Yellow', category: 'Legumes', baseDays: 70, icon: '🫘' },
  { name: 'Sorghum', defaultVariety: 'Serena KSE-15 Dryland', category: 'Cereals', baseDays: 90, icon: '🌿' },
  { name: 'Potato', defaultVariety: 'Kufri Jyoti Early Blight Resistant', category: 'Tubers', baseDays: 90, icon: '🥔' },
  { name: 'Cotton', defaultVariety: 'Bt RCH-2 Long Staple', category: 'Fiber', baseDays: 150, icon: '☁️' }
];

export default function CropGrowthPredictionModule({
  weather,
  activeLocation = 'Nairobi',
  user,
  projects = [],
  className = ''
}: CropGrowthPredictionModuleProps) {
  // Selected crop & custom parameters
  const [selectedCrop, setSelectedCrop] = useState<string>('Maize');
  const [selectedVariety, setSelectedVariety] = useState<string>('DKC 90-89 Drought-Shield');
  
  // Default planting date to 38 days ago
  const defaultPlanting = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 38);
    return d.toISOString().split('T')[0];
  }, []);

  const [plantingDate, setPlantingDate] = useState<string>(defaultPlanting);
  const [soilType, setSoilType] = useState<string>('Clay Loam');
  const [irrigationType, setIrrigationType] = useState<string>('Drip Irrigation (Automated)');
  const [fieldNotes, setFieldNotes] = useState<string>('Split basal fertilizer applied at sowing.');

  // UI state
  const [prediction, setPrediction] = useState<CropGrowthPredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [timelineViewMode, setTimelineViewMode] = useState<'timeline' | 'chart' | 'gdd'>('timeline');
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(false);

  // Sync crop variety when selectedCrop changes
  const handleCropChange = (newCrop: string) => {
    setSelectedCrop(newCrop);
    const matched = COMMON_CROPS.find(c => c.name.toLowerCase() === newCrop.toLowerCase());
    if (matched) {
      setSelectedVariety(matched.defaultVariety);
    }
  };

  // Prepopulate from projects if any match
  useEffect(() => {
    if (projects.length > 0 && selectedCrop === 'Maize') {
      const firstProject = projects[0];
      if (firstProject.crop) {
        setSelectedCrop(firstProject.crop);
        const matched = COMMON_CROPS.find(c => c.name.toLowerCase().includes(firstProject.crop.toLowerCase()));
        if (matched) setSelectedVariety(matched.defaultVariety);
      }
    }
  }, [projects]);

  // Fetch prediction from Gemini server endpoint
  const fetchPrediction = async (showNotification = false) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/crop-growth/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropName: selectedCrop,
          cropVariety: selectedVariety,
          plantingDate,
          location: activeLocation,
          weather,
          soilType,
          irrigationType,
          fieldNotes
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        setPrediction(resJson.data);
        setActiveStageIndex(resJson.data.currentStageIndex || 0);
        if (showNotification) {
          showToast(
            `Gemini modeled maturity timeline for ${selectedCrop} (${resJson.data.totalMaturityDays} days total cycle)`,
            'success'
          );
        }
      } else {
        throw new Error(resJson.error || 'Failed to process growth prediction.');
      }
    } catch (err: any) {
      console.error('Error fetching growth prediction:', err);
      showToast('Could not refresh growth prediction. Please check network connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on mount or when location / crop changes
  useEffect(() => {
    fetchPrediction(false);
  }, [selectedCrop, plantingDate, activeLocation]);

  // Recharts phenological curve dataset
  const chartData = useMemo(() => {
    if (!prediction || !prediction.stages) return [];
    return prediction.stages.map((st, idx) => ({
      stageName: st.stageName,
      stageShort: st.stageCode,
      faoStage: st.faoStage,
      dayMid: Math.round((st.dayStart + st.dayEnd) / 2),
      dayRange: `Day ${st.dayStart}-${st.dayEnd}`,
      biomassPct: st.biomassPct,
      canopyCoverPct: st.canopyCoverPct,
      kcFactor: Math.round(st.kcFactor * 100),
      waterMm: st.waterRequirementMm,
      gdd: st.gddAccumulated,
      status: st.status,
      isCurrent: st.status === 'current'
    }));
  }, [prediction]);

  return (
    <div className={`bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden ${className}`}>
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-5 sm:p-6 relative overflow-hidden">
        {/* Glow backdrop decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                Gemini Multimodal Agronomy Engine
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                • FAO-56 Phenology + Thermal Units
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>🌱</span>
              Growth Prediction & Crop Maturity Timelines
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Dynamically projects crop maturity stages, growing degree days (GDD), and harvest readiness dates by fusing live meteorological telemetry with biological planting benchmarks.
            </p>
          </div>

          {/* Quick Action Button & Config Toggle */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={() => setShowConfigDrawer(!showConfigDrawer)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 ${
                showConfigDrawer
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/40'
                  : 'bg-white/10 hover:bg-white/15 text-slate-200 border-white/15'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showConfigDrawer ? 'Hide Parameters' : 'Tune Planting Parameters'}</span>
            </button>

            <button
              onClick={() => fetchPrediction(true)}
              disabled={isLoading}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Modeling...' : 'Re-Run Prediction'}</span>
            </button>
          </div>
        </div>

        {/* Selected Crop & Climate Snapshot Bar */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Crop & Variety</span>
            <span className="text-xs sm:text-sm font-bold text-emerald-300 truncate block">
              {prediction?.cropName || selectedCrop}
            </span>
            <span className="text-[10px] text-slate-400 truncate block">
              {prediction?.cropVariety || selectedVariety}
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Planting Date</span>
            <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-400" />
              {plantingDate}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">
              {prediction?.daysSincePlanting ?? 0} days elapsed
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projected Harvest</span>
            <span className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-1">
              <CalendarCheck className="w-3 h-3 text-amber-400" />
              {prediction?.estimatedHarvestDate || 'Calculating...'}
            </span>
            <span className="text-[10px] text-slate-400">
              Total {prediction?.totalMaturityDays ?? 110} days
            </span>
          </div>

          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">GDD Thermal Pace</span>
            <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" />
              {prediction?.accumulatedGdd ?? 0} GDD
            </span>
            <span className={`text-[10px] font-semibold ${
              prediction?.gddPaceAssessment === 'ahead' ? 'text-emerald-400' :
              prediction?.gddPaceAssessment === 'delayed' ? 'text-amber-400' : 'text-sky-400'
            }`}>
              {prediction?.gddPaceAssessment === 'ahead' ? '▲ Accelerated pace' :
               prediction?.gddPaceAssessment === 'delayed' ? '▼ Slow thermal gain' : '● On regional target'}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-4 md:col-span-1 bg-white/5 rounded-xl p-2.5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Maturity</span>
              <span className="text-xs font-bold text-emerald-400">
                {prediction?.overallMaturityProgressPct ?? 0}%
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-1.5 border border-white/10">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, prediction?.overallMaturityProgressPct ?? 0)}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-400 mt-1 truncate">
              Stage {prediction ? prediction.currentStageIndex + 1 : 1} of 5 Active
            </span>
          </div>
        </div>
      </div>

      {/* Collapsible Parameter Tuning Drawer */}
      <AnimatePresence>
        {showConfigDrawer && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-b border-emerald-100 bg-emerald-50/40 p-5 overflow-hidden"
          >
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                  Field & Planting Parameters Customizer
                </h4>
                <span className="text-[11px] text-slate-500">
                  Modifying inputs triggers real-time biological recalibration
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Crop Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Target Crop Species
                  </label>
                  <select
                    value={selectedCrop}
                    onChange={(e) => handleCropChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                  >
                    {COMMON_CROPS.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.icon} {c.name} ({c.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cultivar / Variety */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Cultivar / Hybrid Seed
                  </label>
                  <input
                    type="text"
                    value={selectedVariety}
                    onChange={(e) => setSelectedVariety(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                    placeholder="e.g. DKC 90-89 Drought-Shield"
                  />
                </div>

                {/* Planting Date Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Actual Sowing Date
                  </label>
                  <input
                    type="date"
                    value={plantingDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setPlantingDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                  />
                </div>

                {/* Soil Matrix */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Soil Texture & Type
                  </label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                  >
                    <option value="Clay Loam">Clay Loam (Balanced CEC)</option>
                    <option value="Sandy Loam">Sandy Loam (Rapid Drainage)</option>
                    <option value="Silt Loam">Silt Loam (High Field Capacity)</option>
                    <option value="Black Cotton Soil">Black Cotton / Vertisol (High Swelling)</option>
                    <option value="Red Laterite">Red Laterite (Low Phosphorus)</option>
                  </select>
                </div>
              </div>

              {/* Advanced Irrigation & Notes Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Water Supply System
                  </label>
                  <select
                    value={irrigationType}
                    onChange={(e) => setIrrigationType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                  >
                    <option value="Drip Irrigation (Automated)">Drip Irrigation (Automated Valve Scheduling)</option>
                    <option value="Micro-Sprinkler Overhead">Micro-Sprinkler Overhead</option>
                    <option value="Furrow / Basin Surface">Furrow / Basin Surface</option>
                    <option value="Rainfed (Non-irrigated)">Rainfed (Dependent on Seasonal Rains)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Agronomic Observation / Fertilizer Records
                  </label>
                  <input
                    type="text"
                    value={fieldNotes}
                    onChange={(e) => setFieldNotes(e.target.value)}
                    placeholder="e.g. Inoculated with Rhizobium, top-dressed with CAN at day 28..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200/60">
                <button
                  type="button"
                  onClick={() => {
                    setPlantingDate(defaultPlanting);
                    setSoilType('Clay Loam');
                    setIrrigationType('Drip Irrigation (Automated)');
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={() => {
                    fetchPrediction(true);
                    setShowConfigDrawer(false);
                  }}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Apply & Recalculate Timeline
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Body: Mode Tabs & Stage Lifecycle */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Navigation Tabs (Timeline vs Recharts Curve vs Thermal GDD) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTimelineViewMode('timeline')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                timelineViewMode === 'timeline'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
              <span>Phenological Stage Cards</span>
            </button>

            <button
              onClick={() => setTimelineViewMode('chart')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                timelineViewMode === 'chart'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Biomass & Water Demand Curve</span>
            </button>

            <button
              onClick={() => setTimelineViewMode('gdd')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                timelineViewMode === 'gdd'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>Climate Heat Stress Analysis</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Completed
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" /> Active Stage
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Upcoming
            </span>
          </div>
        </div>

        {/* VIEW 1: Interactive Phenological Timeline Cards */}
        {timelineViewMode === 'timeline' && (
          <div className="space-y-5">
            {/* Horizontal Timeline Flow Tracker */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {(prediction?.stages || []).map((stage, idx) => {
                const isSelected = activeStageIndex === idx;
                const isCurrent = stage.status === 'current';
                const isCompleted = stage.status === 'completed';

                return (
                  <button
                    key={stage.stageName}
                    onClick={() => setActiveStageIndex(idx)}
                    className={`text-left p-3.5 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-md'
                        : isCurrent
                        ? 'border-amber-400 bg-amber-50/30 hover:border-amber-500'
                        : isCompleted
                        ? 'border-emerald-200 bg-white hover:border-emerald-300'
                        : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
                    }`}
                  >
                    {/* Top status indicator */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCurrent
                          ? 'bg-amber-500 text-white font-black animate-pulse'
                          : isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isCurrent ? 'ACTIVE NOW' : isCompleted ? 'DONE' : `STAGE ${idx + 1}`}
                      </span>

                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {stage.stageCode}
                      </span>
                    </div>

                    <div className="space-y-1 my-1">
                      <h5 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">
                        {stage.stageName}
                      </h5>
                      <span className="text-[11px] text-slate-500 block">
                        Day {stage.dayStart} – {stage.dayEnd}
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-medium">Est. {stage.estimatedDate}</span>
                      <span className="font-bold text-emerald-700">{stage.biomassPct}% Bio</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detailed Selected Stage Inspection Card */}
            {prediction && prediction.stages && prediction.stages[activeStageIndex] && (
              (() => {
                const currentStage = prediction.stages[activeStageIndex];
                return (
                  <motion.div
                    key={currentStage.stageName}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-600 text-white">
                            Stage {activeStageIndex + 1} of 5 • {currentStage.faoStage}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            Code: {currentStage.stageCode}
                          </span>
                          {currentStage.status === 'current' && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-md border border-amber-300">
                              Currently in Progress
                            </span>
                          )}
                        </div>
                        <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                          {currentStage.stageName}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 text-xs bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs self-start md:self-auto">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">Estimated Milestone</span>
                          <span className="font-bold text-slate-800">{currentStage.estimatedDate}</span>
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">Day Range</span>
                          <span className="font-bold text-emerald-700">Day {currentStage.dayStart} to {currentStage.dayEnd}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stage Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-sky-500" /> Water Requirement
                        </span>
                        <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                          {currentStage.waterRequirementMm} mm / day
                        </span>
                        <span className="text-[10px] text-slate-500">
                          FAO Kc factor: {currentStage.kcFactor}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-500" /> Heat Target (GDD)
                        </span>
                        <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                          +{currentStage.gddAccumulated} GDD
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Base threshold 10°C
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Sprout className="w-3 h-3 text-emerald-500" /> Cumulative Biomass
                        </span>
                        <span className="text-sm font-bold text-emerald-700 mt-0.5 block">
                          {currentStage.biomassPct}% max
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Canopy Cover: {currentStage.canopyCoverPct}%
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-500" /> Key Nutrients
                        </span>
                        <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
                          {currentStage.criticalNutrients.join(', ')}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Critical uptake window
                        </span>
                      </div>
                    </div>

                    {/* Action Tips & Biological Vulnerability */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5 space-y-1.5">
                        <h5 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Agronomic Field Interventions for this Stage
                        </h5>
                        <ul className="space-y-1 text-xs text-emerald-800 list-disc list-inside">
                          {currentStage.fieldActionTips.map((tip, i) => (
                            <li key={i} className="leading-relaxed">{tip}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3.5 space-y-1.5">
                        <h5 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                          Key Risks & Pathogen Vulnerabilities
                        </h5>
                        <ul className="space-y-1 text-xs text-amber-800 list-disc list-inside">
                          {currentStage.keyRisks.map((risk, i) => (
                            <li key={i} className="leading-relaxed">{risk}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                );
              })()
            )}
          </div>
        )}

        {/* VIEW 2: Recharts Biomass Accumulation & Water Demand Curve */}
        {timelineViewMode === 'chart' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Phenological Growth Trajectory (Biomass % & FAO Kc Factor)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Visualizes cumulative biological mass and daily crop evapotranspiration coefficient across stages
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <span className="w-3 h-0.5 bg-emerald-600" /> Biomass Accumulation (%)
                </span>
                <span className="flex items-center gap-1 font-semibold text-sky-700">
                  <span className="w-3 h-0.5 bg-sky-500" /> Water Demand (mm/day)
                </span>
              </div>
            </div>

            <div className="h-72 w-full bg-slate-50/50 rounded-2xl border border-slate-200/80 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 15, right: 25, bottom: 25, left: 0 }}>
                  <defs>
                    <linearGradient id="biomassAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="waterBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#0284C7" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

                  <XAxis
                    dataKey="stageShort"
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />

                  <YAxis
                    yAxisId="left"
                    domain={[0, 100]}
                    unit="%"
                    tick={{ fontSize: 11, fill: '#059669' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />

                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 10]}
                    unit=" mm"
                    tick={{ fontSize: 11, fill: '#0284c7' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />

                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl border border-white/10 shadow-xl text-xs space-y-1">
                          <p className="font-bold text-emerald-400">{data.stageName} ({data.stageShort})</p>
                          <p className="text-[11px] text-slate-300">{data.dayRange} • {data.faoStage}</p>
                          <div className="border-t border-white/10 pt-1.5 mt-1 space-y-0.5">
                            <p className="text-emerald-300 font-semibold">Biomass: {data.biomassPct}%</p>
                            <p className="text-sky-300 font-semibold">Water Need: {data.waterMm} mm/day</p>
                            <p className="text-amber-300 font-semibold">Accumulated GDD: {data.gdd} units</p>
                            <p className="text-slate-400 text-[10px]">Crop Factor (Kc): {(data.kcFactor / 100).toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    }}
                  />

                  <Bar
                    yAxisId="right"
                    dataKey="waterMm"
                    name="Daily Water Demand"
                    fill="url(#waterBarGrad)"
                    radius={[6, 6, 0, 0]}
                    barSize={28}
                  />

                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="biomassPct"
                    name="Biomass Accumulation"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fill="url(#biomassAreaGrad)"
                  />

                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="canopyCoverPct"
                    name="Canopy Coverage %"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ fill: '#F59E0B', r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* VIEW 3: Climate Heat Units & Thermal Adjustments */}
        {timelineViewMode === 'gdd' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Microclimate & Evapotranspiration Adjustments
              </h4>
              <p className="text-[11px] text-slate-500">
                How live field telemetry (temperature, moisture, humidity) shifts the physiological maturity clock
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(prediction?.climateAdjustments || []).map((adj, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    adj.severity === 'favorable'
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : adj.severity === 'warning'
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800">
                      {adj.parameter}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      adj.severity === 'favorable'
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-amber-200 text-amber-800'
                    }`}>
                      {adj.impactOnMaturity}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed my-1">
                    {adj.explanation}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Field Observed: <strong className="text-slate-800">{adj.observedValue}</strong></span>
                    <span>Climate Norm: <strong className="text-slate-800">{adj.baselineNormal}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            {/* Yield Impact Card */}
            {prediction?.yieldExpectation && (
              <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Model Yield Projection
                  </span>
                  <div className="flex items-baseline gap-2">
                    <h5 className="text-2xl font-black text-white">
                      {prediction.yieldExpectation.projectedYieldTonsHa} <span className="text-sm font-normal text-slate-300">Tons / Ha</span>
                    </h5>
                    <span className="text-xs font-bold text-emerald-400">
                      (+{prediction.yieldExpectation.variancePct}% vs {prediction.yieldExpectation.baselineYieldTonsHa} baseline)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Limiting Variable: <strong className="text-amber-300">{prediction.yieldExpectation.limitingFactor}</strong>
                  </p>
                </div>

                <div className="bg-white/10 px-4 py-3 rounded-xl border border-white/10 shrink-0 text-right">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Estimated Harvest Window</span>
                  <span className="text-sm font-bold text-amber-300">
                    {prediction.harvestWindow.earlyDate} – {prediction.harvestWindow.lateDate}
                  </span>
                  <span className="block text-[10px] text-slate-400">Optimal: {prediction.harvestWindow.optimalDate}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Agronomist Synthesis Banner */}
        {prediction?.aiAgronomistSynthesis && (
          <div className="bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/80 border border-emerald-200 rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Claire.ai Agronomic Growth Synthesis
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    Generated by Gemini 3.8 Flash • Confidence: {prediction.confidenceScore}%
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                Active Protocol Validated
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              {prediction.aiAgronomistSynthesis.summary}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-sky-800 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-sky-600" />
                  Water & Soil Moisture Directive:
                </span>
                <p className="text-slate-600 leading-relaxed">
                  {prediction.aiAgronomistSynthesis.irrigationStrategy}
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-amber-800 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  Pathogen & Disease Vulnerability:
                </span>
                <p className="text-slate-600 leading-relaxed">
                  {prediction.aiAgronomistSynthesis.pestDiseaseVulnerability}
                </p>
              </div>
            </div>

            <div className="bg-emerald-950 text-white p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] shrink-0">
                  ⚡ Immediate Action:
                </span>
                <span className="text-slate-200 font-medium">
                  {prediction.aiAgronomistSynthesis.immediateActionItem}
                </span>
              </div>

              <button
                onClick={() => {
                  showToast(`Copied agronomy recommendations for ${selectedCrop} to clipboard!`, 'success');
                  navigator.clipboard?.writeText(prediction.aiAgronomistSynthesis.summary + '\n\nDirective: ' + prediction.aiAgronomistSynthesis.immediateActionItem);
                }}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[11px] font-semibold text-slate-200 shrink-0 transition-colors"
              >
                Copy Action Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
