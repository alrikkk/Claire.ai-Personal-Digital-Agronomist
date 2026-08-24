import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Trash2,
  Download,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Info,
  X,
  HelpCircle,
  Database,
  Layers,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { showToast } from '../types';

export interface ParsedYieldRow {
  id: string;
  season: string;
  crop: string;
  target: string;
  actual: string;
  status: string;
  profit: string;
  isValid: boolean;
  validationError?: string;
  raw: Record<string, string>;
}

interface YieldCsvImporterProps {
  userId?: string;
  onImportSuccess: (newLogs: Array<{ id?: string; season: string; crop: string; target: string; actual: string; status: string; profit: string }>, mode: 'append' | 'replace') => void;
  onClose?: () => void;
  isInline?: boolean;
}

// Sample CSV content generator
const SAMPLE_CSV_CONTENT = `Season,Cultivar / Crop,Target Yield (t/ha),Actual Harvest (t/ha),Crop Status,Net Return ($)
2023 Autumn,Spring Wheat,4.8,4.6,Stable,+$1120
2024 Summer,Roma Tomatoes,18.2,19.5,Optimal,+$3450
2024 Autumn,Sweet Corn,8.5,7.2,Drought Stress,-$420
2025 Winter,Cabbage clusters,12.0,12.4,Stable,+$840
2025 Spring,Soybeans,3.2,3.5,Optimal,+$1650
2025 Summer,Golden Maize,9.0,9.8,Optimal,+$2100`;

// Detect delimiter (, or ; or \t or |)
const detectDelimiter = (text: string): string => {
  const firstLine = text.split(/\r\n|\n|\r/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const pipeCount = (firstLine.match(/\|/g) || []).length;

  const max = Math.max(commaCount, semiCount, tabCount, pipeCount);
  if (max === 0) return ',';
  if (max === tabCount) return '\t';
  if (max === semiCount) return ';';
  if (max === pipeCount) return '|';
  return ',';
};

// Robust CSV Line parser taking into account quotes and commas
const parseCsvLine = (line: string, delimiter: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

// Fuzzy column auto-detector
const findMatchingHeader = (headers: string[], candidates: string[]): string => {
  for (const h of headers) {
    const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const c of candidates) {
      const cleanC = c.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanH.includes(cleanC) || cleanC.includes(cleanH)) {
        return h;
      }
    }
  }
  return '';
};

export default function YieldCsvImporter({
  userId,
  onImportSuccess,
  onClose,
  isInline = false
}: YieldCsvImporterProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState<number | null>(null);

  // Parsing & Mapping state
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState({
    season: '',
    crop: '',
    target: '',
    actual: '',
    status: '',
    profit: ''
  });

  const [parsedRows, setParsedRows] = useState<ParsedYieldRow[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process raw text into headers, suggested mappings, and parsed rows
  const processRawCsvContent = (content: string, name = 'imported_data.csv', size: number | null = null) => {
    setErrorBanner(null);
    const trimmed = content.trim();
    if (!trimmed) {
      setErrorBanner('The selected file or text is empty.');
      return;
    }

    const lines = trimmed.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setErrorBanner('No valid lines found in CSV data.');
      return;
    }

    const delimiter = detectDelimiter(trimmed);
    const rawHeaders = parseCsvLine(lines[0], delimiter);

    if (rawHeaders.length === 0) {
      setErrorBanner('Could not detect header columns from the top row.');
      return;
    }

    // Auto-map headers intelligently
    const seasonCol = findMatchingHeader(rawHeaders, ['season', 'period', 'year', 'date', 'harvest_season', 'time']);
    const cropCol = findMatchingHeader(rawHeaders, ['crop', 'cultivar', 'variety', 'plant', 'commodity', 'name']);
    const targetCol = findMatchingHeader(rawHeaders, ['target', 'expected', 'target_yield', 'goal', 'benchmark', 'expected_yield', 'plan']);
    const actualCol = findMatchingHeader(rawHeaders, ['actual', 'yield', 'harvest', 'actual_yield', 'production', 'actual_harvest', 'output']);
    const statusCol = findMatchingHeader(rawHeaders, ['status', 'condition', 'health', 'state', 'flag']);
    const profitCol = findMatchingHeader(rawHeaders, ['profit', 'net_profit', 'net_return', 'revenue', 'return', 'margin', 'earnings', 'usd']);

    const mapping = {
      season: seasonCol || rawHeaders[0] || '',
      crop: cropCol || rawHeaders[1] || '',
      target: targetCol || rawHeaders[2] || '',
      actual: actualCol || rawHeaders[3] || '',
      status: statusCol || '',
      profit: profitCol || ''
    };

    setHeaders(rawHeaders);
    setColumnMapping(mapping);
    setFileName(name);
    setFileSize(size);

    // Parse data rows
    generateParsedRows(lines.slice(1), rawHeaders, delimiter, mapping);
  };

  // Re-generate parsed rows whenever mapping changes
  const generateParsedRows = (
    dataLines: string[],
    currentHeaders: string[],
    delimiter: string,
    mapping: typeof columnMapping
  ) => {
    const rows: ParsedYieldRow[] = [];

    dataLines.forEach((line, index) => {
      const tokens = parseCsvLine(line, delimiter);
      if (tokens.length === 0 || (tokens.length === 1 && !tokens[0])) return;

      const rawRecord: Record<string, string> = {};
      currentHeaders.forEach((h, idx) => {
        rawRecord[h] = tokens[idx] || '';
      });

      const rawSeason = mapping.season ? rawRecord[mapping.season] : tokens[0] || '';
      const rawCrop = mapping.crop ? rawRecord[mapping.crop] : tokens[1] || '';
      const rawTarget = mapping.target ? rawRecord[mapping.target] : tokens[2] || '';
      const rawActual = mapping.actual ? rawRecord[mapping.actual] : tokens[3] || '';
      const rawStatus = mapping.status ? rawRecord[mapping.status] : tokens[4] || '';
      const rawProfit = mapping.profit ? rawRecord[mapping.profit] : tokens[5] || '';

      // Validate & clean
      let isValid = true;
      let validationError = '';

      if (!rawSeason.trim()) {
        isValid = false;
        validationError = 'Missing season';
      }

      if (!rawCrop.trim()) {
        isValid = false;
        validationError = 'Missing crop/cultivar name';
      }

      // Check numeric actual yield
      const matchActual = rawActual.match(/[\d.]+/);
      if (!matchActual || isNaN(parseFloat(matchActual[0]))) {
        isValid = false;
        validationError = 'Invalid actual yield number';
      }

      // Format target
      let targetFormatted = '10.0 tons/ha';
      const matchTarget = rawTarget.match(/[\d.]+/);
      if (matchTarget && !isNaN(parseFloat(matchTarget[0]))) {
        targetFormatted = `${parseFloat(matchTarget[0]).toFixed(1)} tons/ha`;
      } else if (matchActual) {
        targetFormatted = `${parseFloat(matchActual[0]).toFixed(1)} tons/ha`;
      }

      // Format actual
      let actualFormatted = '0.0 tons/ha';
      if (matchActual && !isNaN(parseFloat(matchActual[0]))) {
        actualFormatted = `${parseFloat(matchActual[0]).toFixed(1)} tons/ha`;
      }

      // Status
      let statusFormatted = rawStatus.trim() || 'Stable';
      if (!statusFormatted) statusFormatted = 'Stable';

      // Profit
      let profitFormatted = rawProfit.trim() || '+$0';
      if (!profitFormatted.startsWith('+') && !profitFormatted.startsWith('-') && profitFormatted !== '$0') {
        const numProfit = parseFloat(profitFormatted.replace(/[^0-9.-]/g, ''));
        if (!isNaN(numProfit)) {
          profitFormatted = numProfit >= 0 ? `+$${numProfit.toLocaleString()}` : `-$${Math.abs(numProfit).toLocaleString()}`;
        } else {
          profitFormatted = '+$0';
        }
      }

      rows.push({
        id: `row-${index}-${Date.now()}`,
        season: rawSeason.trim(),
        crop: rawCrop.trim(),
        target: targetFormatted,
        actual: actualFormatted,
        status: statusFormatted,
        profit: profitFormatted,
        isValid,
        validationError,
        raw: rawRecord
      });
    });

    setParsedRows(rows);
  };

  // Handle Drag Events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    if (!file.name.match(/\.(csv|tsv|txt)$/i) && file.type !== 'text/csv' && file.type !== 'text/plain') {
      setErrorBanner('Please upload a valid CSV, TSV, or comma-separated text file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        processRawCsvContent(text, file.name, file.size);
      }
    };
    reader.onerror = () => {
      setErrorBanner('Failed to read file. Please verify file permissions.');
    };
    reader.readAsText(file);
  };

  // Download Sample CSV Template
  const handleDownloadSampleTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'claire_yield_logs_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Downloaded sample CSV template!', 'info');
  };

  // Load Sample Data directly into the parser
  const handleLoadSampleData = () => {
    processRawCsvContent(SAMPLE_CSV_CONTENT, 'sample_historical_yields.csv', SAMPLE_CSV_CONTENT.length);
    showToast('Loaded 6 sample agricultural yield records.', 'success');
  };

  // Manual Raw Text parse
  const handleParsePastedText = () => {
    if (!rawText.trim()) {
      setErrorBanner('Please paste spreadsheet rows or CSV text before clicking parse.');
      return;
    }
    processRawCsvContent(rawText, 'pasted_data.csv', rawText.length);
  };

  // Re-map column handler
  const handleMappingChange = (field: keyof typeof columnMapping, selectedHeader: string) => {
    const updated = { ...columnMapping, [field]: selectedHeader };
    setColumnMapping(updated);

    // Re-parse with updated mapping
    const lines = (rawText || SAMPLE_CSV_CONTENT).trim().split(/\r\n|\n|\r/).filter(Boolean);
    const delimiter = detectDelimiter(rawText || SAMPLE_CSV_CONTENT);
    generateParsedRows(lines.slice(1), headers, delimiter, updated);
  };

  // Remove single row from preview
  const handleRemoveRow = (rowId: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  // Clear all parsed state
  const handleReset = () => {
    setParsedRows([]);
    setHeaders([]);
    setFileName('');
    setFileSize(null);
    setRawText('');
    setErrorBanner(null);
  };

  // Final Commit Import Handler
  const handleCommitImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      showToast('No valid rows found to import. Please check your data.', 'error');
      return;
    }

    setIsSubmitting(true);
    setErrorBanner(null);

    const formattedPayload = validRows.map((r) => ({
      season: r.season,
      crop: r.crop,
      target: r.target,
      actual: r.actual,
      status: r.status,
      profit: r.profit
    }));

    try {
      if (userId) {
        const response = await fetch('/api/yield-logs/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId
          },
          body: JSON.stringify({
            logs: formattedPayload,
            mode: importMode
          })
        });

        const data = await response.json();
        if (data.success && data.logs) {
          onImportSuccess(data.logs, importMode);
          showToast(`Successfully bulk-imported ${data.logs.length} yield records to database!`, 'success');
          if (onClose) onClose();
          return;
        }
      }

      // Local / Offline fallback
      onImportSuccess(formattedPayload, importMode);
      showToast(`Imported ${formattedPayload.length} historical yield records!`, 'success');
      if (onClose) onClose();
    } catch (err) {
      console.error('Bulk import error:', err);
      // Fallback local update
      onImportSuccess(formattedPayload, importMode);
      showToast(`Imported ${formattedPayload.length} records in local session.`, 'info');
      if (onClose) onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div
      id="yield_csv_importer_container"
      className={`bg-white rounded-3xl border border-sky-100 shadow-xl overflow-hidden flex flex-col ${
        isInline ? 'w-full my-4 border-2 border-sky-200' : 'w-full max-w-4xl max-h-[85vh]'
      }`}
    >
      {/* Modal / Panel Header */}
      <div className="p-5 bg-gradient-to-r from-sky-50/80 via-white to-orange-50/40 border-b border-sky-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-800 text-base">Bulk Import Historical Yield Data</h3>
              <span className="text-[10px] bg-sky-100 text-sky-700 font-bold px-2 py-0.5 rounded-full font-mono">
                CSV / Spreadsheet
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Drag & drop spreadsheet data to populate multiple seasons, harvest goals, and profit records instantly.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadSampleTemplate}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-200 bg-white hover:bg-sky-50 text-sky-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Download CSV spreadsheet template"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sample Template</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        {/* Error Notification Banner */}
        {errorBanner && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{errorBanner}</span>
          </div>
        )}

        {/* STEP 1: Upload / Dropzone or Paste Mode (Visible when no parsed rows yet) */}
        {parsedRows.length === 0 ? (
          <div className="space-y-4">
            {/* Tab switchers: File Drag & Drop vs. Paste Raw CSV */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'upload' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Drag & Drop File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'paste' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Paste Spreadsheet Text</span>
                </button>
              </div>

              {/* Quick sample loader button */}
              <button
                type="button"
                onClick={handleLoadSampleData}
                className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-bold hover:underline cursor-pointer bg-orange-50 hover:bg-orange-100/70 border border-orange-200/60 px-3 py-1.5 rounded-xl transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>Try Sample Data</span>
              </button>
            </div>

            {activeTab === 'upload' ? (
              /* Drag and Drop Zone */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${
                  isDragging
                    ? 'border-sky-500 bg-sky-50/70 scale-[1.01]'
                    : 'border-slate-300 hover:border-sky-400 bg-slate-50/50 hover:bg-sky-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt,text/csv,text/plain"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-transform ${
                  isDragging ? 'bg-sky-500 text-white scale-110' : 'bg-sky-100 text-sky-600'
                }`}>
                  <Upload className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800">
                    {isDragging ? 'Drop your spreadsheet file here' : 'Click to browse or drag & drop CSV file here'}
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Accepts standard comma, tab, or semicolon-delimited CSV exports from Excel, Google Sheets, or farm ERPs.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <span className="text-[11px] bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg font-mono font-bold shadow-2xs">
                    .CSV
                  </span>
                  <span className="text-[11px] bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg font-mono font-bold shadow-2xs">
                    .TSV
                  </span>
                  <span className="text-[11px] bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg font-mono font-bold shadow-2xs">
                    Spreadsheet TXT
                  </span>
                </div>
              </div>
            ) : (
              /* Paste Raw Data Area */
              <div className="space-y-3">
                <textarea
                  rows={8}
                  placeholder={`Paste columns directly from Excel, Numbers, or CSV format:\nSeason,Crop,Target Yield,Actual Yield,Status,Profit\n2024 Autumn,Spring Wheat,4.8,4.6,Stable,+$1200\n2025 Summer,Roma Tomatoes,18.0,19.2,Optimal,+$3500`}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono text-slate-800 outline-none focus:border-sky-400 focus:bg-white transition-all shadow-inner resize-none"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleParsePastedText}
                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-sky-600/20 transition-all"
                  >
                    <span>Parse Table Data</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Helper notes card */}
            <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-2xl flex items-start gap-3 text-xs text-sky-900">
              <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Smart Column Auto-Detection</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Claire.ai automatically detects column names like <em>Season</em>, <em>Cultivar</em>, <em>Target Yield</em>, <em>Actual Yield</em>, <em>Status</em>, and <em>Profit</em>. Even if your spreadsheet headers vary, you can map them in the next step.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: Column Mapping & Live Data Verification Preview */
          <div className="space-y-6">
            
            {/* Header info badge & Reset button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{fileName || 'Parsed Data'}</span>
                    {fileSize && (
                      <span className="text-[10px] text-slate-400 font-mono">({Math.round(fileSize / 1024)} KB)</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Found <strong>{parsedRows.length}</strong> total row(s) &bull;{' '}
                    <strong className="text-emerald-600">{validCount} valid</strong>
                    {invalidCount > 0 && <strong className="text-amber-600"> &bull; {invalidCount} with notes</strong>}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Choose Another File</span>
                </button>
              </div>
            </div>

            {/* Column Mapping Section */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-500" />
                  Spreadsheet Column Mapping
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Verify detected header matches</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Season / Year *
                  </label>
                  <select
                    value={columnMapping.season}
                    onChange={(e) => handleMappingChange('season', e.target.value)}
                    className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs text-slate-700 font-bold outline-none focus:border-sky-400"
                  >
                    <option value="">-- Select Header --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Crop / Cultivar *
                  </label>
                  <select
                    value={columnMapping.crop}
                    onChange={(e) => handleMappingChange('crop', e.target.value)}
                    className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs text-slate-700 font-bold outline-none focus:border-sky-400"
                  >
                    <option value="">-- Select Header --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Target Yield (t/ha)
                  </label>
                  <select
                    value={columnMapping.target}
                    onChange={(e) => handleMappingChange('target', e.target.value)}
                    className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs text-slate-700 outline-none focus:border-sky-400"
                  >
                    <option value="">-- Optional / Default --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Actual Harvest *
                  </label>
                  <select
                    value={columnMapping.actual}
                    onChange={(e) => handleMappingChange('actual', e.target.value)}
                    className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs text-slate-700 font-bold outline-none focus:border-sky-400"
                  >
                    <option value="">-- Select Header --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Crop Status
                  </label>
                  <select
                    value={columnMapping.status}
                    onChange={(e) => handleMappingChange('status', e.target.value)}
                    className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs text-slate-700 outline-none focus:border-sky-400"
                  >
                    <option value="">-- Optional / Stable --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Net Profit / Loss
                  </label>
                  <select
                    value={columnMapping.profit}
                    onChange={(e) => handleMappingChange('profit', e.target.value)}
                    className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs text-slate-700 outline-none focus:border-sky-400"
                  >
                    <option value="">-- Optional / $0 --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Parsed Rows Preview Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Data Verification Preview ({parsedRows.length} Rows)
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Click trash to exclude any row</span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
                        <th className="py-2.5 px-3 w-8 text-center">Status</th>
                        <th className="py-2.5 px-3">Season</th>
                        <th className="py-2.5 px-3">Crop / Cultivar</th>
                        <th className="py-2.5 px-3 text-center">Target</th>
                        <th className="py-2.5 px-3 text-center">Actual Yield</th>
                        <th className="py-2.5 px-3 text-center">Condition</th>
                        <th className="py-2.5 px-3 text-right">Profit / Loss</th>
                        <th className="py-2.5 px-2 w-8 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {parsedRows.map((row) => (
                        <tr
                          key={row.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            !row.isValid ? 'bg-rose-50/50 text-rose-800' : 'text-slate-700'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            {row.isValid ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                            ) : (
                              <span title={row.validationError}>
                                <AlertTriangle className="w-4 h-4 text-rose-500 mx-auto" />
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">{row.season}</td>
                          <td className="py-2.5 px-3">{row.crop}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">{row.target}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600">{row.actual}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-100 text-slate-600">
                              {row.status}
                            </span>
                          </td>
                          <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                            row.profit.startsWith('+') ? 'text-emerald-600' : 'text-rose-500'
                          }`}>
                            {row.profit}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(row.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Exclude row"
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
            </div>

            {/* Import Options (Append vs. Replace) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-700 block">Database Synchronization Mode</span>
                <span className="text-[11px] text-slate-500">
                  Choose how imported records should interact with your current yield log history.
                </span>
              </div>

              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setImportMode('append')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    importMode === 'append' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Append Records
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    importMode === 'replace' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Replace All Existing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls / Commit Button */}
      {parsedRows.length > 0 && (
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Cancel / Clear
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={validCount === 0 || isSubmitting}
              onClick={handleCommitImport}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-sky-600/20 cursor-pointer transition-all"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Importing & Syncing Database...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>
                    Commit & Save {validCount} Yield {validCount === 1 ? 'Record' : 'Records'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
