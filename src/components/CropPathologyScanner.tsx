import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileImage, ShieldAlert, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { showToast } from '../types';

// Sample leaf presets for easy demonstration
const LEAF_PRESETS = [
  {
    name: "Tomato Early Blight",
    img: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=200&auto=format&fit=crop&q=80",
    desc: "Specimen with brown circles and concentric ring lesions.",
    mimeType: "image/jpeg"
  },
  {
    name: "Corn Common Rust",
    img: "https://images.unsplash.com/photo-1529429617124-95b109e86bb8?w=200&auto=format&fit=crop&q=80",
    desc: "Elongated golden-brown powdery pustules on foliage leaf surface.",
    mimeType: "image/jpeg"
  },
  {
    name: "Wheat Powdery Mildew",
    img: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200&auto=format&fit=crop&q=80",
    desc: "Specimen detailing white-to-grey powdery fungal growth patch.",
    mimeType: "image/jpeg"
  }
];

export default function CropPathologyScanner() {
  const [selectedImage, setSelectedImage] = useState<string | null>(() => {
    return sessionStorage.getItem('claireai_scanner_image');
  });
  const [imageMimeType, setImageMimeType] = useState<string>(() => {
    return sessionStorage.getItem('claireai_scanner_mime') || 'image/jpeg';
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reportText, setReportText] = useState<string | null>(() => {
    return sessionStorage.getItem('claireai_scanner_report');
  });
  const [labNotes, setLabNotes] = useState<string>(() => {
    return sessionStorage.getItem('claireai_scanner_notes') || '';
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save mechanism targeting session storage
  useEffect(() => {
    setSaveStatus('saving');
    
    if (selectedImage !== null) {
      sessionStorage.setItem('claireai_scanner_image', selectedImage);
    } else {
      sessionStorage.removeItem('claireai_scanner_image');
    }
    
    sessionStorage.setItem('claireai_scanner_mime', imageMimeType);
    
    if (reportText !== null) {
      sessionStorage.setItem('claireai_scanner_report', reportText);
    } else {
      sessionStorage.removeItem('claireai_scanner_report');
    }
    
    sessionStorage.setItem('claireai_scanner_notes', labNotes);
    
    const timer = setTimeout(() => {
      setSaveStatus('saved');
    }, 500);
    
    return () => clearTimeout(timer);
  }, [selectedImage, imageMimeType, reportText, labNotes]);

  // Convert File to Base64
  const processFile = (file: File) => {
    if (!file.type.match('image.*')) {
      setErrorMsg('Invalid file format. Please upload a plant foliage image.');
      showToast('Invalid file format. Please upload an image.', 'error');
      return;
    }
    setErrorMsg('');
    setImageMimeType(file.type);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setReportText(null);
      showToast('Specimen image uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Click handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Select leaf preset
  const handleSelectPreset = async (presetUrl: string, name: string) => {
    setErrorMsg('');
    setIsLoading(true);
    setReportText(null);
    try {
      // Fetch preset image and convert to base64
      const response = await fetch(presetUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setImageMimeType(blob.type || 'image/jpeg');
        setIsLoading(false);
        showToast(`Loaded preset specimen: ${name}`, 'info');
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      setErrorMsg(`Failed to load preset specimen. Please try uploading manually.`);
      setIsLoading(false);
      showToast('Failed to load preset specimen.', 'error');
    }
  };

  // Trigger Gemini Multimodal vision pathology scan
  const handleTriggerAnalysis = async () => {
    if (!selectedImage) return;
    setIsLoading(true);
    setErrorMsg('');
    showToast('Starting AI foliage pathology analysis...', 'info');
    try {
      const response = await fetch('/api/scanner/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: imageMimeType
        })
      });
      const data = await response.json();
      if (data.success) {
        setReportText(data.report);
        showToast('AI Foliage Pathology scan completed!', 'success');
      } else {
        const errStr = data.error || 'Pathology scanning session failed.';
        setErrorMsg(errStr);
        showToast(errStr, 'error');
      }
    } catch (err) {
      setErrorMsg('Network timeout or proxy connectivity fault.');
      showToast('Network timeout. Scanning failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Parse markdown into clean elements manually to avoid react-markdown bugs
  const renderFormattedReport = (markdown: string) => {
    const sections = markdown.split(/(?=###\s+)/);
    
    return (
      <div className="space-y-6">
        {sections.map((section, idx) => {
          const lines = section.trim().split('\n');
          const header = lines[0].replace(/###\s+/, '').trim();
          const contentLines = lines.slice(1);

          if (!header) return null;

          return (
            <div key={idx} className="bg-white border border-orange-100 rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2 border-b border-slate-50 pb-2">
                <Sparkles className="w-4 h-4 text-[#FF7A59]" />
                {header}
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                {contentLines.map((line, lIdx) => {
                  const cleanedLine = line.trim();
                  if (!cleanedLine) return null;
                  
                  // If bullet point
                  if (cleanedLine.startsWith('-') || cleanedLine.startsWith('*')) {
                    const cleanText = cleanedLine.replace(/^[-*]\s*/, '');
                    // Check bold labels (e.g., **Crop Type**: Tomato)
                    const boldMatch = cleanText.match(/^\*\*(.*?)\*\*:(.*)/);
                    if (boldMatch) {
                      return (
                        <li key={lIdx} className="flex gap-2">
                          <span className="text-[#FF7A59] select-none">•</span>
                          <span>
                            <strong className="text-slate-800 font-bold">{boldMatch[1]}:</strong>
                            {boldMatch[2]}
                          </span>
                        </li>
                      );
                    }
                    return (
                      <li key={lIdx} className="flex gap-2">
                        <span className="text-[#FF7A59] select-none">•</span>
                        <span>{cleanText}</span>
                      </li>
                    );
                  }
                  return <p key={lIdx} className="pl-3 text-slate-500 leading-relaxed">{cleanedLine}</p>;
                })}
              </ul>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div id="crop_pathology_scanner" className="-m-8 flex flex-col min-h-[480px]">
      
      {/* Bento Header Bar */}
      <div className="p-6 border-b border-orange-50 flex items-center justify-between bg-gradient-to-r from-white to-orange-50/30 rounded-t-3xl shrink-0 no-print">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <span className="text-orange-500 text-lg">🔬</span> Crop Pathology Scanner
        </h3>
        <span className="text-[10px] bg-white border border-slate-200 px-2.5 py-1 rounded-md text-slate-500 uppercase tracking-widest font-bold">AI Vision Active</span>
      </div>

      <div className="p-8 space-y-6 flex-1 overflow-y-auto">
        
        {/* Selector Container */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${reportText ? 'print:hidden' : ''}`}>
          
          {/* Specimen Ingestion Module */}
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Specimen Ingestion Console</span>
            
            <div
              id="drag_drop_zone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-[#FF7A59] bg-orange-50/40'
                  : selectedImage
                  ? 'border-orange-200 bg-[#FAFAFA]'
                  : 'border-slate-200 hover:border-orange-200 hover:bg-slate-50/50'
              }`}
            >
              {selectedImage ? (
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl">
                  <img
                    src={selectedImage}
                    alt="Foliage specimen preview"
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(null);
                      setReportText(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Clear Specimen
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-[#FF7A59]">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-700">Drag leaf image here, or browse files</p>
                    <p className="text-xs text-slate-400">Accepts .jpg, .png foliage photos under 2MB</p>
                  </div>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/jpg"
              className="hidden"
            />

            {/* Trigger scan action buttons */}
            {selectedImage && (
              <button
                id="btn_trigger_pathology_scan"
                type="button"
                onClick={handleTriggerAnalysis}
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-orange-400 to-[#FF7A59] hover:opacity-95 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing Cellular Leaf Tissue...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Execute Pathology Vision Scan
                  </>
                )}
              </button>
            )}
          </div>

          {/* Specimen Presets Module */}
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Specimen Preset Catalog (Sandbox Demonstrations)</span>
            
            <div className="space-y-3">
              {LEAF_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  id={`btn_preset_${idx}`}
                  onClick={() => handleSelectPreset(preset.img, preset.name)}
                  disabled={isLoading}
                  className="w-full text-left p-3.5 bg-white border border-slate-100 rounded-xl flex items-center gap-4 hover:border-orange-100 hover:bg-orange-50/10 active:bg-orange-50/20 cursor-pointer transition-all"
                >
                  <img
                    src={preset.img}
                    alt={preset.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 object-cover rounded-lg shrink-0 border border-slate-100"
                  />
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">{preset.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{preset.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}
          </div>

        </div>

        {/* Lab Notes & Personal Assessment Card */}
        <div className="bg-white border border-orange-100 p-5 rounded-2xl shadow-sm space-y-4 hover:border-orange-200 transition-colors no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-50 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">📝</span>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Interactive Lab Notes & Assessment Notebook
              </h4>
            </div>
            
            {/* Auto-save Status Badge */}
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' ? (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                  Saving Draft...
                </div>
              ) : saveStatus === 'saved' && (labNotes || selectedImage || reportText) ? (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Draft Auto-Saved to Session
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 font-mono">
                  Session Sandbox Ready
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setLabNotes(prev => prev + (prev ? '\n' : '') + `[${new Date().toLocaleTimeString()}] OBSERVATION: Leaf necrosis detected around margin, showing concentric lesions. Hydration index: Medium.`)}
                className="px-2.5 py-1 bg-slate-50 hover:bg-orange-50 text-[10px] font-semibold text-slate-600 hover:text-orange-600 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                + Add Specimen Observation
              </button>
              <button
                type="button"
                onClick={() => setLabNotes(prev => prev + (prev ? '\n' : '') + `[${new Date().toLocaleTimeString()}] INTERVENTION PLAN:\n- Adjust irrigation by -10%.\n- Apply organic copper-based fungicide.\n- Monitor progression over 72 hours.`)}
                className="px-2.5 py-1 bg-slate-50 hover:bg-orange-50 text-[10px] font-semibold text-slate-600 hover:text-orange-600 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                + Insert Intervention Plan
              </button>
              {labNotes && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear your local notes?')) {
                      setLabNotes('');
                    }
                  }}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-[10px] font-semibold text-rose-600 rounded-lg border border-rose-100 transition-colors cursor-pointer ml-auto"
                >
                  Clear Notes
                </button>
              )}
            </div>

            <textarea
              id="lab_notes_textarea"
              value={labNotes}
              onChange={(e) => setLabNotes(e.target.value)}
              placeholder="Document specific environmental indicators, plant species, visual symptoms, soil wetness, or manual diagnostic findings here. Your notes and scan results will automatically save as you type so you never lose your progress..."
              className="w-full min-h-[120px] p-4 text-xs font-sans text-slate-700 bg-[#FAFAFA] border border-orange-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-300 focus:border-orange-300 transition-all leading-relaxed resize-y"
            />
          </div>
        </div>

        {/* Lab Results / Markdown Display with Exit/Enter Animations */}
        <AnimatePresence>
          {reportText && (
            <motion.div
              id="lab_diagnostics_report"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              {/* Print-only elegant header */}
              <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-6">
                <h1 className="text-xl font-bold text-slate-900">Claire.ai Crop Pathology Diagnostic Assessment</h1>
                <p className="text-[10px] text-slate-500 mt-1">
                  Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()} • Verified Digital Agronomist Report
                </p>
              </div>

              <div className="flex items-center justify-between no-print">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Automated Lab Analysis Report</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-orange-50 text-orange-600 border border-orange-200 rounded-xl text-xs font-bold cursor-pointer shadow-sm transition-colors"
                  >
                    🖨️ Print Report
                  </button>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    Diagnostic Complete
                  </div>
                </div>
              </div>

              {renderFormattedReport(reportText)}

              {/* Printable integrated notes block */}
              {labNotes && (
                <div className="bg-orange-50/20 border border-orange-100 rounded-2xl p-5 space-y-2 mt-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-orange-100/50">
                    <span>📝</span> Field Specialist Notes & Local Observations
                  </h4>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {labNotes}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}
