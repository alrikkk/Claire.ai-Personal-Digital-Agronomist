import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  X, 
  Check, 
  Trash2, 
  Sparkles,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timeAgo: string;
  read: boolean;
  createdAt: number;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Microclimate Live Sync',
    message: 'Telemetry linked: Salinas Valley station at 22.4°C and 62% RH.',
    type: 'success',
    timeAgo: '2m ago',
    read: false,
    createdAt: Date.now() - 120000
  },
  {
    id: 'notif-2',
    title: 'Irrigation & Moisture Advisory',
    message: 'Block B Soil volumetric water content is 34.2% (optimal wheat grain filling zone).',
    type: 'info',
    timeAgo: '14m ago',
    read: false,
    createdAt: Date.now() - 840000
  },
  {
    id: 'notif-3',
    title: 'Aero-Pathology Model',
    message: 'Top-down drone scan model calibrated for Septoria & Yellow Rust early spotting.',
    type: 'warning',
    timeAgo: '1h ago',
    read: true,
    createdAt: Date.now() - 3600000
  }
];

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('claire_notifications_history');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_NOTIFICATIONS;
  });
  const [filter, setFilter] = useState<'all' | 'unread' | 'alerts'>('all');

  const containerRef = useRef<HTMLDivElement>(null);

  // Save to localStorage when notifications change
  useEffect(() => {
    try {
      localStorage.setItem('claire_notifications_history', JSON.stringify(notifications));
    } catch {
      // ignore
    }
  }, [notifications]);

  // Listen to incoming app toast/system events
  useEffect(() => {
    const handleIncomingToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type?: 'success' | 'error' | 'warning' | 'info'; title?: string }>;
      if (customEvent.detail && customEvent.detail.message) {
        const type = customEvent.detail.type || 'info';
        const titleMap = {
          success: 'System Operation Successful',
          error: 'Action Alert Required',
          warning: 'Field Notice',
          info: 'Agronomic Notification'
        };
        const title = customEvent.detail.title || titleMap[type] || 'Notification';
        
        const newNotif: NotificationItem = {
          id: 'notif-' + Math.random().toString(36).substring(2, 9),
          title,
          message: customEvent.detail.message,
          type,
          timeAgo: 'Just now',
          read: false,
          createdAt: Date.now()
        };

        setNotifications((prev) => [newNotif, ...prev.slice(0, 24)]);
      }
    };

    window.addEventListener('claire-toast', handleIncomingToast);
    return () => {
      window.removeEventListener('claire-toast', handleIncomingToast);
    };
  }, []);

  // Close on outside click or escape key
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markSingleAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'alerts') return n.type === 'warning' || n.type === 'error';
    return true;
  });

  const getTypeStyle = (type: NotificationItem['type']) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />,
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
          dot: 'bg-emerald-500'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
          badge: 'bg-amber-50 text-amber-700 border-amber-200/60',
          dot: 'bg-amber-500'
        };
      case 'error':
        return {
          icon: <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />,
          badge: 'bg-rose-50 text-rose-700 border-rose-200/60',
          dot: 'bg-rose-500'
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-3.5 h-3.5 text-sky-500 shrink-0" />,
          badge: 'bg-sky-50 text-sky-700 border-sky-200/60',
          dot: 'bg-sky-500'
        };
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Header Notification Bell Button */}
      <button
        type="button"
        id="btn_notifications_dropdown"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative p-2.5 rounded-2xl border transition-all duration-200 flex items-center justify-center cursor-pointer ${
          isOpen
            ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20'
            : 'bg-white hover:bg-orange-50/80 border-orange-200 text-slate-600 hover:text-orange-600 shadow-xs'
        }`}
        title="Notifications & Field Alerts"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />

        {/* Unread badge / pulse */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-[9px] font-bold font-mono text-white shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="notifications_dropdown_menu"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2.5 w-[360px] sm:w-[400px] max-w-[92vw] bg-white rounded-3xl border border-orange-100 shadow-2xl shadow-slate-900/15 overflow-hidden z-50 flex flex-col max-h-[520px]"
          >
            {/* Dropdown Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-orange-500 text-white font-mono font-bold px-1.5 py-0.2 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="p-1.5 text-[11px] text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    title="Mark all as read"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline font-medium">Read all</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="p-1.5 text-[11px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    title="Clear all notifications"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/60 flex items-center gap-1.5 shrink-0 text-[11px]">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-white text-orange-600 shadow-2xs border border-orange-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-2.5 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
                  filter === 'unread'
                    ? 'bg-white text-orange-600 shadow-2xs border border-orange-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('alerts')}
                className={`px-2.5 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
                  filter === 'alerts'
                    ? 'bg-white text-orange-600 shadow-2xs border border-orange-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Alerts
              </button>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 p-1.5">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-400 mb-3 shadow-2xs">
                    <Check className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mb-0.5">All caught up</h4>
                  <p className="text-[11px] text-slate-400 max-w-[200px]">
                    {filter === 'unread' 
                      ? 'No unread notifications at the moment.' 
                      : 'No active agronomy or telemetry notifications.'}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((item) => {
                  const style = getTypeStyle(item.type);
                  return (
                    <div
                      key={item.id}
                      onClick={() => markSingleAsRead(item.id)}
                      className={`group relative p-3 rounded-2xl transition-all duration-150 flex items-start gap-3 cursor-pointer ${
                        item.read ? 'hover:bg-slate-50/80 opacity-75' : 'bg-orange-50/30 hover:bg-orange-50/70 border border-orange-100/50'
                      }`}
                    >
                      {/* Left icon badge */}
                      <div className="mt-0.5 p-1.5 rounded-xl bg-white border border-slate-100 shadow-2xs shrink-0">
                        {style.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md border ${style.badge}`}>
                            {item.title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            • {item.timeAgo}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed break-words font-medium">
                          {item.message}
                        </p>
                      </div>

                      {/* Unread indicator dot */}
                      {!item.read && (
                        <span className="absolute right-8 top-4 w-2 h-2 rounded-full bg-orange-500 shadow-2xs" />
                      )}

                      {/* Delete notification single button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(item.id);
                        }}
                        className="absolute right-2.5 top-3.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 hover:bg-white rounded-lg transition-all cursor-pointer"
                        title="Dismiss notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Dropdown Footer */}
            <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span className="text-[11px] text-slate-400 font-medium">
                {notifications.length} events logged
              </span>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[11px] text-slate-400 hover:text-slate-600 font-medium cursor-pointer transition-colors"
                >
                  Clear history
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
