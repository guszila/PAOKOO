import React from 'react';
import { Button } from './Button';
import { CenterModal } from './CenterModal';
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
  return (
    <CenterModal
      isOpen={isOpen}
      onClose={onCancel}
      backdropClassName="bg-black/50 backdrop-blur-sm"
      cardClassName="p-5 space-y-4"
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
    </CenterModal>
  );
};
