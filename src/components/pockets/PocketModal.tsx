import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { Button } from '../common/Button';
import { ConfirmModal } from '../common/ConfirmModal';
import { Pocket } from '../../types/pocket';
import { parseToSatang, satangToBaht } from '../../lib/money';
import {
  Wallet,
  Utensils,
  Coffee,
  ShoppingBag,
  Car,
  Plane,
  Heart,
  Smile,
  Gamepad2,
  Gift,
  Trash2,
} from 'lucide-react';

interface PocketModalProps {
  isOpen: boolean;
  onClose: () => void;
  pocket?: Pocket | null; // If null/undefined, create mode. If set, edit mode.
  onSave: (data: { name: string; allocatedSatang: number; color: string; icon: string }) => void;
  onDelete?: (id: string) => void;
}

export const POCKET_ICONS: Record<string, React.ElementType> = {
  wallet: Wallet,
  utensils: Utensils,
  coffee: Coffee,
  'shopping-bag': ShoppingBag,
  car: Car,
  plane: Plane,
  heart: Heart,
  smile: Smile,
  'gamepad-2': Gamepad2,
  gift: Gift,
};

export const POCKET_COLORS = [
  { label: 'ม่วงลาเวนเดอร์', value: '#8B5CF6', bgClass: 'bg-purple-500' },
  { label: 'ฟ้าน้ำทะเล', value: '#3B82F6', bgClass: 'bg-blue-500' },
  { label: 'ฟ้าคราม', value: '#06B6D4', bgClass: 'bg-cyan-500' },
  { label: 'ชมพูกุหลาบ', value: '#F43F5E', bgClass: 'bg-rose-500' },
  { label: 'ครามคราม', value: '#6366F1', bgClass: 'bg-indigo-500' },
  { label: 'เขียวมิ้นต์', value: '#14B8A6', bgClass: 'bg-teal-500' },
];

export const PocketModal: React.FC<PocketModalProps> = ({
  isOpen,
  onClose,
  pocket,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [color, setColor] = useState('#8B5CF6');
  const [icon, setIcon] = useState('wallet');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (pocket) {
      setName(pocket.name);
      setAmountStr(satangToBaht(pocket.allocatedSatang).toString());
      const pColor = pocket.color?.toLowerCase();
      if (!pocket.color || pColor === '#10b981' || pColor === '#f59e0b') {
        setColor('#8B5CF6');
      } else {
        setColor(pocket.color);
      }
      setIcon(pocket.icon || 'wallet');
    } else {
      setName('');
      setAmountStr('');
      setColor('#8B5CF6');
      setIcon('wallet');
    }
    setErrorMsg(null);
    setShowDeleteConfirm(false);
  }, [isOpen, pocket]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('กรุณากรอกชื่อกล่องเงิน');
      return;
    }

    const satang = parseToSatang(amountStr);
    if (satang <= 0) {
      setErrorMsg('กรุณากรอกจำนวนเงินงบประมาณให้ถูกต้อง (มากกว่า 0 บาท)');
      return;
    }

    onSave({
      name: trimmedName,
      allocatedSatang: satang,
      color,
      icon,
    });
    onClose();
  };

  const IconComp = POCKET_ICONS[icon] || Wallet;

  const quickAmounts = [1000, 2000, 3000, 5000];

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={pocket ? 'แก้ไขกล่องแบ่งเงิน' : 'สร้างกล่องแบ่งเงินใช้'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-200 dark:border-red-900/40">
              {errorMsg}
            </div>
          )}

          {/* Preview Badge */}
          <div className="flex items-center justify-center py-2">
            <div
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-sm text-white font-medium"
              style={{ backgroundColor: color }}
            >
              <IconComp size={20} strokeWidth={2} />
              <span>{name.trim() || 'ตัวอย่างกล่องเงิน'}</span>
              <span className="text-white/80 text-sm">
                ({amountStr ? `${parseFloat(amountStr).toLocaleString()} ฿` : '0 ฿'})
              </span>
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
              ชื่อกล่องแบ่งเงิน
            </label>
            <input
              type="text"
              placeholder="เช่น เงินแบ่งใช้, ค่ากินสัปดาห์นี้, ช้อปปิ้ง"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-surfaceElevated-dark border border-border-light dark:border-border-dark rounded-xl text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              maxLength={30}
              autoFocus
            />
          </div>

          {/* Quick preset names */}
          {!pocket && (
            <div className="flex flex-wrap gap-1.5 -mt-2">
              {['เงินแบ่งใช้', 'ค่ากินประจำสัปดาห์', 'ช้อปปิ้ง & ของใช้', 'เงินเที่ยว'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setName(preset)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  + {preset}
                </button>
              ))}
            </div>
          )}

          {/* Allocated Amount Field */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
              วงเงินที่ต้องการแบ่งมาใช้ (บาท)
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                inputMode="decimal"
                placeholder="2000"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-12 bg-neutral-50 dark:bg-surfaceElevated-dark border border-border-light dark:border-border-dark rounded-xl text-neutral-900 dark:text-neutral-100 font-semibold text-lg placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                บาท
              </span>
            </div>

            {/* Quick Amount Chips */}
            <div className="flex gap-2 mt-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmountStr(amt.toString())}
                  className={`flex-1 py-1 text-xs rounded-lg border transition-all ${
                    amountStr === amt.toString()
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-medium'
                      : 'border-border-light dark:border-border-dark hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  +{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
              ไอคอน
            </label>
            <div className="grid grid-cols-5 gap-2">
              {Object.keys(POCKET_ICONS).map((iconKey) => {
                const ItemIcon = POCKET_ICONS[iconKey];
                const isSelected = icon === iconKey;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setIcon(iconKey)}
                    className={`p-2.5 flex items-center justify-center rounded-xl border transition-all ${
                      isSelected
                        ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                        : 'border-border-light dark:border-border-dark text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <ItemIcon size={20} strokeWidth={isSelected ? 2 : 1.5} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
              สีประจำกล่อง
            </label>
            <div className="flex items-center gap-3">
              {POCKET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full ${c.bgClass} flex items-center justify-center transition-transform ${
                    color === c.value
                      ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-neutral-100 scale-110 shadow-sm'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  aria-label={c.label}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
            <p className="font-medium text-emerald-800 dark:text-emerald-300">
              💡 เงินจริงในบัญชีจะไม่ถูกตัดจนกว่าจะมีรายจ่ายจริง
            </p>
            <p>
              การสร้างกล่องเป็นการแบ่งสัดส่วนเงินไว้ใช้ เมื่อคุณสแกนสลิปหรือเพิ่มรายจ่าย
              สามารถเลือกตัดจากกล่องนี้ได้ เงินในกล่องจะค่อยๆ ลดลงทีละนิดตามยอดสลิป
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex gap-2">
            {pocket && onDelete && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-500 hover:text-red-600 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 size={16} />
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              ยกเลิก
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              {pocket ? 'บันทึกการแก้ไข' : 'สร้างกล่องเงิน'}
            </Button>
          </div>
        </form>
      </BottomSheet>

      {/* Delete Confirmation */}
      {pocket && onDelete && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            onDelete(pocket.id);
            setShowDeleteConfirm(false);
            onClose();
          }}
          title="ลบกล่องแบ่งเงินนี้?"
          message={`ต้องการลบกล่อง "${pocket.name}" หรือไม่? รายการค่าใช้จ่ายในอดีตจะไม่ถูกลบ เพียงแต่จะไม่เชื่อมโยงกับกล่องนี้`}
          confirmText="ลบกล่อง"
          isDestructive={true}
        />
      )}
    </>
  );
};
