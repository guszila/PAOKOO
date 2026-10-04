import React, { useEffect, useState } from 'react';
import { Button } from './Button';
import { AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let animFrame: number;
    let timer: NodeJS.Timeout;

    if (isOpen) {
      setIsMounted(true);
      animFrame = requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      timer = setTimeout(() => {
        setIsMounted(false);
      }, 200);
    }

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (timer) clearTimeout(timer);
    };
  }, [isOpen]);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCancel}
      />
      <div
        className={`relative w-full max-w-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-5 shadow-2xl z-10 space-y-4 transition-all duration-200 ease-out ${
          isVisible
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
            <AlertCircle size={22} strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{title}</h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button variant="secondary" fullWidth onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'primary'}
            fullWidth
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
