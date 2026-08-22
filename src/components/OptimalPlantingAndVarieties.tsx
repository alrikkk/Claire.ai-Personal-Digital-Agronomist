import React, { useState } from 'react';
import { 
  Sprout, 
  Calendar, 
  Thermometer, 
  Droplets, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  AlertCircle, 
  TrendingUp, 
  ShieldCheck, 
  Leaf, 
  Plus, 
  Loader2, 
  Bot, 
  Info, 
  Filter, 
  Layers, 
  Sun,
  X,
  Copy,
  Check
} from 'lucide-react';
import { WeatherData, Project, User, showToast } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { getApiConfigHeaders } from '../utils/apiConfig';

interface VarietyRecommendation {
  id: string;
  crop: string;
  varietyName: string;
  category: 'Cereals' | 'Legumes' | 'Vegetables' | 'Roots';
  maturityDays: number;
  potentialYield: string;
  idealTempRange: [number, number]; // [min, max] °C
  idealSoilTempRange: [number, number];
  minSoilMoisture: number; // % VWC
  keyTraits: string[];
  spacing: string;
  depth: string;
  agronomistNote: string;
}

const CROP_VARIETIES_DATABASE: VarietyRecommendation[] = [
  {
    id: 'maize-dkc9089',
    crop: 'Maize',
    varietyName: 'DKC 90-89 Drought-Shield Hybrid',
    category: 'Cereals',
    maturityDays: 105,
    potentialYield: '38 - 44 Bags/Acre',
    idealTempRange: [20, 32],
    idealSoilTempRange: [18, 30],
    minSoilMoisture: 25,
    keyTraits: ['Drought Tolerant', 'Fall Armyworm Resistance', 'Flint Grain Quality'],
    spacing: '75 cm x 25 cm',
    depth: '5 cm',
    agronomistNote: 'Thrives in mid-altitude zones. Excellent stalk strength prevents lodging during late-season winds.'
  },
  {
    id: 'maize-h6214',
    crop: 'Maize',
    varietyName: 'H6214 Highland Super-Yield',
    category: 'Cereals',
    maturityDays: 140,
    potentialYield: '45 - 55 Bags/Acre',
    idealTempRange: [15, 26],
    idealSoilTempRange: [14, 24],
    minSoilMoisture: 30,
    keyTraits: ['Highland Adapted', 'Heavy Cob Weight', 'Blight Immunity'],
    spacing: '75 cm x 30 cm',
    depth: '5 cm',
    agronomistNote: 'Ideal for cooler altitudes above 1,500m. Requires well-drained soil with adequate nitrogen at top-dressing.'
  },
  {
    id: 'beans-katb1',
    crop: 'Beans',
    varietyName: 'KAT B1 Rosecoco (Yellow Bean)',
    category: 'Legumes',
    maturityDays: 65,
    potentialYield: '12 - 16 Bags/Acre',
    idealTempRange: [18, 29],
    idealSoilTempRange: [16, 28],
    minSoilMoisture: 20,
    keyTraits: ['Ultra-Short Season', 'Nitrogen Fixing', 'Heat Tolerant'],
    spacing: '50 cm x 10 cm',
    depth: '3 cm',
    agronomistNote: 'Fast 65-day harvest window. Perfect fit for quick rain cycles or intercropping with young maize.'
  },
  {
    id: 'sorghum-kse15',
    crop: 'Sorghum',
    varietyName: 'Serena KSE-15 Dryland Sorghum',
    category: 'Cereals',
    maturityDays: 90,
    potentialYield: '25 - 32 Bags/Acre',
    idealTempRange: [22, 36],
    idealSoilTempRange: [20, 34],
    minSoilMoisture: 15,
    keyTraits: ['Extreme Heat Shield', 'Bird Tolerant Red Grain', 'Low Water Requirement'],
    spacing: '60 cm x 15 cm',
    depth: '2.5 cm',
    agronomistNote: 'Exceptional performance in arid/semi-arid soils where soil moisture drops below 20% VWC.'
  },
  {
    id: 'tomato-ansalf1',
    crop: 'Tomatoes',
    varietyName: 'Ansal F1 Heat & Wilt Resistant',
    category: 'Vegetables',
    maturityDays: 75,
    potentialYield: '30 - 35 Tons/Acre',
    idealTempRange: [21, 31],
    idealSoilTempRange: [18, 28],
    minSoilMoisture: 35,
    keyTraits: ['Bacterial Wilt Immune', 'Firm Shelf-Life Fruits', 'Indeterminate Yield'],
    spacing: '60 cm x 45 cm',
    depth: 'Nursery seedling transplant (0.5cm seed)',
    agronomistNote: 'Requires steady rootzone moisture. Mulch well to maintain soil temperature below 28°C.'
  },
  {
    id: 'wheat-eldo',
    crop: 'Wheat',
    varietyName: 'Eldo-Mavuno Short-Duration Wheat',
    category: 'Cereals',
    maturityDays: 110,
    potentialYield: '28 - 34 Bags/Acre',
    idealTempRange: [14, 24],
    idealSoilTempRange: [12, 22],
    minSoilMoisture: 25,
    keyTraits: ['Stem Rust Resistant', 'High Baking Quality', 'Uniform Tiller Density'],
    spacing: '20 cm row drill',
    depth: '3 cm',
    agronomistNote: 'Perform soil compaction test prior to drilling. Early weed suppression is crucial in first 21 days.'
  },
  {
    id: 'sweetpotato-kabode',
    crop: 'Sweet Potato',
    varietyName: 'Kabode Orange-Fleshed (OFSP)',
    category: 'Roots',
    maturityDays: 100,
    potentialYield: '14 - 18 Tons/Acre',
    idealTempRange: [20, 32],
    idealSoilTempRange: [18, 30],
    minSoilMoisture: 20,
    keyTraits: ['Pro-Vitamin A Enriched', 'Weevil Tolerant', 'Low Input Required'],
    spacing: '100 cm ridge x 30 cm vine',
    depth: 'Mounded vines (15cm depth)',
    agronomistNote: 'Plant on raised ridges or mounds to facilitate tuber expansion and avoid waterlogging.'
  },
  {
    id: 'cabbage-gloria',
    crop: 'Cabbage',
    varietyName: 'Gloria F1 Hybrid Heavy Head',
    category: 'Vegetables',
    maturityDays: 80,
    potentialYield: '40 - 50 Tons/Acre',
    idealTempRange: [16, 26],
    idealSoilTempRange: [15, 25],
    minSoilMoisture: 35,
    keyTraits: ['Black Rot Tolerant', 'Solid Field Holdability', 'Uniform Head Size'],
    spacing: '60 cm x 45 cm',
    depth: 'Transplant 4-week nursery plugs',
    agronomistNote: 'Sustained moisture essential during head formation. Apply calcium ammonium nitrate (CAN) top-dress at week 3.'
  }
];

interface OptimalPlantingAndVarietiesProps {
  weather: WeatherData;
  projects?: Project[];
  user?: User | null;
  onSelectLocation?: (location: string) => void;
  onRefreshProjects?: () => void;
}

export function OptimalPlantingAndVarieties({ 
  weather, 
  projects = [], 
  user,
  onSelectLocation,
  onRefreshProjects
}: OptimalPlantingAndVarietiesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSeasonGoal, setSelectedSeasonGoal] = useState<'immediate' | 'early_rain' | 'irrigated'>('immediate');
  
  // Modal / Drawer state for AI Sowing Plan
  const [aiGuideVariety, setAiGuideVariety] = useState<VarietyRecommendation | null>(null);
  const [aiPlanOutput, setAiPlanOutput] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Quick project creation state
  const [isCreatingProject, setIsCreatingProject] = useState<boolean>(false);
  const [projectToRegister, setProjectToRegister] = useState<VarietyRecommendation | null>(null);
  const [customFieldName, setCustomFieldName] = useState<string>('');
  const [isSubmittingProject, setIsSubmittingProject] = useState<boolean>(false);

  // Calculate Planting Readiness Index (0 - 100) based on current weather telemetry
  const calculatePlantingReadiness = (w: WeatherData) => {
    let score = 70; // Baseline

    // Soil Temperature evaluation (ideal 18-28°C)
    if (w.soilTemp >= 18 && w.soilTemp <= 28) {
      score += 15;
    } else if (w.soilTemp >= 14 && w.soilTemp < 18) {
      score += 5;
    } else if (w.soilTemp < 12 || w.soilTemp > 34) {
      score -= 20;
    }

    // Soil Moisture evaluation (ideal 25-45% VWC)
    if (w.soilMoisture >= 25 && w.soilMoisture <= 45) {
      score += 15;
    } else if (w.soilMoisture >= 18 && w.soilMoisture < 25) {
      score += 5;
    } else if (w.soilMoisture < 15) {
      score -= 15; // Too dry
    } else if (w.soilMoisture > 55) {
      score -= 10; // Saturated
    }

    // Day type / Rain check
    if (w.dayType === 'Rainy') {
      score += 5; // Rain provides immediate moisture boost for planting
    }

    return Math.min(100, Math.max(15, score));
  };

  const readinessScore = calculatePlantingReadiness(weather);

  const getReadinessBadge = (score: number) => {
    if (score >= 85) {
      return {
        label: 'Prime Sowing Window Active',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        barColor: 'bg-emerald-500',
        description: 'Soil temperature and moisture parameters are perfectly matched for rapid seed germination and root anchoring.'
      };
    } else if (score >= 65) {
      return {
        label: 'Favorable Sowing Conditions',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        barColor: 'bg-amber-500',
        description: 'Good sowing parameters. Consider light seedbed irrigation or mulching if soil surface feels dry.'
      };
    } else {
      return {
        label: 'Sowing Window Hold / Caution',
        color: 'text-rose-700 bg-rose-50 border-rose-200',
        barColor: 'bg-rose-500',
        description: 'Microclimate metrics suggest waiting for rainfall or soil thermal stabilization before sowing expensive hybrid seeds.'
      };
    }
  };

  const badgeInfo = getReadinessBadge(readinessScore);

  // Calculate Match Score for each variety against current weather
  const calculateVarietyMatch = (variety: VarietyRecommendation, w: WeatherData) => {
    let match = 80;

    // Air temperature check
    if (w.temp >= variety.idealTempRange[0] && w.temp <= variety.idealTempRange[1]) {
      match += 10;
    } else {
      match -= Math.abs(w.temp - ((variety.idealTempRange[0] + variety.idealTempRange[1]) / 2)) * 1.5;
    }

    // Soil temp check
    if (w.soilTemp >= variety.idealSoilTempRange[0] && w.soilTemp <= variety.idealSoilTempRange[1]) {
      match += 10;
    }

    // Soil moisture check
    if (w.soilMoisture >= variety.minSoilMoisture) {
      match += 5;
    } else {
      match -= (variety.minSoilMoisture - w.soilMoisture) * 1.2;
    }

    return Math.min(99, Math.max(45, Math.round(match)));
  };

  // Filtered varieties
  const filteredVarieties = CROP_VARIETIES_DATABASE.filter(v => {
    if (selectedCategory !== 'All' && v.category !== selectedCategory) return false;
    return true;
  }).map(v => ({
    ...v,
    matchScore: calculateVarietyMatch(v, weather)
  })).sort((a, b) => b.matchScore - a.matchScore);

  // Generate AI Agronomy Sowing Guide using /api/assistant/chat
  const handleGenerateAiGuide = async (variety: VarietyRecommendation) => {
    setAiGuideVariety(variety);
    setAiPlanOutput('');
    setIsAiLoading(true);

    try {
      const promptText = `Provide an elite, practical Agronomist Sowing & Management Guide for planting "${variety.varietyName}" (${variety.crop}) in ${weather.name}, ${weather.country}.
Current Field Telemetry:
- Air Temp: ${weather.temp}°C
- Soil Temp: ${weather.soilTemp}°C
- Soil Moisture: ${weather.soilMoisture}% VWC
- Relative Humidity: ${weather.humidity}%

Please output a concise, structured markdown guide with:
1. **Optimal Planting Calendar Window** (Dates for this month)
2. **Seedbed Prep & Basal Fertilizer Recommendation** (DAP vs NPK rate per acre)
3. **Emergence Timeline & Irrigation Adjustments**
4. **Top 2 Pest/Disease Prevention Protocols** for ${weather.name}`;

      const customHeaders = getApiConfigHeaders();
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...customHeaders
        },
        body: JSON.stringify({
          message: promptText,
          weatherContext: weather
        })
      });

      const data = await response.json();
      if (data.response || data.reply) {
        setAiPlanOutput(data.response || data.reply);
      } else {
        setAiPlanOutput(`### 🌾 Sowing Protocol for ${variety.varietyName}\n- **Target Location**: ${weather.name}\n- **Current Soil Moisture**: ${weather.soilMoisture}% VWC (Sufficient for immediate drill sowing)\n- **Basal Fertilizer**: Apply 50kg DAP per acre at 5cm seed depth.\n- **Germination Forecast**: Expect emergence in 5-7 days under current ${weather.soilTemp}°C soil thermal conditions.`);
      }
    } catch (err) {
      console.error('Error generating AI Sowing Guide', err);
      setAiPlanOutput(`### 🌾 Sowing Protocol for ${variety.varietyName}\n- **Target Location**: ${weather.name}\n- **Current Soil Moisture**: ${weather.soilMoisture}% VWC\n- **Basal Fertilizer**: Apply 50kg DAP per acre.\n- **Germination Forecast**: Expect emergence in 5-7 days.`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Create Project handler
  const handleQuickRegisterProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectToRegister || !customFieldName.trim()) return;

    if (!user) {
      showToast('Please sign in or initialize profile to persist project regions!', 'warning');
      return;
    }

    setIsSubmittingProject(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          name: customFieldName.trim(),
          crop: `${projectToRegister.crop} (${projectToRegister.varietyName})`,
          location: weather.name
        })
      });

      const data = await response.json();
      if (data.success) {
        showToast(`Registered field "${customFieldName.trim()}" in ${weather.name}!`, 'success');
        setIsCreatingProject(false);
        setProjectToRegister(null);
        setCustomFieldName('');
        if (onRefreshProjects) onRefreshProjects();
      } else {
        showToast(data.error || 'Failed to register project.', 'error');
      }
    } catch (err) {
      console.error('Failed to create project', err);
      showToast('Error registering project field.', 'error');
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const handleCopyAiPlan = () => {
    if (!aiPlanOutput) return;
    navigator.clipboard.writeText(aiPlanOutput);
    setCopiedText(true);
    showToast('Sowing guide copied to clipboard!', 'success');
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div id="optimal_planting_varieties_module" className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6">
      
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
              <Sprout className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2 uppercase">
              Optimal Planting Times & Crop Varieties
            </h3>
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Agronomic Geo-AI
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans">
            Real-time planting suitability calculations & crop variety match scores calibrated for <strong className="text-slate-800 font-semibold">{weather.name}, {weather.country}</strong>.
          </p>
        </div>

        {/* Location badge indicator */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3.5 py-2 rounded-2xl shrink-0 self-start sm:self-auto">
          <Sun className="w-4 h-4 text-amber-500" />
          <div className="text-xs">
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Telemetry Location</span>
            <span className="font-bold text-slate-700">{weather.name} ({weather.temp}°C, {weather.soilMoisture}% VWC)</span>
          </div>
        </div>
      </div>

      {/* Planting Readiness Gauge & Soil Metrics Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Main Readiness Score Banner */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl space-y-4 relative overflow-hidden shadow-md">
          {/* Subtle background glow pattern */}
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            <div>
              <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-widest block mb-1">
                Field Sowing Suitability Index
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white font-mono">{readinessScore}%</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badgeInfo.color}`}>
                  {badgeInfo.label}
                </span>
              </div>
            </div>

            {/* Microclimate Quick Status Badges */}
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold">
              <span className="px-2.5 py-1.5 bg-white/10 rounded-xl text-slate-200 border border-white/10">
                Soil Temp: {weather.soilTemp}°C
              </span>
              <span className="px-2.5 py-1.5 bg-white/10 rounded-xl text-slate-200 border border-white/10">
                Moisture: {weather.soilMoisture}% VWC
              </span>
            </div>
          </div>

          {/* Visual progress bar */}
          <div className="space-y-1 relative z-10">
            <div className="w-full bg-slate-700/60 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/10">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${badgeInfo.barColor}`} 
                style={{ width: `${readinessScore}%` }}
              />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              {badgeInfo.description}
            </p>
          </div>

          {/* Key Germination & Sowing Insights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10 text-xs relative z-10">
            <div>
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Est. Seed Emergence</span>
              <span className="font-extrabold text-emerald-400 font-mono">
                {weather.soilTemp >= 20 ? '5 - 7 Days' : weather.soilTemp >= 15 ? '8 - 12 Days' : '12 - 16 Days'}
              </span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Seedbed Thermal State</span>
              <span className="font-extrabold text-orange-300 font-mono">
                {weather.soilTemp >= 18 ? 'Warm (Active)' : 'Cool (Delayed)'}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Root Moisture Need</span>
              <span className="font-extrabold text-sky-300 font-mono">
                {weather.soilMoisture >= 30 ? 'Adequate Moisture' : 'Pre-Irrigate First'}
              </span>
            </div>
          </div>
        </div>

        {/* Target Sowing Goal Selector Card */}
        <div className="bg-orange-50/40 border border-orange-100 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-bold text-[#FF7A59] uppercase tracking-wider block mb-1">
              🎯 Select Planting Goal
            </span>
            <h4 className="text-xs font-bold text-slate-800">Season & Water Strategy</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Adjust crop variety ranking based on your target water supply strategy.
            </p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setSelectedSeasonGoal('immediate')}
              className={`w-full p-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between border ${
                selectedSeasonGoal === 'immediate'
                  ? 'bg-white border-orange-400 text-orange-700 shadow-sm'
                  : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                <span>Immediate Sowing (Next 10 Days)</span>
              </div>
              {selectedSeasonGoal === 'immediate' && <CheckCircle2 className="w-3.5 h-3.5 text-orange-500" />}
            </button>

            <button
              type="button"
              onClick={() => setSelectedSeasonGoal('early_rain')}
              className={`w-full p-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between border ${
                selectedSeasonGoal === 'early_rain'
                  ? 'bg-white border-orange-400 text-orange-700 shadow-sm'
                  : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                <span>Main Rain Cycle Target</span>
              </div>
              {selectedSeasonGoal === 'early_rain' && <CheckCircle2 className="w-3.5 h-3.5 text-orange-500" />}
            </button>

            <button
              type="button"
              onClick={() => setSelectedSeasonGoal('irrigated')}
              className={`w-full p-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between border ${
                selectedSeasonGoal === 'irrigated'
                  ? 'bg-white border-orange-400 text-orange-700 shadow-sm'
                  : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span>Irrigated / Off-Season Crop</span>
              </div>
              {selectedSeasonGoal === 'irrigated' && <CheckCircle2 className="w-3.5 h-3.5 text-orange-500" />}
            </button>
          </div>
        </div>

      </div>

      {/* Crop Category Filter & Variety Recommendations Header */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5 uppercase">
              🌾 High-Match Recommended Varieties for {weather.name}
            </h4>
            <p className="text-xs text-slate-400">
              Cultivars scored against local rootzone temperature ({weather.soilTemp}°C) & heat tolerance profile.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-slate-100/80 p-1 rounded-xl">
            {['All', 'Cereals', 'Legumes', 'Vegetables', 'Roots'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Variety Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVarieties.map((variety) => (
            <motion.div
              key={variety.id}
              whileHover={{ y: -2 }}
              className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm hover:border-orange-200 hover:shadow-md transition-all space-y-3.5 flex flex-col justify-between"
            >
              <div>
                {/* Variety Top Header */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-orange-50 border border-orange-100 text-orange-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
                      {variety.crop} • {variety.category}
                    </span>
                  </div>
                  {/* Match Score Pill */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-extrabold flex items-center gap-1 ${
                    variety.matchScore >= 90
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : variety.matchScore >= 75
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-700'
                  }`}>
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    {variety.matchScore}% Match
                  </span>
                </div>

                <h4 className="text-sm font-extrabold text-slate-800 tracking-tight">
                  {variety.varietyName}
                </h4>

                <p className="text-xs text-slate-500 leading-relaxed mt-1 font-sans">
                  {variety.agronomistNote}
                </p>

                {/* Key Traits Pills */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {variety.keyTraits.map((trait, idx) => (
                    <span 
                      key={idx}
                      className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      {trait}
                    </span>
                  ))}
                </div>

                {/* Spacing, Maturity & Yield Grid */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px]">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Maturity</span>
                    <span className="font-extrabold text-slate-700 font-mono">{variety.maturityDays} Days</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Est. Yield</span>
                    <span className="font-extrabold text-emerald-600 font-mono">{variety.potentialYield}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Row Spacing</span>
                    <span className="font-bold text-slate-700 font-mono truncate block">{variety.spacing}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleGenerateAiGuide(variety)}
                  className="flex-1 h-9 px-3 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5 text-orange-600" />
                  AI Sowing Plan
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProjectToRegister(variety);
                    setCustomFieldName(`${weather.name} ${variety.crop} Field`);
                    setIsCreatingProject(true);
                  }}
                  className="h-9 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add to Projects
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* AI Sowing Plan Modal / Drawer */}
      <AnimatePresence>
        {aiGuideVariety && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-100 text-orange-700 rounded-2xl">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-orange-600 uppercase tracking-widest block">
                      Claire.ai Agronomy Plan
                    </span>
                    <h3 className="text-base font-extrabold text-slate-800">
                      Sowing Guide for {aiGuideVariety.varietyName}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Calibrated for {weather.name} ({weather.temp}°C, {weather.soilMoisture}% VWC)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAiGuideVariety(null);
                    setAiPlanOutput('');
                  }}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content Body */}
              {isAiLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  <p className="text-xs text-slate-500 font-bold font-sans">
                    Generating localized sowing calendar & fertilizer strategy...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                    {aiPlanOutput}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCopyAiPlan}
                      className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                      {copiedText ? 'Copied!' : 'Copy Plan to Clipboard'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAiGuideVariety(null);
                        setAiPlanOutput('');
                      }}
                      className="h-10 px-5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition-opacity cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Add Project Modal */}
      <AnimatePresence>
        {isCreatingProject && projectToRegister && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">
                    Register Field Region in Projects
                  </h3>
                  <p className="text-xs text-slate-400">
                    Save this variety plan to track field harvest progress.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingProject(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleQuickRegisterProject} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Field / Folder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customFieldName}
                    onChange={(e) => setCustomFieldName(e.target.value)}
                    placeholder="e.g. North Acre Maize Plot"
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-800 outline-none focus:border-orange-400 focus:bg-white"
                  />
                </div>

                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Selected Crop Variety:</span>
                    <span className="font-bold text-slate-700">{projectToRegister.varietyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Location Zone:</span>
                    <span className="font-bold text-slate-700">{weather.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Cycle Duration:</span>
                    <span className="font-bold text-emerald-600 font-mono">{projectToRegister.maturityDays} Days</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingProject(false)}
                    className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingProject}
                    className="h-9 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isSubmittingProject ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Save Region
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
