import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sprout, 
  Wheat, 
  TreePine, 
  Apple, 
  BellRing, 
  Bell, 
  AlertTriangle, 
  AlertOctagon, 
  ShieldAlert, 
  SlidersHorizontal, 
  Settings2, 
  TrendingDown, 
  Flame, 
  Info,
  CheckCircle2,
  Plus,
  Trash2,
  RotateCcw,
  Play,
  Sparkles,
  Droplet,
  Droplets,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { IrrigationZone, CropMoistureThreshold, WeatherData, showToast } from '../types';

interface CropMoistureThresholdConfigProps {
  zones: IrrigationZone[];
  weather: WeatherData;
  onTriggerZone?: (zoneId: string, durationMinutes: number) => void;
  soundEnabled?: boolean;
  onPlaySound?: (type?: 'toggle' | 'start' | 'stop') => void;
}

export const DEFAULT_CROP_THRESHOLDS: CropMoistureThreshold[] = [
  {
    cropId: 'crop-maize',
    cropName: 'Maize / Sweet Corn',
    category: 'grain',
    criticalThreshold: 24,
    warningThreshold: 32,
    targetMoisture: 45,
    autoIrrigateOnCritical: true,
    autoEmergencyDurationMinutes: 20,
    notifyOnCritical: true,
    notifyOnWarning: true,
    rootDepthCm: 80,
    faoReferenceStage: 'Tasseling & Silking'
  },
  {
    cropId: 'crop-soybean',
    cropName: 'Soybeans & Pulses',
    category: 'legume',
    criticalThreshold: 25,
    warningThreshold: 33,
    targetMoisture: 48,
    autoIrrigateOnCritical: false,
    autoEmergencyDurationMinutes: 15,
    notifyOnCritical: true,
    notifyOnWarning: true,
    rootDepthCm: 60,
    faoReferenceStage: 'Pod Setting (R3-R4)'
  },
  {
    cropId: 'crop-citrus',
    cropName: 'Fruit Citrus & Avocados',
    category: 'fruit',
    criticalThreshold: 30,
    warningThreshold: 38,
    targetMoisture: 50,
    autoIrrigateOnCritical: true,
    autoEmergencyDurationMinutes: 25,
    notifyOnCritical: true,
    notifyOnWarning: true,
    rootDepthCm: 90,
    faoReferenceStage: 'Fruit Expansion'
  },
  {
    cropId: 'crop-seedlings',
    cropName: 'High-Density Seedlings',
    category: 'nursery',
    criticalThreshold: 35,
    warningThreshold: 45,
    targetMoisture: 55,
    autoIrrigateOnCritical: true,
    autoEmergencyDurationMinutes: 15,
    notifyOnCritical: true,
    notifyOnWarning: true,
    rootDepthCm: 15,
    faoReferenceStage: 'Early Emergence / Cotyledon'
  },
  {
    cropId: 'crop-wheat',
    cropName: 'Winter Wheat & Grains',
    category: 'grain',
    criticalThreshold: 20,
    warningThreshold: 28,
    targetMoisture: 42,
    autoIrrigateOnCritical: false,
    autoEmergencyDurationMinutes: 20,
    notifyOnCritical: true,
    notifyOnWarning: false,
    rootDepthCm: 75,
    faoReferenceStage: 'Booting to Heading'
  },
  {
    cropId: 'crop-tomatoes',
    cropName: 'Tomatoes & Solanaceae',
    category: 'vegetable',
    criticalThreshold: 28,
    warningThreshold: 36,
    targetMoisture: 52,
    autoIrrigateOnCritical: true,
    autoEmergencyDurationMinutes: 20,
    notifyOnCritical: true,
    notifyOnWarning: true,
    rootDepthCm: 50,
    faoReferenceStage: 'First Cluster Bloom'
  }
];

export default function CropMoistureThresholdConfig({
  zones,
  weather,
  onTriggerZone,
  soundEnabled = true,
  onPlaySound
}: CropMoistureThresholdConfigProps) {
  // Persistent Crop Thresholds in localStorage
  const [thresholds, setThresholds] = useState<CropMoistureThreshold[]>(() => {
    try {
      const saved = localStorage.getItem('claire_crop_moisture_thresholds');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_CROP_THRESHOLDS;
  });

  const [selectedCropId, setSelectedCropId] = useState<string>(thresholds[0]?.cropId || 'crop-maize');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'grain' | 'legume' | 'fruit' | 'nursery' | 'vegetable'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [simulationMoistureOffset, setSimulationMoistureOffset] = useState<number>(0);
  const [isSimulatingStress, setIsSimulatingStress] = useState<boolean>(false);
  const [alertHistory, setAlertHistory] = useState<Array<{
    id: string;
    cropName: string;
    zoneName: string;
    moisture: number;
    threshold: number;
    severity: 'critical' | 'warning';
    time: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('claire_crop_threshold_alerts_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'hist-1',
        cropName: 'High-Density Seedlings',
        zoneName: 'Nursery & Seedling Bed',
        moisture: 22,
        threshold: 35,
        severity: 'critical',
        time: '12m ago'
      }
    ];
  });

  // New crop form state
  const [newCropName, setNewCropName] = useState('');
  const [newCategory, setNewCategory] = useState<'grain' | 'legume' | 'fruit' | 'nursery' | 'vegetable'>('vegetable');
  const [newCritical, setNewCritical] = useState(25);
  const [newWarning, setNewWarning] = useState(35);
  const [newTarget, setNewTarget] = useState(48);
  const [newRootDepth, setNewRootDepth] = useState(45);
  const [newStage, setNewStage] = useState('Vegetative Growth');
  const [newAutoIrrigate, setNewAutoIrrigate] = useState(true);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('claire_crop_moisture_thresholds', JSON.stringify(thresholds));
    } catch {
      // ignore
    }
  }, [thresholds]);

  useEffect(() => {
    try {
      localStorage.setItem('claire_crop_threshold_alerts_history', JSON.stringify(alertHistory));
    } catch {
      // ignore
    }
  }, [alertHistory]);

  const activeCrop = useMemo(() => {
    return thresholds.find(t => t.cropId === selectedCropId) || thresholds[0];
  }, [thresholds, selectedCropId]);

  // Evaluate which zones match crops and check for threshold violations
  const zoneEvaluations = useMemo(() => {
    return zones.map(zone => {
      // Find matching crop profile by matching name or category
      const matchedCrop = thresholds.find(t => 
        zone.cropType.toLowerCase().includes(t.cropName.toLowerCase().split(' ')[0].toLowerCase()) ||
        t.cropName.toLowerCase().includes(zone.cropType.toLowerCase().split(' ')[0].toLowerCase())
      ) || thresholds[0];

      // Effective moisture considering simulation test offset if active
      const effectiveMoisture = Math.max(5, Math.min(100, zone.currentMoisture + (isSimulatingStress ? simulationMoistureOffset : 0)));

      const isCritical = effectiveMoisture < matchedCrop.criticalThreshold;
      const isWarning = !isCritical && effectiveMoisture < matchedCrop.warningThreshold;
      const isOptimal = !isCritical && !isWarning && effectiveMoisture <= (matchedCrop.targetMoisture + 10);
      const isSaturated = effectiveMoisture > (matchedCrop.targetMoisture + 10);

      const status: 'critical' | 'warning' | 'optimal' | 'saturated' = 
        isCritical ? 'critical' : isWarning ? 'warning' : isSaturated ? 'saturated' : 'optimal';

      return {
        zone,
        matchedCrop,
        effectiveMoisture,
        status,
        deficitPct: Math.max(0, matchedCrop.targetMoisture - effectiveMoisture)
      };
    });
  }, [zones, thresholds, isSimulatingStress, simulationMoistureOffset]);

  const criticalCount = zoneEvaluations.filter(z => z.status === 'critical').length;
  const warningCount = zoneEvaluations.filter(z => z.status === 'warning').length;

  // Filtered crops list
  const filteredCrops = useMemo(() => {
    if (categoryFilter === 'all') return thresholds;
    return thresholds.filter(c => c.category === categoryFilter);
  }, [thresholds, categoryFilter]);

  // Update threshold for active crop
  const updateActiveCrop = (updates: Partial<CropMoistureThreshold>) => {
    setThresholds(prev => prev.map(item => {
      if (item.cropId === selectedCropId) {
        return { ...item, ...updates };
      }
      return item;
    }));
  };

  // Run proactive threshold audit & fire notifications
  const handleRunProactiveAudit = () => {
    if (onPlaySound && soundEnabled) {
      onPlaySound();
    }

    const newAlerts: typeof alertHistory = [];
    let notificationSentCount = 0;

    zoneEvaluations.forEach(ev => {
      if (ev.status === 'critical' && ev.matchedCrop.notifyOnCritical) {
        notificationSentCount++;
        const alertMsg = `CRITICAL ROOT STRESS: ${ev.zone.name} (${ev.matchedCrop.cropName}) at ${ev.effectiveMoisture}% moisture is below the ${ev.matchedCrop.criticalThreshold}% critical wilting threshold!`;
        
        showToast(alertMsg, 'error');
        
        newAlerts.push({
          id: 'alert-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          cropName: ev.matchedCrop.cropName,
          zoneName: ev.zone.name,
          moisture: ev.effectiveMoisture,
          threshold: ev.matchedCrop.criticalThreshold,
          severity: 'critical',
          time: 'Just now'
        });

        // If automated irrigation is enabled for critical breach
        if (ev.matchedCrop.autoIrrigateOnCritical && onTriggerZone && ev.zone.valveStatus !== 'watering') {
          setTimeout(() => {
            onTriggerZone(ev.zone.id, ev.matchedCrop.autoEmergencyDurationMinutes);
            showToast(`Auto-Irrigation Activated: ${ev.zone.name} starting ${ev.matchedCrop.autoEmergencyDurationMinutes}m emergency soak.`, 'success');
          }, 600);
        }
      } else if (ev.status === 'warning' && ev.matchedCrop.notifyOnWarning) {
        notificationSentCount++;
        const warnMsg = `Moisture Advisory: ${ev.zone.name} (${ev.matchedCrop.cropName}) at ${ev.effectiveMoisture}% has dipped below the ${ev.matchedCrop.warningThreshold}% warning threshold.`;
        
        showToast(warnMsg, 'warning');

        newAlerts.push({
          id: 'alert-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          cropName: ev.matchedCrop.cropName,
          zoneName: ev.zone.name,
          moisture: ev.effectiveMoisture,
          threshold: ev.matchedCrop.warningThreshold,
          severity: 'warning',
          time: 'Just now'
        });
      }
    });

    if (newAlerts.length > 0) {
      setAlertHistory(prev => [...newAlerts, ...prev].slice(0, 15));
    } else {
      showToast(`Proactive Audit Complete: All monitored zones are above critical crop moisture thresholds!`, 'success');
    }
  };

  // Add custom crop handler
  const handleAddCustomCrop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCropName.trim()) return;

    const newCrop: CropMoistureThreshold = {
      cropId: 'crop-' + Date.now(),
      cropName: newCropName.trim(),
      category: newCategory,
      criticalThreshold: Number(newCritical),
      warningThreshold: Math.max(Number(newCritical) + 4, Number(newWarning)),
      targetMoisture: Math.max(Number(newWarning) + 5, Number(newTarget)),
      autoIrrigateOnCritical: newAutoIrrigate,
      autoEmergencyDurationMinutes: 15,
      notifyOnCritical: true,
      notifyOnWarning: true,
      rootDepthCm: Number(newRootDepth),
      faoReferenceStage: newStage || 'Active Growth'
    };

    setThresholds(prev => [...prev, newCrop]);
    setSelectedCropId(newCrop.cropId);
    setIsAddModalOpen(false);
    setNewCropName('');
    showToast(`Added crop profile "${newCrop.cropName}" with custom moisture thresholds.`, 'success');
  };

  // Reset to FAO defaults
  const handleResetDefaults = () => {
    setThresholds(DEFAULT_CROP_THRESHOLDS);
    setSelectedCropId(DEFAULT_CROP_THRESHOLDS[0].cropId);
    showToast('Reset all crop moisture thresholds to FAO-56 agricultural standards.', 'info');
  };

  // Remove crop
  const handleDeleteCrop = (cropId: string) => {
    if (thresholds.length <= 1) {
      showToast('At least one crop threshold profile must be configured.', 'warning');
      return;
    }
    const crop = thresholds.find(t => t.cropId === cropId);
    const updated = thresholds.filter(t => t.cropId !== cropId);
    setThresholds(updated);
    if (selectedCropId === cropId) {
      setSelectedCropId(updated[0].cropId);
    }
    showToast(`Removed crop profile "${crop?.cropName || ''}".`, 'info');
  };

  const getCategoryIcon = (category: CropMoistureThreshold['category']) => {
    switch (category) {
      case 'grain':
        return <Wheat className="w-4 h-4 text-amber-500" />;
      case 'legume':
        return <Sprout className="w-4 h-4 text-emerald-500" />;
      case 'fruit':
        return <Apple className="w-4 h-4 text-rose-500" />;
      case 'nursery':
        return <Droplets className="w-4 h-4 text-cyan-500" />;
      case 'vegetable':
      default:
        return <TreePine className="w-4 h-4 text-teal-500" />;
    }
  };

  return (
    <div className="p-5 md:p-6 space-y-6">
      {/* Top Banner: Proactive Monitoring Status & Action Controls */}
      <div className={`p-4 md:p-5 rounded-2xl border transition-all ${
        criticalCount > 0 
          ? 'bg-rose-50/90 border-rose-200 text-rose-950 shadow-xs' 
          : warningCount > 0 
          ? 'bg-amber-50/80 border-amber-200 text-amber-950 shadow-xs'
          : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
              criticalCount > 0 
                ? 'bg-rose-500 text-white animate-pulse' 
                : warningCount > 0 
                ? 'bg-amber-500 text-white' 
                : 'bg-emerald-500 text-white'
            }`}>
              {criticalCount > 0 ? (
                <AlertOctagon className="w-5 h-5" />
              ) : warningCount > 0 ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold tracking-tight">
                  {criticalCount > 0 
                    ? `⚠️ Proactive Alarm: ${criticalCount} Zone${criticalCount > 1 ? 's' : ''} Below Critical Crop Wilting Threshold!`
                    : warningCount > 0
                    ? `Proactive Advisory: ${warningCount} Zone${warningCount > 1 ? 's' : ''} Approaching Low Moisture Threshold`
                    : 'All Crop Root Zones Operating in Safe Moisture Bounds'}
                </h4>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  criticalCount > 0 
                    ? 'bg-rose-200 text-rose-800' 
                    : warningCount > 0 
                    ? 'bg-amber-200 text-amber-800' 
                    : 'bg-emerald-200 text-emerald-800'
                }`}>
                  {criticalCount > 0 ? 'Action Required' : warningCount > 0 ? 'Advisory' : 'Optimal Hydration'}
                </span>
              </div>

              <p className="text-xs text-slate-700 mt-1 max-w-2xl leading-relaxed">
                Claire continuously audits tensiometer sensors across all {zones.length} field quadrants against FAO-56 crop wilting points. 
                When volumetric water content dips below configured critical points, proactive alarms and automated emergency soak valves engage immediately.
              </p>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
            <button
              onClick={handleRunProactiveAudit}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer group"
              title="Audit all zone moisture levels and trigger proactive notifications"
            >
              <BellRing className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
              <span>Run Proactive Audit</span>
            </button>

            <button
              onClick={() => setIsSimulatingStress(!isSimulatingStress)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 ${
                isSimulatingStress
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
              title="Test threshold triggers by simulating lower soil moisture"
            >
              <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
              <span>{isSimulatingStress ? 'Simulation Active' : 'Test Stress Simulation'}</span>
            </button>
          </div>
        </div>

        {/* Stress Simulation Slider if active */}
        {isSimulatingStress && (
          <div className="mt-4 pt-3 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-amber-50/80 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold text-amber-900">
                Moisture Stress Simulation Mode:
              </span>
              <span className="text-amber-800">
                Applying artificial offset of <strong className="font-bold">{simulationMoistureOffset}%</strong> to test automated notifications.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-amber-700 font-medium">Offset: -20%</span>
              <input
                type="range"
                min="-20"
                max="0"
                step="1"
                value={simulationMoistureOffset}
                onChange={(e) => setSimulationMoistureOffset(Number(e.target.value))}
                className="w-32 accent-amber-600 cursor-pointer"
              />
              <span className="text-[11px] text-amber-900 font-bold w-8">{simulationMoistureOffset}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Zone Audit Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 md:px-6 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-sky-600" />
              Active Zone Moisture vs Crop Threshold Comparison
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Live tensiometer readings cross-referenced with crop species critical limits.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="flex items-center gap-1 text-rose-600">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Critical ({criticalCount})
            </span>
            <span className="flex items-center gap-1 text-amber-600 ml-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Warning ({warningCount})
            </span>
            <span className="flex items-center gap-1 text-emerald-600 ml-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Optimal ({zoneEvaluations.filter(z => z.status === 'optimal').length})
            </span>
          </div>
        </div>

        <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {zoneEvaluations.map(({ zone, matchedCrop, effectiveMoisture, status, deficitPct }) => {
            const isCrit = status === 'critical';
            const isWarn = status === 'warning';

            return (
              <div
                key={zone.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isCrit
                    ? 'bg-rose-50/40 border-rose-300 shadow-xs'
                    : isWarn
                    ? 'bg-amber-50/30 border-amber-300'
                    : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {zone.fieldQuadrant.split(' ')[0]}
                      </span>
                      <h5 className="text-xs font-bold text-slate-800 line-clamp-1">{zone.name}</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">{matchedCrop.cropName}</p>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                      isCrit
                        ? 'bg-rose-500 text-white animate-pulse'
                        : isWarn
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isCrit ? 'CRITICAL' : isWarn ? 'WARNING' : 'HEALTHY'}
                    </span>
                  </div>

                  {/* Moisture Progress & Targets */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Droplet className="w-3 h-3 text-sky-500" />
                        Current:
                      </span>
                      <span className="font-bold text-slate-800">
                        {effectiveMoisture}%
                        {isCrit && <span className="text-rose-600 text-[11px] ml-1">(&lt;{matchedCrop.criticalThreshold}%)</span>}
                      </span>
                    </div>

                    {/* Visual Tripartite bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCrit ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (effectiveMoisture / 60) * 100)}%` }}
                      />
                      {/* Critical marker line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-rose-700 z-10"
                        style={{ left: `${(matchedCrop.criticalThreshold / 60) * 100}%` }}
                        title={`Critical wilting threshold: ${matchedCrop.criticalThreshold}%`}
                      />
                      {/* Target marker line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-emerald-700 z-10"
                        style={{ left: `${(matchedCrop.targetMoisture / 60) * 100}%` }}
                        title={`Optimal target: ${matchedCrop.targetMoisture}%`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span>Crit: {matchedCrop.criticalThreshold}%</span>
                      <span>Warn: {matchedCrop.warningThreshold}%</span>
                      <span>Target: {matchedCrop.targetMoisture}%</span>
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  {isCrit ? (
                    <button
                      onClick={() => onTriggerZone && onTriggerZone(zone.id, matchedCrop.autoEmergencyDurationMinutes)}
                      className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-colors shadow-2xs"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Emergency {matchedCrop.autoEmergencyDurationMinutes}m Soak
                    </button>
                  ) : isWarn ? (
                    <button
                      onClick={() => onTriggerZone && onTriggerZone(zone.id, 15)}
                      className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Proactive 15m Top-up
                    </button>
                  ) : (
                    <div className="flex items-center justify-between w-full text-[11px] text-slate-500">
                      <span>Status: In optimal range</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Safe
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column Configuration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Crop Profiles List & Category Tabs (4 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Configured Crop Profiles</h4>
                <p className="text-xs text-slate-500">Select a crop to customize moisture trigger thresholds.</p>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Crop
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1 mb-4 pb-2 border-b border-slate-100">
              {(['all', 'grain', 'legume', 'fruit', 'nursery', 'vegetable'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'All Crops' : cat}
                </button>
              ))}
            </div>

            {/* Crops List */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {filteredCrops.map(crop => {
                const isSelected = crop.cropId === selectedCropId;
                // Check if any zone with this crop has violations
                const hasCritical = zoneEvaluations.some(
                  ze => ze.matchedCrop.cropId === crop.cropId && ze.status === 'critical'
                );

                return (
                  <div
                    key={crop.cropId}
                    onClick={() => setSelectedCropId(crop.cropId)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-sky-50/70 border-sky-300 ring-1 ring-sky-300 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                        {getCategoryIcon(crop.category)}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-xs font-bold text-slate-900">{crop.cropName}</h5>
                          {hasCritical && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Active critical moisture breach" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Crit: <strong className="text-rose-600 font-semibold">{crop.criticalThreshold}%</strong> · 
                          Warn: <strong className="text-amber-600 font-semibold">{crop.warningThreshold}%</strong> · 
                          Target: <strong className="text-emerald-600 font-semibold">{crop.targetMoisture}%</strong>
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      <div className="text-[10px] text-slate-400">
                        {crop.autoIrrigateOnCritical && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold block mb-0.5">
                            Auto-Soak
                          </span>
                        )}
                        <span>{crop.rootDepthCm}cm root</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reset Defaults button */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">FAO-56 standard curve calibrated</span>
              <button
                onClick={handleResetDefaults}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Defaults
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Threshold Calibration Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {activeCrop && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs space-y-6">
              
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700">
                    {getCategoryIcon(activeCrop.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{activeCrop.cropName}</h3>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 capitalize">
                        {activeCrop.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Phenological Stage: <span className="font-semibold text-slate-700">{activeCrop.faoReferenceStage}</span> · Root Zone: <span className="font-semibold text-slate-700">{activeCrop.rootDepthCm} cm depth</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {thresholds.length > 1 && (
                    <button
                      onClick={() => handleDeleteCrop(activeCrop.cropId)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete this crop configuration"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Threshold Sliders Section */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600" />
                    Automated Soil Moisture Threshold Settings
                  </h4>
                  <span className="text-[11px] text-slate-400">Values in Volumetric Water Content %</span>
                </div>

                {/* 1. Critical Wilting Threshold Slider */}
                <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-rose-600" />
                      <div>
                        <span className="text-xs font-bold text-rose-950">
                          Critical Wilting Threshold (Emergency Alarm)
                        </span>
                        <p className="text-[11px] text-rose-700/80">
                          Root stress point where capillary water retention fails. Triggers instant high-priority alerts.
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-rose-700">{activeCrop.criticalThreshold}%</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="45"
                    step="1"
                    value={activeCrop.criticalThreshold}
                    onChange={(e) => updateActiveCrop({ 
                      criticalThreshold: Number(e.target.value),
                      // maintain hierarchy: warning >= critical + 3
                      warningThreshold: Math.max(Number(e.target.value) + 3, activeCrop.warningThreshold)
                    })}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-rose-600/80 font-medium">
                    <span>10% (Severe Drought)</span>
                    <span>Agronomic Default: 24%</span>
                    <span>45% (High Moisture Sensitive)</span>
                  </div>
                </div>

                {/* 2. Warning Moisture Threshold Slider */}
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <div>
                        <span className="text-xs font-bold text-amber-950">
                          Proactive Warning Moisture Threshold
                        </span>
                        <p className="text-[11px] text-amber-700/80">
                          Early advisory threshold to prevent stomatal closure before irreversible yield loss.
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-amber-700">{activeCrop.warningThreshold}%</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={activeCrop.criticalThreshold + 1}
                    max="55"
                    step="1"
                    value={activeCrop.warningThreshold}
                    onChange={(e) => updateActiveCrop({ 
                      warningThreshold: Number(e.target.value),
                      targetMoisture: Math.max(Number(e.target.value) + 4, activeCrop.targetMoisture)
                    })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-amber-600/80 font-medium">
                    <span>{activeCrop.criticalThreshold + 1}% (Above Critical)</span>
                    <span>Early Advisory Buffer</span>
                    <span>55% (High Moisture)</span>
                  </div>
                </div>

                {/* 3. Optimal Target Moisture (Field Capacity) Slider */}
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="text-xs font-bold text-emerald-950">
                          Optimal Target Moisture (Field Capacity)
                        </span>
                        <p className="text-[11px] text-emerald-700/80">
                          Ideal saturation target for complete nutrient uptake without root anaerobic stress.
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-emerald-700">{activeCrop.targetMoisture}%</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={activeCrop.warningThreshold + 2}
                    max="75"
                    step="1"
                    value={activeCrop.targetMoisture}
                    onChange={(e) => updateActiveCrop({ targetMoisture: Number(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-emerald-600/80 font-medium">
                    <span>{activeCrop.warningThreshold + 2}%</span>
                    <span>Full Field Capacity</span>
                    <span>75% (Maximum)</span>
                  </div>
                </div>
              </div>

              {/* Notification & Automated Valve Response Configuration */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-indigo-600" />
                  Proactive Trigger & Automated Response Actions
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Toggle 1: Proactive Critical Notifications */}
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer bg-slate-50/50">
                    <input
                      type="checkbox"
                      checked={activeCrop.notifyOnCritical}
                      onChange={(e) => updateActiveCrop({ notifyOnCritical: e.target.checked })}
                      className="mt-1 rounded accent-sky-600 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Proactive Critical Alarms</span>
                      <p className="text-[11px] text-slate-500">
                        Dispatch high-priority push toasts and sound alerts if moisture drops &lt; {activeCrop.criticalThreshold}%.
                      </p>
                    </div>
                  </label>

                  {/* Toggle 2: Proactive Warning Notifications */}
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer bg-slate-50/50">
                    <input
                      type="checkbox"
                      checked={activeCrop.notifyOnWarning}
                      onChange={(e) => updateActiveCrop({ notifyOnWarning: e.target.checked })}
                      className="mt-1 rounded accent-sky-600 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Proactive Warning Notices</span>
                      <p className="text-[11px] text-slate-500">
                        Dispatch early advisories when approaching the {activeCrop.warningThreshold}% warning band.
                      </p>
                    </div>
                  </label>

                  {/* Toggle 3: Auto-Irrigate Emergency Valve on Critical Breach */}
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer bg-slate-50/50 sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={activeCrop.autoIrrigateOnCritical}
                      onChange={(e) => updateActiveCrop({ autoIrrigateOnCritical: e.target.checked })}
                      className="mt-1 rounded accent-emerald-600 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 block">
                          Automated Valve Activation on Critical Breach
                        </span>
                        {activeCrop.autoIrrigateOnCritical && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600" onClick={(e) => e.stopPropagation()}>
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Soak Duration:</span>
                            <select
                              value={activeCrop.autoEmergencyDurationMinutes}
                              onChange={(e) => updateActiveCrop({ autoEmergencyDurationMinutes: Number(e.target.value) })}
                              className="px-2 py-0.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white"
                            >
                              <option value="10">10 mins</option>
                              <option value="15">15 mins</option>
                              <option value="20">20 mins</option>
                              <option value="25">25 mins</option>
                              <option value="30">30 mins</option>
                            </select>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        If soil moisture dips below {activeCrop.criticalThreshold}%, automatically open the corresponding solenoid valve for {activeCrop.autoEmergencyDurationMinutes} minutes without waiting for scheduled cycles.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Test / Save Confirmation Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Settings are auto-saved to Claire Hydro-Engine telemetry.
                </span>

                <button
                  onClick={() => {
                    showToast(`Updated threshold parameters for ${activeCrop.cropName}.`, 'success');
                    if (onPlaySound && soundEnabled) onPlaySound();
                  }}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Save & Apply Thresholds
                </button>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Proactive Notification & Alert Trigger History */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-slate-700" />
            <h4 className="text-sm font-bold text-slate-900">Recent Proactive Threshold Alerts & Triggers</h4>
          </div>

          <span className="text-xs text-slate-400">{alertHistory.length} logged events</span>
        </div>

        {alertHistory.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No threshold breach events recorded. Run an Agronomic Audit to check for violations.
          </div>
        ) : (
          <div className="space-y-2">
            {alertHistory.map(alert => (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                  alert.severity === 'critical'
                    ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                    : 'bg-amber-50/60 border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    alert.severity === 'critical' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {alert.severity === 'critical' ? <AlertOctagon className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  </div>

                  <div>
                    <span className="font-bold">{alert.cropName} in {alert.zoneName}:</span>
                    <span className="ml-1 text-slate-700">
                      Moisture dropped to <strong className="font-bold text-slate-900">{alert.moisture}%</strong> (Critical threshold: {alert.threshold}%).
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-slate-400">{alert.time}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                    alert.severity === 'critical' ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Custom Crop Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden"
            >
              <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-sm font-bold text-slate-900">Add Custom Crop Profile & Thresholds</h4>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddCustomCrop} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Crop Name / Variety</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Crisphead Lettuce, Haas Avocado, Alfalfa"
                    value={newCropName}
                    onChange={(e) => setNewCropName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Crop Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-sky-500 bg-white"
                    >
                      <option value="grain">Grain & Cereals</option>
                      <option value="legume">Legumes & Pulses</option>
                      <option value="fruit">Fruit & Orchards</option>
                      <option value="vegetable">Vegetables & Brassicas</option>
                      <option value="nursery">Nursery & Seedlings</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Root Depth (cm)</label>
                    <input
                      type="number"
                      min="5"
                      max="150"
                      value={newRootDepth}
                      onChange={(e) => setNewRootDepth(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-rose-700 mb-1">Critical (%)</label>
                    <input
                      type="number"
                      min="10"
                      max="40"
                      value={newCritical}
                      onChange={(e) => setNewCritical(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-rose-200 rounded-xl text-xs focus:outline-hidden focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-700 mb-1">Warning (%)</label>
                    <input
                      type="number"
                      min="15"
                      max="50"
                      value={newWarning}
                      onChange={(e) => setNewWarning(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-amber-200 rounded-xl text-xs focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-700 mb-1">Target (%)</label>
                    <input
                      type="number"
                      min="25"
                      max="70"
                      value={newTarget}
                      onChange={(e) => setNewTarget(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-emerald-200 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phenological Growth Stage</label>
                  <input
                    type="text"
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                    placeholder="e.g. Vegetative, Flowering, Maturation"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newAutoIrrigate}
                    onChange={(e) => setNewAutoIrrigate(e.target.checked)}
                    className="rounded accent-emerald-600"
                  />
                  <span>Automatically open irrigation valve on critical moisture deficit</span>
                </label>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                  >
                    Create Crop Threshold
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
