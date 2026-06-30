import React, { useState, useRef } from 'react';
import { User } from '../types';
import { Camera, Trash2, Save, X, Settings, AlertTriangle, Loader2 } from 'lucide-react';

interface OperationalProfileProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onDeleteAccount: () => void;
  onClose: () => void;
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
  user,
  onUpdateUser,
  onDeleteAccount,
  onClose,
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
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle uploader change - Convert image safely to clean base64 string
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
      // Auto-trigger sync to server
      handleSaveProfile(result, showSettingsLocal);
    };
    reader.readAsDataURL(file);
  };

  // Toggle persistent settings drawer flag
  const handleToggleSettingsPersistence = async (val: boolean) => {
    setShowSettingsLocal(val);
    await handleSaveProfile(avatarBase64, val);
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
          avatar_base64: customAvatar !== undefined ? customAvatar : avatarBase64,
          show_settings: customShowSettings !== undefined ? customShowSettings : showSettingsLocal
        })
      });

      const data = await response.json();
      if (data.success) {
        onUpdateUser(data.user);
        setSuccessMsg('Profile synced to database.');
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

  return (
    <div id="settings_drawer" className="w-full bg-white rounded-2xl border border-orange-100 shadow-md p-6 space-y-6">
      
      {/* Drawer Title Block */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#FF7A59]" />
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Farmer Profile Settings</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Profile Picture Manipulation */}
      <div className="flex flex-col items-center py-2 relative">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full border-2 border-orange-200 overflow-hidden bg-slate-50 flex items-center justify-center shadow-inner">
            {avatarBase64 ? (
              <img
                src={avatarBase64}
                alt="Farmer profile avatar"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-slate-300 font-semibold text-2xl">
                {fullName ? fullName.charAt(0).toUpperCase() : 'F'}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tr from-[#FF7A59] to-[#FFB74D] text-white rounded-full flex items-center justify-center shadow hover:opacity-90 active:opacity-100 transition-opacity cursor-pointer border border-white"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/jpg"
          className="hidden"
        />
        <p className="text-[10px] text-slate-400 mt-2">Click to ingest .jpg or .png image</p>
      </div>

      {/* Sync / Warning Badges */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-medium leading-relaxed">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-medium text-center">
          {successMsg}
        </div>
      )}

      {/* Edit Form Fields */}
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Farmer Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-700 outline-none focus:border-orange-300 focus:bg-white transition-colors"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-700 outline-none focus:border-orange-300 focus:bg-white transition-colors"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-700 outline-none focus:border-orange-300 focus:bg-white transition-colors"
          />
        </div>

        {/* Persistent settings toggle switch */}
        <div className="flex items-center justify-between bg-orange-50/50 border border-orange-100/60 p-3 rounded-xl">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700">Lock Settings Drawer Open</span>
            <span className="text-[10px] text-slate-400">Maintains drawer visibility on text updates</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showSettingsLocal}
              onChange={(e) => handleToggleSettingsPersistence(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF7A59]"></div>
          </label>
        </div>

        {/* Action Controls */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleSaveProfile()}
            disabled={isLoading}
            className="flex-1 h-10 bg-[#FF7A59] hover:bg-[#ff6942] active:bg-[#e05834] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Synchronize Data
          </button>
        </div>
      </div>

      {/* Destructive Delete Section */}
      <div className="border-t border-slate-100 pt-5 space-y-3">
        <div className="flex items-start gap-2 bg-rose-50/60 border border-rose-100 p-3 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="text-[11px] text-rose-600 font-medium leading-normal">
            Deleting this profile permanently drops your user rows, synchronized field folders, and logs from the SQLite backend instantly.
          </div>
        </div>
        <button
          type="button"
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
  );
}
