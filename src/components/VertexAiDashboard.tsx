import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cpu,
  Sparkles,
  Brain,
  Activity,
  LineChart,
  Globe,
  Volume2,
  Languages,
  Satellite,
  Database,
  Terminal,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  RefreshCw,
  Eye,
  FileText,
  ExternalLink,
  ChevronRight,
  Zap,
  Leaf,
  Droplets,
  Sun,
  Flame,
  HelpCircle
} from 'lucide-react';
import {
  VertexPredictiveResult,
  VertexMultimodalVisionScan,
  VertexVoiceTranslationResult,
  VertexGeospatialLayer,
  VertexBigQueryQuerySample,
  VertexPublicDataRecord,
  showToast
} from '../types';

interface VertexAiDashboardProps {
  darkMode?: boolean;
}

type VertexPillarTab = 
  | 'overview'
  | 'predictive'
  | 'vision'
  | 'voice_lang'
  | 'geospatial'
  | 'bigquery'
  | 'public_data';

export default function VertexAiDashboard({ darkMode = false }: VertexAiDashboardProps) {
  const [activePillar, setActivePillar] = useState<VertexPillarTab>('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Track 1: System Overview Status
  const [overviewData, setOverviewData] = useState<any>(null);

  // Track 2: Predictive Modelling State
  const [selectedCrop, setSelectedCrop] = useState('Wheat');
  const [nitrogenInput, setNitrogenInput] = useState(320);
  const [soilOrganicCarbon, setSoilOrganicCarbon] = useState(0.68);
  const [rainfallAmount, setRainfallAmount] = useState(650);
  const [temperatureCelsius, setTemperatureCelsius] = useState(25.0);
  const [canopyNdvi, setCanopyNdvi] = useState(0.72);
  const [predictiveResult, setPredictiveResult] = useState<VertexPredictiveResult | null>(null);

  // Track 3: Vision & Multimodal State
  const [visionScanType, setVisionScanType] = useState<'drone_multispectral' | 'citizen_photo'>('drone_multispectral');
  const [visionScanResult, setVisionScanResult] = useState<VertexMultimodalVisionScan | null>(null);
  const [isVisionScanning, setIsVisionScanning] = useState(false);

  // Track 4: Language & Voice State
  const [sourceAdvisoryText, setSourceAdvisoryText] = useState(
    'Soil moisture in the North-East quadrant is at 62%. Apply 1.5% foliar potassium spray before afternoon temperature peaks to prevent leaf dehydration.'
  );
  const [selectedTargetLang, setSelectedTargetLang] = useState('hi');
  const [translationResult, setTranslationResult] = useState<VertexVoiceTranslationResult | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Track 5: Geospatial State
  const [geospatialLayers, setGeospatialLayers] = useState<VertexGeospatialLayer[]>([]);
  const [selectedZone, setSelectedZone] = useState('Indo-Gangetic Basin');

  // Track 6: BigQuery State
  const [selectedBqPreset, setSelectedBqPreset] = useState('yield_soc_correlation');
  const [bqQueryResult, setBqQueryResult] = useState<VertexBigQueryQuerySample | null>(null);
  const [isQueryingBq, setIsQueryingBq] = useState(false);

  // Track 7: Public Open Data State
  const [publicDataFeeds, setPublicDataFeeds] = useState<VertexPublicDataRecord[]>([]);

  // Load Initial Overview & Public Data
  useEffect(() => {
    fetchOverview();
    fetchGeospatialLayers();
    fetchPublicData();
    runPredictiveYield();
    runBigQuery(selectedBqPreset);
  }, []);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/vertex/overview');
      if (res.ok) {
        const data = await res.json();
        setOverviewData(data);
      }
    } catch (e) {
      console.error('Failed to fetch Vertex AI overview', e);
    }
  };

  const runPredictiveYield = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/vertex/predict/yield', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop: selectedCrop,
          soilZone: selectedZone,
          nitrogenKgPerHa: Number(nitrogenInput),
          soilOrganicCarbonPct: Number(soilOrganicCarbon),
          rainfallMm: Number(rainfallAmount),
          averageTempCelsius: Number(temperatureCelsius),
          currentNdvi: Number(canopyNdvi)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPredictiveResult(data);
      }
    } catch (e) {
      showToast('Predictive model execution error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const runVisionAnalysis = async () => {
    setIsVisionScanning(true);
    try {
      const res = await fetch('/api/vertex/vision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanType: visionScanType,
          notes: 'AutoML edge drone feed'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setVisionScanResult(data);
        showToast('Vertex AI Vision multimodal scan complete!', 'success');
      }
    } catch (e) {
      showToast('Vision scan failed', 'error');
    } finally {
      setIsVisionScanning(false);
    }
  };

  const runTranslation = async (langCode = selectedTargetLang) => {
    setIsTranslating(true);
    try {
      const res = await fetch('/api/vertex/voice/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceAdvisoryText,
          targetLang: langCode
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTranslationResult(data);
        showToast(`Translated to ${data.targetLangNative}`, 'success');
      }
    } catch (e) {
      showToast('Translation service unavailable', 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  const playSynthesizedAudio = async (textToSpeak: string) => {
    if (!textToSpeak) return;
    setIsPlayingAudio(true);
    try {
      const res = await fetch('/api/advisory/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          audio.onended = () => setIsPlayingAudio(false);
          audio.onerror = () => setIsPlayingAudio(false);
          await audio.play();
          return;
        }
      }
      // Web Speech API fallback
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlayingAudio(false);
      }
    } catch (e) {
      setIsPlayingAudio(false);
    }
  };

  const fetchGeospatialLayers = async () => {
    try {
      const res = await fetch(`/api/vertex/geospatial/layers?region=${encodeURIComponent(selectedZone)}`);
      if (res.ok) {
        const data = await res.json();
        setGeospatialLayers(data.layers || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const runBigQuery = async (preset = selectedBqPreset) => {
    setIsQueryingBq(true);
    setSelectedBqPreset(preset);
    try {
      const res = await fetch('/api/vertex/bigquery/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryPreset: preset })
      });
      if (res.ok) {
        const data = await res.json();
        setBqQueryResult(data);
      }
    } catch (e) {
      showToast('BigQuery query failed', 'error');
    } finally {
      setIsQueryingBq(false);
    }
  };

  const fetchPublicData = async () => {
    try {
      const res = await fetch('/api/vertex/public-data/feeds');
      if (res.ok) {
        const data = await res.json();
        setPublicDataFeeds(data.feeds || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const pillarsList = [
    { id: 'overview' as const, label: 'Ecosystem Mesh', icon: Cpu, badge: 'Unified' },
    { id: 'predictive' as const, label: 'AutoML Predictive', icon: LineChart, badge: 'Yield & Pest' },
    { id: 'vision' as const, label: 'Multimodal Vision', icon: Eye, badge: 'Drone / NDVI' },
    { id: 'voice_lang' as const, label: 'Voice & Languages', icon: Languages, badge: '12+ Dialects' },
    { id: 'geospatial' as const, label: 'Geospatial (GEE)', icon: Satellite, badge: 'Earth Engine' },
    { id: 'bigquery' as const, label: 'BigQuery Analytics', icon: Database, badge: 'SQL Engine' },
    { id: 'public_data' as const, label: 'Public Open Data', icon: Globe, badge: 'Agmarknet/FAO' },
  ];

  return (
    <div className="space-y-6 w-full text-slate-800 dark:text-slate-100">
      
      {/* Header with Google Cloud / Vertex AI Branding */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white shadow-md border border-indigo-700/50">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
            <Sparkles className="w-6 h-6 text-sky-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">Google Vertex AI & Cloud Mesh</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                Live Integration
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5">
              Production architecture spanning Generative AI, AutoML tabular models, GEE geospatial raster, BigQuery, and public data.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              fetchOverview();
              fetchPublicData();
              showToast('Refreshed Vertex AI telemetry', 'info');
            }}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* 7-Track Navigation Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {pillarsList.map((p) => {
          const Icon = p.icon;
          const isActive = activePillar === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActivePillar(p.id)}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-500/50 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-sky-500'}`} />
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}>
                  {p.badge}
                </span>
              </div>
              <span className="text-xs font-bold truncate w-full">{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content Display */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        
        {/* ========================================================================= */}
        {/* 1. OVERVIEW MESH TAB */}
        {/* ========================================================================= */}
        {activePillar === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-sky-500" />
                  Vertex AI 7-Pillar Architecture Diagram & Health
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Unified enterprise mesh connecting Gemini reasoning, AutoML predictive modeling, and geospatial engines.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 self-start">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                All 7 Pipelines Healthy
              </span>
            </div>

            {/* 7 Pillars Matrix Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {overviewData?.activePillars?.map((pillar: any, idx: number) => (
                <div
                  key={pillar.id || idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-sky-400/50 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {idx + 1}. {pillar.name}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded">
                        {pillar.latencyMs}ms
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {pillar.tech?.map((t: string) => (
                        <span
                          key={t}
                          className="text-[10px] font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (pillar.id === 'genai_agents') setActivePillar('predictive');
                      else if (pillar.id === 'predictive_modelling') setActivePillar('predictive');
                      else if (pillar.id === 'vision_multimodal') setActivePillar('vision');
                      else if (pillar.id === 'language_voice') setActivePillar('voice_lang');
                      else if (pillar.id === 'geospatial') setActivePillar('geospatial');
                      else if (pillar.id === 'data_backend') setActivePillar('bigquery');
                      else if (pillar.id === 'public_data') setActivePillar('public_data');
                    }}
                    className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-500 flex items-center gap-1 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 cursor-pointer"
                  >
                    Launch Interactive Workbench <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Architecture Highlights Banner */}
            <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                <p className="text-xs text-sky-900 dark:text-sky-200">
                  <strong>Enterprise Model Garden Access:</strong> Seamlessly switch between Gemini 2.5 Flash, Gemini 2.5 Pro, and specialized tabular AutoML predictors.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. PREDICTIVE MODELLING (AUTOML TABULAR & SHAP) */}
        {/* ========================================================================= */}
        {activePillar === 'predictive' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <LineChart className="w-4 h-4 text-sky-500" />
                Vertex AI AutoML Tabular Yield & Pest Forecasting
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Simulate statistical regression models trained on multi-decade agronomic telemetry and microclimate sensors.
              </p>
            </div>

            {/* Parameter Sliders & Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Select Crop Type
                </label>
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="Wheat">Wheat (Grain)</option>
                  <option value="Rice (Paddy)">Rice (Paddy)</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Soybean">Soybean</option>
                  <option value="Maize (Corn)">Maize (Corn)</option>
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Mustard / Rapeseed">Mustard / Rapeseed</option>
                  <option value="Potato">Potato</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700 dark:text-slate-300">Soil Available Nitrogen (N)</span>
                  <span className="text-sky-500 font-mono">{nitrogenInput} kg/Ha</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="500"
                  step="10"
                  value={nitrogenInput}
                  onChange={(e) => setNitrogenInput(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700 dark:text-slate-300">Soil Organic Carbon (SOC)</span>
                  <span className="text-sky-500 font-mono">{soilOrganicCarbon}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.5"
                  step="0.05"
                  value={soilOrganicCarbon}
                  onChange={(e) => setSoilOrganicCarbon(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700 dark:text-slate-300">Seasonal Rainfall</span>
                  <span className="text-sky-500 font-mono">{rainfallAmount} mm</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="1500"
                  step="50"
                  value={rainfallAmount}
                  onChange={(e) => setRainfallAmount(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700 dark:text-slate-300">Average Temperature</span>
                  <span className="text-sky-500 font-mono">{temperatureCelsius}°C</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="42"
                  step="0.5"
                  value={temperatureCelsius}
                  onChange={(e) => setTemperatureCelsius(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700 dark:text-slate-300">Canopy NDVI (Vegetation)</span>
                  <span className="text-sky-500 font-mono">{canopyNdvi}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.95"
                  step="0.02"
                  value={canopyNdvi}
                  onChange={(e) => setCanopyNdvi(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={isLoading}
                onClick={runPredictiveYield}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Execute Vertex AutoML Prediction
              </button>
            </div>

            {/* Results Output */}
            {predictiveResult && (
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">Predicted Yield</span>
                    <div className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100 mt-1">
                      {predictiveResult.predictedYieldTonsPerHa} <span className="text-xs font-normal">Tons/Ha</span>
                    </div>
                    <span className={`text-[10px] font-bold ${predictiveResult.variancePct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {predictiveResult.variancePct >= 0 ? '+' : ''}{predictiveResult.variancePct}% vs. regional baseline ({predictiveResult.baselineYieldTonsPerHa} T/Ha)
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                    <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300">Model Confidence</span>
                    <div className="text-2xl font-extrabold text-blue-900 dark:text-blue-100 mt-1">
                      {predictiveResult.confidenceScore}%
                    </div>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400">
                      R² = 0.923 on test validation fold
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                    <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">Harvest Maturity Window</span>
                    <div className="text-sm font-bold text-amber-900 dark:text-amber-100 mt-1">
                      {predictiveResult.harvestWindowEstimate}
                    </div>
                  </div>
                </div>

                {/* SHAP Feature Importance & Pest Forecast */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* SHAP drivers */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-sky-500" />
                      SHAP Explainability (Key Yield Influencers)
                    </h4>
                    <div className="space-y-2.5">
                      {predictiveResult.shapKeyDrivers?.map((driver, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between text-[11px] font-semibold mb-1">
                            <span className="text-slate-700 dark:text-slate-300">{driver.factor}</span>
                            <span className={driver.impact === 'Positive' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                              {driver.impact} ({driver.weightPct}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${driver.impact === 'Positive' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                              style={{ width: `${driver.weightPct * 3}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Outbreak Probability */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      AutoML Tabular Pest & Pathogen Risk Forecast
                    </h4>
                    <div className="space-y-3">
                      {predictiveResult.pestOutbreakProbability?.map((pest, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{pest.pestName}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">Peak window: {pest.peakWindowDays}</div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            pest.riskLevel === 'Critical'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : pest.riskLevel === 'Elevated'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {pest.riskLevel} ({pest.probabilityPct}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. MULTIMODAL VISION SCANNER */}
        {/* ========================================================================= */}
        {activePillar === 'vision' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-500" />
                Vertex AI Multimodal Vision & Drone Multispectral Scanner
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Process leaf photos, multispectral drone NDVI orthomosaics, and canopy stress maps with millimeter resolution.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setVisionScanType('drone_multispectral')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  visionScanType === 'drone_multispectral'
                    ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  <Satellite className="w-4 h-4 text-sky-500" />
                  Multispectral Drone Imagery (5-Band NDVI/NDWI)
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Analyzes NIR and Red-Edge reflectance for early canopy nitrogen chlorosis and water stress.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setVisionScanType('citizen_photo')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  visionScanType === 'citizen_photo'
                    ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  <Leaf className="w-4 h-4 text-sky-500" />
                  Macro Leaf Pathology (Citizen Smartphone Photo)
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Identifies fungal spore lesions, bacterial wilts, insect punctures, and nutrient deficiencies.
                </p>
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={isVisionScanning}
                onClick={runVisionAnalysis}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isVisionScanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Trigger Vertex Vision Analysis Pipeline
              </button>
            </div>

            {visionScanResult && (
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                      {visionScanResult.imageSource}
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                      {visionScanResult.diagnosedIssue}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Classification: {visionScanResult.pathogenOrStressType} ({visionScanResult.confidencePct}% Confidence)
                    </p>
                  </div>

                  {visionScanResult.multispectralIndices && (
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 block font-bold">NDVI</span>
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          {visionScanResult.multispectralIndices.ndvi}
                        </span>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 block font-bold">NDWI (Water)</span>
                        <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                          {visionScanResult.multispectralIndices.ndwi}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Remediation Action List */}
                <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                  <h5 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-2">
                    Actionable Agronomic Protocol (Remediation Plan)
                  </h5>
                  <div className="space-y-1.5">
                    {visionScanResult.remediationPlan?.map((plan, i) => (
                      <div key={i} className="text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{plan}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. LANGUAGE & VOICE TRANSLATION */}
        {/* ========================================================================= */}
        {activePillar === 'voice_lang' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Languages className="w-4 h-4 text-sky-500" />
                Google Cloud Translation API & Wavenet Voice Engine
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Break language barriers with real-time translation and natural neural speech synthesis in 12+ regional vernaculars.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Agronomic Advisory Prompt (English Source)
                </label>
                <textarea
                  rows={3}
                  value={sourceAdvisoryText}
                  onChange={(e) => setSourceAdvisoryText(e.target.value)}
                  className="w-full text-xs font-medium p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Regional Language Selection Grid */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Target Vernacular Dialect
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {[
                    { code: 'hi', name: 'Hindi (हिन्दी)' },
                    { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
                    { code: 'te', name: 'Telugu (తెలుగు)' },
                    { code: 'ta', name: 'Tamil (தமிழ்)' },
                    { code: 'bn', name: 'Bengali (বাংলা)' },
                    { code: 'mr', name: 'Marathi (मराठी)' },
                    { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
                    { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
                    { code: 'ml', name: 'Malayalam (മലയാളം)' },
                    { code: 'es', name: 'Spanish (Español)' },
                    { code: 'sw', name: 'Swahili (Kiswahili)' },
                    { code: 'fr', name: 'French (Français)' }
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setSelectedTargetLang(lang.code);
                        runTranslation(lang.code);
                      }}
                      className={`p-2 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer ${
                        selectedTargetLang === lang.code
                          ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-sky-400 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Translation Output Card */}
            {translationResult && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {translationResult.targetLangNative} Translation
                    </span>
                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-mono">
                      {translationResult.audioVoiceType}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isPlayingAudio}
                    onClick={() => playSynthesizedAudio(translationResult.translatedText)}
                    className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
                    {isPlayingAudio ? 'Speaking Voice...' : 'Play Audio'}
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                  {translationResult.translatedText}
                </div>

                {translationResult.phoneticSpelling && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                    Phonetic guide: "{translationResult.phoneticSpelling}"
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. GEOSPATIAL INTELLIGENCE (GOOGLE EARTH ENGINE) */}
        {/* ========================================================================= */}
        {activePillar === 'geospatial' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Satellite className="w-4 h-4 text-sky-500" />
                Google Earth Engine & Google Maps Platform Geospatial Raster
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time Sentinel-2 MSI and Landsat-9 radiometric vegetation, soil moisture, and surface drought anomaly raster.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {geospatialLayers.map((layer) => (
                <div
                  key={layer.layerId}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate">
                      {layer.name}
                    </span>
                    <span className="text-[10px] font-mono text-sky-600 bg-sky-100 dark:bg-sky-950 px-1.5 py-0.5 rounded">
                      {layer.resolutionMeters}m res
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold block">Soil Moisture Anomaly</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {layer.metrics.soilMoistureAnomalyPct >= 0 ? '+' : ''}{layer.metrics.soilMoistureAnomalyPct}%
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold block">Drought Index</span>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {layer.metrics.droughtSeverityIndex}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>Engine: {layer.sourceEngine}</span>
                    <span>Anomalies: {layer.currentAnomalyCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. BIGQUERY AGRICULTURAL ANALYTICS */}
        {/* ========================================================================= */}
        {activePillar === 'bigquery' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-500" />
                Google BigQuery National Agricultural SQL Workbench
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Query petabyte-scale national soil health, monsoon elasticity, and crop production datasets.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => runBigQuery('yield_soc_correlation')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  selectedBqPreset === 'yield_soc_correlation'
                    ? 'bg-sky-500 text-white border-sky-600'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Soil Organic Carbon vs. Yield Elasticity
              </button>
              <button
                type="button"
                onClick={() => runBigQuery('monsoon_resilience')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  selectedBqPreset === 'monsoon_resilience'
                    ? 'bg-sky-500 text-white border-sky-600'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Monsoon Drought Deficit Resilience (IMD + GEE)
              </button>
            </div>

            {bqQueryResult && (
              <div className="space-y-4">
                {/* SQL Code Block */}
                <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
                  <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
                    <span>SQL Query Executed</span>
                    <span>Scanned: {bqQueryResult.recordsScanned} | {bqQueryResult.executionTimeMs}ms</span>
                  </div>
                  <pre className="text-sky-300">{bqQueryResult.sqlQuery}</pre>
                </div>

                {/* Tabular Output */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        {Object.keys(bqQueryResult.results?.[0] || {}).map((col) => (
                          <th key={col} className="p-2.5 capitalize">{col.replace(/_/g, ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {bqQueryResult.results?.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          {Object.values(row).map((val: any, vIdx) => (
                            <td key={vIdx} className="p-2.5 text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                              {typeof val === 'number' ? val.toFixed(2) : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Insight Summary */}
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
                  <strong>BigQuery AI Insight:</strong> {bqQueryResult.insightSummary}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. PUBLIC OPEN DATA PORTALS */}
        {/* ========================================================================= */}
        {activePillar === 'public_data' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-500" />
                Public Open Data Feeds (Agmarknet, FAO, ISRO, IMD)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ground-truth market rates, global supply benchmarks, and meteorological radar data streams.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicDataFeeds.map((feed, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                        {feed.source}
                      </span>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                        {feed.title}
                      </h4>
                    </div>
                    <a
                      href={feed.officialSourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-sky-500 transition-colors"
                      title="Open source portal"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {feed.dataPoints?.map((dp, dIdx) => (
                      <div
                        key={dIdx}
                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-600 dark:text-slate-400 font-medium">{dp.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">{dp.value}</span>
                          {dp.change && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                              {dp.change}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[10px] text-slate-400 text-right">
                    {feed.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
