import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { Toast } from '../types';

export default function ToastContainer() {
  return null;
}

interface ToastItemProps {
  key?: string;
  toast: Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: {
      bg: 'bg-white border-emerald-100 dark:bg-neutral-900 dark:border-emerald-950/40',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
      titleColor: 'text-emerald-800 dark:text-emerald-400',
      tag: 'Success',
      progress: 'bg-emerald-500',
    },
    error: {
      bg: 'bg-white border-rose-100 dark:bg-neutral-900 dark:border-rose-950/40',
      icon: <XCircle className="w-4 h-4 text-rose-500 shrink-0" />,
      titleColor: 'text-rose-800 dark:text-rose-400',
      tag: 'Alert',
      progress: 'bg-rose-500',
    },
    warning: {
      bg: 'bg-white border-amber-100 dark:bg-neutral-900 dark:border-amber-950/40',
      icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
      titleColor: 'text-amber-800 dark:text-amber-400',
      tag: 'Warning',
      progress: 'bg-amber-500',
    },
    info: {
      bg: 'bg-white border-sky-100 dark:bg-neutral-900 dark:border-sky-950/40',
      icon: <Info className="w-4 h-4 text-sky-500 shrink-0" />,
      titleColor: 'text-sky-800 dark:text-sky-400',
      tag: 'System',
      progress: 'bg-sky-500',
    },
  }[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      className={`pointer-events-auto w-full border rounded-2xl p-4 shadow-xl flex gap-3 items-start relative overflow-hidden backdrop-blur-md ${config.bg} transition-all duration-300`}
    >
      {config.icon}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${config.titleColor}`}>
            {config.tag}
          </span>
          <span className="w-1 h-1 bg-slate-200 dark:bg-neutral-800 rounded-full" />
          <span className="text-[9px] font-mono text-slate-400 dark:text-neutral-500">
            Just now
          </span>
        </div>
        <p className="text-xs font-medium text-slate-700 dark:text-neutral-200 leading-relaxed break-words">
          {toast.message}
        </p>
      </div>

      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300 p-0.5 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress bar animation */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 4.5, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-0.5 ${config.progress} opacity-60`}
      />
    </motion.div>
  );
}
