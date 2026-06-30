import React, { useState, useMemo } from 'react';
import { Search, X, ShieldAlert, Sprout, Sparkles, BookOpen, Layers, CheckCircle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Interfaces for structured agronomic guidelines
export interface FAQItem {
  id: string;
  crop: string;
  disease: string;
  scientificName: string;
  pathogenType: 'Fungal' | 'Bacterial' | 'Viral' | 'Pest' | 'Nutritional';
  severity: 'High' | 'Medium' | 'Low';
  symptoms: string[];
  organicRemediation: string[];
  chemicalRemediation: string[];
  prevention: string[];
  keywords: string[];
}

// Complete offline seed dataset for agricultural pathology guidelines
const PATHOLOGY_FAQ_DATABASE: FAQItem[] = [
  {
    id: 'faq_1',
    crop: 'Tomato',
    disease: 'Early Blight (Alternaria solani)',
    scientificName: 'Alternaria solani',
    pathogenType: 'Fungal',
    severity: 'Medium',
    symptoms: [
      'Brown to black spots with concentric rings (target-like appearance) on older leaves first',
      'Leaves turn yellow and drop off prematurely',
      'Dark, sunken lesions near the stem end of fruits'
    ],
    organicRemediation: [
      'Apply organic copper-based fungicides or bio-fungicides containing Bacillus subtilis',
      'Prune lower leaves to improve airflow and prevent soil splash-back',
      'Mulch heavily around the base of tomatoes to create a barrier between soil-borne spores and foliage'
    ],
    chemicalRemediation: [
      'Apply preventative Chlorothalonil or Mancozeb sprays at 7-14 day intervals',
      'Use systemic fungicides such as Azoxystrobin or Pyraclostrobin in case of severe outbreaks'
    ],
    prevention: [
      'Rotate crops on a 3-year cycle, avoiding Solanaceae crops (potatoes, peppers, eggplants)',
      'Use drip irrigation instead of overhead watering to keep foliage dry',
      'Stakes/cages to lift foliage away from moist soil layers'
    ],
    keywords: ['tomato', 'early blight', 'alternaria', 'concentric', 'target', 'yellow leaf', 'copper', 'fungicide', 'solanaceae', 'spots']
  },
  {
    id: 'faq_2',
    crop: 'Corn (Maize)',
    disease: 'Common Rust (Puccinia sorghi)',
    scientificName: 'Puccinia sorghi',
    pathogenType: 'Fungal',
    severity: 'Medium',
    symptoms: [
      'Elongated, golden-brown to cinnamon-brown powdery pustules (uredinia) on both upper and lower leaf surfaces',
      'Pustules turn dark brown to black as the plant matures',
      'Severe infection leads to leaf yellowing, drying, and premature leaf death'
    ],
    organicRemediation: [
      'Apply sulfur or neem oil formulations early in the morning when moisture is lowest',
      'Manually strip severely infested leaves if localized'
    ],
    chemicalRemediation: [
      'Apply strobilurin (e.g., Pyraclostrobin) or triazole (e.g., Propiconazole) fungicides during early tassel stage if severity exceeds 10%'
    ],
    prevention: [
      'Select certified rust-resistant hybrid corn varieties suitable for high-humidity climates',
      'Optimize nitrogen fertilizer application, as excess nitrogen can promote lush susceptible foliage'
    ],
    keywords: ['corn', 'maize', 'rust', 'puccinia', 'pustules', 'powdery', 'brown spots', 'fungicide', 'tassel', 'humidity']
  },
  {
    id: 'faq_3',
    crop: 'Wheat',
    disease: 'Powdery Mildew (Blumeria graminis)',
    scientificName: 'Blumeria graminis f. sp. tritici',
    pathogenType: 'Fungal',
    severity: 'Medium',
    symptoms: [
      'White-to-light grey powdery, cottony patches on leaves and leaf sheaths',
      'Fungal patches turn dull grey-brown with tiny black specks (cleistothecia) over time',
      'Leaf yellowing and early leaf senescence, reducing grain fill capacity'
    ],
    organicRemediation: [
      'Spray dilute milk-and-water solution (1:9 ratio) or potassium bicarbonate spray under direct sunlight to alter leaf pH',
      'Improve canopy ventilation by adjusting drill row spacing'
    ],
    chemicalRemediation: [
      'Spray preventative Triazole fungicides (Tebuconazole) or Quinoxyfen if symptoms appear early in the stem elongation stage'
    ],
    prevention: [
      'Avoid high seeding densities to reduce relative humidity inside the wheat canopy',
      'Avoid excessive spring nitrogen application that triggers dense, high-susceptibility succulent growth'
    ],
    keywords: ['wheat', 'powdery', 'mildew', 'blumeria', 'grey patch', 'white spots', 'canopy', 'spacing', 'bicarbonate', 'nitrogen']
  },
  {
    id: 'faq_4',
    crop: 'Potato',
    disease: 'Late Blight (Phytophthora infestans)',
    scientificName: 'Phytophthora infestans',
    pathogenType: 'Fungal',
    severity: 'High',
    symptoms: [
      'Irregular, dark, water-soaked lesions on leaves that rapidly enlarge in cool, wet weather',
      'White velvety fungal growth on the undersides of leaves during high humidity',
      'Tubers develop dry, reddish-brown leathery rot and decay quickly in storage'
    ],
    organicRemediation: [
      'Apply preventative copper sprays at the first sign of local outbreak notices',
      'Destruction of volunteer potato plants and cull piles near fields to eliminate primary inoculants'
    ],
    chemicalRemediation: [
      'Use targeted oomycete-specific fungicides containing Metalaxyl, Mefenoxam, or Fluopicolide',
      'Rotate chemical classes to prevent Phytophthora resistance development'
    ],
    prevention: [
      'Plant only certified disease-free seed tubers',
      'Harvest only under dry weather conditions and allow tubers to cure before storing',
      'Avoid overhead micro-irrigation in low-air-velocity regions'
    ],
    keywords: ['potato', 'late blight', 'phytophthora', 'water soaked', 'velvety', 'rot', 'tuber', 'wet weather', 'metalaxyl', 'copper']
  },
  {
    id: 'faq_5',
    crop: 'Rice',
    disease: 'Rice Blast (Magnaporthe oryzae)',
    scientificName: 'Magnaporthe oryzae',
    pathogenType: 'Fungal',
    severity: 'High',
    symptoms: [
      'Spindle-shaped or diamond-shaped lesions with grey centers and reddish-brown borders on leaves',
      'Collapsing of nodes and panicles (known as collar rot, neck blast, or panicle blast)',
      'Total sterility of grains if neck blast strikes before seed maturity'
    ],
    organicRemediation: [
      'Increase silicon fertilizer application to reinforce the leaf epidermis against fungal penetration',
      'Incorporate organic bio-inoculants containing Trichoderma species into the nursery soil'
    ],
    chemicalRemediation: [
      'Apply Tricyclazole or Azoxystrobin fungicides at early booting and heading stages'
    ],
    prevention: [
      'Employ moderate water depth management in paddies; drought stress predisposes rice to blast infection',
      'Maintain balanced fertilizer programs without pushing excessive mineral nitrogen loads'
    ],
    keywords: ['rice', 'blast', 'magnaporthe', 'spindle', 'diamond', 'neck blast', 'silicon', 'nitrogen', 'heading', 'sterility']
  },
  {
    id: 'faq_6',
    crop: 'Soybean',
    disease: 'Soybean Rust (Phakopsora pachyrhizi)',
    scientificName: 'Phakopsora pachyrhizi',
    pathogenType: 'Fungal',
    severity: 'High',
    symptoms: [
      'Tiny, dark brown to tan raised pustules (volcano-like structure) primarily on the undersides of lower leaves',
      'Early rapid defoliation of the crop starting from the bottom upward',
      'Substantially reduced pod numbers, seed weight, and overall grain oil content'
    ],
    organicRemediation: [
      'Apply copper sulfate or horticultural oils at the earliest sign of disease vector flight paths'
    ],
    chemicalRemediation: [
      'Apply triazole (Tebuconazole, Cyproconazole) mixed with Strobilurins for curative and protective action'
    ],
    prevention: [
      'Utilize early planting strategies to complete the grain fill phase before local rust spore pressure peaks',
      'Eliminate alternate hosts like Kudzu vines around the perimeter of fields'
    ],
    keywords: ['soybean', 'rust', 'phakopsora', 'pustules', 'underside', 'defoliation', 'pods', 'kudzu', 'triazole']
  },
  {
    id: 'faq_7',
    crop: 'Coffee',
    disease: 'Coffee Leaf Rust (Hemileia vastatrix)',
    scientificName: 'Hemileia vastatrix',
    pathogenType: 'Fungal',
    severity: 'High',
    symptoms: [
      'Orange, powdery, circular pustules on the lower surface of leaves',
      'Chlorotic (yellow) spots on the upper leaf surface opposite the orange pustules',
      'Severe defoliation leading to "dieback" of productive branches and lower cup quality'
    ],
    organicRemediation: [
      'Apply liquid copper fungicides (Bordeaux mixture) immediately after the first seasonal rains',
      'Shade management to prevent hot microclimates that foster rapid spore germination'
    ],
    chemicalRemediation: [
      'Apply systemic triazole fungicides (such as Cyproconazole) to offer preventative and curative cover'
    ],
    prevention: [
      'Prune branches to maintain open spacing and reduce internal humidity within the shrub canopy',
      'Plant rust-resistant cultivars like Castillo, Colombia, or Ruiru 11'
    ],
    keywords: ['coffee', 'rust', 'hemileia', 'orange', 'pustules', 'defoliation', 'bordeaux', 'dieback', 'shade']
  },
  {
    id: 'faq_8',
    crop: 'Citrus',
    disease: 'Citrus Canker (Xanthomonas citri)',
    scientificName: 'Xanthomonas axonopodis pv. citri',
    pathogenType: 'Bacterial',
    severity: 'High',
    symptoms: [
      'Raised, corky, brown lesions on leaves, twigs, and fruit, surrounded by a distinct oily or water-soaked halo',
      'Lesion centers become crater-like over time',
      'Premature fruit drop and severe unmarketable appearance of fresh fruit'
    ],
    organicRemediation: [
      'Prune and safely burn infected twigs during dry winter seasons',
      'Spray preventative copper formulations during shoot flushes'
    ],
    chemicalRemediation: [
      'Since it is bacterial, standard fungal products do not work. Utilize copper sprays or sanitizing copper-ammonium carbonate solutions to suppress bacterial spread on leaf surfaces.'
    ],
    prevention: [
      'Construct windbreaks around orchard perimeters, as wind-driven rain is the primary dispersal mechanism',
      'Decontaminate harvest bins, tools, and clothing when transitioning between blocks'
    ],
    keywords: ['citrus', 'canker', 'xanthomonas', 'corky', 'halo', 'crater', 'bacterial', 'windbreak', 'copper', 'lemon', 'orange']
  }
];

interface AgronomyFAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AgronomyFAQModal({ isOpen, onClose }: AgronomyFAQModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('All');
  const [selectedPathogenFilter, setSelectedPathogenFilter] = useState<string>('All');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('All');

  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Extract unique crop categories for simple filtering
  const cropList = useMemo(() => {
    const crops = new Set<string>();
    PATHOLOGY_FAQ_DATABASE.forEach(item => crops.add(item.crop));
    return ['All', ...Array.from(crops)];
  }, []);

  // Simple local search index matching logic
  const filteredFAQ = useMemo(() => {
    const queryTokens = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(token => token.length > 0);

    return PATHOLOGY_FAQ_DATABASE.filter(item => {
      // Crop Category filter
      if (selectedCropFilter !== 'All' && item.crop !== selectedCropFilter) {
        return false;
      }
      // Pathogen type filter
      if (selectedPathogenFilter !== 'All' && item.pathogenType !== selectedPathogenFilter) {
        return false;
      }
      // Severity filter
      if (selectedSeverityFilter !== 'All' && item.severity !== selectedSeverityFilter) {
        return false;
      }

      // If no query, return match
      if (queryTokens.length === 0) return true;

      // Calculate matching metrics
      return queryTokens.every(token => {
        // Match in keywords list
        const keywordMatch = item.keywords.some(k => k.includes(token));
        if (keywordMatch) return true;

        // Match in disease name, crop name or scientific name
        if (item.disease.toLowerCase().includes(token)) return true;
        if (item.crop.toLowerCase().includes(token)) return true;
        if (item.scientificName.toLowerCase().includes(token)) return true;
        if (item.pathogenType.toLowerCase().includes(token)) return true;

        // Match in symptoms list
        const symptomMatch = item.symptoms.some(s => s.toLowerCase().includes(token));
        if (symptomMatch) return true;

        // Match in organic remedies
        const organicMatch = item.organicRemediation.some(or => or.toLowerCase().includes(token));
        if (organicMatch) return true;

        // Match in chemical remedies
        const chemicalMatch = item.chemicalRemediation.some(cr => cr.toLowerCase().includes(token));
        if (chemicalMatch) return true;

        return false;
      });
    });
  }, [searchQuery, selectedCropFilter, selectedPathogenFilter, selectedSeverityFilter]);

  const toggleExpand = (id: string) => {
    setExpandedItemId(prev => (prev === id ? null : id));
  };

  // Helper to highlight search tokens inside rendering strings
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return <span>{text}</span>;
    const tokens = query.split(/\s+/).filter(t => t.length > 0);
    if (tokens.length === 0) return <span>{text}</span>;

    // Use regex that matches any of the tokens
    const escapedTokens = tokens.map(t => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${escapedTokens})`, 'gi');
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <mark key={index} className="bg-amber-100 text-amber-900 font-semibold rounded px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-orange-100/60 flex flex-col max-h-[85vh] overflow-hidden z-10"
          >
            {/* Elegant Header */}
            <div className="p-6 border-b border-orange-100 flex items-start justify-between bg-gradient-to-br from-white to-orange-50/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-[#FF7A59] flex items-center justify-center text-white shadow-md">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
                    Agronomy Diagnostics & Remediation Guidelines
                  </h4>
                  <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">
                    🛰️ Offline-Capable Local Keyword Index
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 hover:bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sticky Search and Advanced Filtering Panel */}
            <div className="p-5 bg-slate-50/50 border-b border-slate-100 space-y-3.5">
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pathology database (e.g. 'tomato', 'copper', 'blight', 'rust')..."
                  className="w-full h-10 bg-white border border-slate-200 rounded-2xl pl-10 pr-4 text-xs text-slate-700 placeholder-slate-400 focus:border-orange-300 outline-none shadow-sm transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-3 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {/* Crop select */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-xl px-2.5 py-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Crop:</span>
                  <select
                    value={selectedCropFilter}
                    onChange={(e) => setSelectedCropFilter(e.target.value)}
                    className="bg-transparent border-none outline-none text-slate-700 text-xs font-semibold pr-1 cursor-pointer"
                  >
                    {cropList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Pathogen Filter */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-xl px-2.5 py-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Pathogen:</span>
                  <select
                    value={selectedPathogenFilter}
                    onChange={(e) => setSelectedPathogenFilter(e.target.value)}
                    className="bg-transparent border-none outline-none text-slate-700 text-xs font-semibold pr-1 cursor-pointer"
                  >
                    <option value="All">All Types</option>
                    <option value="Fungal">Fungal</option>
                    <option value="Bacterial">Bacterial</option>
                    <option value="Viral">Viral</option>
                    <option value="Nutritional">Nutritional</option>
                  </select>
                </div>

                {/* Severity level */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-xl px-2.5 py-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Severity:</span>
                  <select
                    value={selectedSeverityFilter}
                    onChange={(e) => setSelectedSeverityFilter(e.target.value)}
                    className="bg-transparent border-none outline-none text-slate-700 text-xs font-semibold pr-1 cursor-pointer"
                  >
                    <option value="All">All Severity</option>
                    <option value="High">🔴 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                </div>

                {/* Counter */}
                <div className="ml-auto text-[10px] text-slate-400 font-mono font-bold uppercase">
                  {filteredFAQ.length} Match{filteredFAQ.length !== 1 ? 'es' : ''}
                </div>
              </div>
            </div>

            {/* Content list (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {filteredFAQ.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-2">
                  <HelpCircle className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">No diagnostic guidelines matched your query.</p>
                  <p className="text-[11px] text-slate-400">
                    Try refining your keyword query or expanding the crop type filter constraints.
                  </p>
                </div>
              ) : (
                filteredFAQ.map(item => {
                  const isExpanded = expandedItemId === item.id;
                  const severityColors = 
                    item.severity === 'High' 
                      ? 'bg-rose-50 text-rose-700 border-rose-100' 
                      : item.severity === 'Medium' 
                        ? 'bg-amber-50 text-amber-700 border-amber-100' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-100';

                  return (
                    <div
                      key={item.id}
                      className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                        isExpanded 
                          ? 'border-orange-200 bg-orange-50/10 shadow-sm' 
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      {/* Summary Row */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        className="w-full text-left p-4 flex items-center justify-between gap-4 cursor-pointer transition-colors hover:bg-slate-50/20"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                            <Sprout className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800">
                                {highlightText(`${item.crop} — ${item.disease}`, searchQuery)}
                              </span>
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${severityColors}`}>
                                {item.severity}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 italic font-mono truncate block">
                              {highlightText(item.scientificName, searchQuery)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                            {item.pathogenType}
                          </span>
                          <span className="text-xs text-[#FF7A59] font-bold">
                            {isExpanded ? 'Collapse' : 'Expand'}
                          </span>
                        </div>
                      </button>

                      {/* Detailed Content Panel */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="border-t border-slate-100"
                          >
                            <div className="p-5 space-y-4 text-xs text-slate-700 bg-slate-50/30">
                              
                              {/* Symptoms section */}
                              <div className="space-y-1.5">
                                <h5 className="font-extrabold text-slate-800 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400">
                                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                                  Visual Symptoms & Manifestation
                                </h5>
                                <ul className="list-disc pl-5 space-y-1 leading-relaxed">
                                  {item.symptoms.map((s, idx) => (
                                    <li key={idx}>{highlightText(s, searchQuery)}</li>
                                  ))}
                                </ul>
                              </div>

                              {/* Remediation strategies */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5 p-3 bg-emerald-50/20 border border-emerald-100/50 rounded-xl">
                                  <h6 className="font-extrabold text-emerald-700 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                                    🌿 Organic & Biological Remediation
                                  </h6>
                                  <ul className="list-disc pl-4 space-y-1 text-slate-600 leading-relaxed text-[11px]">
                                    {item.organicRemediation.map((or, idx) => (
                                      <li key={idx}>{highlightText(or, searchQuery)}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="space-y-1.5 p-3 bg-amber-50/20 border border-amber-100/50 rounded-xl">
                                  <h6 className="font-extrabold text-amber-700 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                                    🧪 Chemical & Spray Guidelines
                                  </h6>
                                  <ul className="list-disc pl-4 space-y-1 text-slate-600 leading-relaxed text-[11px]">
                                    {item.chemicalRemediation.map((cr, idx) => (
                                      <li key={idx}>{highlightText(cr, searchQuery)}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              {/* Preventative actions */}
                              <div className="space-y-1.5 bg-sky-50/20 border border-sky-100/50 p-3 rounded-xl">
                                <h5 className="font-extrabold text-sky-800 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                                  <CheckCircle className="w-3.5 h-3.5 text-sky-500" />
                                  Agronomic Preventative Best Practices
                                </h5>
                                <ul className="list-disc pl-5 space-y-1 leading-relaxed text-[11px]">
                                  {item.prevention.map((p, idx) => (
                                    <li key={idx}>{highlightText(p, searchQuery)}</li>
                                  ))}
                                </ul>
                              </div>

                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with informational hints */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 font-medium">
              <span>💡 Tip: Click on any disease card to view detailed organic and chemical remediation checklists.</span>
              <span className="mt-1 sm:mt-0">Claire.ai Agronomy Diagnostics V1.2</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
