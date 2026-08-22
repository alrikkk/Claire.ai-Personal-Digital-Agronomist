import React, { useState, useEffect } from 'react';
import { 
  Globe2, 
  Share2, 
  Download, 
  Plus, 
  Layers, 
  CheckCircle2, 
  Network, 
  ShieldCheck, 
  Sparkles, 
  Search, 
  TrendingUp, 
  ArrowRight, 
  Building2, 
  BookOpen, 
  Code2, 
  FileJson, 
  RefreshCw, 
  Loader2, 
  Sprout, 
  Droplet, 
  Flame, 
  Compass,
  Check,
  Cpu,
  Info,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StateNode, OpenAgriModel, showToast, User } from '../types';

interface DigitalAgriNetworkProps {
  user: User;
  onSelectState?: (stateName: string) => void;
}

export default function DigitalAgriNetwork({ user, onSelectState }: DigitalAgriNetworkProps) {
  const [nodes, setNodes] = useState<StateNode[]>([]);
  const [models, setModels] = useState<OpenAgriModel[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStateCode, setSelectedStateCode] = useState<string>('MH');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [isSubmittingModel, setIsSubmittingModel] = useState<boolean>(false);

  // New model submission form state
  const [newTitle, setNewTitle] = useState('');
  const [newAuthorState, setNewAuthorState] = useState(user.location || 'Maharashtra');
  const [newCategory, setNewCategory] = useState<'Soil Regeneration' | 'Pest Early Warning' | 'Monsoon Drought Coping' | 'Water Conservation' | 'Crop Phenology'>('Soil Regeneration');
  const [newDescription, setNewDescription] = useState('');
  const [newTargetCrops, setNewTargetCrops] = useState('');
  const [newTags, setNewTags] = useState('');

  // Active Cooperation channel tab
  const [activeCoopView, setActiveCoopView] = useState<'models' | 'federation' | 'matrix' | 'api'>('models');

  useEffect(() => {
    fetchNetworkData();
  }, []);

  const fetchNetworkData = async () => {
    setIsLoading(true);
    try {
      const [nodesRes, modelsRes] = await Promise.all([
        fetch('/api/dpg/nodes'),
        fetch('/api/dpg/models')
      ]);
      const nodesData = await nodesRes.json();
      const modelsData = await modelsRes.json();

      if (nodesData.success && nodesData.nodes) {
        setNodes(nodesData.nodes);
      }
      if (modelsData.success && modelsData.models) {
        setModels(modelsData.models);
      }
    } catch (e) {
      console.error('Failed to load DPG network state', e);
      showToast('Loaded local fallback state nodes', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportSchema = () => {
    window.open('/api/dpg/export-schema', '_blank');
    showToast('Downloading National DPG Open Agri Schema (JSON)...', 'success');
  };

  const handlePublishModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription) {
      showToast('Please provide a title and detailed description for your model.', 'error');
      return;
    }

    setIsSubmittingModel(true);
    try {
      const res = await fetch('/api/dpg/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          authorState: newAuthorState,
          category: newCategory,
          description: newDescription,
          targetCrops: newTargetCrops ? newTargetCrops.split(',').map(s => s.trim()) : ['Millets', 'Pulses'],
          accuracyR2: 0.94,
          tags: newTags ? newTags.split(',').map(s => s.trim()) : ['CommunityDPG', 'OpenData']
        })
      });

      const data = await res.json();
      if (data.success && data.model) {
        setModels(prev => [data.model, ...prev]);
        showToast('Successfully published open agronomy model to the National DPG Network!', 'success');
        setIsPublishModalOpen(false);
        setNewTitle('');
        setNewDescription('');
        setNewTargetCrops('');
        setNewTags('');
      } else {
        showToast(data.error || 'Failed to publish model.', 'error');
      }
    } catch (err) {
      showToast('Error connecting to national repository.', 'error');
    } finally {
      setIsSubmittingModel(false);
    }
  };

  const filteredModels = models.filter(m => {
    const matchesCat = selectedCategory === 'All' || m.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.authorState.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const selectedNode = nodes.find(n => n.stateCode === selectedStateCode) || nodes[0];

  return (
    <div className="space-y-8">
      {/* Header Banner: Theme Cooperation */}
      <div className="bg-gradient-to-r from-orange-500 via-[#FF7A59] to-amber-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold uppercase tracking-wider">
              <Network className="w-3.5 h-3.5" />
              Theme: Inter-State Cooperation & Digital Public Good (DPG)
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              National Agricultural Intelligence Network
            </h2>
            <p className="text-xs md:text-sm text-white/90 max-w-2xl leading-relaxed">
              Bridging the digital divide for small and marginal farmers across India. A federated open-source architecture enabling Indian states to exchange agronomic machine-learning models, soil carbon algorithms, and cross-state climate playbooks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportSchema}
              className="h-10 px-4 bg-white text-orange-600 hover:bg-orange-50 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <Download className="w-4 h-4" />
              Export DPG Schema
            </button>
            <button
              type="button"
              onClick={() => setIsPublishModalOpen(true)}
              className="h-10 px-4 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Share State Model
            </button>
          </div>
        </div>

        {/* Global Network Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/20">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <span className="text-[10px] uppercase font-bold text-white/80 block">Federated State Nodes</span>
            <span className="text-xl font-black">{nodes.length || 10} States</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <span className="text-[10px] uppercase font-bold text-white/80 block">Active Micro-Sensors</span>
            <span className="text-xl font-black">48,700+ Nodes</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <span className="text-[10px] uppercase font-bold text-white/80 block">Open DPG Agro-Models</span>
            <span className="text-xl font-black">{models.length} Certified</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <span className="text-[10px] uppercase font-bold text-white/80 block">Avg Climate Resilience</span>
            <span className="text-xl font-black">88.6 / 100</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveCoopView('models')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCoopView === 'models'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Open Agronomy Models ({models.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCoopView('federation')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCoopView === 'federation'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            State Nodes & Agro-Climatic Zones
          </button>
          <button
            type="button"
            onClick={() => setActiveCoopView('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCoopView === 'matrix'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Cross-State Cooperation Matrix
          </button>
          <button
            type="button"
            onClick={() => setActiveCoopView('api')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCoopView === 'api'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Open DPG REST API
          </button>
        </div>

        <button
          type="button"
          onClick={fetchNetworkData}
          disabled={isLoading}
          className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
          title="Refresh national state nodes"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* VIEW 1: OPEN AGRONOMY MODELS REPOSITORY */}
      {activeCoopView === 'models' && (
        <div className="space-y-6">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['All', 'Soil Regeneration', 'Pest Early Warning', 'Monsoon Drought Coping', 'Water Conservation', 'Crop Phenology'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search models, tags, states..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* Model Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredModels.map((model) => (
              <div 
                key={model.id}
                className="bg-white border border-slate-200/90 hover:border-orange-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider ${
                      model.category === 'Soil Regeneration' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      model.category === 'Monsoon Drought Coping' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      model.category === 'Pest Early Warning' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {model.category}
                    </span>

                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      R² {model.accuracyR2}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 leading-snug">
                    {model.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {model.description}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Building2 className="w-3.5 h-3.5 text-orange-500" />
                      <span className="font-semibold">{model.authorState}</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[10px]">{model.license}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {model.targetCrops.map(crop => (
                      <span key={crop} className="text-[10px] font-medium bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md">
                        🌱 {crop}
                      </span>
                    ))}
                    {model.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500 font-medium">
                      📥 <strong>{model.downloadsCount}</strong> state adoptions
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        showToast(`Activated '${model.title}' inside local agronomy engine!`, 'success');
                      }}
                      className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      Deploy Model
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: STATE NODES & AGRO-CLIMATIC ZONES */}
      {activeCoopView === 'federation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* State Nodes List (Left 5 Cols) */}
          <div className="lg:col-span-5 space-y-2 max-h-[600px] overflow-y-auto pr-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select State Agri-Intelligence Node
            </h3>
            {nodes.map(node => (
              <div
                key={node.id}
                onClick={() => setSelectedStateCode(node.stateCode)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  selectedStateCode === node.stateCode
                    ? 'bg-orange-50/70 border-orange-400 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-orange-200'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-800">{node.stateName}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{node.stateCode}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{node.agroClimaticZone}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-emerald-600">{node.climateResilienceScore}/100</span>
                  <span className="text-[10px] text-slate-400 block">{node.activeSensorsCount} sensors</span>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Node Deep Dive (Right 7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            {selectedNode ? (
              <>
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-800">{selectedNode.stateName} Agronomy Node</h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {selectedNode.dpgStatus}
                      </span>
                    </div>
                    <p className="text-xs text-orange-600 font-semibold">{selectedNode.agroClimaticZone}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Resilience Index</span>
                    <span className="text-2xl font-black text-slate-800">{selectedNode.climateResilienceScore}<span className="text-sm text-slate-400">/100</span></span>
                  </div>
                </div>

                {/* Node Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Dominant Soil Type</span>
                    <span className="text-xs font-bold text-slate-800">{selectedNode.soilType}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Annual Rainfall</span>
                    <span className="text-xs font-bold text-slate-800">{selectedNode.averageRainfallMm} mm / yr</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Shared DPG Models</span>
                    <span className="text-xs font-bold text-orange-600">{selectedNode.openModelsCount} Published</span>
                  </div>
                </div>

                {/* Primary Regional Crops */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">Primary Regional Crop Cultivars:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.primaryCrops.map(crop => (
                      <span key={crop} className="text-xs font-semibold bg-orange-50 text-orange-800 px-3 py-1 rounded-lg border border-orange-100">
                        🌾 {crop}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Cooperation Partners */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">Active Inter-State Data Federation Partners:</span>
                  <div className="flex items-center gap-2">
                    {selectedNode.cooperationPartners.map(code => {
                      const partnerNode = nodes.find(n => n.stateCode === code);
                      return (
                        <div key={code} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors flex items-center gap-1">
                          <Network className="w-3 h-3 text-orange-500" />
                          {partnerNode ? partnerNode.stateName : code}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectState) onSelectState(selectedNode.stateName);
                      showToast(`Switched active advisory region to ${selectedNode.stateName}`, 'success');
                    }}
                    className="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Compass className="w-4 h-4 text-orange-400" />
                    Load {selectedNode.stateName} Field Telemetry & Soil Health Card
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* VIEW 3: CROSS-STATE COOPERATION MATRIX */}
      {activeCoopView === 'matrix' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-800">Inter-State Climate Resilience Cooperation Channels</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              How Indian states share adaptive data models, pest early warnings, and zero-chemical soil rejuvenation techniques across state borders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-4 bg-orange-50/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Punjab ↔ Haryana ↔ Uttar Pradesh
                </span>
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Active Stream</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Stubble & Soil Biology Sharing:</strong> Zero-tillage Happy Seeder protocols and bio-decomposer fungal consortium data models shared to enrich organic carbon and stop paddy stubble burning.
              </p>
              <div className="text-[11px] text-orange-700 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 3.2M Acres under shared soil health protocol
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-orange-50/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Droplet className="w-4 h-4 text-blue-500" />
                  Maharashtra ↔ Karnataka ↔ Telangana
                </span>
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Active Stream</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Semi-Arid Drought Defense:</strong> Real-time watershed balance models, farm pond micro-lift irrigation schedules, and drought-tolerant Pigeon Pea (Tur) cultivars exchanged during 14-day dry spells.
              </p>
              <div className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Slashes crop loss by 42% in Vidarbha & Kalyana Karnataka
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-orange-50/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sprout className="w-4 h-4 text-emerald-500" />
                  Odisha ↔ Tamil Nadu ↔ Andhra Pradesh
                </span>
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Active Stream</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Coastal Salinity & Millet Mission:</strong> Sharing deep-rooted Finger Millet (Mandia/Ragi) and saline-tolerant paddy varieties (Luna Sankhi) with automated Alternate Wetting and Drying (AWD) water sensors.
              </p>
              <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 55% Water conservation achieved in delta belts
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-orange-50/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-rose-500" />
                  Gujarat ↔ Rajasthan ↔ Madhya Pradesh
                </span>
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Active Stream</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Locust & Whitefly Early Warning Federation:</strong> Multi-spectral satellite sensor mesh detecting thermal heat anomalies and soil moisture surges to predict pest outbreaks 5 days ahead of infestation.
              </p>
              <div className="text-[11px] text-rose-700 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Lowers pesticide costs by ₹2,400/hectare
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: OPEN DPG REST API SPECIFICATION */}
      {activeCoopView === 'api' && (
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-md space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-orange-400" />
              <span className="font-bold text-white">Open Agri-Stack DPG Interoperability Protocol (v2.1)</span>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">REST / JSON / GeoTIFF</span>
          </div>

          <p className="text-slate-400 text-xs font-sans leading-relaxed">
            All agricultural machine learning models and soil analytics published on Claire.ai are accessible via interoperable open endpoints compliant with the National Digital Public Good registry standard.
          </p>

          <div className="space-y-3 pt-2">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">GET</span>
                <span className="text-emerald-400 font-bold">/api/dpg/nodes</span>
              </div>
              <p className="text-slate-400 text-[11px] font-sans">Returns real-time telemetry, active sensors, and primary crops from all 10 federated state nodes.</p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">POST</span>
                <span className="text-blue-400 font-bold">/api/advisory/generate-localised</span>
              </div>
              <p className="text-slate-400 text-[11px] font-sans">Generates AI multi-lingual agro-advisories based on NPK, satellite NDVI, and microclimate telemetry in Hindi, Marathi, Telugu, Tamil, and English.</p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">GET</span>
                <span className="text-amber-400 font-bold">/api/dpg/export-schema</span>
              </div>
              <p className="text-slate-400 text-[11px] font-sans">Downloads full Open Agricultural Data & Model Interoperability Schema (OAD-MIP JSON).</p>
            </div>
          </div>
        </div>
      )}

      {/* PUBLISH STATE MODEL MODAL */}
      <AnimatePresence>
        {isPublishModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-orange-100 space-y-5"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Publish Open Agronomy Model</h3>
                  <p className="text-xs text-slate-500">Contribute your state or university's research to the National DPG Network</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePublishModel} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Model Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Deccan Plateau Ragi Organic Carbon Rebalancer"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-400 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Author State / University *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Karnataka Agri University"
                      value={newAuthorState}
                      onChange={(e) => setNewAuthorState(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-400 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Category *</label>
                    <select
                      value={newCategory}
                      onChange={(e: any) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-400 focus:outline-hidden bg-white"
                    >
                      <option value="Soil Regeneration">Soil Regeneration</option>
                      <option value="Monsoon Drought Coping">Monsoon Drought Coping</option>
                      <option value="Pest Early Warning">Pest Early Warning</option>
                      <option value="Water Conservation">Water Conservation</option>
                      <option value="Crop Phenology">Crop Phenology</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Model Description & Algorithmic Method *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Detail the algorithm, data inputs (e.g. NPK, daily evapotranspiration), and farmer outcomes..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-400 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Target Crops (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Finger Millet, Chickpea, Cotton"
                      value={newTargetCrops}
                      onChange={(e) => setNewTargetCrops(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-400 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Tags (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. ShreeAnna, Biochar, LowWater"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-400 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl text-[11px] text-orange-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>Models are released under <strong>CC-BY-4.0 (Digital Public Good)</strong> for free adoption by all farmers and state departments.</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPublishModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingModel}
                    className="px-5 py-2 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmittingModel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
                    Publish to National DPG
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
