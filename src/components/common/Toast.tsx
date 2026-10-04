import React, { useEffect, useState } from 'react';
import { ToastItem } from '../../types/toast';
import { Check, Trash2, Info, AlertTriangle, X } from 'lucide-react';

interface ToastProps {
  toast: ToastItem | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!toast) {
      setIsExiting(false);
      return;
    }

    setIsExiting(false);
    const duration = toast.durationMs || 2600;

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onDismiss, 220); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const handleManualDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 220);
  };

  const getIconConfig = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: Check,
          bgColor: 'bg-emerald-500 text-white',
          badgeText: 'สำเร็จ',
          badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
        };
      case 'delete':
        return {
          icon: Trash2,
          bgColor: 'bg-red-500 text-white',
          badgeText: 'ลบแล้ว',
          badgeBg: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-amber-500 text-white',
          badgeText: 'แจ้งเตือน',
          badgeBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
        };
      case 'info':
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-500 text-white',
          badgeText: 'ข้อมูล',
          badgeBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
        };
    }
  };

  const config = getIconConfig();
  const IconComp = config.icon;

  return (
    <div
      onClick={handleManualDismiss}
      className={`fixed top-[max(env(safe-area-inset-top,0px)+24px,5rem)] sm:top-6 left-1/2 z-[100] max-w-[92vw] sm:max-w-md pointer-events-auto cursor-pointer select-none ${
        isExiting ? 'animate-toast-out' : 'animate-toast-in'
      }`}
      role="alert"
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border border-border-light dark:border-border-dark shadow-xl shadow-black/10 dark:shadow-black/50 hover:shadow-2xl transition-all">
        {/* Left Icon Pill */}
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${config.bgColor}`}>
          <IconComp size={16} strokeWidth={2.5} />
        </div>

        {/* Text Container */}
        <div className="min-w-0 pr-1">
          <div className="flex items-center gap-2">
            <h5 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              {toast.title}
            </h5>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-medium ${config.badgeBg}`}>
              {config.badgeText}
            </span>
          </div>
          {toast.message && (
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 truncate max-w-[220px] sm:max-w-xs">
              {toast.message}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleManualDismiss();
          }}
          className="ml-auto text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 -mr-1"
          aria-label="ปิดการแจ้งเตือน"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
