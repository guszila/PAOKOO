import React from 'react';
import { X } from 'lucide-react';
import { CenterModal } from '../common/CenterModal';

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
  return (
    <CenterModal
      isOpen={Boolean(isOpen && imageUrl)}
      onClose={onClose}
      backdropClassName="bg-black/80 backdrop-blur-sm"
      cardClassName="p-4 space-y-3 overflow-hidden"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
            สลิปโอนเงิน
          </h3>
          {date && <p className="text-[11px] text-neutral-400">วันที่: {date}</p>}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors shrink-0"
          aria-label="ปิด"
        >
          <X size={16} />
        </button>
      </div>

      {/* Full Image */}
      {imageUrl && (
        <div className="relative rounded-2xl overflow-hidden bg-black/5 dark:bg-black/20 max-h-[65dvh] flex items-center justify-center">
          <img
            src={imageUrl}
            alt="สลิปโอนเงิน"
            className="w-full h-auto max-h-[62dvh] object-contain rounded-xl"
          />
        </div>
      )}

      {/* Ref No Footer */}
      {refNo && (
        <div className="text-[11px] text-neutral-500 font-mono text-center break-all pt-1">
          Ref: {refNo}
        </div>
      )}
    </CenterModal>
  );
};
