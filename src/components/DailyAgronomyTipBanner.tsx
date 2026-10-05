import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Sprout, 
  ShieldAlert, 
  Droplets, 
  Volume2, 
  VolumeX, 
  RotateCw, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Bug, 
  Layers, 
  MessageSquare,
  Leaf
} from 'lucide-react';
import { WeatherData, DailyAgronomyTip, showToast } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface DailyAgronomyTipBannerProps {
  weather: WeatherData | null;
  activeLocation?: string;
  onAskClaire?: (prompt: string) => void;
  className?: string;
}

export default function DailyAgronomyTipBanner({
  weather,
  activeLocation,
  onAskClaire,
  className = ''
}: DailyAgronomyTipBannerProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'planting' | 'pest_prevention' | 'soil_water'>('all');
  const [tip, setTip] = useState<DailyAgronomyTip | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const targetLocation = activeLocation || weather?.name || 'Nairobi';

  // Fetch contextual tip from backend or cached local storage
  const fetchDailyTip = async (category: string = selectedCategory, force: boolean = false) => {
    setIsLoading(true);
    try {
      const payload = {
        location: targetLocation,
        country: weather?.country || '',
        category,
        forceRefresh: force,
        weather: weather ? {
          temp: weather.temp,
          humidity: weather.humidity,
          windSpeed: weather.windSpeed,
          windDirectionCompass: weather.windDirectionCompass || '',
          dayType: weather.dayType,
          soilMoisture: weather.soilMoisture,
          soilTemp: weather.soilTemp
        } : null
      };

      const response = await fetch('/api/agronomy/daily-tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data && data.title && data.summary) {
        setTip(data);
      } else {
        throw new Error('Failed to retrieve daily tip payload');
      }
    } catch (err) {
      console.error('Failed to fetch daily agronomy tip:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyTip(selectedCategory, false);
  }, [targetLocation, selectedCategory]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text-To-Speech playback
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      showToast('Text-to-speech audio is not supported in this browser.', 'warning');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!tip) return;

    window.speechSynthesis.cancel();
    const readText = `${tip.title}. ${tip.summary}. Today's immediate task: ${tip.immediateAction}. Seasonal alert: ${tip.pestAlert || ''}. Recommended organic remedy: ${tip.lowCostRemedy || ''}`;
    const utterance = new SpeechSynthesisUtterance(readText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechUtteranceRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
    showToast('Reading daily agronomy advisory aloud', 'info');
  };

  const handleCopy = () => {
    if (!tip) return;
    const shareText = `🌾 Claire.ai Daily Agronomy Tip (${tip.locationName} • ${tip.seasonTag})\n\n${tip.title}\n\n${tip.summary}\n\n🎯 Action Today: ${tip.immediateAction}\n⚠️ Seasonal Watch: ${tip.pestAlert || 'None'}\n🌿 Remedy: ${tip.lowCostRemedy || 'None'}`;
    navigator.clipboard.writeText(shareText);
    setIsCopied(true);
    showToast('Daily agronomy protocol copied to clipboard!', 'success');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-amber-50/40 shadow-sm ${className}`}
    >
      {/* Decorative agronomy ambient glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-200/25 rounded-full blur-2xl pointer-events-none" />

      {/* Top Banner Header Bar */}
      <div className="relative p-5 sm:p-6 pb-3 border-b border-emerald-100/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Title & Location / Date metadata */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-600 text-white shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                Daily Agronomy Tip
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white border border-emerald-200 text-emerald-800">
                <MapPin className="w-3 h-3 text-emerald-600" />
                {targetLocation}
              </span>

              {tip?.seasonTag && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100/80 text-amber-900 border border-amber-200/60">
                  <Calendar className="w-3 h-3 text-amber-700" />
                  {tip.seasonTag}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 font-sans flex items-center gap-2 pt-0.5">
              <span>{todayFormatted}</span>
              <span className="text-slate-300">•</span>
              <span>Regional Biological & Integrated Pest Management Advisory</span>
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
            {/* Audio Voice Read-Aloud */}
            <button
              type="button"
              onClick={handleToggleSpeech}
              title={isSpeaking ? 'Stop speaking' : 'Listen to advisory (Read aloud)'}
              className={`h-8 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm animate-pulse'
                  : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Speaking...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px] hidden sm:inline">Listen</span>
                </>
              )}
            </button>

            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopy}
              title="Copy agronomy tip to clipboard"
              className="h-8 px-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px] text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[11px] hidden sm:inline">Share</span>
                </>
              )}
            </button>

            {/* Refresh button */}
            <button
              type="button"
              onClick={() => fetchDailyTip(selectedCategory, true)}
              disabled={isLoading}
              title="Regenerate today's advice"
              className="h-8 w-8 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Collapse toggle */}
            <button
              type="button"
              onClick={() => setIsCollapsed(prev => !prev)}
              title={isCollapsed ? 'Expand banner' : 'Collapse banner'}
              className="h-8 w-8 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl flex items-center justify-center transition-colors cursor-pointer ml-0.5"
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Category Filter Pills Bar */}
        <div className="flex items-center gap-1.5 mt-3.5 overflow-x-auto pb-1 text-xs select-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
            Advisory Focus:
          </span>

          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200/80'
            }`}
          >
            🌟 All Focuses
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('planting')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'planting'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200/80'
            }`}
          >
            <Sprout className="w-3.5 h-3.5 text-emerald-500" />
            Seasonal Planting
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('pest_prevention')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'pest_prevention'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200/80'
            }`}
          >
            <Bug className="w-3.5 h-3.5 text-amber-500" />
            Pest & Disease Prevention
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('soil_water')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'soil_water'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200/80'
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-sky-500" />
            Soil Moisture & Irrigation
          </button>
        </div>
      </div>

      {/* Expandable Tip Content Body */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-5 sm:p-6 pt-4 space-y-4"
          >
            {isLoading && !tip ? (
              <div className="py-6 flex flex-col items-center justify-center space-y-2 text-slate-500">
                <RotateCw className="w-6 h-6 animate-spin text-emerald-600" />
                <p className="text-xs font-medium">Analyzing active microclimate & seasonal calendar for {targetLocation}...</p>
              </div>
            ) : tip ? (
              <>
                {/* Main Headline & Contextual Narrative */}
                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    {tip.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                    {tip.summary}
                  </p>
                </div>

                {/* 3-Column Action & Diagnostic Protocol Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                  {/* Card 1: Immediate Field Task */}
                  <div className="p-3.5 rounded-2xl bg-white/90 border border-emerald-100 shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Action Required Today</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {tip.immediateAction}
                    </p>
                  </div>

                  {/* Card 2: Seasonal Pest & Threat Watch */}
                  <div className="p-3.5 rounded-2xl bg-white/90 border border-amber-100 shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Seasonal Pest Alert</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {tip.pestAlert || 'Inspect foliage underside for sap-sucking nymphs and spore spots.'}
                    </p>
                  </div>

                  {/* Card 3: Low-Cost / Natural Remedy */}
                  <div className="p-3.5 rounded-2xl bg-white/90 border border-sky-100 shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 uppercase tracking-wider">
                      <Leaf className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>Natural / Low-Cost Remedy</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {tip.lowCostRemedy || 'Apply neem kernel extract (NSKE) or biofertilizers to boost root immunity.'}
                    </p>
                  </div>
                </div>

                {/* Footer: Companion Sowing Varieties & Ask Claire CTA */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs border-t border-emerald-100/70">
                  {/* Companion Varieties */}
                  {tip.companionCrops && tip.companionCrops.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                        Recommended Sowing / Intercrops:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {tip.companionCrops.map((crop, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold text-[11px]"
                          >
                            {crop}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ask Claire shortcut */}
                  {onAskClaire && (
                    <button
                      type="button"
                      onClick={() => onAskClaire(`Tell me more about today's agronomy tip for ${targetLocation}: "${tip.title}". How should I implement it step-by-step?`)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100/60 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Ask Claire about this tip &rarr;
                    </button>
                  )}
                </div>
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
