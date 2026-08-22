import React, { useState, useEffect } from 'react';
import { User, Project, showToast } from '../types';
import { Folder, Plus, Calendar, Compass, Sprout, TrendingUp, ChevronRight, Loader2, AlertCircle, Trash2, X, Download, CalendarDays, CheckSquare, Square, Clock, Sparkles, Share2, Info, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';

interface HistoricalYieldLogsProps {
  user: User;
  projects: Project[];
  onProjectAdded: (newProject: Project) => void;
  onProjectDeleted: (id: string) => void;
  onSelectLocation: (city: string) => void;
}

// Crop maturity duration helper (days)
const getCropMaturityDays = (cropName: string): number => {
  const c = cropName.toLowerCase();
  if (c.includes('wheat')) return 120;
  if (c.includes('tomato')) return 75;
  if (c.includes('corn')) return 90;
  if (c.includes('cabbage')) return 85;
  if (c.includes('soybean')) return 100;
  return 90;
};

// Calculate harvest progress cycle metrics based on planting date and maturity/harvest date
const getProjectHarvestProgress = (
  project: Project,
  customDates?: { plantingDate?: string; harvestDate?: string }
) => {
  const defaultPlanting = project.created_at ? project.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
  const maturityDays = getCropMaturityDays(project.crop);
  const plantingVal = customDates?.plantingDate || defaultPlanting;

  let harvestVal = customDates?.harvestDate;
  if (!harvestVal) {
    const pObj = new Date(plantingVal);
    if (!isNaN(pObj.getTime())) {
      harvestVal = new Date(pObj.getTime() + maturityDays * 86400000).toISOString().split('T')[0];
    } else {
      harvestVal = plantingVal;
    }
  }

  const plantTime = new Date(plantingVal).getTime();
  const harvestTime = new Date(harvestVal).getTime();
  const currentTime = new Date().getTime();

  let totalDays = maturityDays;
  if (!isNaN(plantTime) && !isNaN(harvestTime) && harvestTime > plantTime) {
    totalDays = Math.max(1, Math.round((harvestTime - plantTime) / (1000 * 60 * 60 * 24)));
  }

  let elapsedDays = 0;
  if (!isNaN(plantTime)) {
    elapsedDays = Math.max(0, Math.round((currentTime - plantTime) / (1000 * 60 * 60 * 24)));
  }

  let daysLeft = 0;
  if (!isNaN(harvestTime)) {
    daysLeft = Math.max(0, Math.round((harvestTime - currentTime) / (1000 * 60 * 60 * 24)));
  }

  let progressPct = Math.min(100, Math.max(0, parseFloat(((elapsedDays / totalDays) * 100).toFixed(1))));
  const isHarvestReady = currentTime >= harvestTime;

  return {
    plantingVal,
    harvestVal,
    maturityDays,
    totalDays,
    elapsedDays,
    daysLeft,
    progressPct,
    isHarvestReady,
  };
};

// Formats JS Date to ICS UTC String YYYYMMDD
const formatICSDatetime = (date: Date, isAllDay = true): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  if (isAllDay) return `${year}${month}${day}`;
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const mins = String(date.getUTCMinutes()).padStart(2, '0');
  const secs = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${mins}${secs}Z`;
};

// Escape special characters for .ics RFC 5545 format
const escapeICSValue = (str: string): string => {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

export interface ICSEventData {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  category: 'PLANTING' | 'HARVEST' | 'LOG_MILESTONE';
  selected: boolean;
}

export default function HistoricalYieldLogs({ user, projects, onProjectAdded, onProjectDeleted, onSelectLocation }: HistoricalYieldLogsProps) {
  const [folderName, setFolderName] = useState('');
  const [folderCrop, setFolderCrop] = useState('Wheat');
  const [folderLocation, setFolderLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // States for custom deletion confirmation modal
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [confirmDeleteInput, setConfirmDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // States for Calendar Export (.ics)
  const [customProjectDates, setCustomProjectDates] = useState<Record<string, { plantingDate: string; harvestDate: string }>>({});
  const [selectedEventTypes, setSelectedEventTypes] = useState({
    planting: true,
    harvest: true,
    milestones: true,
  });

  // Stateful historical logs for real-time model updating
  const [logs, setLogs] = useState<Array<{ id?: string; season: string; crop: string; target: string; actual: string; status: string; profit: string }>>([
    { id: '1', season: '2023–2024 Autumn', crop: 'Spring Wheat', target: '4.8 tons/ha', actual: '4.6 tons/ha', status: 'Stable', profit: '+$1,120' },
    { id: '2', season: '2024 Summer', crop: 'Roma Tomatoes', target: '18.2 tons/ha', actual: '19.5 tons/ha', status: 'Optimal', profit: '+$3,450' },
    { id: '3', season: '2024 Autumn', crop: 'Sweet Corn', target: '8.5 tons/ha', actual: '7.2 tons/ha', status: 'Drought Stress', profit: '-$420' },
    { id: '4', season: '2025 Winter', crop: 'Cabbage clusters', target: '12.0 tons/ha', actual: '12.4 tons/ha', status: 'Stable', profit: '+$840' },
  ]);
  const [isSyncingLogs, setIsSyncingLogs] = useState(false);

  // Fetch persisted cloud logs for current user
  useEffect(() => {
    if (!user?.id) return;
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/yield-logs', {
          headers: { 'x-user-id': user.id }
        });
        const data = await res.json();
        if (data.success && data.logs && data.logs.length > 0) {
          setLogs(data.logs.map((l: any) => ({
            id: l.id,
            season: l.season,
            crop: l.crop,
            target: l.target,
            actual: l.actual,
            status: l.status,
            profit: l.profit
          })));
        }
      } catch (e) {
        console.error('Failed to fetch user cloud yield logs', e);
      }
    };
    fetchLogs();
  }, [user?.id]);

  // Form states for adding custom historical logs
  const [newSeason, setNewSeason] = useState('');
  const [newCrop, setNewCrop] = useState('Spring Wheat');
  const [newTarget, setNewTarget] = useState('');
  const [newActual, setNewActual] = useState('');
  const [newStatus, setNewStatus] = useState('Stable');
  const [newProfit, setNewProfit] = useState('');

  // Regression options state
  const [predictorType, setPredictorType] = useState<'target' | 'time'>('target');
  const [predictionInput, setPredictionInput] = useState<number>(15.0); // Predict actual yield for 15.0 tons/ha target

  // Parse numerical yield from string representation
  const parseYieldNum = (str: string): number => {
    const matched = str.match(/[\d.]+/);
    return matched ? parseFloat(matched[0]) : 0;
  };

  // Recharts Yield Trend Analytics state & data preparation
  const [chartMode, setChartMode] = useState<'composed' | 'variance' | 'profit'>('composed');
  const [chartCropFilter, setChartCropFilter] = useState<string>('ALL');

  const availableCrops = Array.from(new Set(logs.map((l) => l.crop)));

  const formattedChartData = logs
    .filter((l) => chartCropFilter === 'ALL' || l.crop === chartCropFilter)
    .map((log, idx) => {
      const targetVal = parseYieldNum(log.target);
      const actualVal = parseYieldNum(log.actual);
      const varianceVal = parseFloat((actualVal - targetVal).toFixed(2));
      const variancePct = targetVal > 0 ? parseFloat((((actualVal - targetVal) / targetVal) * 100).toFixed(1)) : 0;

      const rawProfitStr = log.profit.replace(/[^0-9.-]/g, '');
      const isNegative = log.profit.includes('-');
      const numProfit = parseFloat(rawProfitStr) * (isNegative ? -1 : 1);

      return {
        season: log.season,
        crop: log.crop,
        target: targetVal,
        actual: actualVal,
        variance: varianceVal,
        variancePct: variancePct,
        profit: isNaN(numProfit) ? 0 : numProfit,
        formattedProfit: log.profit,
        status: log.status,
        periodIndex: idx + 1,
      };
    });

  const avgActualYield = formattedChartData.length > 0
    ? parseFloat((formattedChartData.reduce((acc, curr) => acc + curr.actual, 0) / formattedChartData.length).toFixed(2))
    : 0;

  const totalNetProfit = formattedChartData.reduce((acc, curr) => acc + curr.profit, 0);

  const avgTargetAchievement = formattedChartData.length > 0
    ? parseFloat((formattedChartData.reduce((acc, curr) => acc + (curr.target > 0 ? (curr.actual / curr.target) * 100 : 100), 0) / formattedChartData.length).toFixed(1))
    : 100;

  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 border-b border-slate-700/80 pb-2">
            <span className="font-bold text-orange-400">{data.season}</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold border border-slate-700">
              {data.crop}
            </span>
          </div>
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Target Expectation:</span>
              <span className="text-slate-200 font-bold">{data.target} tons/ha</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Actual Harvest Yield:</span>
              <span className="text-emerald-400 font-bold">{data.actual} tons/ha</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Yield Performance Delta:</span>
              <span className={data.variance >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {data.variance >= 0 ? `+${data.variance}` : data.variance} tons/ha ({data.variancePct >= 0 ? `+${data.variancePct}%` : `${data.variancePct}%`})
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-1.5 mt-1">
              <span className="text-slate-400">Economic Return:</span>
              <span className={data.profit >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {data.formattedProfit}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Regression Calculation
  const calculateRegression = () => {
    if (logs.length < 2) {
      return { m: 0, b: 0, r2: 0, avgX: 0, avgY: 0, valid: false };
    }

    const dataPoints = logs.map((log, index) => {
      const x = predictorType === 'target' ? parseYieldNum(log.target) : (index + 1);
      const y = parseYieldNum(log.actual);
      return { x, y };
    });

    const n = dataPoints.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    let sumYY = 0;

    dataPoints.forEach((pt) => {
      sumX += pt.x;
      sumY += pt.y;
      sumXY += pt.x * pt.y;
      sumXX += pt.x * pt.x;
      sumYY += pt.y * pt.y;
    });

    const avgX = sumX / n;
    const avgY = sumY / n;

    const numerator = n * sumXY - sumX * sumY;
    const denominator = n * sumXX - sumX * sumX;

    const m = denominator !== 0 ? numerator / denominator : 0;
    const b = avgY - m * avgX;

    // R-squared
    const rNum = n * sumXY - sumX * sumY;
    const rDen = (n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY);
    const r2 = rDen !== 0 ? (rNum * rNum) / rDen : 0;

    return { m, b, r2, avgX, avgY, valid: true };
  };

  const model = calculateRegression();
  const predictedYield = model.valid ? (model.m * predictionInput + model.b) : 0;

  // Confidence assessment based on R-squared
  const getConfidenceRating = (r2: number) => {
    if (r2 >= 0.8) return { rating: 'High Reliability', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
    if (r2 >= 0.4) return { rating: 'Moderate Fit', color: 'text-amber-600 bg-amber-50 border-amber-100' };
    return { rating: 'Low Fit (Highly Volatile)', color: 'text-rose-600 bg-rose-50 border-rose-100' };
  };

  const confidence = getConfidenceRating(model.r2);

  // Handle adding custom logs with cloud persistence
  const handleAddHistoricalLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeason || !newTarget || !newActual) {
      showToast('Please fill out all historical log fields.', 'error');
      return;
    }

    const targetVal = parseFloat(newTarget);
    const actualVal = parseFloat(newActual);

    if (isNaN(targetVal) || isNaN(actualVal)) {
      showToast('Target and actual yields must be valid numbers.', 'error');
      return;
    }

    const formattedLog = {
      season: newSeason,
      crop: newCrop,
      target: `${targetVal.toFixed(1)} tons/ha`,
      actual: `${actualVal.toFixed(1)} tons/ha`,
      status: newStatus,
      profit: newProfit ? (newProfit.startsWith('+') || newProfit.startsWith('-') ? newProfit : `+${newProfit}`) : '+$0',
    };

    setIsSyncingLogs(true);
    try {
      const res = await fetch('/api/yield-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify(formattedLog)
      });
      const data = await res.json();
      if (data.success && data.log) {
        setLogs((prev) => [...prev, data.log]);
      } else {
        setLogs((prev) => [...prev, { ...formattedLog, id: String(Date.now()) }]);
      }
      setNewSeason('');
      setNewTarget('');
      setNewActual('');
      setNewProfit('');
      showToast(`Saved historical yield log to cloud database!`, 'success');
    } catch (err) {
      setLogs((prev) => [...prev, { ...formattedLog, id: String(Date.now()) }]);
      showToast(`Appended log locally (offline mode).`, 'info');
    } finally {
      setIsSyncingLogs(false);
    }
  };

  const handleDeleteHistoricalLog = async (logId?: string, index?: number) => {
    if (logId) {
      try {
        await fetch(`/api/yield-logs/${logId}`, {
          method: 'DELETE',
          headers: { 'x-user-id': user.id }
        });
      } catch (e) {
        console.error(e);
      }
    }
    setLogs((prev) => prev.filter((l, i) => l.id !== logId && i !== index));
    showToast('Removed log point.', 'info');
  };

  // SQL INSERT: Add a new Field Folder to SQLite backend

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim() || !folderLocation.trim()) {
      setErrorMsg('Please supply a descriptive field folder name and location.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          name: folderName.trim(),
          crop: folderCrop,
          location: folderLocation.trim()
        })
      });
      const data = await response.json();
      if (data.success) {
        onProjectAdded(data.project);
        setFolderName('');
        setFolderLocation('');
      } else {
        setErrorMsg(data.error || 'Failed to execute folder INSERT query.');
      }
    } catch (err) {
      setErrorMsg('Database insert error. Check proxy server logs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id
        }
      });
      const data = await response.json();
      if (data.success) {
        onProjectDeleted(id);
        setProjectToDelete(null);
        setConfirmDeleteInput('');
        showToast('Deleted field region successfully!', 'success');
      } else {
        showToast(data.error || 'Failed to delete region.', 'error');
      }
    } catch (err) {
      showToast('Network error while deleting region.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Generate and download an .ics file from a list of ICSEventData items
  const downloadICSFile = (events: ICSEventData[], filename = 'claire_farm_calendar.ics') => {
    if (events.length === 0) {
      showToast('No events selected for calendar export.', 'warning');
      return;
    }

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Claire.ai//Agricultural Yield Sync Engine//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Claire.ai Farm & Harvest Calendar',
      'X-WR-TIMEZONE:UTC'
    ];

    events.forEach((evt) => {
      const startObj = new Date(evt.startDate);
      const endObj = new Date(evt.endDate);
      if (isNaN(startObj.getTime())) return;

      const validEndObj = isNaN(endObj.getTime()) || endObj < startObj ? new Date(startObj.getTime()) : endObj;

      const dtStamp = formatICSDatetime(new Date(), false);
      const dtStart = formatICSDatetime(startObj, true);
      const dtEndObj = new Date(validEndObj.getTime() + 86400000);
      const dtEnd = formatICSDatetime(dtEndObj, true);

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:claire-${evt.id}-${Date.now()}@claire.ai`);
      lines.push(`DTSTAMP:${dtStamp}`);
      lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
      lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
      lines.push(`SUMMARY:${escapeICSValue(evt.title)}`);
      lines.push(`DESCRIPTION:${escapeICSValue(evt.description)}`);
      if (evt.location) {
        lines.push(`LOCATION:${escapeICSValue(evt.location)}`);
      }
      lines.push(`CATEGORIES:${evt.category},AGRICULTURE`);
      lines.push('STATUS:CONFIRMED');
      lines.push('TRANSP:TRANSPARENT');
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');

    const icsContent = lines.join('\r\n');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Exported ${events.length} event(s) to ${filename}!`, 'success');
  };

  // Build full list of calendar events based on project dates and logs
  const buildCalendarEvents = (): ICSEventData[] => {
    const list: ICSEventData[] = [];

    projects.forEach((p) => {
      const defaultPlanting = p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
      const maturityDays = getCropMaturityDays(p.crop);

      const pState = customProjectDates[p.id];
      const plantingDateStr = pState?.plantingDate || defaultPlanting;

      let harvestDateStr = pState?.harvestDate;
      if (!harvestDateStr) {
        const pDateObj = new Date(plantingDateStr);
        if (!isNaN(pDateObj.getTime())) {
          const hDateObj = new Date(pDateObj.getTime() + maturityDays * 86400000);
          harvestDateStr = hDateObj.toISOString().split('T')[0];
        } else {
          harvestDateStr = plantingDateStr;
        }
      }

      if (selectedEventTypes.planting) {
        list.push({
          id: `${p.id}-planting`,
          title: `🌱 Planting: ${p.crop} (${p.name})`,
          description: `Scheduled planting event for ${p.crop} in region "${p.name}". Location: ${p.location}. Managed via Claire.ai Hub.`,
          location: p.location,
          startDate: plantingDateStr,
          endDate: plantingDateStr,
          category: 'PLANTING',
          selected: true
        });
      }

      if (selectedEventTypes.harvest) {
        list.push({
          id: `${p.id}-harvest`,
          title: `🌾 Target Harvest: ${p.crop} (${p.name})`,
          description: `Projected harvest window for ${p.crop} in region "${p.name}" after ${maturityDays}-day growth cycle. Location: ${p.location}. Managed via Claire.ai Hub.`,
          location: p.location,
          startDate: harvestDateStr,
          endDate: harvestDateStr,
          category: 'HARVEST',
          selected: true
        });
      }
    });

    if (selectedEventTypes.milestones) {
      logs.forEach((log, idx) => {
        const approxYear = log.season.match(/\d{4}/)?.[0] || '2026';
        const approxMonth = log.season.toLowerCase().includes('summer') ? '07' :
                            log.season.toLowerCase().includes('autumn') ? '10' :
                            log.season.toLowerCase().includes('winter') ? '01' : '04';
        const milestoneDate = `${approxYear}-${approxMonth}-15`;

        list.push({
          id: `log-${idx}`,
          title: `📈 Yield Milestone: ${log.crop} (${log.season})`,
          description: `Historical Log: ${log.crop} milestone harvest. Actual Yield: ${log.actual} (Target: ${log.target}). Crop Status: ${log.status}. Profit: ${log.profit}.`,
          location: user.fullName ? `${user.fullName}'s Farm` : 'Farm Location',
          startDate: milestoneDate,
          endDate: milestoneDate,
          category: 'LOG_MILESTONE',
          selected: true
        });
      });
    }

    return list;
  };

  // Export single project schedule
  const handleExportSingleProjectICS = (p: Project) => {
    const defaultPlanting = p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
    const maturityDays = getCropMaturityDays(p.crop);
    const pState = customProjectDates[p.id];
    const plantingDateStr = pState?.plantingDate || defaultPlanting;

    let harvestDateStr = pState?.harvestDate;
    if (!harvestDateStr) {
      const pDateObj = new Date(plantingDateStr);
      const hDateObj = !isNaN(pDateObj.getTime()) ? new Date(pDateObj.getTime() + maturityDays * 86400000) : new Date();
      harvestDateStr = hDateObj.toISOString().split('T')[0];
    }

    const events: ICSEventData[] = [
      {
        id: `${p.id}-planting`,
        title: `🌱 Planting: ${p.crop} (${p.name})`,
        description: `Scheduled planting event for ${p.crop} in region "${p.name}". Location: ${p.location}. Managed via Claire.ai.`,
        location: p.location,
        startDate: plantingDateStr,
        endDate: plantingDateStr,
        category: 'PLANTING',
        selected: true
      },
      {
        id: `${p.id}-harvest`,
        title: `🌾 Target Harvest: ${p.crop} (${p.name})`,
        description: `Target harvest window for ${p.crop} in region "${p.name}" after ${maturityDays}-day growth cycle. Location: ${p.location}. Managed via Claire.ai.`,
        location: p.location,
        startDate: harvestDateStr,
        endDate: harvestDateStr,
        category: 'HARVEST',
        selected: true
      }
    ];

    const safeName = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    downloadICSFile(events, `${safeName}_schedule.ics`);
  };

  // Update dates for a project
  const handleProjectDateChange = (projectId: string, field: 'plantingDate' | 'harvestDate', value: string) => {
    setCustomProjectDates((prev) => {
      const current = prev[projectId] || { plantingDate: '', harvestDate: '' };
      const updated = { ...current, [field]: value };

      if (field === 'plantingDate' && value) {
        const proj = projects.find((p) => p.id === projectId);
        if (proj) {
          const maturityDays = getCropMaturityDays(proj.crop);
          const pObj = new Date(value);
          if (!isNaN(pObj.getTime())) {
            const hObj = new Date(pObj.getTime() + maturityDays * 86400000);
            updated.harvestDate = hObj.toISOString().split('T')[0];
          }
        }
      }

      return { ...prev, [projectId]: updated };
    });
  };

  return (
    <div id="historical_yield_logs" className="-m-8 flex flex-col min-h-[480px]">
      
      {/* Bento Header Bar */}
      <div className="p-6 border-b border-orange-50 flex items-center justify-between bg-gradient-to-r from-white to-orange-50/30 rounded-t-3xl shrink-0">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <span className="text-orange-500 text-lg">📊</span> Historical Yield Logs
        </h3>
        <span className="text-[10px] bg-white border border-slate-200 px-2.5 py-1 rounded-md text-slate-500 uppercase tracking-widest font-bold">SQL Database Sync</span>
      </div>

      <div className="p-8 space-y-6 flex-1 overflow-y-auto">
      
      {/* 4x Stats overview row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-orange-100 p-4 rounded-xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-[#FF7A59]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Historical Average Yield</span>
            <span className="text-base font-extrabold text-slate-700">10.9 tons/ha</span>
          </div>
        </div>

        <div className="bg-white border border-orange-100 p-4 rounded-xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Field Folders</span>
            <span className="text-base font-extrabold text-slate-700">{projects.length} Field Locations</span>
          </div>
        </div>

        <div className="bg-white border border-orange-100 p-4 rounded-xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Last Sync Check</span>
            <span className="text-base font-extrabold text-slate-700">Today, Active</span>
          </div>
        </div>
      </div>

      {/* Recharts Crop Yield Trend Visualization Card */}
      <div id="recharts_yield_trend_card" className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-orange-100/60 pb-4">
          <div>
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-orange-500" />
              Seasonal Crop Yield Trends (Recharts)
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Visual analytics comparing expected target yields against actual harvest outputs across historical seasons.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={chartCropFilter}
              onChange={(e) => setChartCropFilter(e.target.value)}
              className="h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs text-slate-700 outline-none focus:border-orange-300 transition-colors font-medium"
            >
              <option value="ALL">All Crops ({logs.length})</option>
              {availableCrops.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartMode('composed')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  chartMode === 'composed' ? 'bg-white text-orange-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Target vs. Actual
              </button>
              <button
                type="button"
                onClick={() => setChartMode('variance')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  chartMode === 'variance' ? 'bg-white text-orange-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Yield Delta
              </button>
              <button
                type="button"
                onClick={() => setChartMode('profit')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  chartMode === 'profit' ? 'bg-white text-orange-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Net Return ($)
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Summary Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-150 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Harvest</span>
            <span className="text-sm font-extrabold text-slate-800 font-mono">{avgActualYield} tons/ha</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Achievement Rate</span>
            <span className="text-sm font-extrabold text-emerald-600 font-mono">{avgTargetAchievement}%</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cumulative Return</span>
            <span className={`text-sm font-extrabold font-mono ${totalNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              {totalNetProfit >= 0 ? `+$${totalNetProfit.toLocaleString()}` : `-$${Math.abs(totalNetProfit).toLocaleString()}`}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Display Periods</span>
            <span className="text-sm font-extrabold text-slate-800 font-mono">{formattedChartData.length} Seasons</span>
          </div>
        </div>

        {/* Interactive Chart Canvas */}
        <div className="h-72 w-full pt-1">
          {formattedChartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
              No historical log records found matching "{chartCropFilter}".
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'composed' ? (
                <ComposedChart data={formattedChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF7A59" stopOpacity={0.85}/>
                      <stop offset="95%" stopColor="#FF7A59" stopOpacity={0.25}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="season" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} unit=" t/ha" />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <ReferenceLine y={avgActualYield} label={{ value: `Avg: ${avgActualYield} t/ha`, fill: '#94a3b8', fontSize: 10, position: 'right' }} stroke="#94a3b8" strokeDasharray="4 4" />
                  <Bar dataKey="actual" name="Actual Yield (tons/ha)" fill="url(#actualGradient)" radius={[6, 6, 0, 0]} maxBarSize={44} />
                  <Line type="monotone" dataKey="target" name="Target Expected (tons/ha)" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 4, fill: '#0284c7' }} />
                </ComposedChart>
              ) : chartMode === 'variance' ? (
                <BarChart data={formattedChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="season" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} unit=" t/ha" />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1.5} />
                  <Bar dataKey="variance" name="Yield Surplus / Deficit (tons/ha)" radius={[4, 4, 0, 0]} maxBarSize={44}>
                    {formattedChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.variance >= 0 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <LineChart data={formattedChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="season" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} unit=" $" />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="profit" name="Net Profit / Loss ($)" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981' }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table of Historic Yield Records - 65% width representation in subgroup */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Structured Tabular Historical Records</span>
            <span className="text-[10px] text-slate-400 font-mono font-medium">Auto-calculated model base ({logs.length} periods)</span>
          </div>
          
          <div className="bg-white border border-orange-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-orange-100/60 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Season Period</th>
                    <th className="py-3 px-4">Cultivar</th>
                    <th className="py-3 px-4 text-center">Expected Target</th>
                    <th className="py-3 px-4 text-center">Actual Yield</th>
                    <th className="py-3 px-4 text-center">Crop Status</th>
                    <th className="py-3 px-4 text-right">Net Profit</th>
                    <th className="py-3 px-3 text-center w-8">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {logs.map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-slate-50/50 text-slate-600 font-medium transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">{log.season}</td>
                      <td className="py-3 px-4">{log.crop}</td>
                      <td className="py-3 px-4 text-center font-mono">{log.target}</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-800 font-semibold">{log.actual}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          log.status === 'Optimal' ? 'bg-emerald-50 text-emerald-600' :
                          log.status === 'Stable' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${log.profit.startsWith('+') ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {log.profit}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteHistoricalLog(log.id, idx)}
                          className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete historical log point"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Expandable form to append historic logs directly */}
          <details className="group bg-slate-50/50 border border-slate-200 rounded-2xl p-4 overflow-hidden transition-all duration-300">
            <summary className="text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer list-none flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <span className="text-orange-500 text-sm">➕</span>
                <span>Add Historical Log Point (Update Regression Model)</span>
              </div>
              <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform font-mono">▼</span>
            </summary>
            
            <form onSubmit={handleAddHistoricalLog} className="pt-4 mt-3 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Season / Year</label>
                <input
                  type="text"
                  placeholder="e.g. 2025 Summer"
                  value={newSeason}
                  onChange={(e) => setNewSeason(e.target.value)}
                  className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2.5 text-xs text-slate-700 outline-none focus:border-orange-300 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Cultivar Crop</label>
                <select
                  value={newCrop}
                  onChange={(e) => setNewCrop(e.target.value)}
                  className="w-full h-8 bg-white border border-slate-200 rounded-lg px-1.5 text-xs text-slate-700 outline-none focus:border-orange-300 transition-colors"
                >
                  <option value="Spring Wheat">Spring Wheat</option>
                  <option value="Roma Tomatoes">Roma Tomatoes</option>
                  <option value="Sweet Corn">Sweet Corn</option>
                  <option value="Cabbage clusters">Cabbage clusters</option>
                  <option value="Soybeans">Soybeans</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Expected Target (tons/ha)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 10.5"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2.5 text-xs text-slate-700 outline-none focus:border-orange-300 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Actual Yield (tons/ha)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 11.2"
                  value={newActual}
                  onChange={(e) => setNewActual(e.target.value)}
                  className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2.5 text-xs text-slate-700 outline-none focus:border-orange-300 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Crop Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full h-8 bg-white border border-slate-200 rounded-lg px-1.5 text-xs text-slate-700 outline-none focus:border-orange-300 transition-colors"
                >
                  <option value="Optimal">Optimal</option>
                  <option value="Stable">Stable</option>
                  <option value="Drought Stress">Drought Stress</option>
                  <option value="Frost Damage">Frost Damage</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Estimated Profit</label>
                <input
                  type="text"
                  placeholder="e.g. +$1,200"
                  value={newProfit}
                  onChange={(e) => setNewProfit(e.target.value)}
                  className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2.5 text-xs text-slate-700 outline-none focus:border-orange-300 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="col-span-1 sm:col-span-3 h-8 mt-2 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                Insert Historical Record to Local Model
              </button>
            </form>
          </details>
        </div>

        {/* Database INSERT Form & Project list - 35% width representation in subgroup */}
        <div className="space-y-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Field Folders Management (SQLite INSERT)</span>
          
          {/* SQL Submission form block */}
          <form onSubmit={handleCreateFolder} className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm space-y-3.5">
            <div className="text-[11px] text-slate-400 leading-normal flex items-start gap-1.5 border-b border-slate-50 pb-2.5">
              <Compass className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
              <span>Name and execute an SQL INSERT statement to write a new microclimate field folder straight to database.</span>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-medium leading-relaxed">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="folder_name" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Field Folder Name</label>
              <input
                id="folder_name"
                type="text"
                placeholder="e.g. West Meadow Plot"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs text-slate-700 outline-none focus:border-orange-300 focus:bg-white transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cultivar Crop</label>
                <select
                  value={folderCrop}
                  onChange={(e) => setFolderCrop(e.target.value)}
                  className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs text-slate-700 outline-none focus:border-orange-300 focus:bg-white transition-colors"
                >
                  <option value="Wheat">Spring Wheat</option>
                  <option value="Tomatoes">Roma Tomatoes</option>
                  <option value="Corn">Sweet Corn</option>
                  <option value="Cabbage">Cabbage cluster</option>
                  <option value="Soybeans">Soybeans</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="folder_location" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Global City Name</label>
                <input
                  id="folder_location"
                  type="text"
                  placeholder="e.g. Nairobi"
                  value={folderLocation}
                  onChange={(e) => setFolderLocation(e.target.value)}
                  className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs text-slate-700 outline-none focus:border-orange-300 focus:bg-white transition-colors"
                  required
                />
              </div>
            </div>

            <button
              id="btn_insert_project"
              type="submit"
              disabled={isSubmitting}
              className="w-full h-9 bg-[#FF7A59] hover:bg-[#ff6942] text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-sm shadow-orange-100 cursor-pointer transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Execute SQL INSERT Folder
            </button>
          </form>

          {/* Active Folder Quick Selection catalog */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Your Field Folders ({projects.length})</span>
            {projects.length === 0 ? (
              <div className="p-5 bg-orange-50/30 border border-dashed border-orange-200 text-center rounded-xl text-xs text-slate-500 space-y-2">
                <p className="font-semibold text-orange-600">📍 No Regions Registered Yet</p>
                <p className="text-[11px] text-slate-400">Please use the "Field Folders Management" form above to add your first agricultural region and persist your field data!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {projects.map((p) => {
                  const progressData = getProjectHarvestProgress(p, customProjectDates[p.id]);

                  return (
                    <div
                      key={p.id}
                      className="w-full p-3 bg-white border border-slate-100 rounded-xl flex flex-col gap-2 text-xs text-slate-600 group transition-all shadow-sm hover:border-orange-200"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectLocation(p.location)}
                          className="flex-1 text-left flex items-center gap-2 min-w-0 cursor-pointer"
                        >
                          <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-700 truncate block group-hover:text-orange-600 transition-colors">{p.name}</span>
                            <span className="text-[10px] text-slate-400 truncate block">{p.crop} • {p.location}</span>
                          </div>
                        </button>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportSingleProjectICS(p);
                            }}
                            title="Export region calendar schedule (.ics)"
                            className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectToDelete(p);
                              setConfirmDeleteInput('');
                            }}
                            title="Delete this region"
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>

                      {/* Visual Harvest Cycle Progress Bar */}
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Sprout className="w-3 h-3 text-emerald-500" />
                            Harvest Cycle
                          </span>
                          <span className={progressData.isHarvestReady ? 'text-emerald-600 font-extrabold' : 'text-orange-600 font-extrabold'}>
                            {progressData.isHarvestReady ? '🌾 Ready for Harvest (100%)' : `${progressData.progressPct}% Complete`}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              progressData.isHarvestReady
                                ? 'bg-emerald-500'
                                : 'bg-gradient-to-r from-orange-400 via-amber-400 to-emerald-500'
                            }`}
                            style={{ width: `${progressData.progressPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                          <span>Planting: {progressData.plantingVal}</span>
                          <span>{progressData.isHarvestReady ? 'Harvest Window Reached' : `${progressData.daysLeft} days remaining`}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Advanced Predictive Analytics Section: Simple Linear Regression Module */}
      <div className="mt-8 bg-slate-50 border border-orange-100 rounded-3xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-orange-100/60 pb-4">
          <div>
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="text-base">🔮</span> Yield Forecasting Engine (Linear Regression)
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Applies a least-squares model (y = mx + b) over season logs to calculate crop yield trajectories.
            </p>
          </div>
          <div className="flex items-center gap-1.5 self-start sm:self-center">
            <button
              type="button"
              onClick={() => {
                setPredictorType('target');
                setPredictionInput(12.0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                predictorType === 'target' 
                  ? 'bg-[#FF7A59] text-white shadow-sm' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              X = Target Yield
            </button>
            <button
              type="button"
              onClick={() => {
                setPredictorType('time');
                setPredictionInput(logs.length + 1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                predictorType === 'time' 
                  ? 'bg-[#FF7A59] text-white shadow-sm' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              X = Chronological Trend
            </button>
          </div>
        </div>

        {model.valid ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Stat output cards */}
            <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
              <div className="bg-white border border-orange-100/70 p-4 rounded-2xl shadow-sm space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Calibration Summary</span>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Model Slope ($m$):</span>
                    <span className="font-mono font-bold text-slate-800">
                      {model.m >= 0 ? '+' : ''}{model.m.toFixed(3)} tons/ha per unit
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Intercept ($b$):</span>
                    <span className="font-mono font-bold text-slate-800">{model.b.toFixed(3)} tons/ha</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Correlation Coefficient ($R^2$):</span>
                    <span className="font-mono font-bold text-slate-800">{model.r2.toFixed(4)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Model Fit Reliability:</span>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${confidence.color}`}>
                    {confidence.rating}
                  </span>
                </div>
              </div>

              <div className="bg-[#FAF6F0] border border-orange-100 p-4 rounded-2xl flex items-center gap-3">
                <div className="text-lg text-orange-400 shrink-0">💡</div>
                <div className="text-[11px] text-slate-600 leading-normal font-medium">
                  {predictorType === 'target' ? (
                    <span>This model shows that for every 1.0 tons/ha increase in your target expectation, actual yield responds by <strong>{model.m.toFixed(2)} tons/ha</strong> on average.</span>
                  ) : (
                    <span>The seasonal yield trend shows a <strong>{model.m >= 0 ? 'growth' : 'decrease'} of {Math.abs(model.m).toFixed(2)} tons/ha</strong> per sequential crop period.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive sliders & big output */}
            <div className="lg:col-span-7 bg-white border border-orange-100 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Forecast Predictor Parameter</span>
                  <span className="text-[11px] font-mono font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-lg border border-orange-100">
                    Input X = {predictorType === 'target' ? `${predictionInput.toFixed(1)} tons/ha Expected` : `Season Period #${predictionInput}`}
                  </span>
                </div>

                <div className="space-y-2">
                  {predictorType === 'target' ? (
                    <input
                      type="range"
                      min="1.0"
                      max="25.0"
                      step="0.5"
                      value={predictionInput}
                      onChange={(e) => setPredictionInput(parseFloat(e.target.value))}
                      className="w-full accent-[#FF7A59] bg-slate-100 h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                  ) : (
                    <input
                      type="range"
                      min="1"
                      max="12"
                      step="1"
                      value={predictionInput}
                      onChange={(e) => setPredictionInput(parseInt(e.target.value, 10))}
                      className="w-full accent-[#FF7A59] bg-slate-100 h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                  )}
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono font-bold">
                    <span>MIN: {predictorType === 'target' ? '1.0' : '1'}</span>
                    <span>SLIDER CONTROLS INDEPENDENT VARIABLE</span>
                    <span>MAX: {predictorType === 'target' ? '25.0' : '12'}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between gap-4">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Predicted Next Season Potential Yield (ŷ)
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-[#FF7A59] font-mono">
                      {predictedYield > 0 ? predictedYield.toFixed(2) : '0.00'}
                    </span>
                    <span className="text-xs font-bold text-slate-500">tons/ha</span>
                  </div>
                </div>

                <div className="p-3 border border-orange-100 bg-orange-50/25 rounded-xl shrink-0 text-right">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">REGRESSION FIT LINE</span>
                  <span className="text-[11px] font-mono font-bold text-slate-700">
                    y = {model.m.toFixed(2)}x {model.b >= 0 ? '+' : '-'} {Math.abs(model.b).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 bg-white border border-dashed border-orange-200 rounded-2xl text-center space-y-2">
            <span className="text-2xl">⚠️</span>
            <p className="text-xs text-slate-500 font-medium">
              Insufficient data points for linear regression calibration. Add at least 2 historical log records to build model.
            </p>
          </div>
        )}
      </div>

      {/* Agricultural Calendar Sync & iCalendar (.ics) Exporter Section */}
      <div id="calendar_ics_export_section" className="mt-8 bg-gradient-to-br from-slate-50 to-orange-50/20 border border-orange-100 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-orange-100/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-orange-200/60 shadow-sm text-orange-500">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                Calendar Event Sync & Exporter (.ics)
              </h4>
              <p className="text-xs text-slate-500">
                Generate standard iCalendar (.ics) schedule files for Google Calendar, Apple iCal, Outlook, or mobile devices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const allEvents = buildCalendarEvents();
                downloadICSFile(allEvents, 'claire_farm_calendar_schedule.ics');
              }}
              className="h-9 px-4 bg-[#FF7A59] hover:bg-[#ff6942] text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              Export All Schedule (.ics)
            </button>
          </div>
        </div>

        {/* Filters & Options Bar */}
        <div className="bg-white border border-slate-150 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Include Event Categories:</span>
            
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedEventTypes.planting}
                onChange={(e) => setSelectedEventTypes((prev) => ({ ...prev, planting: e.target.checked }))}
                className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
              />
              <span>🌱 Planting Events ({projects.length})</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedEventTypes.harvest}
                onChange={(e) => setSelectedEventTypes((prev) => ({ ...prev, harvest: e.target.checked }))}
                className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
              />
              <span>🌾 Harvest Windows ({projects.length})</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedEventTypes.milestones}
                onChange={(e) => setSelectedEventTypes((prev) => ({ ...prev, milestones: e.target.checked }))}
                className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
              />
              <span>📈 Yield Milestones ({logs.length})</span>
            </label>
          </div>

          <div className="text-[11px] text-slate-400 font-mono text-right shrink-0">
            Total Ready: <strong className="text-slate-700">{buildCalendarEvents().length} Events</strong>
          </div>
        </div>

        {/* Projects Field Folder Schedule Table with Editable Dates */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Field Folder Planting & Harvest Target Dates
            </span>
            <span className="text-[10px] text-slate-400">
              Customize dates to adjust your generated .ics calendar reminders
            </span>
          </div>

          {projects.length === 0 ? (
            <div className="p-6 bg-white border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400">
              No active field projects found. Add a region folder above to schedule planting and harvest events.
            </div>
          ) : (
            <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100 text-xs">
              {projects.map((p) => {
                const progressData = getProjectHarvestProgress(p, customProjectDates[p.id]);

                return (
                  <div key={p.id} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:bg-slate-50/50 transition-colors">
                    
                    {/* Project info */}
                    <div className="flex items-center gap-3 min-w-[180px] lg:max-w-[220px]">
                      <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs shrink-0 shadow-xs">
                        {p.crop.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 block text-xs truncate">{p.name}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{p.crop} • {p.location}</span>
                        <span className="text-[9px] font-mono text-slate-400 block mt-0.5">Est. Cycle: {progressData.totalDays} days</span>
                      </div>
                    </div>

                    {/* Integrated Visual Harvest Cycle Progress Bar */}
                    <div className="flex-1 min-w-[220px] max-w-md bg-slate-50/80 border border-slate-150 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-600 flex items-center gap-1">
                          <Sprout className="w-3.5 h-3.5 text-emerald-500" />
                          Harvest Cycle Completion
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                          progressData.isHarvestReady
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-orange-100 text-orange-700 border border-orange-200 font-mono'
                        }`}>
                          {progressData.isHarvestReady ? '🌾 Ready for Harvest' : `${progressData.progressPct}%`}
                        </span>
                      </div>

                      {/* Visual Bar track */}
                      <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden shadow-inner p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            progressData.isHarvestReady
                              ? 'bg-emerald-500 shadow-sm'
                              : 'bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-500'
                          }`}
                          style={{ width: `${progressData.progressPct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>{progressData.elapsedDays} / {progressData.totalDays} days elapsed</span>
                        <span className="font-bold text-slate-700">
                          {progressData.isHarvestReady ? '0 days remaining' : `${progressData.daysLeft} days left`}
                        </span>
                      </div>
                    </div>

                    {/* Date Pickers */}
                    <div className="flex flex-wrap items-center gap-3">
                      
                      {/* Planting Date */}
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          🌱 Planting Date
                        </label>
                        <input
                          type="date"
                          value={progressData.plantingVal}
                          onChange={(e) => handleProjectDateChange(p.id, 'plantingDate', e.target.value)}
                          className="h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs text-slate-700 outline-none focus:border-orange-300 focus:bg-white font-mono"
                        />
                      </div>

                      {/* Harvest Date */}
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          🌾 Projected Harvest
                        </label>
                        <input
                          type="date"
                          value={progressData.harvestVal}
                          onChange={(e) => handleProjectDateChange(p.id, 'harvestDate', e.target.value)}
                          className="h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs text-slate-700 outline-none focus:border-orange-300 focus:bg-white font-mono"
                        />
                      </div>

                    </div>

                    {/* Export Single ICS Action */}
                    <button
                      type="button"
                      onClick={() => handleExportSingleProjectICS(p)}
                      className="h-8 px-3 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-600 border border-slate-200 hover:border-orange-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start lg:self-center shrink-0"
                    >
                      <Download className="w-3.5 h-3.5 text-orange-500" />
                      Export .ics
                    </button>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Integration Instructions Footer */}
        <div className="p-4 bg-slate-100/60 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-orange-500 shrink-0" />
            <span>
              Downloaded <strong>.ics files</strong> can be directly imported into <strong>Google Calendar</strong>, <strong>Apple iCal</strong>, or <strong>Microsoft Outlook</strong> to receive automated harvest reminders.
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-slate-600 shrink-0">
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px]">Google Calendar</span>
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px]">Apple iCal</span>
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px]">Outlook</span>
          </div>
        </div>

      </div>

      </div>

      {/* Confirmation Modal for Project Deletion */}
      <AnimatePresence>
        {projectToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isDeleting) setProjectToDelete(null);
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-xl border border-rose-100 overflow-hidden z-10"
            >
              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800">Delete Agricultural Region</h4>
                      <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider font-mono">Irreversible Operation</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProjectToDelete(null)}
                    disabled={isDeleting}
                    className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Description */}
                <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                  <p>
                    You are about to delete the region <strong className="text-slate-800 font-bold">{projectToDelete.name}</strong> ({projectToDelete.location}).
                  </p>
                  <p className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl text-rose-800">
                    ⚠️ This will permanently remove this field folder, disabling its microclimate monitoring gauges and custom historical records. This action cannot be undone.
                  </p>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Type the name <strong className="text-slate-800 font-bold">"{projectToDelete.name}"</strong> to confirm:
                    </label>
                    <input
                      type="text"
                      value={confirmDeleteInput}
                      onChange={(e) => setConfirmDeleteInput(e.target.value)}
                      placeholder={projectToDelete.name}
                      disabled={isDeleting}
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs text-slate-700 outline-none focus:border-rose-300 focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setProjectToDelete(null)}
                    disabled={isDeleting}
                    className="flex-1 h-9 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting || confirmDeleteInput !== projectToDelete.name}
                    onClick={() => handleDeleteProject(projectToDelete.id)}
                    className="flex-1 h-9 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-100 disabled:text-rose-300 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-sm shadow-rose-100 transition-colors cursor-pointer"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Confirm Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
