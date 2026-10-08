import React, { useState, useEffect } from 'react';
import { User, Project, SoilRecord, showToast } from '../types';
import { Folder, Plus, Calendar, Compass, Sprout, TrendingUp, ChevronRight, Loader2, AlertCircle, Trash2, X, Download, CalendarDays, CheckSquare, Square, Clock, Sparkles, Share2, Info, BarChart2, FileSpreadsheet, Upload, Brain, Zap, Sliders, FlaskConical, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import YieldTrendsVisualization from './YieldTrendsVisualization';
import YieldCsvImporter from './YieldCsvImporter';
import YieldAiForecastModal from './YieldAiForecastModal';
import ExportDataModal from './ExportDataModal';
import { generateYieldAndSoilCsv, downloadCsvBlob } from '../utils/csvExportUtils';

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
  const [showCsvImporterModal, setShowCsvImporterModal] = useState(false);
  const [showInlineCsvImporter, setShowInlineCsvImporter] = useState(false);
  const [showAiForecastModal, setShowAiForecastModal] = useState(false);

  // Stateful soil health records for current user
  const [soilRecords, setSoilRecords] = useState<SoilRecord[]>([
    {
      id: 'soil_1',
      user_id: user?.id || '1',
      fieldName: 'North Sector A',
      location: user?.location || 'Regional Zone',
      sampleDate: '2024-03-15',
      crop: 'Spring Wheat',
      soilType: 'Deep Alluvial Loam',
      nitrogenKgHa: 280,
      phosphorusKgHa: 18,
      potassiumKgHa: 210,
      organicCarbonPct: 0.68,
      phLevel: 6.8,
      ecDsM: 0.58,
      moisturePct: 28.5,
      soilTempC: 19.2,
      healthRating: 'Good',
      notes: 'Pre-sowing baseline soil test; balanced NPK ratio and optimal pore structure.'
    },
    {
      id: 'soil_2',
      user_id: user?.id || '1',
      fieldName: 'Central Parcel B',
      location: user?.location || 'Regional Zone',
      sampleDate: '2024-07-20',
      crop: 'Roma Tomatoes',
      soilType: 'Black Regur Soil',
      nitrogenKgHa: 310,
      phosphorusKgHa: 24,
      potassiumKgHa: 245,
      organicCarbonPct: 0.74,
      phLevel: 7.2,
      ecDsM: 0.62,
      moisturePct: 33.1,
      soilTempC: 23.5,
      healthRating: 'Optimal',
      notes: 'Mid-season fertigation check; rich humus content and thriving beneficial fungi.'
    },
    {
      id: 'soil_3',
      user_id: user?.id || '1',
      fieldName: 'South Slope Terrace',
      location: user?.location || 'Regional Zone',
      sampleDate: '2024-10-10',
      crop: 'Sweet Corn',
      soilType: 'Clay Loam',
      nitrogenKgHa: 220,
      phosphorusKgHa: 12,
      potassiumKgHa: 175,
      organicCarbonPct: 0.51,
      phLevel: 7.6,
      ecDsM: 0.85,
      moisturePct: 19.8,
      soilTempC: 24.1,
      healthRating: 'Moderate',
      notes: 'Post-drought survey; recommends humic acid compost amendment to boost CEC.'
    },
    {
      id: 'soil_4',
      user_id: user?.id || '1',
      fieldName: 'East Lowland Basin',
      location: user?.location || 'Regional Zone',
      sampleDate: '2025-01-18',
      crop: 'Cabbage clusters',
      soilType: 'Sandy Clay Loam',
      nitrogenKgHa: 295,
      phosphorusKgHa: 21,
      potassiumKgHa: 230,
      organicCarbonPct: 0.62,
      phLevel: 6.5,
      ecDsM: 0.52,
      moisturePct: 31.0,
      soilTempC: 17.8,
      healthRating: 'Good',
      notes: 'Winter moisture retention high; vigorous earthworm channel activity detected.'
    }
  ]);
  const [isSyncingSoil, setIsSyncingSoil] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeRecordTab, setActiveRecordTab] = useState<'yield' | 'soil'>('yield');

  // Form states for adding custom soil test record
  const [newSoilField, setNewSoilField] = useState('North Sector A');
  const [newSoilDate, setNewSoilDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSoilCrop, setNewSoilCrop] = useState('Spring Wheat');
  const [newSoilType, setNewSoilType] = useState('Deep Alluvial Loam');
  const [newSoilN, setNewSoilN] = useState('280');
  const [newSoilP, setNewSoilP] = useState('18');
  const [newSoilK, setNewSoilK] = useState('210');
  const [newSoilSoc, setNewSoilSoc] = useState('0.68');
  const [newSoilPh, setNewSoilPh] = useState('6.8');
  const [newSoilMoisture, setNewSoilMoisture] = useState('28.5');
  const [newSoilRating, setNewSoilRating] = useState<'Good' | 'Optimal' | 'Moderate' | 'Poor'>('Good');
  const [newSoilNotes, setNewSoilNotes] = useState('');

  // Handle successful CSV import (append or replace)
  const handleImportCsvSuccess = (
    newLogs: Array<{ id?: string; season: string; crop: string; target: string; actual: string; status: string; profit: string }>,
    mode: 'append' | 'replace'
  ) => {
    if (mode === 'replace') {
      setLogs(newLogs);
    } else {
      setLogs((prev) => [...prev, ...newLogs]);
    }
  };

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

  // Fetch persisted cloud soil records for current user
  useEffect(() => {
    if (!user?.id) return;
    const fetchSoilRecords = async () => {
      try {
        const res = await fetch('/api/soil-records', {
          headers: { 'x-user-id': user.id }
        });
        const data = await res.json();
        if (data.success && data.records && data.records.length > 0) {
          setSoilRecords(data.records.map((s: any) => ({
            id: s.id,
            user_id: s.user_id,
            fieldName: s.field_name,
            location: s.location,
            sampleDate: s.sample_date,
            crop: s.crop,
            soilType: s.soil_type,
            nitrogenKgHa: s.nitrogen_kg_ha,
            phosphorusKgHa: s.phosphorus_kg_ha,
            potassiumKgHa: s.potassium_kg_ha,
            organicCarbonPct: s.organic_carbon_pct,
            phLevel: s.ph_level,
            ecDsM: s.ec_ds_m,
            moisturePct: s.moisture_pct,
            soilTempC: s.soil_temp_c,
            healthRating: s.health_rating,
            notes: s.notes,
            createdAt: s.created_at
          })));
        }
      } catch (e) {
        console.error('Failed to fetch user cloud soil records', e);
      }
    };
    fetchSoilRecords();
  }, [user?.id]);

  // Direct 1-click Export Data function: generates and downloads CSV report of yield & soil records
  const handleDirectExportData = () => {
    try {
      const csvString = generateYieldAndSoilCsv(user, logs, soilRecords, projects, {
        includeYieldLogs: true,
        includeSoilRecords: true,
        includeMetadata: true,
        format: 'combined_sections',
        delimiter: ','
      });
      const dateStr = new Date().toISOString().split('T')[0];
      const prefix = user.fullName 
        ? user.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '_') 
        : 'claire_agri';
      const outFilename = `${prefix}_yield_and_soil_report_${dateStr}.csv`;

      downloadCsvBlob(csvString, outFilename);
      showToast(`Exported CSV report with ${logs.length} yield & ${soilRecords.length} soil records!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to export CSV report.', 'error');
    }
  };

  // Handle adding custom soil test record
  const handleAddSoilRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSoilField || !newSoilDate || !newSoilType) {
      showToast('Please provide field name, sample date, and soil type.', 'error');
      return;
    }

    const formattedSoil: SoilRecord = {
      id: 'soil_' + Date.now(),
      user_id: user.id,
      fieldName: newSoilField,
      location: user.location || 'Regional Zone',
      sampleDate: newSoilDate,
      crop: newSoilCrop,
      soilType: newSoilType,
      nitrogenKgHa: parseFloat(newSoilN) || 260,
      phosphorusKgHa: parseFloat(newSoilP) || 18,
      potassiumKgHa: parseFloat(newSoilK) || 200,
      organicCarbonPct: parseFloat(newSoilSoc) || 0.65,
      phLevel: parseFloat(newSoilPh) || 7.0,
      ecDsM: 0.60,
      moisturePct: parseFloat(newSoilMoisture) || 28.0,
      soilTempC: 21.0,
      healthRating: newSoilRating,
      notes: newSoilNotes || 'Field test log entry',
      createdAt: new Date().toISOString()
    };

    setIsSyncingSoil(true);
    try {
      const res = await fetch('/api/soil-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          fieldName: formattedSoil.fieldName,
          location: formattedSoil.location,
          sampleDate: formattedSoil.sampleDate,
          crop: formattedSoil.crop,
          soilType: formattedSoil.soilType,
          nitrogenKgHa: formattedSoil.nitrogenKgHa,
          phosphorusKgHa: formattedSoil.phosphorusKgHa,
          potassiumKgHa: formattedSoil.potassiumKgHa,
          organicCarbonPct: formattedSoil.organicCarbonPct,
          phLevel: formattedSoil.phLevel,
          ecDsM: formattedSoil.ecDsM,
          moisturePct: formattedSoil.moisturePct,
          soilTempC: formattedSoil.soilTempC,
          healthRating: formattedSoil.healthRating,
          notes: formattedSoil.notes
        })
      });
      const data = await res.json();
      if (data.success && data.record) {
        setSoilRecords((prev) => [...prev, {
          id: data.record.id,
          user_id: data.record.user_id,
          fieldName: data.record.field_name,
          location: data.record.location,
          sampleDate: data.record.sample_date,
          crop: data.record.crop,
          soilType: data.record.soil_type,
          nitrogenKgHa: data.record.nitrogen_kg_ha,
          phosphorusKgHa: data.record.phosphorus_kg_ha,
          potassiumKgHa: data.record.potassium_kg_ha,
          organicCarbonPct: data.record.organic_carbon_pct,
          phLevel: data.record.ph_level,
          ecDsM: data.record.ec_ds_m,
          moisturePct: data.record.moisture_pct,
          soilTempC: data.record.soil_temp_c,
          healthRating: data.record.health_rating,
          notes: data.record.notes
        }]);
      } else {
        setSoilRecords((prev) => [...prev, formattedSoil]);
      }
      setNewSoilNotes('');
      showToast('Saved soil test record to cloud database!', 'success');
    } catch (err) {
      setSoilRecords((prev) => [...prev, formattedSoil]);
      showToast('Added soil record locally (offline mode).', 'info');
    } finally {
      setIsSyncingSoil(false);
    }
  };

  const handleDeleteSoilRecord = async (soilId: string) => {
    try {
      await fetch(`/api/soil-records/${soilId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id }
      });
    } catch (e) {
      console.error(e);
    }
    setSoilRecords((prev) => prev.filter((s) => s.id !== soilId));
    showToast('Deleted soil record.', 'info');
  };

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
      <div className="p-6 border-b border-orange-50 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-white via-orange-50/20 to-purple-50/30 rounded-t-3xl shrink-0">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <span className="text-orange-500 text-lg">📊</span> Historical Yield Logs & Analytics
        </h3>
        
        <div className="flex items-center gap-2.5">
          {/* Export Data Button */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDirectExportData}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-extrabold shadow-sm shadow-emerald-600/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              title="Quick 1-click CSV download of your historical yield and soil records"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Data (CSV)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="p-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-emerald-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Configure CSV format, delimiter, and live preview"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* New AI Prediction Model Trigger Button */}
          <button
            type="button"
            onClick={() => setShowAiForecastModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white text-xs font-extrabold shadow-sm shadow-purple-600/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            title="Trigger AI prediction model based on historical yield data for next 3 harvest cycles"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>🔮 Run AI Yield Forecast (Next 3 Cycles)</span>
          </button>

          <span className="text-[10px] bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-slate-500 uppercase tracking-widest font-bold hidden sm:inline-block">
            SQL Sync Active
          </span>
        </div>
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

      {/* Recharts Crop Yield Trend Visualization Component */}
      <YieldTrendsVisualization logs={logs} onOpenAiForecastModal={() => setShowAiForecastModal(true)} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table of Historic Yield Records - 65% width representation in subgroup */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* View Tabs: Yield Records vs Soil Health Records */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveRecordTab('yield')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeRecordTab === 'yield'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
                <span>Crop Yield Logs ({logs.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveRecordTab('soil')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeRecordTab === 'soil'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                <span>Soil Health Records ({soilRecords.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Export Data Button */}
              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                title="Generate and download a CSV report of your yield and soil records"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Data</span>
              </button>

              {/* Secondary AI Forecast Trigger Button */}
              <button
                type="button"
                onClick={() => setShowAiForecastModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition-all cursor-pointer"
                title="Run machine learning model on historical yields"
              >
                <Brain className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">AI Model</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCsvImporterModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-xs font-bold transition-all cursor-pointer"
                title="Bulk upload historical yields from spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden sm:inline">Import CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setShowInlineCsvImporter(!showInlineCsvImporter)}
                className={`p-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  showInlineCsvImporter
                    ? 'bg-sky-50 border-sky-300 text-sky-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="Toggle inline CSV dropzone"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">{showInlineCsvImporter ? 'Hide Drop' : 'Quick Drop'}</span>
              </button>
            </div>
          </div>

          {/* Inline CSV Dropzone / Importer (if expanded) */}
          <AnimatePresence>
            {showInlineCsvImporter && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <YieldCsvImporter
                  userId={user?.id}
                  isInline={true}
                  onImportSuccess={handleImportCsvSuccess}
                  onClose={() => setShowInlineCsvImporter(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {activeRecordTab === 'yield' ? (
            /* TAB 1: Yield Performance Records Table */
            <>
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
            </>
          ) : (
            /* TAB 2: Soil Health & Laboratory Records Table */
            <>
              <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-emerald-100/60 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Field / Parcel</th>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Soil Type</th>
                        <th className="py-3 px-3 text-center">N-P-K (kg/ha)</th>
                        <th className="py-3 px-3 text-center">SOC (%)</th>
                        <th className="py-3 px-3 text-center">pH</th>
                        <th className="py-3 px-3 text-center">Moisture</th>
                        <th className="py-3 px-3 text-center">Health</th>
                        <th className="py-3 px-3 text-center w-8">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
                      {soilRecords.map((soil) => (
                        <tr key={soil.id} className="hover:bg-slate-50/50 text-slate-600 font-medium transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800 block truncate max-w-[140px]">{soil.fieldName}</span>
                            <span className="text-[10px] text-slate-400 block truncate">{soil.crop || 'Crop'} • {soil.location}</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {soil.sampleDate}
                          </td>
                          <td className="py-3 px-3 text-slate-700 text-xs truncate max-w-[120px]" title={soil.soilType}>
                            {soil.soilType}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-xs">
                            <span className="text-emerald-700 font-bold">{soil.nitrogenKgHa}</span>-
                            <span className="text-amber-700 font-bold">{soil.phosphorusKgHa}</span>-
                            <span className="text-sky-700 font-bold">{soil.potassiumKgHa}</span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                            {soil.organicCarbonPct.toFixed(2)}%
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            {soil.phLevel.toFixed(1)}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-700">
                            {soil.moisturePct.toFixed(1)}%
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              soil.healthRating === 'Optimal' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                              soil.healthRating === 'Good' ? 'bg-sky-100 text-sky-700 border border-sky-200' :
                              'bg-amber-100 text-amber-700 border border-amber-200'
                            }`}>
                              {soil.healthRating}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteSoilRecord(soil.id)}
                              className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Delete soil test record"
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

              {/* Expandable form to append soil test records */}
              <details className="group bg-emerald-50/30 border border-emerald-200/70 rounded-2xl p-4 overflow-hidden transition-all duration-300">
                <summary className="text-xs font-bold text-emerald-800 uppercase tracking-wider cursor-pointer list-none flex items-center justify-between select-none">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-emerald-600" />
                    <span>Add Soil Laboratory Test Record</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 group-open:rotate-180 transition-transform font-mono">▼</span>
                </summary>
                
                <form onSubmit={handleAddSoilRecord} className="pt-4 mt-3 border-t border-emerald-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Field / Plot Name</label>
                    <input
                      type="text"
                      placeholder="e.g. North Sector A"
                      value={newSoilField}
                      onChange={(e) => setNewSoilField(e.target.value)}
                      className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2.5 text-xs text-slate-700 outline-none focus:border-emerald-400 transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Sampling Date</label>
                    <input
                      type="date"
                      value={newSoilDate}
                      onChange={(e) => setNewSoilDate(e.target.value)}
                      className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2 text-xs text-slate-700 outline-none focus:border-emerald-400 font-mono transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Soil Texture Type</label>
                    <select
                      value={newSoilType}
                      onChange={(e) => setNewSoilType(e.target.value)}
                      className="w-full h-8 bg-white border border-slate-200 rounded-lg px-1.5 text-xs text-slate-700 outline-none focus:border-emerald-400 transition-colors"
                    >
                      <option value="Deep Alluvial Loam">Deep Alluvial Loam</option>
                      <option value="Black Regur Soil">Black Regur Soil</option>
                      <option value="Clay Loam">Clay Loam</option>
                      <option value="Sandy Clay Loam">Sandy Clay Loam</option>
                      <option value="Red Laterite Loam">Red Laterite Loam</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Nitrogen N (kg/ha)</label>
                    <input
                      type="number"
                      placeholder="280"
                      value={newSoilN}
                      onChange={(e) => setNewSoilN(e.target.value)}
                      className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2.5 text-xs text-slate-700 outline-none focus:border-emerald-400 transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Phosphorus P (kg/ha)</label>
                    <input
                      type="number"
                      placeholder="18"
                      value={newSoilP}
                      onChange={(e) => setNewSoilP(e.target.value)}
                      className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2.5 text-xs text-slate-700 outline-none focus:border-emerald-400 transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Potassium K (kg/ha)</label>
                    <input
                      type="number"
                      placeholder="210"
                      value={newSoilK}
                      onChange={(e) => setNewSoilK(e.target.value)}
                      className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2.5 text-xs text-slate-700 outline-none focus:border-emerald-400 transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Organic Carbon SOC (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.68"
                      value={newSoilSoc}
                      onChange={(e) => setNewSoilSoc(e.target.value)}
                      className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2.5 text-xs text-slate-700 outline-none focus:border-emerald-400 transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Soil pH Level</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="6.8"
                      value={newSoilPh}
                      onChange={(e) => setNewSoilPh(e.target.value)}
                      className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2.5 text-xs text-slate-700 outline-none focus:border-emerald-400 transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Moisture (% VWC)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="28.5"
                      value={newSoilMoisture}
                      onChange={(e) => setNewSoilMoisture(e.target.value)}
                      className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2.5 text-xs text-slate-700 outline-none focus:border-emerald-400 transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-3">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Agronomic Field Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Pre-sowing baseline soil test; balanced NPK ratio."
                      value={newSoilNotes}
                      onChange={(e) => setNewSoilNotes(e.target.value)}
                      className="w-full h-8 bg-white border border-slate-200 rounded-lg px-2.5 text-xs text-slate-700 outline-none focus:border-emerald-400 transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSyncingSoil}
                    className="col-span-1 sm:col-span-3 h-8 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {isSyncingSoil ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Save Soil Test Record to Database</span>
                  </button>
                </form>
              </details>
            </>
          )}
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

        {/* Bulk CSV Importer Modal */}
        {showCsvImporterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-4xl max-h-[90vh] flex flex-col"
            >
              <YieldCsvImporter
                userId={user?.id}
                onImportSuccess={handleImportCsvSuccess}
                onClose={() => setShowCsvImporterModal(false)}
              />
            </motion.div>
          </div>
        )}

        {/* AI Predictive Model & 3-Cycle Forecast Modal */}
        {showAiForecastModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-5xl max-h-[92vh] flex flex-col"
            >
              <YieldAiForecastModal
                logs={logs}
                onClose={() => setShowAiForecastModal(false)}
              />
            </motion.div>
          </div>
        )}

        {/* Agricultural Telemetry Data Export Modal (Yield & Soil CSV) */}
        {showExportModal && (
          <ExportDataModal
            user={user}
            yieldLogs={logs}
            soilRecords={soilRecords}
            projects={projects}
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
