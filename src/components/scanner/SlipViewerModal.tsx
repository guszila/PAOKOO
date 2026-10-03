import React from 'react';
import { X } from 'lucide-react';

interface SlipViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  refNo?: string;
  date?: string;
}

export const SlipViewerModal: React.FC<SlipViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  refNo,
  date,
}) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative max-w-sm w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl overflow-hidden shadow-2xl space-y-3 p-4">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              สลิปโอนเงิน
            </h3>
            {date && <p className="text-[11px] text-neutral-400">วันที่: {date}</p>}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
            aria-label="ปิด"
          >
            <X size={16} />
          </button>
        </div>

        {/* Full Image */}
        <div className="relative rounded-2xl overflow-hidden bg-black/5 dark:bg-black/20 max-h-[70vh] flex items-center justify-center">
          <img
            src={imageUrl}
            alt="สลิปโอนเงิน"
            className="w-full h-auto max-h-[65vh] object-contain rounded-xl"
          />
        </div>

        {/* Ref No Footer */}
        {refNo && (
          <div className="text-[11px] text-neutral-500 font-mono text-center break-all pt-1">
            Ref: {refNo}
          </div>
        )}
      </div>
    </div>
  );
};
