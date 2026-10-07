import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplets, 
  Droplet, 
  Play, 
  Square, 
  Clock, 
  Calendar, 
  Sliders, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  Power, 
  Waves, 
  CloudRain, 
  Volume2, 
  VolumeX, 
  Sparkles,
  ArrowRight,
  RotateCcw,
  Activity,
  Sprout
} from 'lucide-react';
import { WeatherData, IrrigationZone, IrrigationSchedule, showToast } from '../types';
import AutomatedSchedulingSubPanel from './AutomatedSchedulingSubPanel';
import SoilMoistureHistoryChart from './SoilMoistureHistoryChart';
import IrrigationEfficiencySummaryCard from './IrrigationEfficiencySummaryCard';
import CropMoistureThresholdConfig from './CropMoistureThresholdConfig';

interface SmartIrrigationControlPanelProps {
  weather: WeatherData;
  activeLocation?: string;
}

const DEFAULT_ZONES: IrrigationZone[] = [
  {
    id: 'zone-1',
    name: 'North Pivot & Furrow',
    fieldQuadrant: 'Quadrant A (North-East)',
    cropType: 'Maize / Sweet Corn',
    method: 'Drip',
    valveStatus: 'idle',
    flowRateLitersPerMin: 22,
    currentMoisture: 26,
    targetMoisture: 45,
    weeklyLitersUsed: 3850,
    lastWatered: 'Yesterday, 06:15 PM'
  },
  {
    id: 'zone-2',
    name: 'South Slope Terraces',
    fieldQuadrant: 'Quadrant B (South)',
    cropType: 'Soybeans & Pulses',
    method: 'Micro-Sprinkler',
    valveStatus: 'idle',
    flowRateLitersPerMin: 18,
    currentMoisture: 32,
    targetMoisture: 48,
    weeklyLitersUsed: 2940,
    lastWatered: 'Today, 05:45 AM'
  },
  {
    id: 'zone-3',
    name: 'East Orchard Row',
    fieldQuadrant: 'Quadrant C (East)',
    cropType: 'Fruit Citrus & Avocados',
    method: 'Subsurface Drip',
    valveStatus: 'idle',
    flowRateLitersPerMin: 14,
    currentMoisture: 39,
    targetMoisture: 50,
    weeklyLitersUsed: 2120,
    lastWatered: '2 days ago'
  },
  {
    id: 'zone-4',
    name: 'Nursery & Seedling Bed',
    fieldQuadrant: 'Quadrant D (High-Tunnel)',
    cropType: 'High-Density Seedlings',
    method: 'Drip',
    valveStatus: 'idle',
    flowRateLitersPerMin: 8,
    currentMoisture: 22,
    targetMoisture: 55,
    weeklyLitersUsed: 1180,
    lastWatered: 'Today, 10:30 AM'
  }
];

const DEFAULT_SCHEDULES: IrrigationSchedule[] = [
  {
    id: 'sched-event-1',
    name: 'Soil Moisture Deficit Trigger (< 20%)',
    triggerType: 'event_based',
    zoneIds: ['zone-1', 'zone-4'],
    startTime: '06:00',
    durationMinutes: 25,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
    eventCondition: {
      metric: 'soil_moisture_below',
      threshold: 20,
      operator: '<',
      unit: '%',
      cooldownHours: 6
    },
    smartSkipConditions: {
      skipOnRain: true,
      rainThresholdPct: 35,
      skipOnHighMoisture: true,
      moistureThresholdPct: 38,
      skipOnHighWind: true,
      windThresholdKmH: 22
    },
    nextRun: 'Active Sensor Watch (Fires if Moisture < 20%)'
  },
  {
    id: 'sched-daily-1',
    name: 'Dawn Deep Soak (Evaporation Saver)',
    triggerType: 'daily',
    zoneIds: ['zone-1', 'zone-3'],
    startTime: '05:30',
    durationMinutes: 30,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
    smartSkipConditions: {
      skipOnRain: true,
      rainThresholdPct: 35,
      skipOnHighMoisture: true,
      moistureThresholdPct: 38,
      skipOnHighWind: true,
      windThresholdKmH: 22
    },
    nextRun: 'Tomorrow at 05:30 AM'
  },
  {
    id: 'sched-weekly-1',
    name: 'Midday Micro-Cooling Pulse',
    triggerType: 'weekly',
    zoneIds: ['zone-2'],
    startTime: '13:00',
    durationMinutes: 12,
    daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
    enabled: true,
    smartSkipConditions: {
      skipOnRain: true,
      rainThresholdPct: 40,
      skipOnHighMoisture: true,
      moistureThresholdPct: 42,
      skipOnHighWind: true,
      windThresholdKmH: 18
    },
    nextRun: 'Wednesday at 01:00 PM'
  },
  {
    id: 'sched-event-2',
    name: 'Canopy Heat Stress Protection (> 32°C)',
    triggerType: 'event_based',
    zoneIds: ['zone-2'],
    startTime: '12:00',
    durationMinutes: 10,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
    eventCondition: {
      metric: 'temp_above',
      threshold: 32,
      operator: '>',
      unit: '°C',
      cooldownHours: 4
    },
    smartSkipConditions: {
      skipOnRain: true,
      rainThresholdPct: 40,
      skipOnHighMoisture: true,
      moistureThresholdPct: 45,
      skipOnHighWind: true,
      windThresholdKmH: 20
    },
    nextRun: 'Active Sensor Watch (Fires if Temp > 32°C)'
  },
  {
    id: 'sched-daily-2',
    name: 'Nursery Moisture Top-Up',
    triggerType: 'daily',
    zoneIds: ['zone-4'],
    startTime: '18:15',
    durationMinutes: 20,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    enabled: false,
    smartSkipConditions: {
      skipOnRain: false,
      rainThresholdPct: 50,
      skipOnHighMoisture: true,
      moistureThresholdPct: 45,
      skipOnHighWind: false,
      windThresholdKmH: 30
    },
    nextRun: 'Paused'
  }
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Subtle sound synthesizer for realistic valve feedback
function playIrrigationSound(type: 'start' | 'stop' | 'toggle') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'start') {
      // Gentle ascending water droplet tone
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(580, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'stop') {
      // Soft descending valve close tone
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else {
      // Subtle click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    }
  } catch {
    // Ignore audio restrictions
  }
}

export default function SmartIrrigationControlPanel({ weather, activeLocation }: SmartIrrigationControlPanelProps) {
  // Panel expansion toggle state
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem('claire_irrigation_expanded');
    return saved !== null ? saved === 'true' : true;
  });

  // Sound feedback toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('claire_irrigation_sound') === 'true';
  });

  // Master System Mode
  const [masterMode, setMasterMode] = useState<'smart_auto' | 'scheduled' | 'manual_only' | 'standby'>(() => {
    return (localStorage.getItem('claire_irrigation_mode') as 'smart_auto' | 'scheduled' | 'manual_only' | 'standby') || 'smart_auto';
  });

  // Active view tab
  const [activeTab, setActiveTab] = useState<'zones' | 'schedules' | 'history' | 'analytics' | 'thresholds'>('zones');

  // Zones state
  const [zones, setZones] = useState<IrrigationZone[]>(() => {
    const saved = localStorage.getItem('claire_irrigation_zones');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_ZONES;
      }
    }
    return DEFAULT_ZONES;
  });

  // Schedules state
  const [schedules, setSchedules] = useState<IrrigationSchedule[]>(() => {
    const saved = localStorage.getItem('claire_irrigation_schedules');
    if (saved) {
      try {
        const parsed: IrrigationSchedule[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(s => ({
            ...s,
            triggerType: s.triggerType || (s.daysOfWeek && s.daysOfWeek.length === 7 ? 'daily' : 'weekly')
          }));
        }
      } catch {
        return DEFAULT_SCHEDULES;
      }
    }
    return DEFAULT_SCHEDULES;
  });

  // Selected manual trigger duration for zones (zoneId -> minutes)
  const [selectedDuration, setSelectedDuration] = useState<Record<string, number>>({
    'zone-1': 20,
    'zone-2': 15,
    'zone-3': 30,
    'zone-4': 10
  });

  // Sync zones and schedules to localStorage
  useEffect(() => {
    localStorage.setItem('claire_irrigation_zones', JSON.stringify(zones));
  }, [zones]);

  useEffect(() => {
    localStorage.setItem('claire_irrigation_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('claire_irrigation_expanded', String(isExpanded));
  }, [isExpanded]);

  useEffect(() => {
    localStorage.setItem('claire_irrigation_sound', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('claire_irrigation_mode', masterMode);
  }, [masterMode]);

  // Live timer interval to decrement active watering zones
  useEffect(() => {
    const timer = setInterval(() => {
      setZones(prevZones => {
        let hasChanges = false;
        const updated = prevZones.map(zone => {
          if (zone.valveStatus === 'watering' && zone.activeRun) {
            hasChanges = true;
            const newRemaining = Math.max(0, zone.activeRun.remainingSeconds - 1);
            const secondsElapsed = (zone.activeRun.durationMinutes * 60) - newRemaining;
            const delivered = Math.round((secondsElapsed / 60) * zone.flowRateLitersPerMin);

            if (newRemaining <= 0) {
              // Watering cycle completed
              showToast(`Irrigation cycle completed for ${zone.name}. Delivered ${delivered} L.`, 'success');
              if (soundEnabled) playIrrigationSound('stop');
              return {
                ...zone,
                valveStatus: 'idle' as const,
                currentMoisture: Math.min(zone.targetMoisture, zone.currentMoisture + 12),
                weeklyLitersUsed: zone.weeklyLitersUsed + delivered,
                lastWatered: 'Just now',
                activeRun: undefined
              };
            }

            return {
              ...zone,
              activeRun: {
                ...zone.activeRun,
                remainingSeconds: newRemaining,
                litersDelivered: delivered
              }
            };
          }
          return zone;
        });
        return hasChanges ? updated : prevZones;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [soundEnabled]);

  // Calculate environmental AI skip conditions based on current weather
  const isRainDelayActive = weather.dayType === 'Rainy' || weather.humidity > 80;
  const isHighWindDrift = (weather.windSpeed || 0) > 20 || (weather.windGusts || 0) > 28;
  const isSoilSaturated = weather.soilMoisture > 40;
  const isMoistureCriticallyLow = weather.soilMoisture < 25;

  // Active zones count
  const activeWateringCount = zones.filter(z => z.valveStatus === 'watering').length;
  const totalWaterSavedWeek = 3840; // L conserved via automated rain delay and moisture threshold skips

  // Trigger manual watering for a specific zone
  const handleTriggerZone = (zoneId: string, durationMinutes: number) => {
    if (masterMode === 'standby') {
      showToast('Master system is in Standby mode. Switch to Manual or Auto to operate valves.', 'warning');
      return;
    }

    if (soundEnabled) playIrrigationSound('start');

    setZones(prev => prev.map(zone => {
      if (zone.id === zoneId) {
        return {
          ...zone,
          valveStatus: 'watering',
          activeRun: {
            startedAt: Date.now(),
            durationMinutes,
            remainingSeconds: durationMinutes * 60,
            litersDelivered: 0
          }
        };
      }
      return zone;
    }));

    const targetZone = zones.find(z => z.id === zoneId);
    showToast(`Valve opened: ${targetZone?.name || 'Zone'} watering initiated for ${durationMinutes} mins.`, 'success');
  };

  // Stop manual watering for a specific zone
  const handleStopZone = (zoneId: string) => {
    if (soundEnabled) playIrrigationSound('stop');

    setZones(prev => prev.map(zone => {
      if (zone.id === zoneId) {
        const delivered = zone.activeRun?.litersDelivered || 0;
        return {
          ...zone,
          valveStatus: 'idle',
          weeklyLitersUsed: zone.weeklyLitersUsed + delivered,
          lastWatered: 'Just stopped',
          currentMoisture: Math.min(zone.targetMoisture, zone.currentMoisture + Math.round(delivered / 35)),
          activeRun: undefined
        };
      }
      return zone;
    }));

    const targetZone = zones.find(z => z.id === zoneId);
    showToast(`Valve shut off: ${targetZone?.name || 'Zone'} stopped.`, 'info');
  };

  // Stop all active zones immediately
  const handleEmergencyStopAll = () => {
    if (soundEnabled) playIrrigationSound('stop');
    setZones(prev => prev.map(zone => {
      if (zone.valveStatus === 'watering') {
        const delivered = zone.activeRun?.litersDelivered || 0;
        return {
          ...zone,
          valveStatus: 'idle',
          weeklyLitersUsed: zone.weeklyLitersUsed + delivered,
          lastWatered: 'Emergency stopped',
          activeRun: undefined
        };
      }
      return zone;
    }));
    showToast('Emergency cutoff triggered: All irrigation valves shut down.', 'warning');
  };

  // Sequential cycle across all zones
  const handleStartAllSequential = () => {
    if (masterMode === 'standby') {
      showToast('Master system is in Standby mode.', 'warning');
      return;
    }
    // Start Zone 1 first
    handleTriggerZone('zone-1', selectedDuration['zone-1'] || 15);
    showToast('Sequential multi-zone soak cycle queued.', 'success');
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
      
      {/* Top Header & Collapsible Toggle Bar */}
      <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-sky-50/40 via-white to-emerald-50/30">
        
        {/* Left Title & Status */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
              activeWateringCount > 0 
                ? 'bg-sky-500 text-white shadow-md shadow-sky-200 animate-pulse' 
                : masterMode === 'standby' 
                ? 'bg-slate-100 text-slate-400' 
                : 'bg-sky-50 text-sky-600 border border-sky-100'
            }`}>
              {activeWateringCount > 0 ? (
                <Waves className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
              ) : (
                <Droplets className="w-5 h-5" />
              )}
            </div>
            {activeWateringCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-sky-500 text-[8px] font-bold text-white items-center justify-center">
                  {activeWateringCount}
                </span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800 tracking-tight">Smart Irrigation Control</h3>
              <span className="text-[11px] font-medium text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">
                {activeLocation || weather.name} Field
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${
                  masterMode === 'standby' 
                    ? 'bg-slate-400' 
                    : activeWateringCount > 0 
                    ? 'bg-sky-500 animate-pulse' 
                    : 'bg-emerald-500'
                }`} />
                {masterMode === 'standby' 
                  ? 'System Standby' 
                  : activeWateringCount > 0 
                  ? `${activeWateringCount} Valve${activeWateringCount > 1 ? 's' : ''} Flowing` 
                  : 'Automated Ready'}
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Soil Moisture: <span className="font-semibold text-slate-700">{weather.soilMoisture}%</span></span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-emerald-600 font-medium">Saved 3.8kL this week</span>
            </div>
          </div>
        </div>

        {/* Right Action Controls: Master Mode Selector & Expand Toggle */}
        <div className="flex items-center flex-wrap gap-2.5">
          
          {/* Master Mode Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => {
                setMasterMode('smart_auto');
                if (soundEnabled) playIrrigationSound('toggle');
                showToast('Master mode set to Smart Auto (AI moisture & weather linked).', 'info');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                masterMode === 'smart_auto' 
                  ? 'bg-white text-slate-900 shadow-xs font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Smart Auto
            </button>
            <button
              onClick={() => {
                setMasterMode('scheduled');
                if (soundEnabled) playIrrigationSound('toggle');
                showToast('Master mode set to Scheduled Timers.', 'info');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                masterMode === 'scheduled' 
                  ? 'bg-white text-slate-900 shadow-xs font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Scheduled
            </button>
            <button
              onClick={() => {
                setMasterMode('manual_only');
                if (soundEnabled) playIrrigationSound('toggle');
                showToast('Master mode set to Manual Override.', 'info');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                masterMode === 'manual_only' 
                  ? 'bg-white text-slate-900 shadow-xs font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Manual
            </button>
            <button
              onClick={() => {
                setMasterMode('standby');
                if (soundEnabled) playIrrigationSound('toggle');
                handleEmergencyStopAll();
                showToast('System placed in Standby (All valves off).', 'warning');
              }}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                masterMode === 'standby' 
                  ? 'bg-rose-50 text-rose-700 shadow-xs font-semibold border border-rose-200' 
                  : 'text-slate-500 hover:text-rose-600'
              }`}
              title="Cut off all valves and suspend automation"
            >
              <Power className="w-3.5 h-3.5" />
              Off
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs transition-colors ${
              soundEnabled 
                ? 'bg-sky-50 text-sky-700 border-sky-200' 
                : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
            }`}
            title={soundEnabled ? 'Acoustic valve chime active' : 'Audio muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Expand/Collapse Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-xs font-semibold transition-colors"
          >
            <span>{isExpanded ? 'Hide Panel' : 'Expand Controls'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Collapsible Body */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {/* Real-time Environmental Smart Skip & Advisory Banner */}
            <div className="p-4 md:px-6 bg-slate-50/60 border-b border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                
                <div className="flex items-start md:items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-sky-100/80 text-sky-700 shrink-0 mt-0.5 md:mt-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">Claire AI Hydro-Engine: </span>
                    {isRainDelayActive ? (
                      <span className="text-sky-700 font-medium">
                        🌧️ Active precipitation/high humidity ({weather.humidity}%) in {activeLocation || weather.name}. Smart Rain Skip engaged to save ~3,200 L.
                      </span>
                    ) : isSoilSaturated ? (
                      <span className="text-emerald-700 font-medium">
                        🌱 Root zone moisture is optimal ({weather.soilMoisture}%). Regular irrigation suspended to prevent nitrogen leaching.
                      </span>
                    ) : isMoistureCriticallyLow ? (
                      <span className="text-amber-800 font-medium">
                        ⚠️ Low soil moisture alert ({weather.soilMoisture}%). Transpiration stress imminent — a 20-min deep soak is advised.
                      </span>
                    ) : (
                      <span className="text-slate-600">
                        Atmospheric demand normal ({weather.temp}°C, {weather.humidity}% RH). Next scheduled cycle will run at nominal flow.
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab('thresholds')}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                    Crop Thresholds & Alerts
                  </button>

                  {isMoistureCriticallyLow && (
                    <button
                      onClick={() => handleTriggerZone('zone-1', 20)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Droplet className="w-3.5 h-3.5 fill-current" />
                      Apply Recommended Soak
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* Water Saved & Estimated Efficiency Summary Card (Automated vs Manual) */}
            <div className="px-5 md:px-6 pt-4">
              <IrrigationEfficiencySummaryCard
                weather={weather}
                zones={zones}
                activeLocation={activeLocation}
              />
            </div>

            {/* Navigation Tabs & Quick Master Actions */}
            <div className="px-5 md:px-6 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              {/* Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium self-start">
                <button
                  onClick={() => setActiveTab('zones')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'zones'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Droplets className="w-3.5 h-3.5 text-sky-500" />
                  Field Zones & Valves ({zones.length})
                </button>
                <button
                  onClick={() => setActiveTab('schedules')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'schedules'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  Automated Schedules ({schedules.filter(s => s.enabled).length}/{schedules.length})
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'history'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-cyan-500" />
                  7-Day Moisture History
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'analytics'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  Water Conservation & Telemetry
                </button>
                <button
                  onClick={() => setActiveTab('thresholds')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'thresholds'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sprout className="w-3.5 h-3.5 text-emerald-500" />
                  Crop Moisture Thresholds & Alerts
                </button>
              </div>

              {/* Master Trigger Shortcuts */}
              <div className="flex items-center gap-2">
                {activeWateringCount > 0 ? (
                  <button
                    onClick={handleEmergencyStopAll}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    Emergency All Stop
                  </button>
                ) : (
                  <button
                    onClick={handleStartAllSequential}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Run All Zones (Sequential)
                  </button>
                )}
              </div>
            </div>

            {/* Tab 1: Zone Controls & Manual Triggering */}
            {activeTab === 'zones' && (
              <div className="p-5 md:p-6 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {zones.map((zone) => {
                    const isWatering = zone.valveStatus === 'watering';
                    const progressPct = isWatering && zone.activeRun
                      ? Math.min(100, Math.round(((zone.activeRun.durationMinutes * 60 - zone.activeRun.remainingSeconds) / (zone.activeRun.durationMinutes * 60)) * 100))
                      : 0;

                    return (
                      <div
                        key={zone.id}
                        className={`rounded-2xl border transition-all p-5 ${
                          isWatering
                            ? 'bg-sky-50/50 border-sky-300 shadow-md shadow-sky-50'
                            : 'bg-white border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        {/* Zone Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-800">{zone.name}</h4>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                isWatering
                                  ? 'bg-sky-500 text-white animate-pulse'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {isWatering ? 'VALVE OPEN' : 'STANDBY'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {zone.cropType} · {zone.method} · {zone.fieldQuadrant}
                            </p>
                          </div>

                          {/* Flow Rate Meter */}
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-700">{zone.flowRateLitersPerMin} L/min</span>
                            <p className="text-[10px] text-slate-400">Target: {zone.targetMoisture}%</p>
                          </div>
                        </div>

                        {/* Soil Moisture Bar for this Zone */}
                        <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-slate-500 flex items-center gap-1">
                              <Droplet className="w-3 h-3 text-sky-500" />
                              Zone Soil Moisture:
                            </span>
                            <span className="font-bold text-slate-800">
                              {zone.currentMoisture}% <span className="text-slate-400 font-normal">/ {zone.targetMoisture}% target</span>
                            </span>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                zone.currentMoisture < 25 
                                  ? 'bg-amber-500' 
                                  : zone.currentMoisture >= zone.targetMoisture 
                                  ? 'bg-emerald-500' 
                                  : 'bg-sky-500'
                              }`}
                              style={{ width: `${Math.min(100, (zone.currentMoisture / 60) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Active Watering Countdown or Duration Selector */}
                        {isWatering && zone.activeRun ? (
                          <div className="space-y-3 bg-white p-3.5 rounded-xl border border-sky-200">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <Waves className="w-4 h-4 text-sky-500 animate-bounce" />
                                <span className="font-bold text-sky-900">
                                  Remaining: {formatTime(zone.activeRun.remainingSeconds)}
                                </span>
                              </div>
                              <span className="font-semibold text-sky-700">
                                {zone.activeRun.litersDelivered} Liters Delivered
                              </span>
                            </div>

                            {/* Active cycle progress */}
                            <div className="w-full bg-sky-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-sky-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>

                            {/* Stop button */}
                            <button
                              onClick={() => handleStopZone(zone.id)}
                              className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Square className="w-3.5 h-3.5 fill-current" />
                              Stop Valve Now
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Duration Presets */}
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[11px] font-semibold text-slate-500">Duration:</span>
                              <div className="flex items-center gap-1">
                                {[10, 20, 30, 45].map((mins) => {
                                  const isSelected = (selectedDuration[zone.id] || 20) === mins;
                                  return (
                                    <button
                                      key={mins}
                                      onClick={() => setSelectedDuration({ ...selectedDuration, [zone.id]: mins })}
                                      className={`px-2 py-1 text-xs rounded-lg font-medium transition-all ${
                                        isSelected
                                          ? 'bg-sky-500 text-white shadow-xs font-semibold'
                                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                      }`}
                                    >
                                      {mins}m
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Manual Trigger Button */}
                            <button
                              onClick={() => handleTriggerZone(zone.id, selectedDuration[zone.id] || 20)}
                              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-2 group cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current text-sky-400 group-hover:scale-110 transition-transform" />
                              <span>Trigger {selectedDuration[zone.id] || 20}m Soak Cycle</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                (~{((selectedDuration[zone.id] || 20) * zone.flowRateLitersPerMin)} L)
                              </span>
                            </button>
                          </div>
                        )}

                        {/* Footer metadata */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Last soak: {zone.lastWatered || 'N/A'}</span>
                          <span>Week volume: {zone.weeklyLitersUsed.toLocaleString()} L</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: Automated Scheduling Sub-panel */}
            {activeTab === 'schedules' && (
              <AutomatedSchedulingSubPanel
                weather={weather}
                zones={zones}
                schedules={schedules}
                onUpdateSchedules={(newSchedules) => setSchedules(newSchedules)}
                onTriggerZone={handleTriggerZone}
                soundEnabled={soundEnabled}
                onPlaySound={playIrrigationSound}
              />
            )}

            {/* Tab 3: 7-Day Soil Moisture History Visualization (Recharts) */}
            {activeTab === 'history' && (
              <SoilMoistureHistoryChart
                weather={weather}
                zones={zones}
                activeLocation={activeLocation}
              />
            )}

            {/* Tab 4: Analytics & Water Conservation */}
            {activeTab === 'analytics' && (
              <div className="p-5 md:p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Card 1: Water Conserved */}
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                      Weekly Water Saved
                    </span>
                    <h4 className="text-2xl font-bold text-emerald-900 mt-1">3,840 Liters</h4>
                    <p className="text-xs text-emerald-700/80 mt-1">
                      Conserved via automated rain delays and root zone saturation thresholds.
                    </p>
                  </div>

                  {/* Card 2: Today's Delivery Volume */}
                  <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100">
                    <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">
                      Today's Delivered Volume
                    </span>
                    <h4 className="text-2xl font-bold text-sky-900 mt-1">680 Liters</h4>
                    <p className="text-xs text-sky-700/80 mt-1">
                      Nominal flow across Zone 2 & Zone 4. Pressure: 42.4 PSI steady.
                    </p>
                  </div>

                  {/* Card 3: Pump & Sensor Telemetry */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Hardware Telemetry
                    </span>
                    <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>4/4 Solenoid Valves:</span>
                        <span className="font-semibold text-emerald-600">Online & Tested</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Main Pump Pressure:</span>
                        <span className="font-semibold text-slate-800">42.4 PSI (Optimal)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Weather Link:</span>
                        <span className="font-semibold text-sky-600">{weather.isFallback ? 'Simulated' : 'Live Open-Meteo'}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Embedded 7-Day Moisture History Trend in Analytics */}
                <div className="pt-2 border-t border-slate-100">
                  <SoilMoistureHistoryChart
                    weather={weather}
                    zones={zones}
                    activeLocation={activeLocation}
                  />
                </div>
              </div>
            )}

            {/* Tab 5: Crop Moisture Thresholds & Proactive Notifications */}
            {activeTab === 'thresholds' && (
              <CropMoistureThresholdConfig
                zones={zones}
                weather={weather}
                onTriggerZone={handleTriggerZone}
                soundEnabled={soundEnabled}
                onPlaySound={playIrrigationSound}
              />
            )}

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
