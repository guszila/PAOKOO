import React, { useEffect, useRef, useState } from 'react';
import { acquireScrollLock, releaseScrollLock } from '../../lib/scrollLock';

interface CenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
  cardClassName?: string;
  backdropClassName?: string;
}

/**
 * Shared centered dialog container with smooth fade+scale entry/exit animations,
 * mobile-safe viewport scrolling (max-h-[90dvh]), Escape key support, and ref-counted scroll lock.
 */
export const CenterModal: React.FC<CenterModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidthClass = 'max-w-sm',
  cardClassName = 'p-5 space-y-4',
  backdropClassName = 'bg-black/60 backdrop-blur-sm',
}) => {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const hasLockRef = useRef(false);

  useEffect(() => {
    let animFrame: number;
    let timer: ReturnType<typeof setTimeout>;

    if (isOpen) {
      setIsMounted(true);
      if (!hasLockRef.current) {
        acquireScrollLock();
        hasLockRef.current = true;
      }
      animFrame = requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      timer = setTimeout(() => {
        setIsMounted(false);
        if (hasLockRef.current) {
          releaseScrollLock();
          hasLockRef.current = false;
        }
      }, 200);
    }

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (timer) clearTimeout(timer);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (hasLockRef.current) {
        releaseScrollLock();
        hasLockRef.current = false;
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isMounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isVisible ? '' : 'pointer-events-none'
      }`}
    >
      <div
        className={`fixed inset-0 transition-opacity duration-200 ease-out ${backdropClassName} ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div
        className={`relative w-full ${maxWidthClass} max-h-[90dvh] overflow-y-auto bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl shadow-2xl z-10 transition-all duration-200 ease-out ${cardClassName} ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {children}
      </div>
    </div>
  );
};
