import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VERIFIED_CROP_FACTS, CropFact } from '../data/cropFacts';
import { Sparkles, Sprout, Sun, Droplets, Satellite, Dna, Compass } from 'lucide-react';

interface SkyLoadingTransitionOverlayProps {
  isVisible: boolean;
  onTransitionFinished?: () => void;
  statusText?: string;
}

export default function SkyLoadingTransitionOverlay({
  isVisible,
  onTransitionFinished,
  statusText = 'Initializing your personal agronomy workspace...'
}: SkyLoadingTransitionOverlayProps) {
  const [factIndex, setFactIndex] = useState(0);

  // Rotate crop facts smoothly every 2.8 seconds
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % VERIFIED_CROP_FACTS.length);
    }, 2800);

    return () => clearInterval(interval);
  }, [isVisible]);

  const currentFact: CropFact = VERIFIED_CROP_FACTS[factIndex];

  const getFactIcon = (type: CropFact['iconType']) => {
    switch (type) {
      case 'leaf':
      case 'grain':
        return <Sprout className="w-5 h-5 text-emerald-600" />;
      case 'sun':
        return <Sun className="w-5 h-5 text-amber-500" />;
      case 'droplet':
        return <Droplets className="w-5 h-5 text-sky-500" />;
      case 'satellite':
        return <Satellite className="w-5 h-5 text-indigo-500" />;
      case 'dna':
        return <Dna className="w-5 h-5 text-purple-500" />;
      case 'soil':
      default:
        return <Sparkles className="w-5 h-5 text-orange-500" />;
    }
  };

  return (
    <AnimatePresence onExitComplete={onTransitionFinished}>
      {isVisible && (
        <motion.div
          id="sky_loading_transition_overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.015 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[99999] flex flex-col justify-between items-center bg-white p-6 sm:p-12 selection:bg-orange-100 overflow-hidden"
          style={{ perspective: '1200px' }}
        >
          {/* Simulated 3D Camera Tilt Upward into the Sky Layer */}
          <motion.div
            className="absolute inset-0 pointer-events-none origin-bottom flex flex-col justify-start items-center"
            initial={{
              rotateX: 38,
              translateY: '18%',
              scale: 1.15,
              opacity: 0.4
            }}
            animate={{
              rotateX: 0,
              translateY: '0%',
              scale: 1,
              opacity: 1
            }}
            transition={{
              duration: 1.4,
              ease: [0.12, 0.8, 0.25, 1]
            }}
          >
            {/* Atmospheric Sky Horizon Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-100/50 via-amber-50/40 to-white" />

            {/* Glowing Sun Flare rising as camera pitches up */}
            <motion.div
              className="w-[800px] h-[800px] rounded-full bg-gradient-to-b from-amber-200/50 via-orange-100/40 to-transparent blur-3xl -mt-48 pointer-events-none"
              initial={{ scale: 0.6, y: -120, opacity: 0.2 }}
              animate={{ scale: 1.25, y: -20, opacity: 0.9 }}
              transition={{ duration: 1.8, ease: 'easeOut' }}
            />

            {/* Solar Rays Optics */}
            <motion.div
              className="absolute -top-32 w-[600px] h-[600px] rounded-full bg-white/70 blur-2xl pointer-events-none"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.5 }}
              transition={{ duration: 1.6, ease: 'easeOut' }}
            />
          </motion.div>

          {/* Whiteout Bloom Layer with optical soft flash */}
          <motion.div
            className="absolute inset-0 bg-white pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.45, 0.94] }}
            transition={{
              times: [0, 0.4, 1],
              duration: 1.2,
              ease: 'easeInOut'
            }}
          />

          {/* Top Status Tracker */}
          <motion.div 
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-2 relative z-10 pt-4 text-center"
          >
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50/90 border border-orange-200/80 shadow-2xs backdrop-blur-sm">
              <Compass className="w-3.5 h-3.5 text-orange-600 animate-spin" style={{ animationDuration: '8s' }} />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-orange-700">
                Workspace Telemetry Sync
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500">
              {statusText}
            </p>
          </motion.div>

          {/* Center Stage: Rotating Verified Crop Science Facts with 3D Float */}
          <div className="w-full max-w-xl mx-auto my-auto relative z-10 flex flex-col items-center text-center px-4 py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFact.id}
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.96 }}
                transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center space-y-4"
              >
                {/* Fact Icon & Category Pill */}
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center">
                    {getFactIcon(currentFact.iconType)}
                  </div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    {currentFact.category}
                  </span>
                </div>

                {/* Primary Fact Text */}
                <p className="text-base sm:text-lg md:text-xl font-semibold text-slate-800 leading-relaxed tracking-tight max-w-lg">
                  “{currentFact.fact}”
                </p>

                {/* Verified Source Citation */}
                <div className="pt-2">
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-2xs">
                    Source: {currentFact.source}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Fact Step Indicator Dots */}
            <div className="flex items-center gap-1.5 mt-8">
              {VERIFIED_CROP_FACTS.map((fact, idx) => (
                <span
                  key={fact.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === factIndex 
                      ? 'w-6 bg-orange-500' 
                      : 'w-1.5 bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Bottom Progress Bar & Telemetry Status */}
          <motion.div 
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="w-full max-w-md space-y-2 relative z-10 pb-4 text-center"
          >
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/60">
              <motion.div 
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3.6, ease: 'easeInOut' }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
              <span>Calibrating canopy telemetry</span>
              <span>Claire.ai Engine</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
