import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Project, WeatherData, showToast } from './types';
import LoginGate from './components/LoginGate';
import OperationalProfile from './components/OperationalProfile';
import LiveFieldInsights from './components/LiveFieldInsights';
import CropPathologyScanner from './components/CropPathologyScanner';
import HistoricalYieldLogs from './components/HistoricalYieldLogs';
import ClaireAssistant from './components/ClaireAssistant';
import ToastContainer from './components/ToastNotification';
import { Settings, LogOut, Sprout, Shield, CloudSun, Leaf, Database, Sparkles, Folder, Sun, Moon, BookOpen } from 'lucide-react';
import AgronomyFAQModal from './components/AgronomyFAQModal';
import GoogleDriveExplorer from './components/GoogleDriveExplorer';
import { initAuth } from './lib/googleAuth';

const PIXEL_LEAF_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="100%" height="100%" style="image-rendering:pixelated; shape-rendering:crispEdges;"><rect x="2" y="13" width="2" height="2" fill="%2378350F" /><rect x="3" y="12" width="2" height="2" fill="%2378350F" /><rect x="4" y="11" width="1" height="1" fill="%23065F46" /><rect x="5" y="10" width="1" height="1" fill="%23065F46" /><rect x="6" y="9" width="1" height="1" fill="%23065F46" /><rect x="7" y="8" width="1" height="1" fill="%23065F46" /><rect x="8" y="7" width="1" height="1" fill="%23065F46" /><rect x="9" y="6" width="1" height="1" fill="%23065F46" /><rect x="10" y="5" width="1" height="1" fill="%23065F46" /><rect x="11" y="4" width="1" height="1" fill="%23065F46" /><rect x="12" y="3" width="1" height="1" fill="%23065F46" /><rect x="13" y="2" width="1" height="1" fill="%23065F46" /><rect x="14" y="2" width="1" height="4" fill="%23047857" /><rect x="13" y="6" width="1" height="3" fill="%23047857" /><rect x="12" y="9" width="1" height="2" fill="%23047857" /><rect x="10" y="11" width="2" height="1" fill="%23047857" /><rect x="7" y="12" width="3" height="1" fill="%23047857" /><rect x="4" y="13" width="3" height="1" fill="%23047857" /><rect x="11" y="3" width="2" height="1" fill="%2310B981" /><rect x="10" y="4" width="2" height="1" fill="%2310B981" /><rect x="12" y="4" width="1" height="1" fill="%23059669" /><rect x="9" y="5" width="2" height="1" fill="%2310B981" /><rect x="11" y="5" width="2" height="1" fill="%23059669" /><rect x="7" y="6" width="2" height="1" fill="%2334D399" /><rect x="9" y="6" width="2" height="1" fill="%23FF7A59" /><rect x="11" y="6" width="2" height="1" fill="%23D97706" /><rect x="6" y="7" width="2" height="1" fill="%2334D399" /><rect x="8" y="7" width="2" height="1" fill="%23FF7A59" /><rect x="10" y="7" width="3" height="1" fill="%23D97706" /><rect x="5" y="8" width="2" height="1" fill="%23059669" /><rect x="7" y="8" width="2" height="1" fill="%23FF7A59" /><rect x="9" y="8" width="3" height="1" fill="%23D97706" /><rect x="4" y="9" width="2" height="1" fill="%23059669" /><rect x="6" y="9" width="2" height="1" fill="%23FF7A59" /><rect x="8" y="9" width="4" height="1" fill="%23B45309" /><rect x="4" y="10" width="2" height="1" fill="%23047857" /><rect x="6" y="10" width="4" height="1" fill="%23B45309" /><rect x="4" y="11" width="6" height="1" fill="%2378350F" /></svg>`;

export default function App() {
  // Authentication & session state
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'insights' | 'scanner' | 'logs' | 'google_drive'>('insights');
  const [weatherContext, setWeatherContext] = useState<WeatherData | null>(null);

  // Initialize Google Auth token observer on startup
  useEffect(() => {
    initAuth();
  }, []);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const [activeLocation, setActiveLocation] = useState('Nairobi');

  // Persistent dark mode state (React equivalent to st.session_state['dark_mode'])
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('claireai_dark_mode');
    return saved === 'true';
  });

  // Keep state synchronized with localStorage
  useEffect(() => {
    localStorage.setItem('claireai_dark_mode', String(darkMode));
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
    setUser(authenticatedUser);
    localStorage.setItem('claireai_user_id', authenticatedUser.id);
    setIsSettingsOpen(authenticatedUser.show_settings);
    fetchUserProjects(authenticatedUser.id);
    showToast(`Welcome back, ${authenticatedUser.fullName}!`, 'success');
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

  // Lock Gate Check
  if (!user || !user.authenticated) {
    return <LoginGate onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div id="app_workspace" className="min-h-screen bg-[#FAFAFA] text-slate-700 selection:bg-orange-100 selection:text-orange-900 flex flex-col font-sans">
      
      {/* Dynamic override block for Apple-inspired minimalist Dark Mode layout */}
      {darkMode && (
        <style dangerouslySetInnerHTML={{ __html: `
          /* Premium Cold Blue Dark Mode styling */
          body, #app_workspace {
            background-color: #050a18 !important; /* Rich deep cold space blue-black */
            color: #f1f5f9 !important; /* Clear ice slate white */
          }
          /* Header styled as a clean cold blue block */
          header {
            background-color: #0b132b !important;
            border-bottom-color: #1e3a8a !important;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4) !important;
          }
          /* Card components and inner panels in cold slate-blue layers */
          .bg-white, [class*="bg-white"], div[class*="bg-white"] {
            background-color: #0f1c3f !important; /* Custom deep arctic blue card body */
            border-color: #1e3a8a !important;
          }
          .bg-slate-50, .bg-slate-50\\/50, .bg-slate-50\\/30, .bg-slate-50\\/80 {
            background-color: #091226 !important; /* Steel-blue inner panels */
          }
          /* Text visibility guaranteed overrides */
          h1, h2, h3, h4, h5, h6, .font-bold, .font-extrabold, .text-slate-900, .text-slate-800, .text-slate-700 {
            color: #f8fafc !important; /* Bright crisp display white */
          }
          .text-slate-600, .text-slate-500, .text-slate-400, p, span:not(.text-white):not(.text-emerald-500):not(.text-rose-500):not(.text-amber-500):not(.text-emerald-400):not(.text-rose-400):not(.text-red-400), li, label, td, th {
            color: #cbd5e1 !important; /* Highly legible pale steel blue-grey */
          }
          /* Form controls and input frames */
          input, select, textarea {
            background-color: #050a18 !important;
            color: #ffffff !important;
            border-color: #1e3a8a !important;
          }
          input::placeholder, textarea::placeholder {
            color: #475569 !important;
          }
          /* Cold steel blue border replacements for warm or light outlines */
          .border-orange-100, .border-orange-200, .border-orange-50, .border-slate-100, .border-slate-200, .border-slate-300 {
            border-color: #1e3a8a !important;
          }
          /* Custom interactive control buttons */
          #btn_toggle_settings, #btn_logout, #btn_gps_location, #btn_toggle_faq {
            background-color: #111a2e !important;
            color: #f1f5f9 !important;
            border-color: #1e3a8a !important;
          }
          #btn_toggle_settings:hover, #btn_logout:hover, #btn_gps_location:hover, #btn_toggle_faq:hover {
            background-color: #1a2a47 !important;
          }
          /* Active navigation tabs inside cold blue dark mode */
          .bg-orange-50 {
            background-color: #1e3a8a !important; /* Deep cobalt blue active highlights */
            color: #38bdf8 !important; /* Bright cyber sky blue */
          }
          /* Chat and assistant panel specific overrides */
          .bg-\\[\\#FFF8F6\\] {
            background-color: #0b132b !important;
            border-color: #1e3a8a !important;
          }
          /* Override orange and warm indicators to vibrant cool cyber blue */
          .text-\\[\\#FF7A59\\], .text-orange-600, .text-orange-500, .text-orange-400, .text-amber-500 {
            color: #38bdf8 !important; /* High contrast sky blue instead of dull orange */
          }
          .bg-\\[\\#FF7A59\\], .bg-orange-400, .bg-orange-500, .from-orange-400, .to-\\[\\#FF7A59\\] {
            background-image: none !important;
            background-color: #2563eb !important; /* Radiant primary blue buttons */
            color: #ffffff !important;
          }
          .bg-gradient-to-r, .bg-gradient-to-tr, .bg-gradient-to-br {
            background-image: linear-gradient(to right, #1d4ed8, #3b82f6) !important;
          }
          .shadow-orange-100, .shadow-orange-100\\/40 {
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15) !important;
          }
          /* Custom card panels inside insights */
          .from-white {
            --tw-gradient-from: #0f1c3f !important;
          }
          .to-orange-50\\/30 {
            --tw-gradient-to: #091226 !important;
          }
          /* Shadows adjustments for deep navy layouts */
          .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl {
            box-shadow: 0 10px 15px -3px rgba(3, 7, 18, 0.6), 0 4px 6px -2px rgba(3, 7, 18, 0.4) !important;
          }
          /* Active locations list list-items background */
          button.bg-white {
            background-color: #0f1c3f !important;
          }
          button.bg-white:hover {
            background-color: #1a2a47 !important;
          }
          /* Leaf icon SVG custom colors */
          svg rect {
            /* Keep colored pixels visible or tintable */
          }
        ` }} />
      )}
      
      {/* Header element bar */}
      <header className="bg-white border-b border-orange-100 h-16 px-8 flex items-center justify-between shadow-sm sticky top-0 z-30 shrink-0">
        
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
            <p className="text-[10px] text-orange-500 font-semibold uppercase tracking-widest">Digital Agronomist</p>
          </div>
        </div>

        {/* User state details & picture circular clip */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-tighter">System Database Sync</span>
          </div>

          {/* Dark Mode Toggle Switch column */}
          <button
            type="button"
            id="btn_toggle_dark_mode"
            onClick={() => {
              const nextMode = !darkMode;
              setDarkMode(nextMode);
              showToast(`Switched to ${nextMode ? 'Dark Obsidian' : 'Classic Warm'} Mode`, 'info');
            }}
            className={`w-9 h-9 border rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 relative group overflow-hidden ${
              darkMode 
                ? 'bg-neutral-800 text-amber-400 border-amber-500/30 hover:border-amber-400/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]' 
                : 'bg-white text-slate-500 border-orange-100 hover:bg-orange-50/50 hover:text-orange-500 hover:border-orange-200'
            }`}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <motion.div
              initial={false}
              animate={{ rotate: darkMode ? 360 : 0, scale: darkMode ? 0 : 1 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={`absolute flex items-center justify-center ${darkMode ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
            >
              <Sun className="w-4 h-4 text-orange-500" />
            </motion.div>
            
            <motion.div
              initial={false}
              animate={{ rotate: darkMode ? 0 : -360, scale: darkMode ? 1 : 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={`absolute flex items-center justify-center ${!darkMode ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
            >
              <Moon className="w-4 h-4 text-amber-300 fill-amber-300" />
            </motion.div>
          </button>

          <button
            type="button"
            id="btn_toggle_faq"
            onClick={() => setIsFAQOpen(true)}
            className={`h-9 px-3.5 border border-orange-100 rounded-xl flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors ${
              isFAQOpen 
                ? 'bg-orange-50 text-[#FF7A59] border-orange-200' 
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#FF7A59]" />
            <span>Agronomy Guide</span>
          </button>

          <button
            type="button"
            id="btn_toggle_settings"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`h-9 px-3.5 border border-orange-100 rounded-xl flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors ${
              isSettingsOpen 
                ? 'bg-orange-50 text-[#FF7A59] border-orange-200' 
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          <button
            type="button"
            id="btn_logout"
            onClick={handleLogout}
            className="h-9 px-3 bg-white hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 rounded-xl flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>

          {/* User profile picture thumbnail styled beautifully */}
          <div className="flex items-center gap-3 bg-white border border-orange-200 pl-4 pr-1 py-1 rounded-full">
            <span className="text-xs font-bold text-slate-700 hidden sm:inline">{user.fullName}</span>
            <div className="w-8 h-8 rounded-full border border-orange-200 overflow-hidden bg-orange-50/50 flex items-center justify-center shadow-inner shrink-0">
              {user.avatar_base64 ? (
                <img
                  src={user.avatar_base64}
                  alt="Active user avatar thumbnail"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[#FF7A59] font-bold text-xs">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>
          </div>
        </div>

      </header>

      {/* Main split 65/35 workspace container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT WORKSPACE: 65% width representation (cols 1-8) */}
        <div id="main_content_area" className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* Settings Drawer embedded permanently if show_settings is true, otherwise collapsable overlay */}
          {isSettingsOpen && (user.show_settings) && (
            <div className="transition-all">
              <OperationalProfile
                user={user}
                onUpdateUser={handleUpdateUser}
                onDeleteAccount={handleDeleteAccountComplete}
                onClose={() => setIsSettingsOpen(false)}
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
            </div>
          )}

          {/* Interactive Multi-view Tabs header styled like Bento Grid */}
          <div className="bg-white border border-orange-100 p-1 rounded-xl shadow-sm flex flex-wrap gap-1">
            <button
              id="tab_field_insights"
              type="button"
              onClick={() => setActiveTab('insights')}
              className={`flex-1 py-2 px-6 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'insights'
                  ? 'bg-gradient-to-r from-orange-400 to-[#FF7A59] text-white shadow-md'
                  : 'text-slate-500 hover:text-orange-500 hover:bg-slate-50/50'
              }`}
            >
              <CloudSun className="w-4 h-4" />
              Live Field Insights
            </button>
            <button
              id="tab_pathology_scanner"
              type="button"
              onClick={() => setActiveTab('scanner')}
              className={`flex-1 py-2 px-6 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'scanner'
                  ? 'bg-gradient-to-r from-orange-400 to-[#FF7A59] text-white shadow-md'
                  : 'text-slate-500 hover:text-orange-500 hover:bg-slate-50/50'
              }`}
            >
              <Leaf className="w-4 h-4" />
              Pathology Scanner
            </button>
            <button
              id="tab_historical_logs"
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`flex-1 py-2 px-6 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-gradient-to-r from-orange-400 to-[#FF7A59] text-white shadow-md'
                  : 'text-slate-500 hover:text-orange-500 hover:bg-slate-50/50'
              }`}
            >
              <Database className="w-4 h-4" />
              Historical Logs
            </button>
            <button
              id="tab_google_drive"
              type="button"
              onClick={() => setActiveTab('google_drive')}
              className={`flex-1 py-2 px-6 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'google_drive'
                  ? 'bg-gradient-to-r from-orange-400 to-[#FF7A59] text-white shadow-md'
                  : 'text-slate-500 hover:text-orange-500 hover:bg-slate-50/50'
              }`}
            >
              <Folder className="w-4 h-4" />
              Google Drive Cloud Sync
            </button>
          </div>

          {/* Active Tab contents inside a Bento Grid styled rounded-3xl container */}
          <div className="flex-1 bg-white border border-orange-100 p-8 rounded-3xl shadow-sm relative min-h-[480px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="w-full h-full"
              >
                {activeTab === 'insights' && (
                  <LiveFieldInsights
                    onWeatherDataFetched={setWeatherContext}
                    activeLocation={activeLocation}
                    projects={projects}
                    user={user}
                    onUpdateUser={handleUpdateUser}
                  />
                )}
                {activeTab === 'scanner' && (
                  <CropPathologyScanner />
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
                {activeTab === 'google_drive' && (
                  <GoogleDriveExplorer
                    user={user}
                    projects={projects}
                    onSelectCropImage={handleSelectCropImage}
                    onSwitchTab={(tab) => setActiveTab(tab)}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>

        {/* RIGHT WORKSPACE: 35% width representation (cols 9-12) */}
        <div id="assistant_sidebar_area" className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Settings Drawer collapsable sliding panel overlay if show_settings is false */}
          {isSettingsOpen && (!user.show_settings) && (
            <div className="transition-all duration-300">
              <OperationalProfile
                user={user}
                onUpdateUser={handleUpdateUser}
                onDeleteAccount={handleDeleteAccountComplete}
                onClose={() => setIsSettingsOpen(false)}
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
            </div>
          )}

          <div className="flex-1 h-full min-h-[500px]">
            <ClaireAssistant
              user={user}
              weatherContext={weatherContext}
            />
          </div>

          {/* Thin horizontal separator line and copyright notice footer */}
          <div className="pt-3 border-t border-slate-200/40 mt-1 shrink-0">
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              © 2026 Claire.ai by Rajesh Pan. All Rights Reserved. Protected under the MIT License.
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
            <Shield className="w-3 h-3 text-[#FF7A59]" />
            SQLite Persistent Rows Secured
          </span>
          <span>© 2026 Claire.ai Inc.</span>
        </div>
      </footer>

      {/* Real-time system toast alerts container */}
      <ToastContainer />

      {/* Agronomy FAQ diagnostic guidelines searchable modal */}
      <AgronomyFAQModal isOpen={isFAQOpen} onClose={() => setIsFAQOpen(false)} />

    </div>
  );
}
