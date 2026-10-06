import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Zap, 
  Sliders, 
  Droplets, 
  Droplet, 
  CloudRain, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Play, 
  Thermometer, 
  History,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { WeatherData, IrrigationZone, IrrigationSchedule, IrrigationTriggerLog, showToast } from '../types';

interface AutomatedSchedulingSubPanelProps {
  weather: WeatherData;
  zones: IrrigationZone[];
  schedules: IrrigationSchedule[];
  onUpdateSchedules: (schedules: IrrigationSchedule[]) => void;
  onTriggerZone: (zoneId: string, durationMinutes: number) => void;
  soundEnabled: boolean;
  onPlaySound: (type: 'start' | 'stop' | 'toggle') => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AutomatedSchedulingSubPanel({
  weather,
  zones,
  schedules,
  onUpdateSchedules,
  onTriggerZone,
  soundEnabled,
  onPlaySound
}: AutomatedSchedulingSubPanelProps) {
  // Filter for schedule type: all, daily, weekly, event_based
  const [filterType, setFilterType] = useState<'all' | 'daily' | 'weekly' | 'event_based'>('all');
  
  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formTriggerType, setFormTriggerType] = useState<'daily' | 'weekly' | 'event_based'>('event_based');
  const [formStartTime, setFormStartTime] = useState('06:00');
  const [formDuration, setFormDuration] = useState(20);
  const [formDays, setFormDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [formZoneIds, setFormZoneIds] = useState<string[]>(['zone-1']);
  
  // Event condition form states
  const [formEventMetric, setFormEventMetric] = useState<'soil_moisture_below' | 'temp_above' | 'humidity_below' | 'vpd_above'>('soil_moisture_below');
  const [formEventThreshold, setFormEventThreshold] = useState<number>(20); // Default < 20%
  const [formCooldownHours, setFormCooldownHours] = useState<number>(6);

  // Smart skip conditions
  const [formSkipRain, setFormSkipRain] = useState(true);
  const [formSkipHighMoisture, setFormSkipHighMoisture] = useState(true);
  const [formSkipHighWind, setFormSkipHighWind] = useState(true);

  // Execution logs
  const [logs, setLogs] = useState<IrrigationTriggerLog[]>(() => {
    const saved = localStorage.getItem('claire_irrigation_trigger_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [
      {
        id: 'log-1',
        ruleName: 'Low Moisture Auto-Soak (< 20%)',
        triggerType: 'event_based',
        zoneNames: ['North Pivot & Furrow (Maize)'],
        timestamp: 'Today at 04:30 AM',
        reason: 'Soil moisture telemetry detected 19.4% (Threshold: < 20%)',
        litersDelivered: 440
      },
      {
        id: 'log-2',
        ruleName: 'Dawn Deep Soak',
        triggerType: 'daily',
        zoneNames: ['East Orchard Row (Fruit Citrus)'],
        timestamp: 'Yesterday at 05:30 AM',
        reason: 'Daily scheduled sunrise soak',
        litersDelivered: 420
      }
    ];
  });

  const saveLogs = (newLogs: IrrigationTriggerLog[]) => {
    setLogs(newLogs);
    localStorage.setItem('claire_irrigation_trigger_logs', JSON.stringify(newLogs));
  };

  // Filtered schedules list
  const filteredSchedules = schedules.filter(s => {
    if (filterType === 'all') return true;
    return s.triggerType === filterType;
  });

  // Open modal for creating new schedule
  const handleOpenCreateModal = (defaultType: 'daily' | 'weekly' | 'event_based' = 'event_based') => {
    setModalMode('create');
    setEditingScheduleId(null);
    setFormTriggerType(defaultType);
    setFormName(
      defaultType === 'event_based'
        ? 'Soil Moisture Deficit Auto-Watering (< 20%)'
        : defaultType === 'daily'
        ? 'Daily Morning Refresh'
        : 'Weekly Deep Soil Soak'
    );
    setFormStartTime('06:00');
    setFormDuration(20);
    setFormDays(defaultType === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : [1, 3, 5]);
    setFormZoneIds([zones[0]?.id || 'zone-1']);
    setFormEventMetric('soil_moisture_below');
    setFormEventThreshold(20);
    setFormCooldownHours(6);
    setFormSkipRain(true);
    setFormSkipHighMoisture(true);
    setFormSkipHighWind(true);
    setIsModalOpen(true);
  };

  // Open modal for editing schedule
  const handleOpenEditModal = (schedule: IrrigationSchedule) => {
    setModalMode('edit');
    setEditingScheduleId(schedule.id);
    setFormTriggerType(schedule.triggerType);
    setFormName(schedule.name);
    setFormStartTime(schedule.startTime);
    setFormDuration(schedule.durationMinutes);
    setFormDays(schedule.daysOfWeek);
    setFormZoneIds(schedule.zoneIds);
    if (schedule.eventCondition) {
      setFormEventMetric(schedule.eventCondition.metric);
      setFormEventThreshold(schedule.eventCondition.threshold);
      setFormCooldownHours(schedule.eventCondition.cooldownHours);
    } else {
      setFormEventMetric('soil_moisture_below');
      setFormEventThreshold(20);
      setFormCooldownHours(6);
    }
    setFormSkipRain(schedule.smartSkipConditions.skipOnRain);
    setFormSkipHighMoisture(schedule.smartSkipConditions.skipOnHighMoisture);
    setFormSkipHighWind(schedule.smartSkipConditions.skipOnHighWind);
    setIsModalOpen(true);
  };

  // Toggle enable/disable
  const handleToggleSchedule = (id: string) => {
    if (soundEnabled) onPlaySound('toggle');
    const updated = schedules.map(s => {
      if (s.id === id) {
        const nextEnabled = !s.enabled;
        return {
          ...s,
          enabled: nextEnabled,
          nextRun: nextEnabled ? (s.triggerType === 'event_based' ? 'Active sensor watch' : 'Scheduled') : 'Paused'
        };
      }
      return s;
    });
    onUpdateSchedules(updated);
  };

  // Delete schedule
  const handleDeleteSchedule = (id: string) => {
    const updated = schedules.filter(s => s.id !== id);
    onUpdateSchedules(updated);
    showToast('Schedule removed from automation registry.', 'info');
  };

  // Form submission (Create or Edit)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Please enter a trigger name.', 'warning');
      return;
    }
    if (formZoneIds.length === 0) {
      showToast('Please select at least one field zone.', 'warning');
      return;
    }

    const eventCondition = formTriggerType === 'event_based' ? {
      metric: formEventMetric,
      threshold: Number(formEventThreshold),
      operator: formEventMetric.includes('below') ? ('<' as const) : ('>' as const),
      unit: formEventMetric.includes('moisture') || formEventMetric.includes('humidity') ? '%' : '°C',
      cooldownHours: Number(formCooldownHours)
    } : undefined;

    const nextRunText = formTriggerType === 'event_based'
      ? `Active (Fires if ${formEventMetric === 'soil_moisture_below' ? 'Moisture < ' + formEventThreshold + '%' : formEventMetric === 'temp_above' ? 'Temp > ' + formEventThreshold + '°C' : 'Condition met'})`
      : formTriggerType === 'daily'
      ? `Daily at ${formStartTime}`
      : `Weekly at ${formStartTime} (${formDays.map(d => DAY_NAMES[d]).join(', ')})`;

    if (modalMode === 'create') {
      const newSchedule: IrrigationSchedule = {
        id: `sched-${Date.now()}`,
        name: formName.trim(),
        triggerType: formTriggerType,
        zoneIds: formZoneIds,
        startTime: formStartTime,
        durationMinutes: Number(formDuration),
        daysOfWeek: formTriggerType === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : formDays,
        enabled: true,
        eventCondition,
        smartSkipConditions: {
          skipOnRain: formSkipRain,
          rainThresholdPct: 35,
          skipOnHighMoisture: formSkipHighMoisture,
          moistureThresholdPct: 38,
          skipOnHighWind: formSkipHighWind,
          windThresholdKmH: 22
        },
        nextRun: nextRunText
      };

      onUpdateSchedules([...schedules, newSchedule]);
      showToast(`Automated ${formTriggerType.replace('_', ' ')} trigger created.`, 'success');
    } else if (modalMode === 'edit' && editingScheduleId) {
      const updated = schedules.map(s => {
        if (s.id === editingScheduleId) {
          return {
            ...s,
            name: formName.trim(),
            triggerType: formTriggerType,
            zoneIds: formZoneIds,
            startTime: formStartTime,
            durationMinutes: Number(formDuration),
            daysOfWeek: formTriggerType === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : formDays,
            eventCondition,
            smartSkipConditions: {
              ...s.smartSkipConditions,
              skipOnRain: formSkipRain,
              skipOnHighMoisture: formSkipHighMoisture,
              skipOnHighWind: formSkipHighWind
            },
            nextRun: nextRunText
          };
        }
        return s;
      });

      onUpdateSchedules(updated);
      showToast('Automated schedule updated.', 'success');
    }

    setIsModalOpen(false);
  };

  // Test / Fire Trigger Manually (Simulates sensor trigger or scheduled run)
  const handleTestFireTrigger = (schedule: IrrigationSchedule) => {
    if (soundEnabled) onPlaySound('start');
    
    // Trigger the zones
    schedule.zoneIds.forEach(zId => {
      onTriggerZone(zId, schedule.durationMinutes);
    });

    const targetZoneNames = zones
      .filter(z => schedule.zoneIds.includes(z.id))
      .map(z => z.name);

    // Add log entry
    const newLog: IrrigationTriggerLog = {
      id: `log-${Date.now()}`,
      ruleName: schedule.name,
      triggerType: schedule.triggerType,
      zoneNames: targetZoneNames,
      timestamp: 'Just now',
      reason: schedule.triggerType === 'event_based'
        ? `Manual event test: evaluated ${schedule.eventCondition?.metric || 'condition'} and opened valves`
        : `Manual test cycle execution (${schedule.durationMinutes} mins)`,
      litersDelivered: schedule.durationMinutes * 20
    };

    saveLogs([newLog, ...logs.slice(0, 19)]);
    showToast(`Test triggered for '${schedule.name}'. Valves opened for ${schedule.durationMinutes} mins.`, 'success');
  };

  // Simulate an event condition (e.g. soil moisture < 20%)
  const handleSimulateMoistureDeficit = () => {
    const moistureRule = schedules.find(s => s.triggerType === 'event_based' && s.eventCondition?.metric === 'soil_moisture_below');
    const targetSchedule = moistureRule || schedules[0];

    if (!targetSchedule) {
      showToast('No active event-based schedule found.', 'warning');
      return;
    }

    if (soundEnabled) onPlaySound('start');

    targetSchedule.zoneIds.forEach(zId => {
      onTriggerZone(zId, targetSchedule.durationMinutes);
    });

    const targetZoneNames = zones
      .filter(z => targetSchedule.zoneIds.includes(z.id))
      .map(z => z.name);

    const newLog: IrrigationTriggerLog = {
      id: `log-${Date.now()}`,
      ruleName: targetSchedule.name,
      triggerType: 'event_based',
      zoneNames: targetZoneNames,
      timestamp: 'Just now',
      reason: `EVENT SIMULATED: Tensiometer reported 18.2% moisture (< 20% trigger threshold). Automated watering initiated.`,
      litersDelivered: targetSchedule.durationMinutes * 22
    };

    saveLogs([newLog, ...logs.slice(0, 19)]);
    showToast(`Event triggered: Simulated soil moisture deficit (< 20%). Valves opened!`, 'success');
  };

  return (
    <div className="p-5 md:p-6 space-y-6">
      
      {/* Sub-panel Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-slate-800 tracking-tight">Automated Scheduling & Trigger Engine</h4>
            <span className="text-xs text-slate-400 font-medium">·</span>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
              Live Sensor Linked
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Configure multi-zone watering with daily schedules, weekly recurring calendars, or real-time event triggers (e.g., automated soak if soil moisture drops below 20%).
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleSimulateMoistureDeficit}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Simulate soil moisture deficit < 20% to test automated response"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            <span>Simulate Soil Moisture Deficit (&lt; 20%)</span>
          </button>

          <button
            onClick={() => handleOpenCreateModal('event_based')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Trigger Rule</span>
          </button>
        </div>
      </div>

      {/* Real-time Event Trigger Watcher Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50/80 via-emerald-50/40 to-slate-50 border border-sky-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Live Sensor Event Watchers
              </h5>
              <p className="text-[11px] text-slate-500">
                Continuous telemetry evaluation at 60s intervals
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Telemetry Stream: Active</span>
          </div>
        </div>

        {/* Live Rule Evaluation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Rule 1: Soil Moisture Deficit (< 20%) */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            weather.soilMoisture < 20
              ? 'bg-rose-50/90 border-rose-300 shadow-xs'
              : 'bg-white/80 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-sky-500" />
                Soil Moisture &lt; 20%
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                weather.soilMoisture < 20
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {weather.soilMoisture < 20 ? 'TRIGGER FIRED' : 'ARMED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Live Field Reading: <span className="font-bold text-slate-800">{weather.soilMoisture}%</span>
            </p>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>Threshold: 20%</span>
              <span className="text-sky-700 font-semibold">Targets: Zone 1 & 4</span>
            </div>
          </div>

          {/* Rule 2: Canopy Heat Stress (> 32°C) */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            weather.temp > 32
              ? 'bg-amber-50/90 border-amber-300 shadow-xs'
              : 'bg-white/80 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                Canopy Temp &gt; 32°C
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                weather.temp > 32
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {weather.temp > 32 ? 'TRIGGER FIRED' : 'ARMED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Live Field Reading: <span className="font-bold text-slate-800">{weather.temp}°C</span>
            </p>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>Threshold: 32°C</span>
              <span className="text-orange-700 font-semibold">Pulse: 10m Mist</span>
            </div>
          </div>

          {/* Rule 3: Smart Rain Inhibit */}
          <div className="p-3.5 rounded-xl bg-white/80 border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                Precipitation Inhibit
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                ENABLED
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Weather Condition: <span className="font-bold text-slate-800">{weather.dayType} ({weather.humidity}% RH)</span>
            </p>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>Auto-skip active</span>
              <span className="text-emerald-700 font-semibold">Conserves ~3.2kL</span>
            </div>
          </div>

        </div>
      </div>

      {/* Filter Tabs: All, Daily, Weekly, Event-based */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium self-start">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              filterType === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            All Schedules ({schedules.length})
          </button>
          
          <button
            onClick={() => setFilterType('daily')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              filterType === 'daily'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-sky-500" />
            Daily Triggers ({schedules.filter(s => s.triggerType === 'daily').length})
          </button>

          <button
            onClick={() => setFilterType('weekly')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              filterType === 'weekly'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            Weekly Schedules ({schedules.filter(s => s.triggerType === 'weekly').length})
          </button>

          <button
            onClick={() => setFilterType('event_based')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              filterType === 'event_based'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Event Triggers ({schedules.filter(s => s.triggerType === 'event_based').length})
          </button>
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="font-semibold text-slate-700">{filteredSchedules.length}</span> automated watering rules
        </div>
      </div>

      {/* Schedules List */}
      <div className="space-y-3.5">
        {filteredSchedules.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-2">
            <Sliders className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">No schedules found in this category</p>
            <p className="text-xs text-slate-400">Create a new daily, weekly, or event-based trigger to automate field watering.</p>
            <button
              onClick={() => handleOpenCreateModal(filterType === 'all' ? 'event_based' : filterType)}
              className="mt-2 px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Rule
            </button>
          </div>
        ) : (
          filteredSchedules.map((schedule) => {
            const mappedZones = zones.filter(z => schedule.zoneIds.includes(z.id));
            const isEvent = schedule.triggerType === 'event_based';
            const isDaily = schedule.triggerType === 'daily';
            const isWeekly = schedule.triggerType === 'weekly';

            return (
              <div
                key={schedule.id}
                className={`p-4 md:p-5 rounded-2xl border transition-all ${
                  schedule.enabled
                    ? 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                    : 'bg-slate-50/60 border-slate-100 opacity-60'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left Column: Title, Type & Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 ${
                        isEvent
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : isDaily
                          ? 'bg-sky-100 text-sky-800 border border-sky-200'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}>
                        {isEvent && <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />}
                        {isDaily && <Clock className="w-3 h-3 text-sky-600" />}
                        {isWeekly && <Calendar className="w-3 h-3 text-indigo-600" />}
                        {isEvent ? 'Sensor Event Trigger' : isDaily ? 'Daily Schedule' : 'Weekly Calendar'}
                      </span>

                      <h5 className="text-sm font-bold text-slate-800">{schedule.name}</h5>
                      
                      <span className="text-xs text-slate-300">·</span>
                      
                      <span className="text-xs font-semibold text-slate-600">
                        {schedule.durationMinutes} mins cycle
                      </span>
                    </div>

                    {/* Condition or Schedule Timing details */}
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                      {isEvent && schedule.eventCondition ? (
                        <div className="flex items-center gap-1.5 bg-amber-50/70 border border-amber-200/60 px-2.5 py-1 rounded-lg text-amber-900 font-medium">
                          <Activity className="w-3.5 h-3.5 text-amber-600" />
                          <span>
                            Trigger Condition: <strong>{
                              schedule.eventCondition.metric === 'soil_moisture_below' ? `Soil Moisture < ${schedule.eventCondition.threshold}%` :
                              schedule.eventCondition.metric === 'temp_above' ? `Canopy Temp > ${schedule.eventCondition.threshold}°C` :
                              schedule.eventCondition.metric === 'humidity_below' ? `Relative Humidity < ${schedule.eventCondition.threshold}%` :
                              `Sensor Metric ${schedule.eventCondition.operator} ${schedule.eventCondition.threshold}`
                            }</strong>
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500">Cooldown: {schedule.eventCondition.cooldownHours}h</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Start Time: <strong>{schedule.startTime}</strong></span>
                        </div>
                      )}

                      <span className="text-slate-300">·</span>

                      <span>
                        Targeting:{' '}
                        <span className="font-semibold text-slate-800">
                          {mappedZones.length > 0 ? mappedZones.map(z => z.name).join(', ') : 'All Field Zones'}
                        </span>
                      </span>
                    </div>

                    {/* Days of week tags for daily/weekly */}
                    {!isEvent && (
                      <div className="flex items-center gap-1 pt-0.5">
                        {DAY_NAMES.map((day, idx) => {
                          const isDayActive = schedule.daysOfWeek.includes(idx);
                          return (
                            <span
                              key={day}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                isDayActive
                                  ? 'bg-slate-900 text-white font-bold'
                                  : 'text-slate-300 bg-slate-50'
                              }`}
                            >
                              {day}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Smart Skip Inhibit Indicators */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                      {schedule.smartSkipConditions.skipOnRain && (
                        <span className="flex items-center gap-1 text-sky-700">
                          <CloudRain className="w-3 h-3 text-sky-500" /> Rain-Inhibit
                        </span>
                      )}
                      {schedule.smartSkipConditions.skipOnHighMoisture && (
                        <span className="flex items-center gap-1 text-emerald-700">
                          <Droplet className="w-3 h-3 text-emerald-500" /> Soil Saturation Inhibit (&gt; 38%)
                        </span>
                      )}
                      {schedule.smartSkipConditions.skipOnHighWind && (
                        <span className="flex items-center gap-1 text-slate-600">
                          Drift Protection
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions (Test, Edit, Toggle, Delete) */}
                  <div className="flex items-center gap-3 self-end lg:self-center shrink-0 pt-2 lg:pt-0">
                    
                    {/* Test Trigger Button */}
                    <button
                      onClick={() => handleTestFireTrigger(schedule)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      title="Test fire this automated rule now"
                    >
                      <Play className="w-3 h-3 fill-current text-slate-500" />
                      <span>Test Trigger</span>
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => handleOpenEditModal(schedule)}
                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                    >
                      Edit
                    </button>

                    {/* Enable/Disable Toggle Switch */}
                    <button
                      onClick={() => handleToggleSchedule(schedule.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        schedule.enabled ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                      title={schedule.enabled ? 'Schedule enabled' : 'Schedule paused'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          schedule.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Trigger Execution History Log */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Automated Trigger Execution Log
            </h5>
          </div>

          {logs.length > 0 && (
            <button
              onClick={() => saveLogs([])}
              className="text-[11px] text-slate-400 hover:text-slate-600 font-medium transition-colors"
            >
              Clear Log
            </button>
          )}
        </div>

        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl overflow-hidden text-xs">
          {logs.length === 0 ? (
            <div className="p-4 text-center text-slate-400">
              No recent automated triggers recorded.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {logs.map((log) => (
                <div key={log.id} className="p-3 md:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/80 transition-colors">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 sm:mt-0 ${
                      log.triggerType === 'event_based' ? 'bg-amber-500' : 'bg-sky-500'
                    }`} />
                    <div>
                      <span className="font-bold text-slate-800">{log.ruleName}</span>
                      <span className="text-slate-400 mx-1.5">·</span>
                      <span className="text-slate-600">{log.reason}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-[11px] shrink-0 self-end sm:self-center">
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      +{log.litersDelivered} L Delivered
                    </span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {modalMode === 'create' ? 'Create Automated Irrigation Trigger' : 'Edit Irrigation Trigger'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure when and how automated watering is triggered for your field quadrants.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              
              {/* Trigger Type Segmented Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Trigger Category</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormTriggerType('event_based');
                      if (!formName.includes('Manual')) setFormName('Soil Moisture Deficit Auto-Watering (< 20%)');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      formTriggerType === 'event_based'
                        ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      <span>Event-Based</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-normal">Sensor condition (e.g. &lt; 20% moisture)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormTriggerType('daily');
                      if (!formName.includes('Manual')) setFormName('Daily Sunrise Irrigation');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      formTriggerType === 'daily'
                        ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="w-3.5 h-3.5 text-sky-600" />
                      <span>Daily</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-normal">Fires daily at set hour</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormTriggerType('weekly');
                      if (!formName.includes('Manual')) setFormName('Weekly Deep Root Replenish');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      formTriggerType === 'weekly'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Weekly</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-normal">Selected days of week</p>
                  </button>
                </div>
              </div>

              {/* Trigger Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trigger Name</label>
                <input
                  type="text"
                  placeholder="e.g. Root Zone Moisture Recovery (< 20%)"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Event Condition Settings (if event-based) */}
              {formTriggerType === 'event_based' ? (
                <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>Sensor Trigger Condition</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Telemetry Metric</label>
                      <select
                        value={formEventMetric}
                        onChange={(e) => setFormEventMetric(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="soil_moisture_below">Soil Moisture Drops Below (&lt;)</option>
                        <option value="temp_above">Canopy Temp Rises Above (&gt;)</option>
                        <option value="humidity_below">Relative Humidity Drops Below (&lt;)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Threshold Value ({formEventMetric.includes('temp') ? '°C' : '%'})
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="5"
                          max="80"
                          value={formEventThreshold}
                          onChange={(e) => setFormEventThreshold(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-amber-500"
                          required
                        />
                        <span className="font-semibold text-slate-500">
                          {formEventMetric.includes('temp') ? '°C' : '%'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Anti-Flooding Cooldown Period
                    </label>
                    <select
                      value={formCooldownHours}
                      onChange={(e) => setFormCooldownHours(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="4">Wait at least 4 hours between automated triggers</option>
                      <option value="6">Wait at least 6 hours between automated triggers (Recommended)</option>
                      <option value="12">Wait at least 12 hours between automated triggers</option>
                      <option value="24">Wait at least 24 hours (Max 1 cycle per day)</option>
                    </select>
                  </div>
                </div>
              ) : (
                /* Time Setting (for daily or weekly) */
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Cycle Duration (mins)</label>
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={formDuration}
                      onChange={(e) => setFormDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Cycle Duration if Event-based */}
              {formTriggerType === 'event_based' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Automated Run Duration (mins)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={formDuration}
                      onChange={(e) => setFormDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                    <span className="text-slate-500 shrink-0">mins per zone</span>
                  </div>
                </div>
              )}

              {/* Weekly Days Picker */}
              {formTriggerType === 'weekly' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Active Days</label>
                  <div className="flex items-center gap-1.5">
                    {DAY_NAMES.map((day, idx) => {
                      const isSelected = formDays.includes(idx);
                      return (
                        <button
                          type="button"
                          key={day}
                          onClick={() => {
                            if (isSelected) {
                              setFormDays(formDays.filter(d => d !== idx));
                            } else {
                              setFormDays([...formDays, idx]);
                            }
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {day[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Target Zone Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Field Zones</label>
                <div className="grid grid-cols-2 gap-2">
                  {zones.map(z => (
                    <label
                      key={z.id}
                      className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                        formZoneIds.includes(z.id)
                          ? 'bg-sky-50 border-sky-300 text-sky-800'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formZoneIds.includes(z.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormZoneIds([...formZoneIds, z.id]);
                          } else {
                            setFormZoneIds(formZoneIds.filter(id => id !== z.id));
                          }
                        }}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <span className="truncate">{z.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Smart Skip Inhibit Rules */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                <span className="font-semibold text-slate-700 block">AI Inhibit & Safety Rules</span>
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formSkipRain}
                    onChange={(e) => setFormSkipRain(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Skip cycle if precipitation is forecasted</span>
                </label>
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formSkipHighMoisture}
                    onChange={(e) => setFormSkipHighMoisture(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Skip cycle if soil moisture &gt; 38% (Prevent waterlogging)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formSkipHighWind}
                    onChange={(e) => setFormSkipHighWind(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Inhibit overhead mist/sprinklers if wind gusts &gt; 22 km/h</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold text-slate-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-xs cursor-pointer"
                >
                  {modalMode === 'create' ? 'Save Automated Trigger' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
