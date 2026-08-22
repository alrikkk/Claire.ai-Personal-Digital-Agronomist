import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Project, WeatherData, ApiProviderConfig } from '../types';
import { PROVIDER_PRESETS } from '../utils/apiConfig';
import {
  X,
  Settings,
  LogOut,
  Sun,
  Moon,
  BookOpen,
  Key,
  CloudSun,
  Leaf,
  Database,
  Folder,
  Shield,
  Zap,
  Network,
  Layers,
  ChevronRight,
  User as UserIcon,
  Activity,
  Sliders,
  CheckCircle2,
  Sparkles,
  MapPin,
  Cpu,
  RefreshCw,
  HardDrive
} from 'lucide-react';

interface SlideOutDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  activeApiConfig: ApiProviderConfig | null;
  onOpenApiSettings: () => void;
  onOpenFAQ: () => void;
  onToggleSettings: () => void;
  isSettingsOpen: boolean;
  onLogout: () => void;
  activeTab: 'insights' | 'satellite_soil' | 'vertex_ai' | 'agri_network' | 'scanner' | 'logs' | 'indian_gov_sync';
  onSelectTab: (tab: 'insights' | 'satellite_soil' | 'vertex_ai' | 'agri_network' | 'scanner' | 'logs' | 'indian_gov_sync') => void;
  weatherContext: WeatherData | null;
  activeLocation: string;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function SlideOutDashboard({
  isOpen,
  onClose,
  user,
  darkMode,
  setDarkMode,
  activeApiConfig,
  onOpenApiSettings,
  onOpenFAQ,
  onToggleSettings,
  isSettingsOpen,
  onLogout,
  activeTab,
  onSelectTab,
  weatherContext,
  activeLocation,
  showToast
}: SlideOutDashboardProps) {

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const activeProviderName = activeApiConfig?.isActive
    ? PROVIDER_PRESETS[activeApiConfig.provider]?.name || activeApiConfig.provider
    : 'Default (Gemini 2.5 Flash)';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop with smooth blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs cursor-pointer transition-opacity"
            aria-hidden="true"
          />

          {/* Slide-out Sidebar Panel */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10 pointer-events-none">
            <motion.div
              id="slide_out_dashboard_panel"
              initial={{ x: '100%', opacity: 0.6 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260, mass: 0.85 }}
              className="w-screen max-w-md pointer-events-auto bg-white border-l border-sky-100/80 shadow-2xl flex flex-col h-full overflow-hidden"
            >
              {/* Top Header Bar */}
              <div className="px-6 py-5 border-b border-sky-100 bg-gradient-to-r from-sky-50/70 via-white to-blue-50/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-[#38BDF8] flex items-center justify-center text-white shadow-sm shadow-sky-500/20">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
                      Control Hub & Actions
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">Quick controls & utilities</p>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn_close_slideout_dashboard"
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-slate-100/80 hover:bg-sky-100 text-slate-500 hover:text-sky-600 flex items-center justify-center transition-all cursor-pointer"
                  title="Close sidebar (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Dashboard Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-sky-200">
                
                {/* 1. User Profile & Farm Card */}
                <div className="bg-gradient-to-br from-sky-50/90 via-blue-50/40 to-white border border-sky-200/80 rounded-2xl p-4 shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-sky-200/30 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center gap-3.5 relative z-10">
                    <div className="w-12 h-12 rounded-2xl border-2 border-white overflow-hidden bg-sky-100 flex items-center justify-center shadow-md shrink-0">
                      {user.avatar_base64 ? (
                        <img
                          src={user.avatar_base64}
                          alt={user.fullName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[#0EA5E9] font-black text-lg">
                          {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-800 truncate">{user.fullName || 'Active Agronomist'}</h3>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-sky-600 font-semibold truncate">
                        {user.farmName ? `🌾 ${user.farmName}` : 'Operational Field'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {activeLocation || 'Primary Region'}
                      </p>
                    </div>
                  </div>

                  {/* Operational Telemetry Pill */}
                  <div className="mt-3 pt-3 border-t border-sky-200/50 flex items-center justify-between text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      <span className="font-mono font-medium text-slate-600">System Live Sync</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">SQLite Secured</span>
                  </div>
                </div>

                {/* 2. Primary Action Buttons Grid */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
                    System & Custom Utilities
                  </span>

                  {/* Connect API Key Action Card */}
                  <button
                    type="button"
                    id="drawer_btn_api_settings"
                    onClick={() => {
                      onOpenApiSettings();
                      onClose();
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                      activeApiConfig?.isActive
                        ? 'bg-sky-50/70 border-sky-300 hover:border-sky-400 hover:bg-sky-100/60 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-sky-200 hover:bg-sky-50/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        activeApiConfig?.isActive ? 'bg-sky-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600 group-hover:bg-sky-100 group-hover:text-sky-600'
                      }`}>
                        <Key className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800">AI Engine & API Keys</span>
                          {activeApiConfig?.isActive && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-100 text-sky-700">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {activeProviderName}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* Dark Mode / Classic Theme Switcher */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-sky-200 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        darkMode ? 'bg-sky-950/60 text-sky-400 border border-sky-800/40' : 'bg-sky-50 text-sky-500'
                      }`}>
                        {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800">Theme Appearance</span>
                        <p className="text-[11px] text-slate-500">
                          {darkMode ? 'Comfort Dark Mode' : 'Clean Light Mode'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="drawer_btn_toggle_dark_mode"
                      onClick={() => {
                        const nextMode = !darkMode;
                        setDarkMode(nextMode);
                        showToast(`Switched to ${nextMode ? 'Comfort Dark' : 'Clean Light'} Mode`, 'info');
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        darkMode ? 'bg-sky-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          darkMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Agronomy Guide / Diagnostic Guidelines */}
                  <button
                    type="button"
                    id="drawer_btn_agronomy_guide"
                    onClick={() => {
                      onOpenFAQ();
                      onClose();
                    }}
                    className="w-full text-left p-3.5 rounded-xl border border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/40 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-50 group-hover:bg-sky-100 text-[#0EA5E9] flex items-center justify-center transition-colors">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800">Agronomy Guide & FAQs</span>
                        <p className="text-[11px] text-slate-500">Field practices, disease protocols & tips</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* Farm Settings & Operational Profile */}
                  <button
                    type="button"
                    id="drawer_btn_farm_settings"
                    onClick={() => {
                      onToggleSettings();
                      onClose();
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                      isSettingsOpen
                        ? 'bg-sky-50/80 border-sky-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-sky-200 hover:bg-sky-50/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-sky-100 text-slate-600 group-hover:text-sky-600 flex items-center justify-center transition-colors">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800">Farm & Profile Settings</span>
                        <p className="text-[11px] text-slate-500">Soil profile, notifications & farm info</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>

                {/* 3. Fast Workspace Views Navigation */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
                    Workspace Navigation
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab('insights');
                        onClose();
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        activeTab === 'insights'
                          ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-sky-200 hover:bg-sky-50/40'
                      }`}
                    >
                      <CloudSun className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-bold truncate">Live Insights</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab('satellite_soil');
                        onClose();
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        activeTab === 'satellite_soil'
                          ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-sky-200 hover:bg-sky-50/40'
                      }`}
                    >
                      <Layers className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-bold truncate">Satellite & Soil</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab('vertex_ai');
                        onClose();
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        activeTab === 'vertex_ai'
                          ? 'bg-gradient-to-r from-indigo-600 to-sky-500 text-white border-indigo-600 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-sky-200 hover:bg-sky-50/40'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-sky-300 shrink-0 animate-pulse" />
                      <span className="text-xs font-bold truncate">Vertex AI Hub</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab('agri_network');
                        onClose();
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        activeTab === 'agri_network'
                          ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-sky-200 hover:bg-sky-50/40'
                      }`}
                    >
                      <Network className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-bold truncate">DPG Network</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab('scanner');
                        onClose();
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        activeTab === 'scanner'
                          ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-sky-200 hover:bg-sky-50/40'
                      }`}
                    >
                      <Leaf className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-bold truncate">Pathology Scan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab('logs');
                        onClose();
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        activeTab === 'logs'
                          ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-sky-200 hover:bg-sky-50/40'
                      }`}
                    >
                      <Database className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-bold truncate">Yield Logs</span>
                    </button>

                    <button
                      type="button"
                      id="drawer_tab_gov_sync"
                      onClick={() => {
                        onSelectTab('indian_gov_sync');
                        onClose();
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        activeTab === 'indian_gov_sync'
                          ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-sky-200 hover:bg-sky-50/40'
                      }`}
                      title="Govt Data Sync"
                    >
                      <Folder className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-bold truncate">Govt Data Sync</span>
                    </button>
                  </div>
                </div>

                {/* 4. Workspace Security / Switch Account */}
                <div className="pt-2">
                  <button
                    type="button"
                    id="drawer_btn_logout"
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
                    className="w-full py-3 px-4 rounded-xl border border-rose-200/80 bg-rose-50/50 hover:bg-rose-100/70 text-rose-700 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Lock Workspace / Switch Profile</span>
                  </button>
                </div>

              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-sky-100 bg-slate-50/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>Claire.ai Agronomy Hub</span>
                <span className="font-mono text-[10px]">v2.6 Precision DPG</span>
              </div>

            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
