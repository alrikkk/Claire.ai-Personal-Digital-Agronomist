import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Project, WeatherData, showToast, ApiProviderConfig } from './types';
import PersonalSetupGate from './components/PersonalSetupGate';
import OperationalProfile from './components/OperationalProfile';
import LiveFieldInsights from './components/LiveFieldInsights';
import CropPathologyScanner from './components/CropPathologyScanner';
import HistoricalYieldLogs from './components/HistoricalYieldLogs';
import SatelliteAndSoilAnalytics from './components/SatelliteAndSoilAnalytics';
import DigitalAgriNetwork from './components/DigitalAgriNetwork';
import ClaireAssistant from './components/ClaireAssistant';
import ToastContainer from './components/ToastNotification';
import { Settings, LogOut, Sprout, Shield, CloudSun, Leaf, Database, Sparkles, Folder, Sun, Moon, BookOpen, Key, Zap, Network, Layers, Sliders, Menu, PanelRightOpen } from 'lucide-react';
import AgronomyFAQModal from './components/AgronomyFAQModal';
import ApiProviderModal from './components/ApiProviderModal';
import SlideOutDashboard from './components/SlideOutDashboard';
import NotificationDropdown from './components/NotificationDropdown';
import SkyLoadingTransitionOverlay from './components/SkyLoadingTransitionOverlay';
import VertexAiDashboard from './components/VertexAiDashboard';
import { getSavedApiConfig, API_CONFIG_CHANGED_EVENT, PROVIDER_PRESETS } from './utils/apiConfig';

const PIXEL_LEAF_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="100%" height="100%" style="image-rendering:pixelated; shape-rendering:crispEdges;"><rect x="2" y="13" width="2" height="2" fill="%2378350F" /><rect x="3" y="12" width="2" height="2" fill="%2378350F" /><rect x="4" y="11" width="1" height="1" fill="%23065F46" /><rect x="5" y="10" width="1" height="1" fill="%23065F46" /><rect x="6" y="9" width="1" height="1" fill="%23065F46" /><rect x="7" y="8" width="1" height="1" fill="%23065F46" /><rect x="8" y="7" width="1" height="1" fill="%23065F46" /><rect x="9" y="6" width="1" height="1" fill="%23065F46" /><rect x="10" y="5" width="1" height="1" fill="%23065F46" /><rect x="11" y="4" width="1" height="1" fill="%23065F46" /><rect x="12" y="3" width="1" height="1" fill="%23065F46" /><rect x="13" y="2" width="1" height="1" fill="%23065F46" /><rect x="14" y="2" width="1" height="4" fill="%23047857" /><rect x="13" y="6" width="1" height="3" fill="%23047857" /><rect x="12" y="9" width="1" height="2" fill="%23047857" /><rect x="10" y="11" width="2" height="1" fill="%23047857" /><rect x="7" y="12" width="3" height="1" fill="%23047857" /><rect x="4" y="13" width="3" height="1" fill="%23047857" /><rect x="11" y="3" width="2" height="1" fill="%2310B981" /><rect x="10" y="4" width="2" height="1" fill="%2310B981" /><rect x="12" y="4" width="1" height="1" fill="%23059669" /><rect x="9" y="5" width="2" height="1" fill="%2310B981" /><rect x="11" y="5" width="2" height="1" fill="%23059669" /><rect x="7" y="6" width="2" height="1" fill="%2334D399" /><rect x="9" y="6" width="2" height="1" fill="%23FF7A59" /><rect x="11" y="6" width="2" height="1" fill="%23D97706" /><rect x="6" y="7" width="2" height="1" fill="%2334D399" /><rect x="8" y="7" width="2" height="1" fill="%23FF7A59" /><rect x="10" y="7" width="3" height="1" fill="%23D97706" /><rect x="5" y="8" width="2" height="1" fill="%23059669" /><rect x="7" y="8" width="2" height="1" fill="%23FF7A59" /><rect x="9" y="8" width="3" height="1" fill="%23D97706" /><rect x="4" y="9" width="2" height="1" fill="%23059669" /><rect x="6" y="9" width="2" height="1" fill="%23FF7A59" /><rect x="8" y="9" width="4" height="1" fill="%23B45309" /><rect x="4" y="10" width="2" height="1" fill="%23047857" /><rect x="6" y="10" width="4" height="1" fill="%23B45309" /><rect x="4" y="11" width="6" height="1" fill="%2378350F" /></svg>`;

export default function App() {
  // Authentication & session state
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'insights' | 'satellite_soil' | 'vertex_ai' | 'agri_network' | 'scanner' | 'logs' | 'indian_gov_sync'>('insights');
  const [weatherContext, setWeatherContext] = useState<WeatherData | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isSlideOutDashboardOpen, setIsSlideOutDashboardOpen] = useState(false);
  const [activeApiConfig, setActiveApiConfig] = useState<ApiProviderConfig | null>(getSavedApiConfig());
  const [activeLocation, setActiveLocation] = useState('Nairobi');
  const [isAppLoadingAfterSetup, setIsAppLoadingAfterSetup] = useState(false);

  // Listen to API config changes
  useEffect(() => {
    const handleConfigChange = (e: any) => {
      setActiveApiConfig(e.detail || getSavedApiConfig());
    };
    window.addEventListener(API_CONFIG_CHANGED_EVENT, handleConfigChange);
    return () => window.removeEventListener(API_CONFIG_CHANGED_EVENT, handleConfigChange);
  }, []);

  // Persistent dark mode state (React equivalent to st.session_state['dark_mode'])
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('claireai_dark_mode');
    return saved === 'true';
  });

  // Keep state synchronized with localStorage and document body classes for smooth CSS transitions
  useEffect(() => {
    localStorage.setItem('claireai_dark_mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // Lifted form states for settings stability
  const [settingsFullName, setSettingsFullName] = useState('');
  const [settingsEmail, setSettingsEmail] = useState('');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [settingsShowSettings, setSettingsShowSettings] = useState(false);
  const [settingsAvatarBase64, setSettingsAvatarBase64] = useState('');

  // Auto-sync form inputs when user state updates
  useEffect(() => {
    if (user) {
      setSettingsFullName(user.fullName || '');
      setSettingsEmail(user.email || '');
      setSettingsPhone(user.phone || '');
      setSettingsShowSettings(user.show_settings || false);
      setSettingsAvatarBase64(user.avatar_base64 || '');
    }
  }, [user]);

  // Attempt to restore user profile from local persistence on startup
  useEffect(() => {
    const savedUserId = localStorage.getItem('claireai_user_id');
    if (savedUserId) {
      fetchUserProfile(savedUserId);
    }
  }, []);

  // Fetch verified profile from SQLite/JSON database file on disk
  const fetchUserProfile = async (userId: string) => {
    try {
      const response = await fetch('/api/user/profile', {
        headers: { 'x-user-id': userId }
      });
      const data = await response.json();
      if (data.success && data.user.authenticated) {
        setUser(data.user);
        localStorage.setItem('claireai_user_id', data.user.id);
        localStorage.setItem('claireai_cached_user_' + userId, JSON.stringify(data.user));
        setIsSettingsOpen(data.user.show_settings);
        // Load user's projects too
        fetchUserProjects(data.user.id);
      } else {
        localStorage.removeItem('claireai_user_id');
      }
    } catch (err) {
      console.error('Failed to restore persistence session, looking up offline cache...', err);
      const cachedUserStr = localStorage.getItem('claireai_cached_user_' + userId);
      if (cachedUserStr) {
        try {
          const cachedUser = JSON.parse(cachedUserStr);
          setUser(cachedUser);
          setIsSettingsOpen(cachedUser.show_settings);
          showToast('Loaded profile from offline cache', 'info');
          // Try loading projects from cache
          const cachedProjectsStr = localStorage.getItem('claireai_projects_' + userId);
          if (cachedProjectsStr) {
            setProjects(JSON.parse(cachedProjectsStr));
          }
        } catch (e) {
          console.error('Failed to parse cached user profile', e);
        }
      }
    }
  };

  // Fetch list of projects folder records matching verified user ID
  const fetchUserProjects = async (userId: string) => {
    try {
      const response = await fetch('/api/projects', {
        headers: { 'x-user-id': userId }
      });
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
        localStorage.setItem('claireai_projects_' + userId, JSON.stringify(data.projects));
      }
    } catch (err) {
      console.error('Failed to load project folder directory, looking up offline cache...', err);
      const cachedProjectsStr = localStorage.getItem('claireai_projects_' + userId);
      if (cachedProjectsStr) {
        try {
          setProjects(JSON.parse(cachedProjectsStr));
          showToast('Loaded registered regions from offline cache', 'info');
        } catch (e) {
          console.error('Failed to parse cached projects list', e);
        }
      }
    }
  };

  // Handles successful sign-in transitions from gatekeeper modal
  const handleLoginSuccess = (authenticatedUser: User) => {
    setIsAppLoadingAfterSetup(true);
    setUser(authenticatedUser);
    localStorage.setItem('claireai_user_id', authenticatedUser.id);
    setIsSettingsOpen(authenticatedUser.show_settings);
    fetchUserProjects(authenticatedUser.id);
    showToast(`Welcome back, ${authenticatedUser.fullName}!`, 'success');

    // Smoothly dissolve the loading screen into the main app view
    setTimeout(() => {
      setIsAppLoadingAfterSetup(false);
    }, 450);
  };

  // Handle updates to profile fields synchronously inside state & db
  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    setIsSettingsOpen(updatedUser.show_settings);
    showToast('Operational profile updated successfully!', 'success');
  };

  // Safe destructive account drop - clear session logs instantly
  const handleDeleteAccountComplete = () => {
    setUser(null);
    setProjects([]);
    setWeatherContext(null);
    setIsSettingsOpen(false);
    localStorage.removeItem('claireai_user_id');
    showToast('Account credentials and records permanently deleted.', 'warning');
  };

  // Simple logout transition
  const handleLogout = () => {
    setUser(null);
    setProjects([]);
    setWeatherContext(null);
    setIsSettingsOpen(false);
    localStorage.removeItem('claireai_user_id');
    showToast('Signed out of agronomy workspace successfully.', 'info');
  };

  // Append newly created project straight to the display grid
  const handleProjectAdded = (newProject: Project) => {
    setProjects((prev) => {
      const updated = [newProject, ...prev];
      if (user?.id) {
        localStorage.setItem('claireai_projects_' + user.id, JSON.stringify(updated));
      }
      return updated;
    });
    // Auto switch active microclimate location
    setActiveLocation(newProject.location);
    setActiveTab('insights');
    showToast(`New parcel "${newProject.name}" registered!`, 'success');
  };

  // Remove deleted project from local state
  const handleProjectDeleted = (deletedProjectId: string) => {
    setProjects((prev) => {
      const updated = prev.filter(p => p.id !== deletedProjectId);
      if (user?.id) {
        localStorage.setItem('claireai_projects_' + user.id, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Helper when clicking quick select folder locations from historic yield logs
  const handleSelectLocation = (locationName: string) => {
    setActiveLocation(locationName);
    setActiveTab('insights');
    showToast(`Switched active workspace area to ${locationName}`, 'info');
  };

  const handleSelectCropImage = (imageUrl: string, fileName: string) => {
    sessionStorage.setItem('claireai_scanner_image', imageUrl);
    sessionStorage.setItem('claireai_scanner_mime', 'image/jpeg');
    sessionStorage.removeItem('claireai_scanner_report');
    sessionStorage.setItem('claireai_scanner_notes', `Imported from Google Drive file: ${fileName}`);
  };

  // Personal Workspace Lock Gate Check (Shown on initial run or when switching workspace)
  if (!user || !user.authenticated) {
    return <PersonalSetupGate onSetupComplete={handleLoginSuccess} />;
  }

  return (
    <div id="app_workspace" className={`min-h-screen bg-[#FAFAFA] text-slate-700 selection:bg-sky-100 selection:text-sky-900 flex flex-col font-sans transition-all duration-300 ease-in-out ${darkMode ? 'dark' : ''}`}>
      
      {/* Sky transition dissolve overlay when landing into main dashboard */}
      <SkyLoadingTransitionOverlay
        isVisible={isAppLoadingAfterSetup}
        statusText="Entering personal workspace dashboard..."
      />

      {/* Optimized Dark Mode Dynamic Style Overrides */}
      {darkMode && (
        <style dangerouslySetInnerHTML={{ __html: `
          /* Clean, Eye-Soothing Dark Theme */
          body, #app_workspace {
            background-color: #111418 !important;
            color: #e2e8f0 !important;
          }
          header {
            background-color: #181c24 !important;
            border-bottom-color: #272f3d !important;
            box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.4) !important;
          }
          .bg-white, [class*="bg-white"], div[class*="bg-white"] {
            background-color: #181c24 !important;
            border-color: #272f3d !important;
          }
          .bg-slate-50, .bg-slate-50\\/50, .bg-slate-50\\/30, .bg-slate-50\\/80, .bg-slate-50\\/40, .bg-slate-100 {
            background-color: #1e2430 !important;
            border-color: #2d3646 !important;
          }
          h1, h2, h3, h4, h5, h6, .font-bold, .font-extrabold, .text-slate-900, .text-slate-800 {
            color: #f8fafc !important;
          }
          .text-slate-700 {
            color: #e2e8f0 !important;
          }
          .text-slate-600, .text-slate-500, p, label, td, th {
            color: #cbd5e1 !important;
          }
          .text-slate-400 {
            color: #94a3b8 !important;
          }
          input, select, textarea {
            background-color: #141820 !important;
            color: #f8fafc !important;
            border-color: #2e3849 !important;
          }
          input::placeholder, textarea::placeholder {
            color: #64748b !important;
          }
          .border-sky-100, .border-sky-200, .border-sky-50, .border-slate-100, .border-slate-200, .border-slate-300 {
            border-color: #28303f !important;
          }
          .bg-sky-50, .bg-sky-50\\/50, .bg-sky-50\\/70, .bg-sky-50\\/80, .bg-sky-50\\/90, .bg-\\[\\#F0F9FF\\] {
            background-color: rgba(14, 165, 233, 0.12) !important;
            border-color: rgba(14, 165, 233, 0.3) !important;
          }
          .text-\\[\\#0EA5E9\\], .text-\\[\\#38BDF8\\], .text-sky-500, .text-sky-600 {
            color: #38bdf8 !important;
          }
          .bg-\\[\\#0EA5E9\\], .bg-sky-500, .from-sky-500, .to-\\[\\#38BDF8\\], .to-sky-400 {
            background-color: #0284c7 !important;
            color: #ffffff !important;
          }
          .bg-gradient-to-r, .bg-gradient-to-tr, .bg-gradient-to-br {
            background-image: linear-gradient(to right, #0284c7, #38bdf8) !important;
          }
          .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl {
            box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.5) !important;
          }
        ` }} />
      )}
      
      {/* Header element bar */}
      <header className="bg-white border-b border-sky-100 h-16 px-8 flex items-center justify-between shadow-sm sticky top-0 z-30 shrink-0">
        
        {/* Brand logo */}
        <div className="flex items-center gap-3">
          <img 
            src="https://squarespace-cdn.com" 
            alt="Claire Logo" 
            className="w-10 h-10 object-contain shrink-0 select-none"
            style={{ imageRendering: 'pixelated' }}
            onError={(e) => {
              e.currentTarget.src = PIXEL_LEAF_SVG;
            }}
          />
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-800 flex items-center gap-1.5">
              🌾 Claire.ai Dashboard
            </h1>
            <p className="text-[10px] text-sky-500 font-semibold uppercase tracking-widest">Digital Agronomist</p>
          </div>
        </div>

        {/* User state details, Notification Dropdown & Slide-out Action Dashboard Launcher */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Connected Custom API badge if active */}
          {activeApiConfig && activeApiConfig.isActive && (
            <button
              type="button"
              onClick={() => setIsApiModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 border border-sky-200 rounded-lg text-[11px] font-bold text-sky-600 hover:bg-sky-100 transition-all cursor-pointer"
              title="Custom API active - click to configure"
            >
              <Zap className="w-3 h-3 text-sky-500 fill-sky-400" />
              <span>{PROVIDER_PRESETS[activeApiConfig.provider]?.name || activeApiConfig.provider}</span>
            </button>
          )}

          {/* Notifications Dropdown Icon Button */}
          <NotificationDropdown />

          {/* Master Slide-Out Action Dashboard Toggle Button */}
          <button
            type="button"
            id="btn_open_slideout_dashboard"
            onClick={() => setIsSlideOutDashboardOpen(true)}
            className="group pl-2 pr-3 py-1.5 bg-white hover:bg-sky-50/70 border border-sky-200 hover:border-sky-300 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 flex items-center gap-3 cursor-pointer"
            title="Open Slide-Out Dashboard Hub (Settings, Theme, API Keys, Guide, Profile)"
          >
            {/* User profile picture */}
            <div className="w-8 h-8 rounded-xl border border-sky-200 overflow-hidden bg-sky-50 flex items-center justify-center shadow-inner shrink-0 group-hover:scale-105 transition-transform">
              {user.avatar_base64 ? (
                <img
                  src={user.avatar_base64}
                  alt="Active user avatar thumbnail"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[#0EA5E9] font-bold text-xs">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>

            {/* User name & farm preview */}
            <div className="flex flex-col text-left hidden sm:flex leading-tight">
              <span className="text-xs font-bold text-slate-800 truncate max-w-[110px] group-hover:text-sky-600 transition-colors">
                {user.fullName || 'Farmer'}
              </span>
              <span className="text-[9px] text-sky-500 font-semibold truncate max-w-[110px]">
                {user.farmName || 'Actions Hub'}
              </span>
            </div>

            {/* Animated Sliders / Dashboard Icon */}
            <div className="w-7 h-7 rounded-lg bg-sky-100/80 group-hover:bg-sky-500 text-sky-600 group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs">
              <Sliders className="w-3.5 h-3.5 transition-transform group-hover:rotate-90" />
            </div>
          </button>
        </div>

      </header>

      {/* Main split 65/35 workspace container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT WORKSPACE: 65% width representation (cols 1-8) */}
        <div id="main_content_area" className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* Interactive Multi-view Tabs header styled like Bento Grid */}
          <div className="bg-white border border-sky-100 p-1.5 rounded-2xl shadow-sm flex flex-wrap gap-1.5">
            <button
              id="tab_field_insights"
              type="button"
              onClick={() => setActiveTab('insights')}
              className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'insights'
                  ? 'bg-gradient-to-r from-sky-500 to-[#38BDF8] text-white shadow-md'
                  : 'text-slate-500 hover:text-sky-500 hover:bg-sky-50/50'
              }`}
            >
              <CloudSun className="w-3.5 h-3.5" />
              Live Insights
            </button>
            <button
              id="tab_satellite_soil"
              type="button"
              onClick={() => setActiveTab('satellite_soil')}
              className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'satellite_soil'
                  ? 'bg-gradient-to-r from-sky-500 to-[#38BDF8] text-white shadow-md'
                  : 'text-slate-500 hover:text-sky-500 hover:bg-sky-50/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Satellite & Soil
            </button>
            <button
              id="tab_vertex_ai"
              type="button"
              onClick={() => setActiveTab('vertex_ai')}
              className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'vertex_ai'
                  ? 'bg-gradient-to-r from-indigo-600 via-sky-500 to-[#38BDF8] text-white shadow-md'
                  : 'text-slate-500 hover:text-sky-500 hover:bg-sky-50/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-300 animate-pulse" />
              Vertex AI Hub
            </button>
            <button
              id="tab_agri_network"
              type="button"
              onClick={() => setActiveTab('agri_network')}
              className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'agri_network'
                  ? 'bg-gradient-to-r from-sky-500 to-[#38BDF8] text-white shadow-md'
                  : 'text-slate-500 hover:text-sky-500 hover:bg-sky-50/50'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              DPG Network
            </button>
            <button
              id="tab_pathology_scanner"
              type="button"
              onClick={() => setActiveTab('scanner')}
              className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'scanner'
                  ? 'bg-gradient-to-r from-sky-500 to-[#38BDF8] text-white shadow-md'
                  : 'text-slate-500 hover:text-sky-500 hover:bg-sky-50/50'
              }`}
            >
              <Leaf className="w-3.5 h-3.5" />
              Pathology Scan
            </button>
            <button
              id="tab_historical_logs"
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-gradient-to-r from-sky-500 to-[#38BDF8] text-white shadow-md'
                  : 'text-slate-500 hover:text-sky-500 hover:bg-sky-50/50'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Yield Logs
            </button>
            <button
              id="tab_gov_sync"
              type="button"
              onClick={() => setActiveTab('indian_gov_sync')}
              className={`flex-1 min-w-[125px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'indian_gov_sync'
                  ? 'bg-gradient-to-r from-sky-500 to-[#38BDF8] text-white shadow-md'
                  : 'text-slate-500 hover:text-sky-500 hover:bg-sky-50/50'
              }`}
              title="Indian Government Agri-Data Backup"
            >
              <Folder className="w-3.5 h-3.5" />
              Govt Data Sync
            </button>
          </div>

          {/* Active Tab contents inside a Bento Grid styled rounded-3xl container */}
          <div className="flex-1 bg-white border border-sky-100 p-8 rounded-3xl shadow-sm relative min-h-[480px] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 18, filter: 'blur(2px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -14, filter: 'blur(2px)' }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full"
              >
                {activeTab === 'insights' && (
                  <LiveFieldInsights
                    onWeatherDataFetched={setWeatherContext}
                    activeLocation={activeLocation}
                    projects={projects}
                    user={user}
                    onUpdateUser={handleUpdateUser}
                    onRefreshProjects={() => user && fetchUserProjects(user.id)}
                  />
                )}
                {activeTab === 'satellite_soil' && (
                  <SatelliteAndSoilAnalytics
                    user={user}
                    weatherContext={weatherContext}
                    activeLocation={activeLocation}
                  />
                )}
                {activeTab === 'vertex_ai' && (
                  <VertexAiDashboard darkMode={darkMode} />
                )}
                {activeTab === 'agri_network' && (
                  <DigitalAgriNetwork
                    user={user}
                    onSelectState={(stateName) => {
                      setActiveLocation(stateName);
                      setActiveTab('satellite_soil');
                    }}
                  />
                )}
                {activeTab === 'scanner' && (
                  <CropPathologyScanner 
                    onOpenApiSettings={() => setIsApiModalOpen(true)}
                  />
                )}
                {activeTab === 'logs' && (
                  <HistoricalYieldLogs
                    user={user}
                    projects={projects}
                    onProjectAdded={handleProjectAdded}
                    onProjectDeleted={handleProjectDeleted}
                    onSelectLocation={handleSelectLocation}
                  />
                )}
                {activeTab === 'indian_gov_sync' && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                      <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center">
                        <Database className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-800">Govt. of India Agri-Data Backup</h2>
                        <p className="text-sm text-slate-500">Securely sync your crop telemetry with National Agriculture Market (e-NAM) and Soil Health Card portal.</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-slate-800">e-NAM Yield Sync</h3>
                            <p className="text-xs text-slate-500">Push historical yield logs</p>
                          </div>
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">Connected</span>
                        </div>
                        <button className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors">
                          Sync Latest Logs
                        </button>
                      </div>
                      <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-slate-800">Soil Health Card Portal</h3>
                            <p className="text-xs text-slate-500">Backup soil test parameters</p>
                          </div>
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">Not Synced</span>
                        </div>
                        <button className="w-full py-2 bg-sky-50 text-sky-600 border border-sky-200 rounded-xl text-xs font-bold hover:bg-sky-100 transition-colors">
                          Authorize Backup
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>

        {/* RIGHT WORKSPACE: 35% width representation (cols 9-12) */}
        <div id="assistant_sidebar_area" className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-20">
          
          <div className="w-full h-[620px] max-h-[calc(100vh-6.5rem)]">
            <ClaireAssistant
              user={user}
              weatherContext={weatherContext}
              onOpenApiSettings={() => setIsApiModalOpen(true)}
            />
          </div>

          {/* Thin horizontal separator line and copyright notice footer */}
          <div className="pt-2 border-t border-slate-200/40 shrink-0">
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              © 2026 Claire.ai by Rajesh Pan. All Rights Reserved.
            </p>
          </div>

        </div>

      </main>

      {/* Footer copyright */}
      <footer className="bg-white border-t border-slate-100/80 py-4 px-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2 mt-auto">
        <div className="flex items-center gap-1">
          <Sprout className="w-3.5 h-3.5 text-emerald-500" />
          <span>Claire.ai Agronomist • Maximize Yield & Sustain Microclimates</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 font-semibold text-slate-500">
            <Shield className="w-3 h-3 text-[#0EA5E9]" />
            SQLite Persistent Rows Secured
          </span>
          <span>© 2026 Claire.ai Inc.</span>
        </div>
      </footer>

      {/* Real-time system toast alerts disabled per user request */}
      {/* <ToastContainer /> */}

      {/* Floating edge slide-out dashboard quick-trigger */}
      <motion.button
        type="button"
        id="btn_floating_dashboard_toggle"
        onClick={() => setIsSlideOutDashboardOpen(true)}
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileHover={{ x: -4 }}
        transition={{ duration: 0.2 }}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-gradient-to-l from-sky-500 to-[#38BDF8] text-white py-3 px-2 rounded-l-2xl shadow-xl hover:shadow-sky-500/25 border-y border-l border-white/20 flex flex-col items-center gap-1.5 cursor-pointer group transition-all"
        title="Open Action Dashboard (Tools, API, Theme, Settings, Knowledge Hub)"
      >
        <Sliders className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span className="text-[9px] font-extrabold uppercase tracking-widest [writing-mode:vertical-rl] rotate-180 select-none">
          Dashboard
        </span>
      </motion.button>

      {/* Slide-out Sidebar Dashboard */}
      <SlideOutDashboard
        isOpen={isSlideOutDashboardOpen}
        onClose={() => setIsSlideOutDashboardOpen(false)}
        user={user}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        activeApiConfig={activeApiConfig}
        onOpenApiSettings={() => setIsApiModalOpen(true)}
        onOpenFAQ={() => setIsFAQOpen(true)}
        onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
        isSettingsOpen={isSettingsOpen}
        onLogout={handleLogout}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        weatherContext={weatherContext}
        activeLocation={activeLocation}
        showToast={showToast}
      />

      {/* Farm & Operational Profile Settings Full Focus Modal */}
      <OperationalProfile
        isOpen={isSettingsOpen}
        user={user}
        onUpdateUser={handleUpdateUser}
        onDeleteAccount={handleDeleteAccountComplete}
        onClose={() => setIsSettingsOpen(false)}
        onOpenApiSettings={() => {
          setIsSettingsOpen(false);
          setIsApiModalOpen(true);
        }}
        onOpenGovtSync={() => {
          setIsSettingsOpen(false);
          setActiveTab('indian_gov_sync');
        }}
        fullName={settingsFullName}
        setFullName={setSettingsFullName}
        email={settingsEmail}
        setEmail={setSettingsEmail}
        phone={settingsPhone}
        setPhone={setSettingsPhone}
        showSettingsLocal={settingsShowSettings}
        setShowSettingsLocal={setSettingsShowSettings}
        avatarBase64={settingsAvatarBase64}
        setAvatarBase64={setSettingsAvatarBase64}
      />

      {/* Agronomy FAQ diagnostic guidelines searchable modal */}
      <AgronomyFAQModal isOpen={isFAQOpen} onClose={() => setIsFAQOpen(false)} />

      {/* Bring-Your-Own API Key & Provider Configuration Modal */}
      <ApiProviderModal 
        isOpen={isApiModalOpen} 
        onClose={() => setIsApiModalOpen(false)} 
        onConfigSaved={(config) => {
          setActiveApiConfig(config);
        }}
      />

    </div>
  );
}
