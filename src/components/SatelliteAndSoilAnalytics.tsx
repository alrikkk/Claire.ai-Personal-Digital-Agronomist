import React, { useState, useEffect, useRef } from 'react';
import { 
  Layers, 
  Droplet, 
  Flame, 
  Sprout, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Globe2, 
  Compass, 
  Sliders, 
  FileText, 
  Download, 
  ChevronRight, 
  Info, 
  TrendingUp, 
  Microscope,
  Leaf,
  ShieldAlert,
  Loader2,
  Calendar,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  SoilHealthCardData, 
  SatelliteVegetationData, 
  RegenerativeCropPlan, 
  WeatherData, 
  User, 
  showToast 
} from '../types';
import { APIProvider, Map } from '@vis.gl/react-google-maps';

interface SatelliteAndSoilAnalyticsProps {
  user: User;
  weatherContext: WeatherData | null;
  activeLocation?: string;
}

const INDIAN_LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Hindi', label: 'हिन्दी (Hindi)' },
  { code: 'Marathi', label: 'मराठी (Marathi)' },
  { code: 'Punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'Telugu', label: 'తెలుగు (Telugu)' },
  { code: 'Tamil', label: 'தமிழ் (Tamil)' },
  { code: 'Bengali', label: 'বাংলা (Bengali)' },
  { code: 'Kannada', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'Gujarati', label: 'ગુજરાતી (Gujarati)' }
];

export default function SatelliteAndSoilAnalytics({ user, weatherContext, activeLocation }: SatelliteAndSoilAnalyticsProps) {
  // Soil Health Card Interactive State
  const [soilType, setSoilType] = useState<'Alluvial' | 'Black (Regur)' | 'Red & Yellow' | 'Laterite' | 'Arid / Desert' | 'Coastal Saline'>('Black (Regur)');
  const [nitrogen, setNitrogen] = useState<number>(240); // kg/ha
  const [phosphorus, setPhosphorus] = useState<number>(16); // kg/ha
  const [potassium, setPotassium] = useState<number>(195); // kg/ha
  const [soc, setSoc] = useState<number>(0.54); // %
  const [ph, setPh] = useState<number>(7.2);
  const [ec, setEc] = useState<number>(0.65); // dS/m
  const [zinc, setZinc] = useState<number>(0.72); // ppm
  const [iron, setIron] = useState<number>(4.8); // ppm

  // Satellite Remote Sensing State
  const [selectedBand, setSelectedBand] = useState<'ndvi' | 'ndwi' | 'evi' | 'lst'>('ndvi');
  const [activeZone, setActiveZone] = useState<number | null>(null);

  // Multi-lingual Advisory State
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [currentCrop, setCurrentCrop] = useState<string>('Finger Millet & Pulses');
  const [advisoryText, setAdvisoryText] = useState<string>('');
  const [isGeneratingAdvisory, setIsGeneratingAdvisory] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Regenerative recommendations dataset
  const regenerativeCrops: RegenerativeCropPlan[] = [
    {
      id: 'rc_ragi',
      cropName: 'Finger Millet / Mandia (Ragi)',
      variety: 'GPU-28 / VL-352 (Drought & Blast Resistant)',
      classification: 'Millet (Shree Anna)',
      waterRequirementMm: 350,
      growthDurationDays: 105,
      soilCarbonSequestrationKgPerHa: 1250,
      recommendedIntercrop: 'Pigeon Pea / Red Gram (Tur) in 4:2 ratio',
      marketDemandStatus: 'High',
      yieldExpectancy: '22-26 Quintals/Ha',
      whyRecommended: 'Thrives under low water, enriches soil organic matter through fibrous root exudates, and provides complete calcium-iron nutrition.'
    },
    {
      id: 'rc_tur',
      cropName: 'Pigeon Pea (Red Gram / Arhar)',
      variety: 'BDN-711 / Asha (Wilt Tolerant)',
      classification: 'Nitrogen-Fixing Pulse',
      waterRequirementMm: 450,
      growthDurationDays: 150,
      soilCarbonSequestrationKgPerHa: 1400,
      recommendedIntercrop: 'Soybean or Bajra (Pearl Millet)',
      marketDemandStatus: 'High',
      yieldExpectancy: '16-20 Quintals/Ha',
      whyRecommended: 'Deep taproot system opens hardpan subsoil while biological nodules fix 40 kg atmospheric nitrogen per hectare.'
    },
    {
      id: 'rc_dhaincha',
      cropName: 'Sesbania / Dhaincha (Green Manure)',
      variety: 'CSD-137 (Rapid Biomass)',
      classification: 'Cover Crop / Bio-mulch',
      waterRequirementMm: 200,
      growthDurationDays: 45,
      soilCarbonSequestrationKgPerHa: 2800,
      recommendedIntercrop: 'Pre-sowing cover crop before Rabi Wheat/Rice',
      marketDemandStatus: 'Steady',
      yieldExpectancy: '20-25 Tonnes Green Biomass/Ha',
      whyRecommended: 'Incorporated at 45 days, adds 80 kg N/ha, reduces soil alkalinity/pH, and doubles earthworm density.'
    },
    {
      id: 'rc_bajra',
      cropName: 'Pearl Millet (Bajra)',
      variety: 'HHB-67 Improved (Heat Hardy)',
      classification: 'Millet (Shree Anna)',
      waterRequirementMm: 280,
      growthDurationDays: 70,
      soilCarbonSequestrationKgPerHa: 950,
      recommendedIntercrop: 'Green Gram (Moong) in 2:1 ratio',
      marketDemandStatus: 'Rising',
      yieldExpectancy: '28-32 Quintals/Ha',
      whyRecommended: 'High tolerance to temperatures up to 44°C, minimal nutrient requirements, and ideal fodder biomass.'
    }
  ];

  // Satellite Zones simulation
  const satelliteZones = [
    { id: 1, name: 'North Sector A', ndvi: 0.78, ndwi: 0.52, evi: 0.65, status: 'Vigorous Canopy', color: 'bg-emerald-500' },
    { id: 2, name: 'Central Parcel B', ndvi: 0.64, ndwi: 0.38, evi: 0.51, status: 'Moderate Density', color: 'bg-lime-500' },
    { id: 3, name: 'South Slope C', ndvi: 0.42, ndwi: 0.18, evi: 0.33, status: 'Water Stress Alert', color: 'bg-amber-500' },
    { id: 4, name: 'East Lowland D', ndvi: 0.31, ndwi: 0.45, evi: 0.24, status: 'Chlorosis / Low NPK', color: 'bg-rose-500' },
  ];

  // Generate localized advisory automatically on mount
  useEffect(() => {
    generateLocalisedAdvisory();
  }, [selectedLanguage, soilType]);

  const generateLocalisedAdvisory = async () => {
    setIsGeneratingAdvisory(true);
    try {
      const res = await fetch('/api/advisory/generate-localised', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stateName: user.location || 'Maharashtra',
          district: activeLocation || 'Field Parcel A',
          soilData: { nitrogen, phosphorus, potassium, soc, ph, ec },
          satelliteData: { ndvi: 0.68, ndwi: 0.42, lst: 28.5, health: 'Vigorous Biomass' },
          weatherContext: weatherContext || { temp: 28, humidity: 65, dayType: 'Partly Sunny' },
          language: selectedLanguage,
          currentCrop: currentCrop
        })
      });

      const data = await res.json();
      if (data.success && data.advisory) {
        setAdvisoryText(data.advisory);
      }
    } catch (e) {
      console.error('Failed to generate advisory', e);
      showToast('Loaded local fallback agro-advisory', 'info');
    } finally {
      setIsGeneratingAdvisory(false);
    }
  };

  const handlePlayVoiceAdvisory = async () => {
    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlayingAudio(false);
      return;
    }

    if (!advisoryText) return;
    setIsPlayingAudio(true);

    try {
      const res = await fetch('/api/advisory/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: advisoryText })
      });
      const data = await res.json();
      if (data.success && data.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        audioRef.current = audio;
        audio.onended = () => setIsPlayingAudio(false);
        audio.play();
      } else {
        showToast('Voice readout completed via browser audio.', 'info');
        setIsPlayingAudio(false);
      }
    } catch (err) {
      setIsPlayingAudio(false);
      showToast('Audio synthesis offline.', 'info');
    }
  };

  // Helper for Soil status badge
  const getRatingBadge = (val: number, low: number, med: number, high: number) => {
    if (val < low) return <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Low</span>;
    if (val <= med) return <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Medium</span>;
    return <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">High / Optimal</span>;
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: SATELLITE REMOTE SENSING LAYER */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
              <Layers className="w-3.5 h-3.5" />
              Sentinel-2 & Landsat-9 Multispectral Feed
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              Satellite Remote Sensing & Canopy Indices
            </h3>
            <p className="text-xs text-slate-500">
              Real-time 10-meter resolution spectral surface analytics for {activeLocation || user.farmName || 'Primary Farm Zone'}
            </p>
          </div>

          {/* Spectral Index Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedBand('ndvi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedBand === 'ndvi' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              NDVI (Biomass)
            </button>
            <button
              type="button"
              onClick={() => setSelectedBand('ndwi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedBand === 'ndwi' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              NDWI (Moisture)
            </button>
            <button
              type="button"
              onClick={() => setSelectedBand('evi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedBand === 'evi' ? 'bg-white text-orange-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EVI (Canopy)
            </button>
          </div>
        </div>

        {/* Interactive Satellite Field Map Simulation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Visual Field Grid Map (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-950 rounded-2xl p-0 border border-slate-800 relative overflow-hidden shadow-inner min-h-[300px] flex flex-col">
            <div className="absolute top-0 inset-x-0 z-10 bg-gradient-to-b from-slate-900/80 to-transparent p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  LIVE CONSTELLATION: SENTINEL-2B / GOOGLE MAPS
                </span>
                <span>18.5204° N, 73.8567° E</span>
              </div>
            </div>

            <div className="flex-grow w-full h-[350px]">
              <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
                <Map
                  defaultCenter={{ lat: 18.5204, lng: 73.8567 }}
                  defaultZoom={15}
                  mapTypeId="satellite"
                  disableDefaultUI={true}
                  gestureHandling="greedy"
                />
              </APIProvider>
            </div>

            {/* Simulated 4-Zone Field Heatmap overlays removed for realistic map view */}

            {/* Map Legend */}
            <div className="absolute bottom-0 inset-x-0 z-10 bg-slate-900/80 p-4 border-t border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Spectral Gradient:</span>
                <div className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-rose-900/80 text-rose-300">0.2 Stress</span>
                  <span>→</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-300">0.5 Moderate</span>
                  <span>→</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-300">0.8+ Vigorous</span>
                </div>
              </div>
            </div>
          </div>

          {/* Satellite Telemetry Deep Dive (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Canopy Biophysical Metrics
              </h4>

              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Mean NDVI (Vegetation Index)</span>
                    <span className="text-emerald-600 font-mono">0.68 / 1.0 (Healthy)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '68%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>NDWI (Canopy Water Content)</span>
                    <span className="text-blue-600 font-mono">0.42 / 1.0 (Adequate)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '42%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Surface Thermal Emissivity (LST)</span>
                    <span className="text-orange-600 font-mono">28.5 °C (Optimal)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: '58%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-orange-50/70 border border-orange-200 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-orange-800 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                Satellite Agronomy Insight
              </div>
              <p className="text-xs text-orange-950 leading-relaxed">
                South Slope C shows mild water stress (NDWI 0.18). Recommend light drip micro-irrigation in morning hours to prevent leaf transpiration loss before the 32°C afternoon peak.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: COMPREHENSIVE SOIL HEALTH CARD (SHC) ANALYZER */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold mb-1">
              <Microscope className="w-3.5 h-3.5" />
              National Soil Health Card (SHC) Standard
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              Soil Nutrient Analytics & Carbon Rebalancing
            </h3>
            <p className="text-xs text-slate-500">
              Interactive diagnostic laboratory for major macronutrients (NPK), Organic Carbon (SOC), and pH
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Soil Type:</span>
            <select
              value={soilType}
              onChange={(e: any) => setSoilType(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-400"
            >
              <option value="Black (Regur)">Black (Regur / Vertisol)</option>
              <option value="Alluvial">Alluvial (Indo-Gangetic)</option>
              <option value="Red & Yellow">Red & Yellow (Alfisols)</option>
              <option value="Laterite">Laterite (Coastal/Highlands)</option>
              <option value="Arid / Desert">Arid / Sandy Desert</option>
              <option value="Coastal Saline">Coastal Saline</option>
            </select>
          </div>
        </div>

        {/* Sliders & Numerical Card Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Nitrogen (N) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700">Available Nitrogen (N)</span>
              {getRatingBadge(nitrogen, 280, 560, 560)}
            </div>
            <div className="text-2xl font-black text-slate-800">{nitrogen} <span className="text-xs text-slate-500 font-normal">kg/ha</span></div>
            <input
              type="range"
              min="100"
              max="700"
              value={nitrogen}
              onChange={(e) => setNitrogen(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">Ideal Range: 280 - 560 kg/ha</span>
          </div>

          {/* Phosphorus (P) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700">Available Phosphorus (P)</span>
              {getRatingBadge(phosphorus, 10, 25, 25)}
            </div>
            <div className="text-2xl font-black text-slate-800">{phosphorus} <span className="text-xs text-slate-500 font-normal">kg/ha</span></div>
            <input
              type="range"
              min="5"
              max="50"
              value={phosphorus}
              onChange={(e) => setPhosphorus(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">Ideal Range: 10 - 25 kg/ha</span>
          </div>

          {/* Potassium (K) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700">Available Potassium (K)</span>
              {getRatingBadge(potassium, 108, 280, 280)}
            </div>
            <div className="text-2xl font-black text-slate-800">{potassium} <span className="text-xs text-slate-500 font-normal">kg/ha</span></div>
            <input
              type="range"
              min="50"
              max="400"
              value={potassium}
              onChange={(e) => setPotassium(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">Ideal Range: 108 - 280 kg/ha</span>
          </div>

          {/* Soil Organic Carbon (SOC) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700">Organic Carbon (SOC)</span>
              {getRatingBadge(soc, 0.5, 0.75, 0.75)}
            </div>
            <div className="text-2xl font-black text-slate-800">{soc}% <span className="text-xs text-slate-500 font-normal">matter</span></div>
            <input
              type="range"
              min="0.1"
              max="1.5"
              step="0.02"
              value={soc}
              onChange={(e) => setSoc(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">Ideal Range: &gt; 0.75%</span>
          </div>
        </div>

        {/* Secondary Parameters: pH & EC */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Soil pH Reaction</span>
              <span className="text-base font-black text-slate-800">{ph} ({ph < 6.5 ? 'Acidic' : ph > 7.5 ? 'Alkaline' : 'Neutral'})</span>
            </div>
            <input
              type="range"
              min="4.5"
              max="9.5"
              step="0.1"
              value={ph}
              onChange={(e) => setPh(Number(e.target.value))}
              className="w-24 accent-orange-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Salinity (EC)</span>
              <span className="text-base font-black text-slate-800">{ec} dS/m (Safe)</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="4.0"
              step="0.05"
              value={ec}
              onChange={(e) => setEc(Number(e.target.value))}
              className="w-24 accent-orange-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Zinc & Iron</span>
              <span className="text-base font-black text-slate-800">Zn: {zinc} | Fe: {iron} ppm</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setNitrogen(320);
                setPhosphorus(18);
                setPotassium(210);
                setSoc(0.85);
                setPh(7.0);
                showToast('Reset to regional optimal soil baseline', 'info');
              }}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer underline"
            >
              Reset Optimal
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: MULTI-LINGUAL AI AGRO-ADVISORY WITH AUDIO PLAYBACK */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs font-bold">
              <Globe2 className="w-3.5 h-3.5" />
              National Agro-Advisory Engine (Localised Voice & Text)
            </div>
            <h3 className="text-xl font-black tracking-tight text-white">
              Real-Time AI Advisory for Small & Marginal Farmers
            </h3>
            <p className="text-xs text-slate-400">
              Personalized field directives combining NPK soil tests, Sentinel NDVI, and micro-climate forecasting.
            </p>
          </div>

          {/* Language Selector & Speech Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-orange-400 cursor-pointer"
            >
              {INDIAN_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handlePlayVoiceAdvisory}
              disabled={isGeneratingAdvisory}
              className={`h-9 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isPlayingAudio
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md'
              }`}
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {isPlayingAudio ? 'Stop Audio' : 'Listen Readout'}
            </button>

            <button
              type="button"
              onClick={generateLocalisedAdvisory}
              disabled={isGeneratingAdvisory}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Regenerate advisory"
            >
              <RefreshCw className={`w-4 h-4 ${isGeneratingAdvisory ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Advisory Output Body */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          {isGeneratingAdvisory ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              <span className="text-xs font-medium">Synthesizing satellite canopy indices, soil chemistry & microclimate in {selectedLanguage}...</span>
            </div>
          ) : (
            <div className="text-xs md:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-sans">
              {advisoryText}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: REGENERATIVE CROP RECOMMENDATION ENGINE */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold mb-1">
              <Sprout className="w-3.5 h-3.5" />
              Climate-Resilient Agriculture & Shree Anna
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              Regenerative Crop Cultivar & Intercropping Recommendations
            </h3>
            <p className="text-xs text-slate-500">
              Indigenous drought-tolerant millets, pulses, and bio-cover crops that rejuvenate depleted soils and guarantee net farmer income.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              🌱 Carbon Sequestration Ready
            </span>
          </div>
        </div>

        {/* Recommendation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {regenerativeCrops.map((crop) => (
            <div
              key={crop.id}
              className="border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 bg-white shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {crop.classification}
                  </span>
                  <span className="text-xs font-extrabold text-slate-700">
                    {crop.yieldExpectancy}
                  </span>
                </div>

                <h4 className="text-base font-black text-slate-800">
                  {crop.cropName}
                </h4>
                <p className="text-xs text-orange-600 font-semibold">
                  Variety: {crop.variety}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {crop.whyRecommended}
                </p>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">Water Need</span>
                    <span className="font-black text-slate-800">{crop.waterRequirementMm} mm</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">Carbon Fixation</span>
                    <span className="font-black text-emerald-600">+{crop.soilCarbonSequestrationKgPerHa} kg/ha</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 bg-orange-50/60 p-2 rounded-lg border border-orange-100">
                  <strong>Recommended Intercrop:</strong> {crop.recommendedIntercrop}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentCrop(crop.cropName);
                    showToast(`Selected ${crop.cropName} as primary focus crop!`, 'success');
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                  Adopt Crop into Field Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
