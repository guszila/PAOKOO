import React, { useState, useEffect } from 'react';
import { Transaction } from '../../types/transaction';
import { Button } from '../common/Button';
import { APP_NAME, APP_SUBTITLE } from '../../config/app';
import { MAX_CATEGORIES } from '../../config/categories';
import { getCategoryEmoji } from '../../config/emojis';
import {
  Users,
  Check,
  RefreshCw,
  Tag,
  Plus,
  X,
  AlertTriangle,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';

import { User } from 'firebase/auth';
import { Household } from '../../types/household';
import { ThemeMode, ColorTheme, COLOR_THEMES } from '../../hooks/useTheme';
import { Switch } from '../common/Switch';

interface SettingsViewProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  colorTheme?: ColorTheme;
  onColorThemeChange?: (color: ColorTheme) => void;
  transactions?: Transaction[];
  members: string[];
  categories: string[];
  user: User | null;
  household: Household | null;
  onOpenAuth: () => void;
  onOpenHousehold: () => void;
  onLogout: () => void;
  onUpdateMembers: (newMembers: string[]) => void;
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
  onImportData?: (importedTxs: Transaction[], importedMembers?: string[], importedCategories?: string[]) => void;
  onResetData: () => void;
  localTransactionsCount?: number;
  onMigrateLocalToCloud?: () => Promise<{ count: number }>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onThemeChange,
  colorTheme = 'dmg',
  onColorThemeChange,
  members,
  categories,
  user,
  household,
  onOpenAuth,
  onOpenHousehold,
  onLogout,
  onUpdateMembers,
  onAddCategory,
  onDeleteCategory,
  onResetData,
  localTransactionsCount = 0,
  onMigrateLocalToCloud,
}) => {
  const [member1, setMember1] = useState(members[0] || 'โฟกัส');
  const [member2, setMember2] = useState(members[1] || 'ต้นหยง');
  const [isSavedMembers, setIsSavedMembers] = useState(false);

  // Preference switches
  const [coinEnabled, setCoinEnabled] = useState(() => {
    return localStorage.getItem('paokoo_coin_enabled') !== 'false';
  });
  const [hapticEnabled, setHapticEnabled] = useState(() => {
    return localStorage.getItem('paokoo_haptic_enabled') !== 'false';
  });

  const handleToggleCoin = (checked: boolean) => {
    setCoinEnabled(checked);
    localStorage.setItem('paokoo_coin_enabled', String(checked));
  };

  const handleToggleHaptic = (checked: boolean) => {
    setHapticEnabled(checked);
    localStorage.setItem('paokoo_haptic_enabled', String(checked));
    if (checked && navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  // Migration state
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrateMessage, setMigrateMessage] = useState<string | null>(null);

  const handleMigrateLocal = async () => {
    if (!onMigrateLocalToCloud) return;
    setIsMigrating(true);
    setMigrateMessage(null);
    try {
      const res = await onMigrateLocalToCloud();
      setMigrateMessage(`ซิงค์เข้าบัญชีคู่สำเร็จ ${res.count} รายการ`);
      setTimeout(() => setMigrateMessage(null), 5000);
    } catch (err: any) {
      setMigrateMessage(err.message || 'ซิงค์ไม่สำเร็จ');
      setTimeout(() => setMigrateMessage(null), 5000);
    } finally {
      setIsMigrating(false);
    }
  };

  useEffect(() => {
    if (members[0]) setMember1(members[0]);
    if (members[1]) setMember2(members[1]);
  }, [members]);

  // New category input
  const [newCatInput, setNewCatInput] = useState('');

  // Reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const handleSaveMembers = (e: React.FormEvent) => {
    e.preventDefault();
    if (!member1.trim() || !member2.trim()) return;
    onUpdateMembers([member1.trim(), member2.trim()]);
    setIsSavedMembers(true);
    setTimeout(() => setIsSavedMembers(false), 2000);
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    onAddCategory(trimmed);
    setNewCatInput('');
  };

  const handleExecuteReset = () => {
    if (confirmInput === 'RESET' || confirmInput === 'รีเซ็ต') {
      onResetData();
      setShowResetModal(false);
      setConfirmInput('');
      alert('ล้างข้อมูลรายการทั้งหมดเรียบร้อยแล้ว');
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* App Info Card */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-5 shadow-sm text-center">
        <img
          src="/paokoo-logo-dark.svg"
          alt="PAOKOO Logo"
          className="w-16 h-16 mx-auto object-contain drop-shadow-sm mb-2"
        />
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{APP_NAME}</h2>
        <p className="text-xs text-neutral-500 mt-0.5">{APP_SUBTITLE}</p>
        <div className="inline-block mt-3 text-[11px] px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-900/40">
          บันทึกในอุปกรณ์ (Local-first)
        </div>
      </div>

      {/* Theme & Appearance Section */}
      <div className="bg-surface-light dark:bg-surface-dark border-2 border-[#242A20] dark:border-[#3C4A38] rounded-2xl p-4 sm:p-5 shadow-[3px_3px_0px_#242A20] dark:shadow-[3px_3px_0px_#0A0F0A] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-[#242A20]">
              <Sun size={15} strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-silkscreen text-xs font-bold text-neutral-900 dark:text-neutral-100">
                THEME / ธีมและการแสดงผล
              </h3>
              <p className="text-[11px] text-neutral-500">
                เลือกโหมดสว่าง-มืด และสีตัวเครื่อง Game Boy
              </p>
            </div>
          </div>
        </div>

        {/* Theme Segmented Switch with Butter-Smooth Sliding Indicator */}
        <div className="relative grid grid-cols-3 p-1 bg-surfaceElevated-light dark:bg-surfaceElevated-dark rounded-xl border-2 border-[#242A20] dark:border-[#3C4A38] select-none">
          {/* Sliding Pill Indicator */}
          <div
            className="absolute top-1 bottom-1 w-[calc(33.333%-2.67px)] bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm border border-[#242A20] dark:border-[#3C4A38] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
              left:
                theme === 'light'
                  ? '4px'
                  : theme === 'dark'
                  ? 'calc(33.333% + 1.33px)'
                  : 'calc(66.666% - 1.33px)',
            }}
          />

          <button
            type="button"
            onClick={() => onThemeChange('light')}
            className={`relative z-10 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-silkscreen font-bold transition-colors duration-200 active:scale-95 ${
              theme === 'light'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Sun size={14} />
            <span>สว่าง</span>
          </button>

          <button
            type="button"
            onClick={() => onThemeChange('dark')}
            className={`relative z-10 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-silkscreen font-bold transition-colors duration-200 active:scale-95 ${
              theme === 'dark'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Moon size={14} />
            <span>มืด</span>
          </button>

          <button
            type="button"
            onClick={() => onThemeChange('system')}
            className={`relative z-10 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-silkscreen font-bold transition-colors duration-200 active:scale-95 ${
              theme === 'system'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Laptop size={14} />
            <span>ระบบ</span>
          </button>
        </div>

        {/* Color Palette (Game Boy Edition) */}
        <div className="pt-3 border-t-2 border-dashed border-[#242A20]/20 dark:border-[#3C4A38]/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-silkscreen text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
              COLOR EDITIONS / สีธีม Game Boy
            </span>
            <span className="font-pixel text-[8px] px-1.5 py-0.5 rounded bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-[#242A20] dark:border-[#3C4A38] text-neutral-700 dark:text-neutral-300">
              {COLOR_THEMES.find((c) => c.id === colorTheme)?.name || 'DMG Classic'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {COLOR_THEMES.map((item) => {
              const isSelected = colorTheme === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onColorThemeChange?.(item.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-all select-none active:translate-x-[1px] active:translate-y-[1px] ${
                    isSelected
                      ? 'border-[#242A20] dark:border-white bg-surfaceElevated-light dark:bg-surfaceElevated-dark shadow-[2px_2px_0px_#242A20] dark:shadow-[2px_2px_0px_#fff]'
                      : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:border-neutral-400 opacity-80 hover:opacity-100 shadow-[1px_1px_0px_#242A20]/40'
                  }`}
                >
                  {/* Color Swatch Icon */}
                  <div
                    className="w-5 h-5 rounded-md border border-[#242A20] shadow-[1px_1px_0px_#242A20] flex items-center justify-center shrink-0"
                    style={{ backgroundColor: item.screenColor }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.accentColor }}
                    />
                  </div>

                  <div className="text-left min-w-0">
                    <div className="font-silkscreen text-[10px] font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {item.name}
                    </div>
                    <div className="text-[9px] text-neutral-500 truncate">
                      {item.nameTh}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Animation & Sound Preferences with Butter-Smooth Switches */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          ลูกเล่นและการตอบสนอง (Preferences)
        </h3>

        <div className="space-y-4 divide-y divide-border-light dark:divide-border-dark pt-1">
          <div className="pt-1">
            <Switch
              checked={coinEnabled}
              onChange={handleToggleCoin}
              label="แอนิเมชันเหรียญร่วง (Coin Shower)"
              description="แสดงเหรียญทองโปรยปรายเมื่อบันทึกเงินเข้าหรือได้รับเงินคืน"
            />
          </div>

          <div className="pt-3">
            <Switch
              checked={hapticEnabled}
              onChange={handleToggleHaptic}
              label="การตอบสนองแบบสั่น (Haptic Feedback)"
              description="สั่นสะเทือนเบาๆ เมื่อแตะปุ่มและบันทึกรายการบนมือถือ"
            />
          </div>
        </div>
      </div>

      {/* Two-User Cloud Sync Section */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Users size={16} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                ระบบซิงค์ 2 คน (บัญชีคู่)
              </h3>
              <p className="text-[11px] text-neutral-500">
                {user ? `เข้าสู่ระบบด้วย: ${user.email}` : 'ใช้งานในเครื่อง (ยังไม่ได้เชื่อมต่อ)'}
              </p>
            </div>
          </div>
        </div>

        {user ? (
          <div className="space-y-2 pt-1">
            {household ? (
              <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                    {household.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-medium">
                    {household.isLocked ? 'ซิงค์ 2 คนเรียลไทม์' : 'รอคู่ของคุณ (1/2)'}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-600 dark:text-neutral-400">
                  รหัสเชิญ: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{household.inviteCode}</span>
                </div>

                {/* Local to Cloud sync badge inside card */}
                {localTransactionsCount > 0 && onMigrateLocalToCloud && (
                  <div className="pt-1.5 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      มีในเครื่อง {localTransactionsCount} รายการ
                    </span>
                    <button
                      type="button"
                      onClick={handleMigrateLocal}
                      disabled={isMigrating}
                      className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 underline hover:text-emerald-900 dark:hover:text-white"
                    >
                      {isMigrating ? 'กำลังซิงค์...' : 'นำเข้าสู่บัญชีคู่'}
                    </button>
                  </div>
                )}
                {migrateMessage && (
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
                    ✓ {migrateMessage}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
                ยังไม่ได้สร้างหรือเข้าร่วมบัญชีคู่
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" fullWidth onClick={onOpenHousehold}>
                {household ? 'จัดการบัญชีคู่ / ดูรหัส' : 'สร้างหรือเข้าร่วมบัญชีคู่'}
              </Button>
              <Button variant="outline" size="sm" onClick={onLogout} className="shrink-0 text-xs text-neutral-500">
                ออกจากระบบ
              </Button>
            </div>
          </div>
        ) : (
          <div className="pt-1">
            <Button variant="primary" size="md" fullWidth onClick={onOpenAuth}>
              เข้าสู่ระบบ / สมัครเพื่อซิงค์ 2 คน
            </Button>
          </div>
        )}
      </div>
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
            <Users size={14} strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            ชื่อสมาชิกบัญชีคู่ (2 คน)
          </h3>
        </div>

        <form onSubmit={handleSaveMembers} className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] text-neutral-500 block mb-1">คนที่ 1</label>
              <input
                type="text"
                value={member1}
                onChange={(e) => setMember1(e.target.value)}
                className="w-full px-3 py-2 bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-border-light dark:border-border-dark rounded-xl text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-neutral-500 block mb-1">คนที่ 2</label>
              <input
                type="text"
                value={member2}
                onChange={(e) => setMember2(e.target.value)}
                className="w-full px-3 py-2 bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-border-light dark:border-border-dark rounded-xl text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
            </div>
          </div>

          <Button type="submit" variant="secondary" size="sm" fullWidth>
            {isSavedMembers ? (
              <>
                <Check size={14} className="text-emerald-500 mr-1" />
                <span>บันทึกชื่อเรียบร้อย</span>
              </>
            ) : (
              'บันทึกชื่อสมาชิก'
            )}
          </Button>
        </form>
      </div>

      {/* Expense Categories Manager */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400">
              <Tag size={14} strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              หมวดหมู่รายจ่าย ({categories.length}/{MAX_CATEGORIES})
            </h3>
          </div>
          <span className="text-[11px] text-neutral-400">สูงสุด 12 หมวด</span>
        </div>

        {/* Existing Categories Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {categories.map((cat) => (
            <div
              key={cat}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-border-light dark:border-border-dark text-neutral-800 dark:text-neutral-200"
            >
              <span className="text-sm">{getCategoryEmoji(cat)}</span>
              <span>{cat}</span>
              {categories.length > 1 && (
                <button
                  type="button"
                  onClick={() => onDeleteCategory(cat)}
                  className="text-neutral-400 hover:text-red-500 p-0.5 rounded-full"
                  title={`ลบหมวด ${cat}`}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Category Form */}
        {categories.length < MAX_CATEGORIES && (
          <form onSubmit={handleAddCategorySubmit} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newCatInput}
              onChange={(e) => setNewCatInput(e.target.value)}
              placeholder="เพิ่มหมวดใหม่..."
              className="flex-1 px-3 py-2 bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-border-light dark:border-border-dark rounded-xl text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
            />
            <Button type="submit" size="sm" variant="secondary" className="shrink-0 text-xs">
              <Plus size={13} className="mr-0.5" />
              <span>เพิ่ม</span>
            </Button>
          </form>
        )}
      </div>

      {/* Danger Zone: Reset with Type to Confirm Modal */}
      <div className="p-4 rounded-3xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-red-600 dark:text-red-400">
            รีเซ็ตข้อมูลเริ่มต้น
          </div>
          <div className="text-[11px] text-neutral-500">
            ล้างข้อมูลรายการทั้งหมดและเริ่มต้นใหม่
          </div>
        </div>
        <Button
          size="sm"
          variant="danger"
          onClick={() => {
            setConfirmInput('');
            setShowResetModal(true);
          }}
          className="text-xs"
        >
          <RefreshCw size={13} className="mr-1" />
          รีเซ็ตข้อมูล
        </Button>
      </div>

      {/* Type-To-Confirm Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowResetModal(false)} />
          <div className="relative w-full max-w-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-5 shadow-2xl z-10 space-y-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <AlertTriangle size={22} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  ยืนยันการรีเซ็ตข้อมูล
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                  การกระทำนี้จะล้างธุรกรรมทั้งหมดและคืนค่าเริ่มต้น เพื่อยืนยัน กรุณาพิมพ์คำว่า <b className="text-red-600 dark:text-red-400 font-mono">รีเซ็ต</b> หรือ <b className="text-red-600 dark:text-red-400 font-mono">RESET</b> ในช่องด้านล่าง
                </p>
              </div>
            </div>

            <div>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="พิมพ์ รีเซ็ต หรือ RESET เพื่อยืนยัน"
                className="w-full px-3.5 py-2.5 bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-border-light dark:border-border-dark rounded-xl text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button variant="secondary" fullWidth onClick={() => setShowResetModal(false)}>
                ยกเลิก
              </Button>
              <Button
                variant="danger"
                fullWidth
                disabled={confirmInput !== 'RESET' && confirmInput !== 'รีเซ็ต'}
                onClick={handleExecuteReset}
              >
                ยืนยันการรีเซ็ต
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
