import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { Button } from '../common/Button';
import { PocketSummary } from '../../types/pocket';
import { parseToSatang, formatSatang } from '../../lib/money';
import { PlusCircle } from 'lucide-react';
import { POCKET_ICONS } from './PocketModal';

interface PocketTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  pocketSummary: PocketSummary | null;
  onTopUp: (pocketId: string, additionalSatang: number) => void;
}

export const PocketTopUpModal: React.FC<PocketTopUpModalProps> = ({
  isOpen,
  onClose,
  pocketSummary,
  onTopUp,
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmountStr('');
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!pocketSummary) return null;

  const { pocket, remainingSatang } = pocketSummary;
  const IconComp = (pocket.icon && POCKET_ICONS[pocket.icon]) || PlusCircle;

  const quickAmounts = [500, 1000, 2000, 3000];

  const handleAddQuick = (val: number) => {
    const current = parseFloat(amountStr) || 0;
    setAmountStr((current + val).toString());
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const additionalSatang = parseToSatang(amountStr);
    if (additionalSatang <= 0) {
      setErrorMsg('กรุณากรอกจำนวนเงินที่ต้องการเติม (มากกว่า 0 บาท)');
      return;
    }

    onTopUp(pocket.id, additionalSatang);
    onClose();
  };

  const parsedAdditional = parseToSatang(amountStr);
  const newTotalAllocated = pocket.allocatedSatang + (parsedAdditional > 0 ? parsedAdditional : 0);
  const newRemaining = remainingSatang + (parsedAdditional > 0 ? parsedAdditional : 0);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`เติมเงินเข้ากล่อง "${pocket.name}"`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-200 dark:border-red-900/40">
            {errorMsg}
          </div>
        )}

        {/* Current Balance in Pocket Banner */}
        <div className="p-3.5 bg-neutral-50 dark:bg-surfaceElevated-dark rounded-2xl border border-border-light dark:border-border-dark flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: pocket.color || '#10B981' }}
            >
              <IconComp size={20} strokeWidth={2} />
            </div>
            <div>
              <div className="text-xs text-neutral-500">{pocket.name}</div>
              <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                เหลือในกล่องตอนนี้: {formatSatang(remainingSatang)} ฿
              </div>
            </div>
          </div>
        </div>

        {/* Top Up Input */}
        <div>
          <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
            จำนวนเงินที่ต้องการเติมเพิ่ม (บาท)
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              inputMode="decimal"
              placeholder="1000"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full px-3.5 py-2.5 pr-12 bg-neutral-50 dark:bg-surfaceElevated-dark border border-border-light dark:border-border-dark rounded-xl text-neutral-900 dark:text-neutral-100 font-semibold text-xl placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
              บาท
            </span>
          </div>

          {/* Quick Add Buttons */}
          <div className="grid grid-cols-4 gap-2 mt-2">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleAddQuick(amt)}
                className="py-1.5 text-xs font-medium rounded-xl border border-border-light dark:border-border-dark hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
              >
                +{amt.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Projected Balance Preview */}
        {parsedAdditional > 0 && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-xs space-y-1 text-emerald-900 dark:text-emerald-200">
            <div className="flex justify-between">
              <span>ยอดคงเหลือใหม่ในกล่อง:</span>
              <span className="font-semibold tabular-nums">{formatSatang(newRemaining)} ฿</span>
            </div>
            <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
              <span>วงเงินรวมที่ตั้งไว้:</span>
              <span className="tabular-nums">{formatSatang(newTotalAllocated)} ฿</span>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="pt-2 flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            ยกเลิก
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            ยืนยันการเติมเงิน
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
};
