import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Download, 
  FileSpreadsheet, 
  X, 
  CheckCircle2, 
  Layers, 
  Sprout, 
  Copy, 
  Check, 
  Sliders, 
  Info, 
  FileText, 
  TrendingUp, 
  ShieldCheck,
  Calendar,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { User, Project, SoilRecord, ExportDataOptions, showToast } from '../types';
import { 
  generateYieldAndSoilCsv, 
  downloadCsvBlob, 
  YieldRecordItem 
} from '../utils/csvExportUtils';

interface ExportDataModalProps {
  user: User;
  yieldLogs: YieldRecordItem[];
  soilRecords: SoilRecord[];
  projects: Project[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportDataModal({
  user,
  yieldLogs,
  soilRecords,
  projects,
  isOpen,
  onClose
}: ExportDataModalProps) {
  const [format, setFormat] = useState<ExportDataOptions['format']>('combined_sections');
  const [delimiter, setDelimiter] = useState<',' | ';'>(',');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'configure' | 'preview'>('configure');

  // Generate current CSV content dynamically
  const generatedCsv = useMemo(() => {
    return generateYieldAndSoilCsv(user, yieldLogs, soilRecords, projects, {
      includeYieldLogs: format !== 'soil_only',
      includeSoilRecords: format !== 'yield_only',
      includeMetadata,
      format,
      delimiter
    });
  }, [user, yieldLogs, soilRecords, projects, format, delimiter, includeMetadata]);

  // Construct sensible filename based on format and date
  const filename = useMemo(() => {
    const dateStr = new Date().toISOString().split('T')[0];
    const prefix = user.fullName 
      ? user.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '_') 
      : 'claire_agri';
    
    let typePart = 'yield_and_soil_report';
    if (format === 'yield_only') typePart = 'yield_logs';
    if (format === 'soil_only') typePart = 'soil_records';
    if (format === 'combined_matrix') typePart = 'correlated_matrix';

    return `${prefix}_${typePart}_${dateStr}.csv`;
  }, [user.fullName, format]);

  // Handle Download Action
  const handleDownload = () => {
    try {
      downloadCsvBlob(generatedCsv, filename);
      showToast(`Exported "${filename}" successfully!`, 'success');
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to trigger CSV download.', 'error');
    }
  };

  // Handle Copy to Clipboard
  const handleCopyClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCsv);
      setCopied(true);
      showToast('CSV data copied to clipboard! Ready to paste into Sheets or Excel.', 'info');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      showToast('Could not copy to clipboard automatically.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.25 }}
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/40 via-white to-sky-50/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                  Export Data (CSV Report)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                  RFC 4180
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate and download formatted spreadsheet records of your historical crop yields and soil tests.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Close export modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('configure')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'configure'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Export Presets & Options
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <span>Live CSV Preview</span>
              <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 text-[9px] font-mono rounded-full font-bold">
                {generatedCsv.split('\n').length} lines
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
            Target: <strong className="text-slate-700">{filename}</strong>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Record Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50/60 border border-emerald-100/80 p-3 rounded-2xl">
              <span className="block text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Yield Records</span>
              <span className="text-xl font-extrabold text-emerald-800 font-mono">{yieldLogs.length}</span>
              <span className="block text-[10px] text-emerald-600/80 mt-0.5">Seasons logged</span>
            </div>

            <div className="bg-sky-50/60 border border-sky-100/80 p-3 rounded-2xl">
              <span className="block text-[9px] font-bold text-sky-600 uppercase tracking-wider">Soil Records</span>
              <span className="text-xl font-extrabold text-sky-800 font-mono">{soilRecords.length}</span>
              <span className="block text-[10px] text-sky-600/80 mt-0.5">Samples analyzed</span>
            </div>

            <div className="bg-purple-50/60 border border-purple-100/80 p-3 rounded-2xl">
              <span className="block text-[9px] font-bold text-purple-600 uppercase tracking-wider">Field Locations</span>
              <span className="text-xl font-extrabold text-purple-800 font-mono">{projects.length || 1}</span>
              <span className="block text-[10px] text-purple-600/80 mt-0.5">Monitored parcels</span>
            </div>

            <div className="bg-amber-50/60 border border-amber-100/80 p-3 rounded-2xl">
              <span className="block text-[9px] font-bold text-amber-600 uppercase tracking-wider">User Account</span>
              <span className="text-xs font-extrabold text-amber-900 truncate block mt-1" title={user.fullName || user.email}>
                {user.fullName || 'Active Farmer'}
              </span>
              <span className="block text-[10px] text-amber-600/80 truncate">{user.location || 'Local Station'}</span>
            </div>
          </div>

          {activeTab === 'configure' ? (
            <div className="space-y-5">
              {/* Report Format Selection */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select CSV Report Structure
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Combined Sections */}
                  <label
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      format === 'combined_sections'
                        ? 'border-emerald-500 bg-emerald-50/30 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="export_format"
                          value="combined_sections"
                          checked={format === 'combined_sections'}
                          onChange={() => setFormat('combined_sections')}
                          className="accent-emerald-600 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs font-extrabold text-slate-800">
                          Complete Dossier (Yield & Soil)
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-700">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                      Multi-section dossier containing farmer metadata, historical harvest records, complete soil lab parameters (NPK, SOC, pH, moisture), and summary benchmarks.
                    </p>
                  </label>

                  {/* Option 2: Correlated Matrix */}
                  <label
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      format === 'combined_matrix'
                        ? 'border-emerald-500 bg-emerald-50/30 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="export_format"
                          value="combined_matrix"
                          checked={format === 'combined_matrix'}
                          onChange={() => setFormat('combined_matrix')}
                          className="accent-emerald-600 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs font-extrabold text-slate-800">
                          Correlated Matrix (Flat Table)
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-sky-100 text-sky-700">
                        Analytics
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                      Single normalized table joining each harvest period directly with matching soil measurements. Ideal for Excel Pivot Tables, R, and Python Pandas.
                    </p>
                  </label>

                  {/* Option 3: Yield Only */}
                  <label
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      format === 'yield_only'
                        ? 'border-emerald-500 bg-emerald-50/30 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="export_format"
                          value="yield_only"
                          checked={format === 'yield_only'}
                          onChange={() => setFormat('yield_only')}
                          className="accent-emerald-600 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs font-extrabold text-slate-800">
                          Historical Yield Logs Only
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-500 bg-slate-100">
                        {yieldLogs.length} rows
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                      Focused dataset of target vs actual yields, seasonal variance, crop performance ratings, and net profits.
                    </p>
                  </label>

                  {/* Option 4: Soil Only */}
                  <label
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      format === 'soil_only'
                        ? 'border-emerald-500 bg-emerald-50/30 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="export_format"
                          value="soil_only"
                          checked={format === 'soil_only'}
                          onChange={() => setFormat('soil_only')}
                          className="accent-emerald-600 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs font-extrabold text-slate-800">
                          Soil Health & Nutrient Records Only
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-500 bg-slate-100">
                        {soilRecords.length} rows
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                      Dedicated soil test records detailing nitrogen, phosphorus, potassium, organic carbon %, pH, electrical conductivity, moisture % VWC, and lab notes.
                    </p>
                  </label>
                </div>
              </div>

              {/* Format Fine-Tuning Options */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Export Settings & Compatibility
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Metadata Header Toggle */}
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeMetadata}
                      onChange={(e) => setIncludeMetadata(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Include Farmer Profile Header</span>
                      <span className="text-[10px] text-slate-400">Adds enterprise name, contact, and export audit timestamp</span>
                    </div>
                  </label>

                  {/* Delimiter selector */}
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="text-xs font-semibold text-slate-600">CSV Delimiter:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDelimiter(',')}
                        className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                          delimiter === ','
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Comma (,)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDelimiter(';')}
                        className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                          delimiter === ';'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Semicolon (;)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="flex items-start gap-2.5 p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl text-emerald-900 text-xs leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>UTF-8 with Byte Order Mark (BOM)</strong> is automatically attached to ensure accent characters, symbols, and formulas render cleanly across Microsoft Excel, Apple Numbers, LibreOffice Calc, and Google Sheets.
                </span>
              </div>
            </div>
          ) : (
            /* Live CSV Preview Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Raw CSV Report Stream (First 1,500 chars)</span>
                <span className="font-mono text-slate-400 text-[11px]">{generatedCsv.length.toLocaleString()} bytes</span>
              </div>

              <div className="bg-slate-900 text-emerald-400 font-mono text-[11px] p-4 rounded-2xl overflow-x-auto max-h-96 border border-slate-800 leading-relaxed whitespace-pre">
                {generatedCsv.substring(0, 3000)}
                {generatedCsv.length > 3000 && '\n\n... [truncated for display, full file contains all records]'}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyClipboard}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV Report ({filename})</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
