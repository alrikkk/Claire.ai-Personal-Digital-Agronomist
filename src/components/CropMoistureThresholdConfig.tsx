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
  ShieldCheck,
  Zap,
  Sun,
  CloudRain,
  Wind,
  Thermometer,
  Gauge,
  Calendar,
  RefreshCw,
  Activity,
  Sliders,
  Check,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Volume2,
  VolumeX,
  Radio,
  Send,
  Target
} from 'lucide-react';
import { IrrigationZone, CropMoistureThreshold, WeatherData, showToast } from '../types';
import {
  calculateReferenceET0,
  calculateCropETc,
  calculateThresholdAdjustment,
  applySmartSchedulingToThresholds,
  restoreBaselineThresholds,
  getCropCoefficient,
  EtCalculationResult
} from '../utils/evapotranspiration';

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
    baselineCriticalThreshold: 24,
    baselineWarningThreshold: 32,
    baselineTargetMoisture: 45,
    cropCoefficientKc: 1.15,
    autoIrrigateOnCritical: true,
    autoEmergencyDurationMinutes: 20,
    notifyOnCritical: true,
    notifyOnWarning: true,
    alertLeadBufferPct: 8,
    alertHysteresisMinutes: 5,
    alertPriority: 'urgent',
    pushSoundEnabled: true,
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
    baselineCriticalThreshold: 25,
    baselineWarningThreshold: 33,
    baselineTargetMoisture: 48,
    cropCoefficientKc: 1.10,
    autoIrrigateOnCritical: false,
    autoEmergencyDurationMinutes: 15,
    notifyOnCritical: true,
    notifyOnWarning: true,
    alertLeadBufferPct: 8,
    alertHysteresisMinutes: 5,
    alertPriority: 'urgent',
    pushSoundEnabled: true,
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
    baselineCriticalThreshold: 30,
    baselineWarningThreshold: 38,
    baselineTargetMoisture: 50,
    cropCoefficientKc: 0.75,
    autoIrrigateOnCritical: true,
    autoEmergencyDurationMinutes: 25,
    notifyOnCritical: true,
    notifyOnWarning: true,
    alertLeadBufferPct: 8,
    alertHysteresisMinutes: 10,
    alertPriority: 'high',
    pushSoundEnabled: true,
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
    baselineCriticalThreshold: 35,
    baselineWarningThreshold: 45,
    baselineTargetMoisture: 55,
    cropCoefficientKc: 1.05,
    autoIrrigateOnCritical: true,
    autoEmergencyDurationMinutes: 15,
    notifyOnCritical: true,
    notifyOnWarning: true,
    alertLeadBufferPct: 10,
    alertHysteresisMinutes: 0,
    alertPriority: 'urgent',
    pushSoundEnabled: true,
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
    baselineCriticalThreshold: 20,
    baselineWarningThreshold: 28,
    baselineTargetMoisture: 42,
    cropCoefficientKc: 1.12,
    autoIrrigateOnCritical: false,
    autoEmergencyDurationMinutes: 20,
    notifyOnCritical: true,
    notifyOnWarning: false,
    alertLeadBufferPct: 8,
    alertHysteresisMinutes: 15,
    alertPriority: 'standard',
    pushSoundEnabled: false,
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
    baselineCriticalThreshold: 28,
    baselineWarningThreshold: 36,
    baselineTargetMoisture: 52,
    cropCoefficientKc: 1.15,
    autoIrrigateOnCritical: true,
    autoEmergencyDurationMinutes: 20,
    notifyOnCritical: true,
    notifyOnWarning: true,
    alertLeadBufferPct: 8,
    alertHysteresisMinutes: 5,
    alertPriority: 'urgent',
    pushSoundEnabled: true,
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

  // --- Smart Scheduling State ---
  const [smartSchedulingEnabled, setSmartSchedulingEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('claire_smart_scheduling_enabled');
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return true; // Smart Scheduling enabled by default for automated agronomy
  });

  const [sensitivity, setSensitivity] = useState<'conservative' | 'balanced' | 'aggressive'>(() => {
    try {
      const saved = localStorage.getItem('claire_smart_scheduling_sensitivity');
      if (saved) return JSON.parse(saved);
    } catch {}
    return 'balanced';
  });

  const [simulatedScenario, setSimulatedScenario] = useState<'live' | 'heatwave' | 'mild' | 'rainy'>('live');
  const [isSyncingET, setIsSyncingET] = useState<boolean>(false);
  const [showAgronomicFormula, setShowAgronomicFormula] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return 'Today at 06:00 AM';
  });

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

  // Effective Weather (simulated or actual)
  const effectiveWeather = useMemo<WeatherData>(() => {
    if (simulatedScenario === 'heatwave') {
      return {
        ...weather,
        temp: 35.8,
        humidity: 26,
        windSpeed: 24,
        dayType: 'Sunny',
        name: `${weather.name} (Simulated Heatwave)`
      };
    }
    if (simulatedScenario === 'mild') {
      return {
        ...weather,
        temp: 22.4,
        humidity: 58,
        windSpeed: 10,
        dayType: 'Sunny',
        name: `${weather.name} (Simulated Mild)`
      };
    }
    if (simulatedScenario === 'rainy') {
      return {
        ...weather,
        temp: 17.5,
        humidity: 86,
        windSpeed: 14,
        dayType: 'Rainy',
        name: `${weather.name} (Simulated Rain Front)`
      };
    }
    return weather;
  }, [weather, simulatedScenario]);

  // Derived ET values from local weather
  const etData = useMemo<EtCalculationResult>(() => {
    return calculateReferenceET0(effectiveWeather);
  }, [effectiveWeather]);

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
      localStorage.setItem('claire_smart_scheduling_enabled', JSON.stringify(smartSchedulingEnabled));
    } catch {}
  }, [smartSchedulingEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('claire_smart_scheduling_sensitivity', JSON.stringify(sensitivity));
    } catch {}
  }, [sensitivity]);

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

  // Crop-specific ETc and dynamic adjustment for active crop
  const activeCropKc = useMemo(() => {
    return activeCrop?.cropCoefficientKc ?? getCropCoefficient(activeCrop?.cropName || '', activeCrop?.category);
  }, [activeCrop]);

  const activeCropEtc = useMemo(() => {
    return calculateCropETc(etData.et0, activeCrop?.cropName || '', activeCrop?.category);
  }, [etData.et0, activeCrop]);

  const activeCropAdjustment = useMemo(() => {
    return calculateThresholdAdjustment(activeCropEtc, sensitivity);
  }, [activeCropEtc, sensitivity]);

  // Automatic Daily Sync Effect:
  // When Smart Scheduling is active, thresholds automatically calibrate based on ET
  useEffect(() => {
    if (!smartSchedulingEnabled) return;

    // Check if daily update is needed
    const todayStr = new Date().toISOString().split('T')[0];
    const lastDate = localStorage.getItem('claire_smart_scheduling_last_date');

    if (lastDate !== todayStr) {
      const result = applySmartSchedulingToThresholds(thresholds, effectiveWeather, sensitivity);
      setThresholds(result.updatedThresholds);
      localStorage.setItem('claire_smart_scheduling_last_date', todayStr);
      setLastSyncTime(`Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    }
  }, [smartSchedulingEnabled, effectiveWeather, sensitivity]);

  // Toggle Smart Scheduling Handler
  const handleToggleSmartScheduling = (enabled: boolean) => {
    setSmartSchedulingEnabled(enabled);
    if (onPlaySound && soundEnabled) {
      onPlaySound('toggle');
    }

    if (enabled) {
      const result = applySmartSchedulingToThresholds(thresholds, effectiveWeather, sensitivity);
      setThresholds(result.updatedThresholds);
      setLastSyncTime(`Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      showToast(
        `Smart Scheduling Activated: Moisture thresholds updated daily from local weather ET0 (${etData.et0} mm/day).`,
        'success'
      );
    } else {
      const reverted = restoreBaselineThresholds(thresholds);
      setThresholds(reverted);
      showToast('Smart Scheduling Disabled: Reverted to manual baseline crop thresholds.', 'info');
    }
  };

  // Force Daily Recalculate Now Action
  const handleForceDailySync = () => {
    setIsSyncingET(true);
    if (onPlaySound && soundEnabled) {
      onPlaySound('toggle');
    }

    setTimeout(() => {
      setIsSyncingET(false);
      const result = applySmartSchedulingToThresholds(thresholds, effectiveWeather, sensitivity);
      setThresholds(result.updatedThresholds);
      setLastSyncTime(`Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      showToast(
        `Daily Microclimate Sync: ET0 evaluated at ${etData.et0} mm/day (VPD: ${etData.vpd} kPa). Moisture thresholds updated.`,
        'success'
      );
    }, 600);
  };

  // Evaluate which zones match crops and check for threshold violations
  const zoneEvaluations = useMemo(() => {
    return zones.map(zone => {
      const matchedCrop = thresholds.find(t => 
        zone.cropType.toLowerCase().includes(t.cropName.toLowerCase().split(' ')[0].toLowerCase()) ||
        t.cropName.toLowerCase().includes(zone.cropType.toLowerCase().split(' ')[0].toLowerCase())
      ) || thresholds[0];

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
        // Also keep baselines in sync if user changes threshold directly
        const baselineUpdates: Partial<CropMoistureThreshold> = {};
        if (updates.criticalThreshold !== undefined && !smartSchedulingEnabled) {
          baselineUpdates.baselineCriticalThreshold = updates.criticalThreshold;
        }
        if (updates.warningThreshold !== undefined && !smartSchedulingEnabled) {
          baselineUpdates.baselineWarningThreshold = updates.warningThreshold;
        }
        if (updates.targetMoisture !== undefined && !smartSchedulingEnabled) {
          baselineUpdates.baselineTargetMoisture = updates.targetMoisture;
        }
        return { ...item, ...updates, ...baselineUpdates };
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

    zoneEvaluations.forEach(ev => {
      if (ev.status === 'critical' && ev.matchedCrop.notifyOnCritical) {
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

        if (ev.matchedCrop.autoIrrigateOnCritical && onTriggerZone && ev.zone.valveStatus !== 'watering') {
          setTimeout(() => {
            onTriggerZone(ev.zone.id, ev.matchedCrop.autoEmergencyDurationMinutes);
            showToast(`Auto-Irrigation Activated: ${ev.zone.name} starting ${ev.matchedCrop.autoEmergencyDurationMinutes}m emergency soak.`, 'success');
          }, 600);
        }
      } else if (ev.status === 'warning' && ev.matchedCrop.notifyOnWarning) {
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

  // Zones linked to the currently selected crop profile
  const activeCropZones = useMemo(() => {
    if (!activeCrop) return [];
    return zones.filter(zone => 
      zone.cropType.toLowerCase().includes(activeCrop.cropName.toLowerCase().split(' ')[0].toLowerCase()) ||
      activeCrop.cropName.toLowerCase().includes(zone.cropType.toLowerCase().split(' ')[0].toLowerCase())
    );
  }, [zones, activeCrop]);

  const activeCropZonesEvaluation = useMemo(() => {
    if (!activeCrop) return [];
    return activeCropZones.map(zone => {
      const effectiveMoisture = Math.max(5, Math.min(100, zone.currentMoisture + (isSimulatingStress ? simulationMoistureOffset : 0)));
      const isBreachingCritical = effectiveMoisture < activeCrop.criticalThreshold;
      const warningPoint = activeCrop.criticalThreshold + (activeCrop.alertLeadBufferPct ?? 8);
      const isWarning = !isBreachingCritical && effectiveMoisture < warningPoint;
      return {
        zone,
        effectiveMoisture,
        isBreachingCritical,
        isWarning,
        margin: Number((effectiveMoisture - activeCrop.criticalThreshold).toFixed(1))
      };
    });
  }, [activeCropZones, activeCrop, isSimulatingStress, simulationMoistureOffset]);

  const activeCropBreachedCount = activeCropZonesEvaluation.filter(z => z.isBreachingCritical).length;

  // Trigger realistic simulated push notification for current crop alert threshold
  const handleSendTestPushNotification = (cropToTest?: CropMoistureThreshold) => {
    const crop = cropToTest || activeCrop;
    if (!crop) return;

    if (onPlaySound && soundEnabled && (crop.pushSoundEnabled ?? true)) {
      onPlaySound('start');
    }

    const matchingZone = activeCropZones[0] || zones[0];
    const currentZoneMoisture = matchingZone 
      ? Math.max(5, Math.min(100, matchingZone.currentMoisture + (isSimulatingStress ? simulationMoistureOffset : 0)))
      : 19.5;
    
    // Simulate drop below critical if not already below
    const breachMoisture = currentZoneMoisture < crop.criticalThreshold 
      ? currentZoneMoisture 
      : Math.max(8, Number((crop.criticalThreshold - 2.4).toFixed(1)));

    const alertId = 'push-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const title = `🚨 PROACTIVE PUSH ALERT: [${crop.cropName}] Critical Moisture Breach`;
    const message = `Tensiometer in ${matchingZone?.name || 'Field Block'} detected ${breachMoisture}% VWC, breaching your tuned Alert Threshold of ${crop.criticalThreshold.toFixed(1)}%. Immediate proactive root-stress notification triggered!`;

    showToast(message, 'error', title);

    const newAlert = {
      id: alertId,
      cropName: crop.cropName,
      zoneName: matchingZone?.name || 'Field Block',
      moisture: breachMoisture,
      threshold: crop.criticalThreshold,
      severity: 'critical' as const,
      time: 'Just now (Push Test)'
    };

    setAlertHistory(prev => [newAlert, ...prev].slice(0, 15));
  };

  // Add custom crop handler
  const handleAddCustomCrop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCropName.trim()) return;

    const baseCrit = Number(newCritical);
    const baseWarn = Math.max(Number(newCritical) + 4, Number(newWarning));
    const baseTarget = Math.max(Number(newWarning) + 5, Number(newTarget));
    const kc = getCropCoefficient(newCropName, newCategory);

    let effectiveCrit = baseCrit;
    let effectiveWarn = baseWarn;
    let effectiveTarget = baseTarget;

    if (smartSchedulingEnabled) {
      const etc = calculateCropETc(etData.et0, newCropName, newCategory);
      const { criticalOffset, warningOffset, targetOffset } = calculateThresholdAdjustment(etc, sensitivity);
      effectiveCrit = Math.max(10, Math.min(50, baseCrit + criticalOffset));
      effectiveWarn = Math.max(effectiveCrit + 3, Math.min(65, baseWarn + warningOffset));
      effectiveTarget = Math.max(effectiveWarn + 4, Math.min(80, baseTarget + targetOffset));
    }

    const newCrop: CropMoistureThreshold = {
      cropId: 'crop-' + Date.now(),
      cropName: newCropName.trim(),
      category: newCategory,
      criticalThreshold: effectiveCrit,
      warningThreshold: effectiveWarn,
      targetMoisture: effectiveTarget,
      baselineCriticalThreshold: baseCrit,
      baselineWarningThreshold: baseWarn,
      baselineTargetMoisture: baseTarget,
      cropCoefficientKc: kc,
      autoIrrigateOnCritical: newAutoIrrigate,
      autoEmergencyDurationMinutes: 15,
      notifyOnCritical: true,
      notifyOnWarning: true,
      alertLeadBufferPct: 8,
      alertHysteresisMinutes: 5,
      alertPriority: 'urgent',
      pushSoundEnabled: true,
      rootDepthCm: Number(newRootDepth),
      faoReferenceStage: newStage || 'Active Growth'
    };

    setThresholds(prev => [...prev, newCrop]);
    setSelectedCropId(newCrop.cropId);
    setIsAddModalOpen(false);
    setNewCropName('');
    showToast(`Added crop profile "${newCrop.cropName}" with automated ET moisture tuning.`, 'success');
  };

  // Reset to FAO defaults
  const handleResetDefaults = () => {
    if (smartSchedulingEnabled) {
      const result = applySmartSchedulingToThresholds(DEFAULT_CROP_THRESHOLDS, effectiveWeather, sensitivity);
      setThresholds(result.updatedThresholds);
    } else {
      setThresholds(DEFAULT_CROP_THRESHOLDS);
    }
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

  // 7-day Historical ET Log
  const historicalEtLog = useMemo(() => [
    {
      date: 'Today',
      day: 'Wed',
      temp: effectiveWeather.temp,
      humidity: effectiveWeather.humidity,
      dayType: effectiveWeather.dayType,
      et0: etData.et0,
      avgEtc: Math.round(etData.et0 * 1.12 * 10) / 10,
      offset: activeCropAdjustment.criticalOffset,
      action: activeCropAdjustment.criticalOffset > 2 ? 'Threshold raised for heat protection' : activeCropAdjustment.criticalOffset < 0 ? 'Threshold relaxed to save water' : 'Operating at baseline'
    },
    {
      date: 'Yesterday',
      day: 'Tue',
      temp: 28.5,
      humidity: 48,
      dayType: 'Sunny',
      et0: 5.1,
      avgEtc: 5.7,
      offset: 3,
      action: 'Elevated threshold (+3%) due to midday drying winds'
    },
    {
      date: 'Oct 05',
      day: 'Mon',
      temp: 31.0,
      humidity: 38,
      dayType: 'Sunny',
      et0: 5.8,
      avgEtc: 6.5,
      offset: 4,
      action: 'Heatwave surge (+4% buffer applied, early soak triggered)'
    },
    {
      date: 'Oct 04',
      day: 'Sun',
      temp: 24.2,
      humidity: 62,
      dayType: 'Cloudy',
      et0: 3.4,
      avgEtc: 3.8,
      offset: -1,
      action: 'Overcast skies: relaxed threshold (-1%), 820L water conserved'
    },
    {
      date: 'Oct 03',
      day: 'Sat',
      temp: 21.0,
      humidity: 78,
      dayType: 'Rainy',
      et0: 1.8,
      avgEtc: 2.0,
      offset: -3,
      action: 'Precipitation event: irrigation suspended to prevent root hypoxia'
    },
    {
      date: 'Oct 02',
      day: 'Fri',
      temp: 25.4,
      humidity: 55,
      dayType: 'Sunny',
      et0: 4.2,
      avgEtc: 4.7,
      offset: 1,
      action: 'Normal baseline operation with standard cycle'
    },
    {
      date: 'Oct 01',
      day: 'Thu',
      temp: 26.8,
      humidity: 50,
      dayType: 'Sunny',
      et0: 4.6,
      avgEtc: 5.1,
      offset: 2,
      action: 'Mild afternoon breeze: +2% buffer maintained'
    }
  ], [effectiveWeather, etData, activeCropAdjustment]);

  return (
    <div className="p-5 md:p-6 space-y-6">
      
      {/* ========================================================================= */}
      {/* 1. HERO 'SMART SCHEDULING' CONTROL PANEL & WEATHER ET ENGINE             */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-5 md:p-6 shadow-xl border border-slate-700/80 relative overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Main Title & Toggle Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-start gap-3.5">
              <div className={`p-3 rounded-2xl shrink-0 transition-colors ${
                smartSchedulingEnabled 
                  ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                <Zap className="w-6 h-6 fill-current" />
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                    Smart Scheduling
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                      ET-Driven
                    </span>
                  </h3>

                  {smartSchedulingEnabled ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      AUTOMATED DAILY CALIBRATION ACTIVE
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      MANUAL STATIC THRESHOLDS
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Automatically updates soil moisture thresholds daily based on Evapotranspiration (ET) rates calculated from your local microclimate weather. On high-evaporation days, thresholds are elevated to trigger proactive irrigation earlier; on cool or rainy days, thresholds relax to conserve water and prevent root hypoxia.
                </p>
              </div>
            </div>

            {/* Smart Scheduling Master Toggle Switch & Quick Sync */}
            <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
              <div className="flex items-center gap-3 bg-slate-800/90 border border-slate-700 p-2 rounded-2xl backdrop-blur-xs">
                <span className="text-xs font-semibold text-slate-300 pl-1">
                  {smartSchedulingEnabled ? 'Smart Mode' : 'Manual Mode'}
                </span>

                {/* Accessible Toggle Button */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={smartSchedulingEnabled}
                  onClick={() => handleToggleSmartScheduling(!smartSchedulingEnabled)}
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    smartSchedulingEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                  title="Toggle automated ET-driven Smart Scheduling"
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      smartSchedulingEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Force Daily Recalculate Now button */}
              {smartSchedulingEnabled && (
                <button
                  onClick={handleForceDailySync}
                  disabled={isSyncingET}
                  className="px-3.5 py-2.5 bg-sky-600/90 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-sky-900/30 disabled:opacity-50 cursor-pointer"
                  title="Recalculate today's ET0 and refresh threshold offsets immediately"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingET ? 'animate-spin' : ''}`} />
                  <span>Sync Today Now</span>
                </button>
              )}
            </div>
          </div>

          {/* Microclimate ET Telemetry HUD Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Reference ET0 */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Reference ET₀</span>
                <Gauge className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="my-1.5">
                <div className="text-xl font-black text-white flex items-baseline gap-1">
                  {etData.et0}
                  <span className="text-[11px] font-normal text-slate-400">mm/day</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    etData.rating === 'Extreme' ? 'bg-rose-500/20 text-rose-300' :
                    etData.rating === 'High' ? 'bg-amber-500/20 text-amber-300' :
                    etData.rating === 'Moderate' ? 'bg-sky-500/20 text-sky-300' :
                    'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {etData.rating} Demand
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 line-clamp-1">FAO Penman-Monteith</span>
            </div>

            {/* 2. Atmospheric VPD */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Vapor Deficit (VPD)</span>
                <Activity className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="my-1.5">
                <div className="text-xl font-black text-white flex items-baseline gap-1">
                  {etData.vpd}
                  <span className="text-[11px] font-normal text-slate-400">kPa</span>
                </div>
                <span className="text-[10px] text-slate-300">
                  {etData.vpd > 1.8 ? 'High evaporative pull' : etData.vpd > 1.2 ? 'Moderate transpiration' : 'Low evaporative pull'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Stomatal atmospheric load</span>
            </div>

            {/* 3. Weather Inputs */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Local Microclimate</span>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="my-1 space-y-0.5 text-xs">
                <div className="flex items-center justify-between text-slate-200">
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Thermometer className="w-3 h-3 text-rose-400" /> Temp:
                  </span>
                  <span className="font-bold">{effectiveWeather.temp}°C</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Droplet className="w-3 h-3 text-sky-400" /> Humidity:
                  </span>
                  <span className="font-bold">{effectiveWeather.humidity}%</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Wind className="w-3 h-3 text-cyan-400" /> Wind:
                  </span>
                  <span className="font-bold">{effectiveWeather.windSpeed} km/h</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400">{effectiveWeather.dayType} day</span>
            </div>

            {/* 4. Active Crop ETc */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="line-clamp-1">{activeCrop.cropName.split(' ')[0]} ETc</span>
                <Sprout className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="my-1.5">
                <div className="text-xl font-black text-white flex items-baseline gap-1">
                  {activeCropEtc}
                  <span className="text-[11px] font-normal text-slate-400">mm/day</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  Kc coefficient: {activeCropKc}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">ETc = ET₀ × Kc</span>
            </div>

            {/* 5. Dynamic Threshold Offset Applied */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Threshold Shift</span>
                <Sliders className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <div className="my-1.5">
                <div className="text-xl font-black flex items-baseline gap-1 text-white">
                  {smartSchedulingEnabled ? (
                    <span className={activeCropAdjustment.criticalOffset > 0 ? 'text-amber-400' : activeCropAdjustment.criticalOffset < 0 ? 'text-sky-400' : 'text-emerald-400'}>
                      {activeCropAdjustment.criticalOffset > 0 ? `+${activeCropAdjustment.criticalOffset}%` : `${activeCropAdjustment.criticalOffset}%`}
                    </span>
                  ) : (
                    <span className="text-slate-500">0%</span>
                  )}
                  <span className="text-[11px] font-normal text-slate-400">moisture</span>
                </div>
                <span className="text-[10px] text-slate-300 line-clamp-1">
                  {smartSchedulingEnabled 
                    ? (activeCropAdjustment.criticalOffset > 0 ? 'Elevated for heat' : activeCropAdjustment.criticalOffset < 0 ? 'Relaxed to save water' : 'Baseline optimal')
                    : 'Manual baseline'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Sensitivity: {sensitivity}</span>
            </div>

            {/* 6. Recalibration Cycle */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Daily Recalibration</span>
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="my-1.5">
                <span className="text-xs font-bold text-white block">
                  {lastSyncTime}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold block mt-1">
                  Next: Tomorrow at Dawn
                </span>
              </div>
              <button
                onClick={() => setShowHistoryModal(true)}
                className="text-[10px] text-sky-400 hover:text-sky-300 font-medium underline text-left cursor-pointer"
              >
                View 7-day ET history
              </button>
            </div>
          </div>

          {/* Controls Bar: Sensitivity Selector, Weather Simulator Pills & Math formula drawer */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
            {/* ET Sensitivity Mode */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                ET Sensitivity:
              </span>
              {(['conservative', 'balanced', 'aggressive'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => {
                    setSensitivity(mode);
                    if (smartSchedulingEnabled) {
                      const res = applySmartSchedulingToThresholds(thresholds, effectiveWeather, mode);
                      setThresholds(res.updatedThresholds);
                      showToast(`ET Sensitivity switched to ${mode}. Thresholds recalibrated.`, 'info');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    sensitivity === mode
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {mode === 'conservative' ? 'Conservative (+Safety Buffer)' : mode === 'balanced' ? 'Balanced (FAO-56)' : 'Water Saver'}
                </button>
              ))}
            </div>

            {/* Microclimate Simulation Test Modes */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 text-[11px] font-medium mr-1">Weather Test:</span>
              {[
                { id: 'live', label: 'Local Live Weather' },
                { id: 'heatwave', label: 'Heatwave (36°C, High ET)' },
                { id: 'mild', label: 'Mild Spring (22°C)' },
                { id: 'rainy', label: 'Rainy Front (18°C, Low ET)' }
              ].map(scenario => (
                <button
                  key={scenario.id}
                  onClick={() => {
                    setSimulatedScenario(scenario.id as any);
                    if (smartSchedulingEnabled) {
                      showToast(`Simulating ${scenario.label}. Watch daily ET thresholds react!`, 'info');
                    }
                  }}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    simulatedScenario === scenario.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {scenario.label}
                </button>
              ))}

              <button
                onClick={() => setShowAgronomicFormula(!showAgronomicFormula)}
                className="ml-2 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="View FAO-56 Penman-Monteith physics equation"
              >
                <Info className="w-3.5 h-3.5" />
                <span>{showAgronomicFormula ? 'Hide Math' : 'FAO Equation'}</span>
              </button>
            </div>
          </div>

          {/* FAO-56 Agronomic Formula Drawer */}
          {showAgronomicFormula && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 text-xs text-slate-300 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  FAO-56 Penman-Monteith Daily Evapotranspiration Physics
                </span>
                <span className="text-[11px] text-slate-400">UN Food and Agriculture Organization Standard</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-mono bg-slate-900/80 p-2.5 rounded-xl border border-slate-700">
                ET₀ = [ 0.408·Δ·(Rn - G) + γ·(900 / (T + 273))·u₂·(es - ea) ] / [ Δ + γ·(1 + 0.34·u₂) ]
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Where <strong>Δ</strong> is slope of vapor curve, <strong>Rn</strong> is net radiation, <strong>T</strong> is ambient temperature ({effectiveWeather.temp}°C), <strong>u₂</strong> is wind speed at 2m ({effectiveWeather.windSpeed} km/h), <strong>(es - ea)</strong> is Vapor Pressure Deficit ({etData.vpd} kPa), and <strong>γ</strong> is psychrometric constant. 
                Crop Evapotranspiration: <strong>ETc = ET₀ × Kc</strong>. 
                When evaporative demand rises, Claire automatically elevates soil moisture critical thresholds to safeguard against afternoon wilting before scheduled irrigation.
              </p>
            </motion.div>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PROACTIVE MONITORING STATUS & ACTION CONTROLS                          */}
      {/* ========================================================================= */}
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

                {smartSchedulingEnabled && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">
                    ET Calibrated
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-700 mt-1 max-w-2xl leading-relaxed">
                Claire continuously audits tensiometer sensors across all {zones.length} field quadrants against FAO-56 crop wilting points. 
                {smartSchedulingEnabled 
                  ? ` Today's thresholds include a dynamic ${activeCropAdjustment.criticalOffset >= 0 ? `+${activeCropAdjustment.criticalOffset}%` : `${activeCropAdjustment.criticalOffset}%`} microclimate buffer calibrated from local ET rate (${etData.et0} mm/day).`
                  : ' Using static manual threshold setpoints.'}
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
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
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

      {/* ========================================================================= */}
      {/* 3. REAL-TIME ZONE AUDIT MATRIX                                           */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 md:px-6 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-sky-600" />
              Active Zone Moisture vs Crop Threshold Comparison
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Live tensiometer readings cross-referenced with crop species critical limits.
              {smartSchedulingEnabled && ' (Smart Scheduling ET-adjusted active)'}
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
                      className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Emergency {matchedCrop.autoEmergencyDurationMinutes}m Soak
                    </button>
                  ) : isWarn ? (
                    <button
                      onClick={() => onTriggerZone && onTriggerZone(zone.id, 15)}
                      className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
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

      {/* ========================================================================= */}
      {/* 4. MAIN TWO-COLUMN CONFIGURATION SECTION                                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Crop Profiles List & Category Tabs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Configured Crop Profiles</h4>
                <p className="text-xs text-slate-500">Select a crop to customize moisture trigger thresholds.</p>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
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
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {filteredCrops.map(crop => {
                const isSelected = crop.cropId === selectedCropId;
                const hasCritical = zoneEvaluations.some(
                  ze => ze.matchedCrop.cropId === crop.cropId && ze.status === 'critical'
                );

                // Difference from baseline if Smart Scheduling is active
                const critDelta = smartSchedulingEnabled && crop.baselineCriticalThreshold !== undefined
                  ? crop.criticalThreshold - crop.baselineCriticalThreshold
                  : 0;

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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5 className="text-xs font-bold text-slate-900">{crop.cropName}</h5>
                          {hasCritical && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Active critical moisture breach" />
                          )}
                          {smartSchedulingEnabled && critDelta !== 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              critDelta > 0 ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                            }`}>
                              ET {critDelta > 0 ? `+${critDelta}%` : `${critDelta}%`}
                            </span>
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
                className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 transition-colors cursor-pointer"
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
                      Phenological Stage: <span className="font-semibold text-slate-700">{activeCrop.faoReferenceStage}</span> · Root Zone: <span className="font-semibold text-slate-700">{activeCrop.rootDepthCm} cm depth</span> · Kc factor: <span className="font-semibold text-slate-700">{activeCropKc}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {thresholds.length > 1 && (
                    <button
                      onClick={() => handleDeleteCrop(activeCrop.cropId)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete this crop configuration"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Smart Scheduling ET Status Banner for this crop */}
              {smartSchedulingEnabled ? (
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-between text-xs text-sky-950">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-sky-600 shrink-0" />
                    <div>
                      <span className="font-bold">Smart Scheduling Active for {activeCrop.cropName}:</span>
                      <p className="text-[11px] text-sky-800">
                        Today's ETc is <strong>{activeCropEtc} mm/day</strong>. Baseline wilting point ({activeCrop.baselineCriticalThreshold ?? activeCrop.criticalThreshold}%) dynamically adjusted to <strong>{activeCrop.criticalThreshold}%</strong> ({activeCropAdjustment.criticalOffset >= 0 ? `+${activeCropAdjustment.criticalOffset}%` : `${activeCropAdjustment.criticalOffset}%`}) to prevent afternoon plant stress.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-sky-200 text-sky-900 rounded-md shrink-0">
                    ET Dynamic
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Operating on static manual thresholds. Enable Smart Scheduling above to automate daily ET adjustments.</span>
                  </div>
                  <button
                    onClick={() => handleToggleSmartScheduling(true)}
                    className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 underline cursor-pointer"
                  >
                    Enable
                  </button>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 'ALERT THRESHOLD' SLIDER SET & PROACTIVE PUSH NOTIFICATION CENTER       */}
              {/* ========================================================================= */}
              <div className="space-y-6">
                
                {/* Header with status pill & threat telemetry */}
                <div className="bg-gradient-to-r from-rose-50 via-amber-50/40 to-slate-50 p-4 rounded-2xl border border-rose-200/80 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-rose-600 text-white shadow-xs">
                        <SlidersHorizontal className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                            'Alert Threshold' Slider Set
                          </h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                            Fine-Tuning Active
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Fine-tune the critical moisture setpoint, early advisory buffer, and noise filter before proactive push notifications are dispatched.
                        </p>
                      </div>
                    </div>

                    {/* Status badges */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs">
                        <span className={`w-2 h-2 rounded-full ${
                          activeCropBreachedCount > 0 ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                        }`} />
                        <span className="text-[11px] font-semibold text-slate-700">
                          {activeCropBreachedCount > 0 ? (
                            <span className="text-rose-700 font-bold">{activeCropBreachedCount} Zone(s) Breached</span>
                          ) : (
                            <span className="text-emerald-700 font-bold">All Zones in Safe Band</span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs">
                        <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                        <span className="text-[11px] font-semibold text-slate-700">
                          Push: {activeCrop.notifyOnCritical ? 'ARMED' : 'PAUSED'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------------------- */}
                {/* 1. PRIMARY ALERT THRESHOLD SLIDER: CRITICAL MOISTURE POINT                */}
                {/* ------------------------------------------------------------------------- */}
                <div className="bg-gradient-to-b from-rose-50/70 to-rose-50/30 p-5 rounded-2xl border-2 border-rose-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-xl bg-rose-500 text-white shrink-0 mt-0.5">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                            Critical Moisture Alert Point
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-200/80 text-rose-800">
                            Primary Push Trigger
                          </span>
                        </div>
                        <p className="text-xs text-rose-800/85 mt-0.5 leading-relaxed">
                          Fine-tune the exact volumetric water content limit. If soil drops below this setpoint, Claire dispatches an instant proactive push notification and initiates emergency protocol.
                        </p>
                      </div>
                    </div>

                    {/* Numerical readout display */}
                    <div className="text-left sm:text-right bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-rose-200 shrink-0">
                      <div className="flex items-baseline sm:justify-end gap-1">
                        <span className="text-3xl font-black text-rose-600 tracking-tight font-mono">
                          {Number(activeCrop.criticalThreshold).toFixed(1)}%
                        </span>
                        <span className="text-xs font-bold text-rose-500">VWC</span>
                      </div>
                      <span className="block text-[11px] text-rose-700/80 font-medium">
                        {smartSchedulingEnabled && activeCrop.baselineCriticalThreshold ? (
                          <span>Base {activeCrop.baselineCriticalThreshold}% {activeCropAdjustment.criticalOffset >= 0 ? `+${activeCropAdjustment.criticalOffset}% ET` : `${activeCropAdjustment.criticalOffset}% ET`}</span>
                        ) : (
                          <span>Manual Static Point</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Slider Control */}
                  <div className="space-y-1.5 pt-1">
                    <input
                      type="range"
                      min="10"
                      max="45"
                      step="0.5"
                      value={activeCrop.criticalThreshold}
                      onChange={(e) => {
                        const newCrit = Number(e.target.value);
                        const leadBuffer = activeCrop.alertLeadBufferPct ?? 8;
                        updateActiveCrop({ 
                          criticalThreshold: newCrit,
                          warningThreshold: Math.max(newCrit + leadBuffer, activeCrop.warningThreshold)
                        });
                      }}
                      className="w-full accent-rose-600 cursor-pointer h-2.5 bg-rose-200 rounded-lg"
                    />

                    <div className="flex justify-between text-[10px] text-rose-700/80 font-medium px-0.5">
                      <span>10.0% (Severe Desiccation)</span>
                      <span>Agronomic Wilting Baseline: 24.0%</span>
                      <span>45.0% (High Water Sensitivity)</span>
                    </div>
                  </div>

                  {/* Micro-Adjustment Nudge Steppers & Agronomic Presets */}
                  <div className="pt-2 border-t border-rose-200/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Stepper Buttons for Fine Precision */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-rose-900 mr-1 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-rose-600" />
                        Fine-Tune Nudge:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = Math.max(10, Math.round((activeCrop.criticalThreshold - 1.0) * 10) / 10);
                          const leadBuffer = activeCrop.alertLeadBufferPct ?? 8;
                          updateActiveCrop({ criticalThreshold: updated, warningThreshold: Math.max(updated + leadBuffer, activeCrop.warningThreshold) });
                        }}
                        className="px-2 py-1 text-xs font-bold rounded-lg bg-white border border-rose-200 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer shadow-2xs"
                        title="Decrease Alert Threshold by 1.0%"
                      >
                        -1.0%
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = Math.max(10, Math.round((activeCrop.criticalThreshold - 0.5) * 10) / 10);
                          const leadBuffer = activeCrop.alertLeadBufferPct ?? 8;
                          updateActiveCrop({ criticalThreshold: updated, warningThreshold: Math.max(updated + leadBuffer, activeCrop.warningThreshold) });
                        }}
                        className="px-2 py-1 text-xs font-bold rounded-lg bg-white border border-rose-200 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer shadow-2xs"
                        title="Decrease Alert Threshold by 0.5%"
                      >
                        -0.5%
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = Math.min(45, Math.round((activeCrop.criticalThreshold + 0.5) * 10) / 10);
                          const leadBuffer = activeCrop.alertLeadBufferPct ?? 8;
                          updateActiveCrop({ criticalThreshold: updated, warningThreshold: Math.max(updated + leadBuffer, activeCrop.warningThreshold) });
                        }}
                        className="px-2 py-1 text-xs font-bold rounded-lg bg-white border border-rose-200 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer shadow-2xs"
                        title="Increase Alert Threshold by 0.5%"
                      >
                        +0.5%
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = Math.min(45, Math.round((activeCrop.criticalThreshold + 1.0) * 10) / 10);
                          const leadBuffer = activeCrop.alertLeadBufferPct ?? 8;
                          updateActiveCrop({ criticalThreshold: updated, warningThreshold: Math.max(updated + leadBuffer, activeCrop.warningThreshold) });
                        }}
                        className="px-2 py-1 text-xs font-bold rounded-lg bg-white border border-rose-200 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer shadow-2xs"
                        title="Increase Alert Threshold by 1.0%"
                      >
                        +1.0%
                      </button>
                    </div>

                    {/* Agronomic Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-600 mr-1">Presets:</span>
                      {[
                        { label: 'Drought Hardy', val: 18 },
                        { label: 'FAO Standard', val: 24 },
                        { label: 'Yield Guard', val: 28 },
                        { label: 'Seedling Care', val: 34 }
                      ].map(preset => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            const leadBuffer = activeCrop.alertLeadBufferPct ?? 8;
                            updateActiveCrop({ criticalThreshold: preset.val, warningThreshold: preset.val + leadBuffer });
                          }}
                          className={`px-2 py-0.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                            Math.abs(activeCrop.criticalThreshold - preset.val) < 0.3
                              ? 'bg-rose-600 text-white border-rose-600 font-bold shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {preset.label} ({preset.val}%)
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Monitored Zone Needles on the Slider Track */}
                  {activeCropZonesEvaluation.length > 0 && (
                    <div className="mt-3 p-3 rounded-xl bg-white/90 border border-rose-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-rose-600" />
                          Live Field Zones vs. This Tuned Alert Threshold:
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Threshold: <strong>{Number(activeCrop.criticalThreshold).toFixed(1)}%</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {activeCropZonesEvaluation.map(({ zone, effectiveMoisture, isBreachingCritical, margin }) => (
                          <div
                            key={zone.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                              isBreachingCritical
                                ? 'bg-rose-50 border-rose-300 text-rose-950'
                                : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs">{zone.name}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md uppercase ${
                                  isBreachingCritical ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {isBreachingCritical ? 'ALERT BREACH' : 'SAFE'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Current: <strong className={isBreachingCritical ? 'text-rose-600 font-bold' : 'text-slate-800'}>{effectiveMoisture}%</strong> · {margin >= 0 ? `+${margin}% buffer above cutoff` : `${margin}% below threshold`}
                              </p>
                            </div>

                            {isBreachingCritical && (
                              <button
                                type="button"
                                onClick={() => handleSendTestPushNotification(activeCrop)}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                              >
                                Test Push
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ------------------------------------------------------------------------- */}
                {/* 2. ADVISORY WARNING LEAD BUFFER SLIDER                                    */}
                {/* ------------------------------------------------------------------------- */}
                <div className="bg-amber-50/60 p-4.5 rounded-2xl border border-amber-200/90 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                            Early Warning Push Notification Lead Buffer
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-200 text-amber-800">
                            Advisory Advance
                          </span>
                        </div>
                        <p className="text-xs text-amber-800/90 mt-0.5">
                          Dispatches an early advisory push alert before soil reaches critical root damage, giving staff time to inspect irrigation solenoids.
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="flex items-baseline sm:justify-end gap-1">
                        <span className="text-2xl font-bold text-amber-700 font-mono">
                          +{activeCrop.alertLeadBufferPct ?? 8}%
                        </span>
                      </div>
                      <span className="text-[11px] text-amber-800 font-medium block">
                        Advisory Alert fires at: <strong>{Number(activeCrop.criticalThreshold + (activeCrop.alertLeadBufferPct ?? 8)).toFixed(1)}% VWC</strong>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <input
                      type="range"
                      min="2"
                      max="15"
                      step="1"
                      value={activeCrop.alertLeadBufferPct ?? 8}
                      onChange={(e) => {
                        const buffer = Number(e.target.value);
                        updateActiveCrop({
                          alertLeadBufferPct: buffer,
                          warningThreshold: Number(activeCrop.criticalThreshold) + buffer
                        });
                      }}
                      className="w-full accent-amber-500 cursor-pointer h-2 bg-amber-200 rounded-lg"
                    />

                    <div className="flex justify-between text-[10px] text-amber-700/80 font-medium">
                      <span>+2% (Tight Warning)</span>
                      <span>Standard Lead Buffer: +8%</span>
                      <span>+15% (Ultra-Early Notice)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200/60">
                    <span className="text-slate-600 text-[11px]">Buffer Micro-Tuning:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const current = activeCrop.alertLeadBufferPct ?? 8;
                          const next = Math.max(2, current - 1);
                          updateActiveCrop({ alertLeadBufferPct: next, warningThreshold: activeCrop.criticalThreshold + next });
                        }}
                        className="px-2 py-0.5 rounded-lg border border-amber-300 bg-white text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors"
                      >
                        -1%
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const current = activeCrop.alertLeadBufferPct ?? 8;
                          const next = Math.min(15, current + 1);
                          updateActiveCrop({ alertLeadBufferPct: next, warningThreshold: activeCrop.criticalThreshold + next });
                        }}
                        className="px-2 py-0.5 rounded-lg border border-amber-300 bg-white text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors"
                      >
                        +1%
                      </button>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------------------- */}
                {/* 3. SUSTAINED BREACH WINDOW SLIDER (NOISE FILTER / HYSTERESIS)             */}
                {/* ------------------------------------------------------------------------- */}
                <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-xl bg-sky-600 text-white shrink-0 mt-0.5">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Sustained Breach Window (Noise Filter / Hysteresis)
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">
                            False Alarm Filter
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Requires soil moisture to remain under the Alert Threshold continuously before dispatching push notification, filtering transient sensor blips.
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-xl font-bold text-sky-700 font-mono">
                        {(activeCrop.alertHysteresisMinutes ?? 5) === 0 ? '0m (Instant)' : `${activeCrop.alertHysteresisMinutes ?? 5} min delay`}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {(activeCrop.alertHysteresisMinutes ?? 5) === 0 ? 'Immediate push on detection' : 'Sustained verification window'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="5"
                      value={activeCrop.alertHysteresisMinutes ?? 5}
                      onChange={(e) => updateActiveCrop({ alertHysteresisMinutes: Number(e.target.value) })}
                      className="w-full accent-sky-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />

                    <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                      <span>0m (Instant Alert)</span>
                      <span>5m (Recommended Standard)</span>
                      <span>15m</span>
                      <span>30m (Max Delay)</span>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------------------- */}
                {/* 4. OPTIMAL TARGET MOISTURE (FIELD CAPACITY) SLIDER                        */}
                {/* ------------------------------------------------------------------------- */}
                <div className="bg-emerald-50/50 p-4.5 rounded-2xl border border-emerald-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                          Optimal Target Moisture (Field Capacity)
                        </span>
                        <p className="text-xs text-emerald-700/80">
                          Ideal saturation target for complete nutrient uptake without root anaerobic stress.
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-bold text-emerald-700 font-mono">{activeCrop.targetMoisture}%</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={Math.max(25, (activeCrop.warningThreshold || activeCrop.criticalThreshold + 6) + 2)}
                    max="75"
                    step="1"
                    value={activeCrop.targetMoisture}
                    onChange={(e) => updateActiveCrop({ targetMoisture: Number(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer h-2 bg-emerald-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-emerald-600/80 font-medium">
                    <span>{Math.max(25, (activeCrop.warningThreshold || activeCrop.criticalThreshold + 6) + 2)}%</span>
                    <span>Full Field Capacity</span>
                    <span>75% (Saturation Limit)</span>
                  </div>
                </div>

                {/* ------------------------------------------------------------------------- */}
                {/* 5. LIVE PROACTIVE PUSH NOTIFICATION SIMULATOR & PREVIEW CARD              */}
                {/* ------------------------------------------------------------------------- */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white p-5 rounded-2xl border border-slate-700/80 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                          Proactive Push Notification Preview
                        </h5>
                        <p className="text-[11px] text-slate-400">
                          Live mobile & desktop notification rendering for your tuned threshold.
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      APNs / FCM Channel Active
                    </span>
                  </div>

                  {/* Simulated Mobile / System Push Notification Bubble */}
                  <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl space-y-2.5 relative overflow-hidden backdrop-blur-xs">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-2 font-semibold text-slate-300">
                        <div className="w-4 h-4 rounded-md bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-[9px] font-black text-slate-950">
                          C
                        </div>
                        <span>Claire Agri-OS · Smart Irrigation</span>
                      </div>
                      <span className="text-[11px] text-slate-400">Just now</span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                        <BellRing className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-bounce" />
                        <span>PROACTIVE PUSH ALERT: Critical Moisture Drop in {activeCropZones[0]?.name || activeCrop.cropName + ' Field'}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Tensiometer detected <strong className="text-rose-400 font-bold">{Math.max(8, Number((activeCrop.criticalThreshold - 2.4).toFixed(1)))}% VWC</strong>, falling below your fine-tuned Alert Threshold of <strong className="text-white font-bold">{activeCrop.criticalThreshold.toFixed(1)}%</strong>. Immediate root stress risk. {activeCrop.autoIrrigateOnCritical ? `Automated ${activeCrop.autoEmergencyDurationMinutes}m emergency soak armed.` : 'Manual irrigation recommended.'}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-slate-700/80">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold uppercase text-[10px] border border-rose-500/30">
                          Priority: {activeCrop.alertPriority || 'Urgent'}
                        </span>
                        <span className="text-slate-400">
                          Filter: {activeCrop.alertHysteresisMinutes ?? 5}m sustained
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendTestPushNotification(activeCrop)}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-sky-500 to-teal-400 hover:from-sky-400 hover:to-teal-300 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer group"
                      >
                        <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        <span>Dispatch Test Push Now</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------------------- */}
                {/* 6. PROACTIVE PUSH PROTOCOL & VALVE LINK SETTINGS                          */}
                {/* ------------------------------------------------------------------------- */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-indigo-600" />
                    Proactive Alert Protocol & Automated Valve Response
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Toggle 1: Proactive Critical Push Notifications */}
                    <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer bg-slate-50/60">
                      <input
                        type="checkbox"
                        checked={activeCrop.notifyOnCritical}
                        onChange={(e) => updateActiveCrop({ notifyOnCritical: e.target.checked })}
                        className="mt-1 rounded accent-sky-600 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Proactive Critical Push Alarms</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Dispatch high-priority push notifications and in-app system toasts when moisture &lt; {activeCrop.criticalThreshold.toFixed(1)}%.
                        </p>
                      </div>
                    </label>

                    {/* Toggle 2: Proactive Warning Notifications */}
                    <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer bg-slate-50/60">
                      <input
                        type="checkbox"
                        checked={activeCrop.notifyOnWarning}
                        onChange={(e) => updateActiveCrop({ notifyOnWarning: e.target.checked })}
                        className="mt-1 rounded accent-sky-600 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Proactive Early Advisories</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Send early advisory notifications when entering the +{activeCrop.alertLeadBufferPct ?? 8}% buffer window.
                        </p>
                      </div>
                    </label>

                    {/* Toggle 3: Audible Siren / Sound */}
                    <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer bg-slate-50/60">
                      <input
                        type="checkbox"
                        checked={activeCrop.pushSoundEnabled ?? true}
                        onChange={(e) => updateActiveCrop({ pushSoundEnabled: e.target.checked })}
                        className="mt-1 rounded accent-sky-600 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          {activeCrop.pushSoundEnabled ? <Volume2 className="w-3.5 h-3.5 text-sky-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                          Audible Chime on Alert Breach
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Sound audible warning chime when high-priority push notifications fire.
                        </p>
                      </div>
                    </label>

                    {/* Priority Selector */}
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Push Notification Urgency Level</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Controls delivery priority and bypass settings.</p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        {(['urgent', 'high', 'standard'] as const).map(lvl => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => updateActiveCrop({ alertPriority: lvl })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer ${
                              (activeCrop.alertPriority || 'urgent') === lvl
                                ? 'bg-slate-900 text-white shadow-2xs'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Toggle 5: Auto-Irrigate Emergency Valve on Critical Breach */}
                    <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer bg-slate-50/60 sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={activeCrop.autoIrrigateOnCritical}
                        onChange={(e) => updateActiveCrop({ autoIrrigateOnCritical: e.target.checked })}
                        className="mt-1 rounded accent-emerald-600 w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs font-bold text-slate-800 block">
                            Automated Valve Activation on Critical Breach
                          </span>
                          {activeCrop.autoIrrigateOnCritical && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-600" onClick={(e) => e.stopPropagation()}>
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-semibold">Soak Duration:</span>
                              <select
                                value={activeCrop.autoEmergencyDurationMinutes}
                                onChange={(e) => updateActiveCrop({ autoEmergencyDurationMinutes: Number(e.target.value) })}
                                className="px-2 py-0.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white cursor-pointer"
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
                          If soil moisture dips below {Number(activeCrop.criticalThreshold).toFixed(1)}%, automatically open the corresponding solenoid valve for {activeCrop.autoEmergencyDurationMinutes} minutes synchronously with the push notification.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

              </div>

              {/* Save Confirmation Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Settings are auto-saved to Claire Hydro-Engine telemetry.
                </span>

                <button
                  onClick={() => {
                    showToast(`Updated threshold parameters for ${activeCrop.cropName}.`, 'success');
                    if (onPlaySound && soundEnabled) onPlaySound();
                  }}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Save & Apply Thresholds
                </button>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. 7-DAY EVAPOTRANSPIRATION & THRESHOLD HISTORY LOG                      */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900">7-Day Evapotranspiration (ET) & Dynamic Threshold History</h4>
          </div>
          <span className="text-xs text-slate-500">
            Automated adjustments executed daily at dawn from local microclimate weather telemetry
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Weather Condition</th>
                <th className="py-2.5 px-3">Ref ET₀</th>
                <th className="py-2.5 px-3">Crop ETc</th>
                <th className="py-2.5 px-3">Threshold Offset</th>
                <th className="py-2.5 px-3">Claire Autonomous Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historicalEtLog.map((log, idx) => (
                <tr key={idx} className={idx === 0 ? 'bg-sky-50/40 font-medium' : 'hover:bg-slate-50/50'}>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="font-bold text-slate-800">{log.date}</span>
                    <span className="text-slate-400 text-[11px] ml-1">({log.day})</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-slate-700">{log.dayType}, {log.temp}°C, {log.humidity}% RH</span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {log.et0} mm/day
                  </td>
                  <td className="py-2.5 px-3 text-slate-800">
                    {log.avgEtc} mm/day
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                      log.offset > 0 ? 'bg-amber-100 text-amber-800' :
                      log.offset < 0 ? 'bg-sky-100 text-sky-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {log.offset > 0 ? `+${log.offset}%` : `${log.offset}%`}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                    {log.action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. PROACTIVE NOTIFICATION & ALERT TRIGGER HISTORY                        */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* 7. ADD CUSTOM CROP MODAL                                                 */}
      {/* ========================================================================= */}
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
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
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
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
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
