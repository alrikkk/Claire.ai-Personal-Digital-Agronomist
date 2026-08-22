import React, { useState } from 'react';
import { User } from '../types';
import { Lock, Phone, User as UserIcon, Eye, EyeOff, CheckCircle2, ArrowRight, Loader2, AlertCircle, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import InteractiveCropFieldBackground from './InteractiveCropFieldBackground';
import SkyLoadingTransitionOverlay from './SkyLoadingTransitionOverlay';
import LocationAutocomplete from './LocationAutocomplete';

interface PersonalSetupGateProps {
  onSetupComplete: (user: User) => void;
}

export default function PersonalSetupGate({ onSetupComplete }: PersonalSetupGateProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [farmName, setFarmName] = useState('');
  const [location, setLocation] = useState('Nairobi');
  const [showPassword, setShowPassword] = useState(false);
  const [isReturningMode, setIsReturningMode] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioningToSky, setIsTransitioningToSky] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    if (!isReturningMode && !fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!phone.trim() || phone.trim().length < 5) {
      setErrorMsg('Please enter a valid phone number (minimum 6 digits) for user verification.');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMsg('Master password / PIN must be at least 4 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/personal-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim() || 'Agronomy User',
          phone: phone.trim(),
          password: password.trim(),
          farmName: farmName.trim() || undefined,
          location: location.trim() || undefined
        })
      });

      const data = await response.json();

      if (data.success && data.user) {
        setSuccessNotice(data.message || 'Workspace verified!');
        // Trigger the cinematic sky camera tilt and fact loading transition
        setIsTransitioningToSky(true);
        
        // Allow user to experience the smooth sky camera tilt and read verified crop facts
        setTimeout(() => {
          onSetupComplete(data.user);
        }, 3600);
      } else {
        setErrorMsg(data.error || 'Failed to initialize personal workspace.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('[Personal Setup Error]', err);
      setErrorMsg('Network error connecting to local database service.');
      setIsLoading(false);
    }
  };

  return (
    <div id="personal_setup_container" className="relative min-h-screen w-full flex flex-col justify-center items-center bg-[#180e06] p-4 sm:p-6 font-sans selection:bg-orange-200 selection:text-orange-950 overflow-hidden">
      
      {/* Interactive 3D Crop Canopy Background Canvas with Sky Tilt Transition */}
      <InteractiveCropFieldBackground 
        className="z-0" 
        isTransitioningToSky={isTransitioningToSky} 
      />

      {/* Full-Screen Sky Loading & Verified Crop Facts Transition Overlay */}
      <SkyLoadingTransitionOverlay
        isVisible={isTransitioningToSky}
        statusText={
          isReturningMode
            ? 'Unlocking & synchronizing your agricultural models...'
            : 'Configuring personal workspace & microclimate satellite telemetry...'
        }
      />

      {/* Setup Card Container sitting on top */}
      <AnimatePresence>
        {!isTransitioningToSky && (
          <motion.div 
            key="personal_setup_card"
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.96 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl border border-white/80 shadow-2xl shadow-black/40 p-6 sm:p-8 relative z-10 space-y-6"
          >
            {/* Brand Header - simplified and clean */}
            <div className="flex flex-col items-center text-center space-y-1.5 pt-2">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                Claire.ai
              </h1>
              <p className="text-xs font-medium text-slate-500">
                {isReturningMode ? 'Unlock existing workspace' : 'Personal workspace setup'}
              </p>
            </div>

            {/* Mode Selector Tabs */}
            <div className="bg-slate-100/80 p-1 rounded-xl flex text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => { setIsReturningMode(false); setErrorMsg(''); }}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  !isReturningMode ? 'bg-white text-slate-800 shadow-sm' : 'hover:text-slate-900 text-slate-500'
                }`}
              >
                New Personal Setup
              </button>
              <button
                type="button"
                onClick={() => { setIsReturningMode(true); setErrorMsg(''); }}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  isReturningMode ? 'bg-white text-slate-800 shadow-sm' : 'hover:text-slate-900 text-slate-500'
                }`}
              >
                Unlock Existing
              </button>
            </div>

            {/* Status Notices */}
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {successNotice && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successNotice}</span>
              </motion.div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name field (only for new setup) */}
              {!isReturningMode && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    Your Full Name
                  </label>
                  <input
                    id="input_user_fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Jane Miller"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF7A59] focus:bg-white transition-all"
                  />
                </div>
              )}

              {/* Unique Phone Number field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Mobile Phone Number
                </label>
                <input
                  id="input_user_phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +14155552671 or 0712345678"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF7A59] focus:bg-white transition-all"
                />
              </div>

              {/* Master Password / PIN */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Master Password / Security PIN
                </label>
                <div className="relative">
                  <input
                    id="input_user_password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter secure master password"
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF7A59] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Optional Farm & Location fields (only for new setup) */}
              {!isReturningMode && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Farm / Operation
                    </label>
                    <input
                      id="input_farm_name"
                      type="text"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      placeholder="e.g. Green Valley Farm"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF7A59] focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Primary Region
                    </label>
                    <LocationAutocomplete
                      id="input_primary_location"
                      value={location}
                      onChange={(val) => setLocation(val)}
                      placeholder="e.g. Nairobi, Salinas, Punjab..."
                      className="w-full px-3 py-2 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF7A59] focus:bg-white transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  id="btn_submit_personal_setup"
                  type="submit"
                  disabled={isLoading || isTransitioningToSky}
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#FF7A59] to-orange-500 hover:from-orange-600 hover:to-orange-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading && !isTransitioningToSky ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting to Cloud Database...</span>
                    </>
                  ) : isTransitioningToSky ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Igniting Workspace...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      <span>{isReturningMode ? 'Unlock My Workspace' : 'Initialize Personal Workspace'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
