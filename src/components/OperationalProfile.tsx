import React, { useState, useRef, useEffect } from 'react';
import { User, ApiProviderConfig } from '../types';
import { 
  Camera, 
  Trash2, 
  Save, 
  X, 
  Settings, 
  AlertTriangle, 
  Loader2, 
  Key, 
  Zap, 
  CheckCircle2, 
  User as UserIcon, 
  MapPin, 
  Building, 
  Shield, 
  Phone, 
  Mail, 
  Lock,
  Folder,
  ArrowRight,
  Cloud
} from 'lucide-react';
import { getSavedApiConfig, API_CONFIG_CHANGED_EVENT, PROVIDER_PRESETS } from '../utils/apiConfig';
import { motion, AnimatePresence } from 'motion/react';

interface OperationalProfileProps {
  isOpen: boolean;
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onDeleteAccount: () => void;
  onClose: () => void;
  onOpenApiSettings?: () => void;
  onOpenGovtSync?: () => void;
  fullName: string;
  setFullName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  showSettingsLocal: boolean;
  setShowSettingsLocal: (val: boolean) => void;
  avatarBase64: string;
  setAvatarBase64: (val: string) => void;
}

export default function OperationalProfile({
  isOpen,
  user,
  onUpdateUser,
  onDeleteAccount,
  onClose,
  onOpenApiSettings,
  onOpenGovtSync,
  fullName,
  setFullName,
  email,
  setEmail,
  phone,
  setPhone,
  showSettingsLocal,
  setShowSettingsLocal,
  avatarBase64,
  setAvatarBase64
}: OperationalProfileProps) {
  const [farmName, setFarmName] = useState(user.farmName || '');
  const [location, setLocation] = useState(user.location || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'farm' | 'security'>('profile');
  const [apiConfig, setApiConfig] = useState<ApiProviderConfig | null>(getSavedApiConfig());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFarmName(user.farmName || '');
    setLocation(user.location || '');
  }, [user]);

  // Handle escape key to dismiss modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleConfigChange = (e: any) => {
      setApiConfig(e.detail || getSavedApiConfig());
    };
    window.addEventListener(API_CONFIG_CHANGED_EVENT, handleConfigChange);
    return () => window.removeEventListener(API_CONFIG_CHANGED_EVENT, handleConfigChange);
  }, []);

  // Avatar conversion
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      setErrorMsg('Only image formats (.jpg, .png, .jpeg) are accepted.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image size must be under 2MB.');
      return;
    }

    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAvatarBase64(result);
      handleSaveProfile(result, showSettingsLocal);
    };
    reader.readAsDataURL(file);
  };

  // Password update action
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (!newPassword || newPassword.length < 4) {
      setPasswordMsg({ text: 'New password must be at least 4 characters long.', isError: true });
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setPasswordMsg({ text: 'Password successfully updated in cloud database!', isError: false });
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setPasswordMsg({ text: data.error || 'Failed to update password.', isError: true });
      }
    } catch (err) {
      setPasswordMsg({ text: 'Network error updating password.', isError: true });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Sync / Save profile values straight to SQLite table row
  const handleSaveProfile = async (customAvatar?: string, customShowSettings?: boolean) => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          farmName,
          location,
          avatar_base64: customAvatar !== undefined ? customAvatar : avatarBase64,
          show_settings: customShowSettings !== undefined ? customShowSettings : showSettingsLocal
        })
      });

      const data = await response.json();
      if (data.success) {
        onUpdateUser(data.user);
        setSuccessMsg('Profile synced to cloud database.');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(data.error || 'Failed to update profile.');
      }
    } catch (err) {
      setErrorMsg('Network error. Failed to synchronize changes.');
    } finally {
      setIsLoading(false);
    }
  };

  // Destructive "Delete Account" - drops database row, clears session state immediately
  const handleDeleteAccount = async () => {
    if (!window.confirm("WARNING: Are you absolutely sure you want to delete your Claire.ai farmer profile? This operation is permanent and cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id
        }
      });
      const data = await response.json();
      if (data.success) {
        onDeleteAccount();
      } else {
        setErrorMsg(data.error || 'Failed to delete profile row.');
        setIsDeleting(false);
      }
    } catch (err) {
      setErrorMsg('Network error. Failed to execute drop action.');
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="settings_modal_backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          id="settings_drawer"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl bg-white rounded-3xl border border-orange-100 shadow-2xl shadow-black/40 overflow-hidden relative my-auto flex flex-col max-h-[90vh]"
        >
          {/* Header Bar */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50/60 via-amber-50/30 to-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-[#FF7A59] text-white flex items-center justify-center shadow-md shadow-orange-500/25">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Farm & Profile Settings</h2>
                <p className="text-xs text-slate-500">Configure agronomist credentials, microclimate location & security</p>
              </div>
            </div>
            <button
              type="button"
              id="btn_close_settings_modal"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Close Settings (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Category Tabs */}
          <div className="px-6 pt-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/60 shrink-0">
            <button
              type="button"
              id="settings_tab_profile"
              onClick={() => setActiveTab('profile')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              Farmer Identity
            </button>
            <button
              type="button"
              id="settings_tab_farm"
              onClick={() => setActiveTab('farm')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'farm'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              Farm & AI Engine
            </button>
            <button
              type="button"
              id="settings_tab_security"
              onClick={() => setActiveTab('security')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Security & Cloud Sync
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            
            {/* Sync / Warning Badges */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-medium leading-relaxed flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-medium text-center flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* TAB 1: Profile & Identity */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Profile Picture Manipulation */}
                <div className="flex items-center gap-5 p-4 bg-orange-50/40 border border-orange-100 rounded-2xl">
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl border-2 border-orange-200 overflow-hidden bg-white flex items-center justify-center shadow-sm">
                      {avatarBase64 ? (
                        <img
                          src={avatarBase64}
                          alt="Farmer profile avatar"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[#FF7A59] font-black text-2xl">
                          {fullName ? fullName.charAt(0).toUpperCase() : 'F'}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-gradient-to-tr from-[#FF7A59] to-[#FFB74D] text-white rounded-full flex items-center justify-center shadow-md hover:opacity-90 transition-opacity cursor-pointer border-2 border-white"
                      title="Upload Avatar"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">Agronomist Avatar</h4>
                    <p className="text-[11px] text-slate-500">Upload a custom profile photo (PNG, JPG up to 2MB). Automatically saved to cloud storage upon selection.</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 underline cursor-pointer"
                    >
                      Choose file
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/jpg"
                    className="hidden"
                  />
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      Farmer Full Name
                    </label>
                    <input
                      type="text"
                      id="input_settings_fullname"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rajesh Pan"
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 outline-none focus:border-orange-400 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      Verified Phone (DB Identity)
                    </label>
                    <input
                      type="text"
                      id="input_settings_phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 outline-none focus:border-orange-400 focus:bg-white transition-all font-mono font-medium"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      Account Email
                    </label>
                    <input
                      type="email"
                      id="input_settings_email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="farmer@domain.com"
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 outline-none focus:border-orange-400 focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Farm & AI Engine */}
            {activeTab === 'farm' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      Farm / Operational Station
                    </label>
                    <input
                      type="text"
                      id="input_settings_farmname"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      placeholder="e.g. Green Valley Station"
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 outline-none focus:border-orange-400 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      Primary Region / Climate Zone
                    </label>
                    <input
                      type="text"
                      id="input_settings_location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Salinas Valley, CA"
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-xs text-slate-800 outline-none focus:border-orange-400 focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Custom AI Provider Configuration Card */}
                <div className="bg-gradient-to-r from-orange-50/80 via-amber-50/50 to-white border border-orange-200/80 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-xs">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          AI Model & API Provider Engine
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {apiConfig && apiConfig.isActive 
                            ? `Connected: ${PROVIDER_PRESETS[apiConfig.provider]?.name || apiConfig.provider}` 
                            : 'Default built-in server model (Groq / Gemini)'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="settings_btn_configure_api"
                      onClick={() => {
                        onClose();
                        onOpenApiSettings?.();
                      }}
                      className="px-3.5 py-2 bg-white hover:bg-orange-50 border border-orange-200 text-orange-600 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>{apiConfig && apiConfig.isActive ? 'Manage Key' : 'Connect Key'}</span>
                    </button>
                  </div>

                  {apiConfig && apiConfig.isActive && (
                    <div className="pt-2 border-t border-orange-100 flex items-center justify-between text-[11px] font-mono text-slate-600">
                      <span>Active Model: <strong className="text-slate-800">{apiConfig.model || 'Default'}</strong></span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Live Linked
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Security & Database */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Indian Gov Data Sync Block */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-orange-500" />
                      <span className="text-xs font-bold text-slate-800">Govt. of India Agri-Data Backup</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">e-NAM / SHC Synced</span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Connect to Indian Government servers to securely backup your crop telemetry and soil parameters.
                  </p>

                  <button
                    type="button"
                    id="btn_settings_open_gov_sync"
                    onClick={onOpenGovtSync}
                    className="w-full h-10 bg-white hover:bg-orange-50/40 border border-slate-200 hover:border-orange-200 text-slate-800 font-semibold text-xs rounded-xl flex items-center justify-between px-3.5 cursor-pointer transition-all shadow-xs group"
                  >
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-orange-500" />
                      <span>Open Govt Data Hub</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Master Password Update Block */}
                <form onSubmit={handleChangePassword} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-bold text-slate-800">Master Password & PIN</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">PBKDF2 Cloud Secured</span>
                  </div>

                  {passwordMsg && (
                    <div className={`p-2.5 rounded-xl text-xs font-medium ${
                      passwordMsg.isError ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    }`}>
                      {passwordMsg.text}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="password"
                      id="input_settings_current_password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current password"
                      className="h-10 px-3.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono"
                    />
                    <input
                      type="password"
                      id="input_settings_new_password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password (min 4 chars)"
                      className="h-10 px-3.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    id="btn_settings_update_password"
                    disabled={isChangingPassword || !newPassword}
                    className="w-full h-9 bg-slate-800 hover:bg-slate-900 active:bg-black text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {isChangingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                    Update Master Password
                  </button>
                </form>

                {/* Destructive Delete Section */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="flex items-start gap-2 bg-rose-50/60 border border-rose-100 p-3 rounded-2xl">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-rose-600 font-medium leading-relaxed">
                      Deleting this profile permanently drops your user rows, synchronized field folders, and logs from the cloud database instantly.
                    </div>
                  </div>
                  <button
                    type="button"
                    id="btn_settings_delete_account"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="w-full h-10 border border-rose-200 hover:bg-rose-50 text-rose-600 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Delete Agronomist Profile
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Footer Action Bar */}
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              id="btn_cancel_settings"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-white text-slate-600 font-semibold text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn_save_settings_profile"
              onClick={() => handleSaveProfile()}
              disabled={isLoading}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-[#FF7A59] hover:from-orange-600 hover:to-[#f06846] text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-orange-500/20 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save & Synchronize Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
