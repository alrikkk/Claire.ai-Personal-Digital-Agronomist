import React, { useState } from 'react';
import { User, Project, showToast } from '../types';
import { Folder, Plus, Calendar, Compass, Sprout, TrendingUp, ChevronRight, Loader2, AlertCircle, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HistoricalYieldLogsProps {
  user: User;
  projects: Project[];
  onProjectAdded: (newProject: Project) => void;
  onProjectDeleted: (id: string) => void;
  onSelectLocation: (city: string) => void;
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

  // Stateful historical logs for real-time model updating
  const [logs, setLogs] = useState([
    { season: '2023–2024 Autumn', crop: 'Spring Wheat', target: '4.8 tons/ha', actual: '4.6 tons/ha', status: 'Stable', profit: '+$1,120' },
    { season: '2024 Summer', crop: 'Roma Tomatoes', target: '18.2 tons/ha', actual: '19.5 tons/ha', status: 'Optimal', profit: '+$3,450' },
    { season: '2024 Autumn', crop: 'Sweet Corn', target: '8.5 tons/ha', actual: '7.2 tons/ha', status: 'Drought Stress', profit: '-$420' },
    { season: '2025 Winter', crop: 'Cabbage clusters', target: '12.0 tons/ha', actual: '12.4 tons/ha', status: 'Stable', profit: '+$840' },
  ]);

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

  // Handle adding custom logs
  const handleAddHistoricalLog = (e: React.FormEvent) => {
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

    setLogs((prev) => [...prev, formattedLog]);
    setNewSeason('');
    setNewTarget('');
    setNewActual('');
    setNewProfit('');
    showToast(`Appended historical log for ${newSeason}!`, 'success');
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {logs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 text-slate-600 font-medium transition-colors">
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
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="w-full p-2.5 bg-white border border-slate-100 rounded-xl flex items-center justify-between text-xs text-slate-600 group transition-all shadow-sm hover:border-orange-100"
                  >
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
                ))}
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
