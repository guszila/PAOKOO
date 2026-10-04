import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastItem, ToastType } from '../types/toast';
import { Toast } from '../components/common/Toast';

interface ToastContextValue {
  showToast: (params: {
    type: ToastType;
    title: string;
    message?: string;
    durationMs?: number;
  }) => void;
  dismissToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastItem | null>(null);

  const showToast = useCallback(
    ({
      type,
      title,
      message,
      durationMs,
    }: {
      type: ToastType;
      title: string;
      message?: string;
      durationMs?: number;
    }) => {
      setToast({
        id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        title,
        message,
        durationMs,
      });
    },
    []
  );

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <Toast toast={toast} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
