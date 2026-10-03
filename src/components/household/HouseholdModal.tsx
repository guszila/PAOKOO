import React, { useState } from 'react';
import { Household } from '../../types/household';
import { Button } from '../common/Button';
import { Users, Copy, Check, Lock, Plus, ArrowRight, X, AlertCircle } from 'lucide-react';

interface HouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  household: Household | null;
  currentUserId?: string;
  onCreateHousehold: (name: string, myName: string) => Promise<any>;
  onJoinHousehold: (code: string, myName: string) => Promise<any>;
  onDisconnect: () => void;
}

export const HouseholdModal: React.FC<HouseholdModalProps> = ({
  isOpen,
  onClose,
  household,
  currentUserId,
  onCreateHousehold,
  onJoinHousehold,
  onDisconnect,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [houseName, setHouseName] = useState('บัญชีคู่ของเรา');
  const [myName, setMyName] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onCreateHousehold(houseName, myName);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onJoinHousehold(inviteCodeInput, myName);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-6 shadow-2xl z-10 space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                บัญชีคู่ 2 คน (Household)
              </h3>
              <p className="text-xs text-neutral-500">ซิงค์ข้อมูลกระเป๋าตังค์ร่วมกัน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* State 1: Already in a household */}
        {household ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-border-light dark:border-border-dark space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  {household.name}
                </span>
                {household.isLocked ? (
                  <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium">
                    <Lock size={11} />
                    <span>สมาชิกครบ 2 คน (ล็อกแล้ว)</span>
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-medium">
                    รอคู่ของคุณเข้าร่วม (1/2)
                  </span>
                )}
              </div>

              {/* Members list */}
              <div className="space-y-1.5">
                <div className="text-[11px] text-neutral-400">สมาชิกในบัญชีคู่:</div>
                {household.members.map((uid, idx) => (
                  <div key={uid} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      {household.memberNames[uid] || `สมาชิกคนที่ ${idx + 1}`}
                      {uid === currentUserId && ' (คุณ)'}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {uid === household.members[0] ? 'ผู้สร้าง' : 'คู่ร่วม'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Invite Code (if still waiting for 2nd person) */}
              {!household.isLocked && (
                <div className="pt-2 border-t border-border-light dark:border-border-dark space-y-1.5">
                  <div className="text-[11px] text-neutral-500">
                    แชร์รหัสเชิญนี้ให้คู่ของคุณเพื่อเข้าร่วม:
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-surface-light dark:bg-surface-dark border-2 border-dashed border-emerald-500/40 rounded-xl">
                    <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                      {household.inviteCode}
                    </span>
                    <button
                      onClick={() => handleCopyCode(household.inviteCode)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกรหัส'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => {
                if (confirm('ต้องการยกเลิกการเชื่อมต่อบัญชีคู่นี้จากอุปกรณ์ใช่หรือไม่?')) {
                  onDisconnect();
                }
              }}
              className="text-xs text-red-500 border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              ยกเลิกการเชื่อมต่อในเครื่องนี้
            </Button>
          </div>
        ) : (
          /* State 2: Not in a household yet -> Create or Join */
          <div className="space-y-4">
            <div className="grid grid-cols-2 p-1 bg-surfaceElevated-light dark:bg-surfaceElevated-dark rounded-xl border border-border-light dark:border-border-dark">
              <button
                type="button"
                onClick={() => {
                  setTab('create');
                  setError(null);
                }}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                  tab === 'create'
                    ? 'bg-surface-light dark:bg-surface-dark text-neutral-900 dark:text-white shadow-sm border border-border-light dark:border-border-dark'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                สร้างบัญชีคู่ (คนแรก)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('join');
                  setError(null);
                }}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                  tab === 'join'
                    ? 'bg-surface-light dark:bg-surface-dark text-neutral-900 dark:text-white shadow-sm border border-border-light dark:border-border-dark'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                มีรหัสเชิญ (คนที่สอง)
              </button>
            </div>

            {tab === 'create' ? (
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-500">ชื่อบัญชีคู่</label>
                  <input
                    type="text"
                    value={houseName}
                    onChange={(e) => setHouseName(e.target.value)}
                    placeholder="เช่น บัญชีคู่ของเรา"
                    required
                    className="w-full px-3 py-2 bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-border-light dark:border-border-dark rounded-xl text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-500">ชื่อของคุณ</label>
                  <input
                    type="text"
                    value={myName}
                    onChange={(e) => setMyName(e.target.value)}
                    placeholder="เช่น โฟกัส"
                    required
                    className="w-full px-3 py-2 bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-border-light dark:border-border-dark rounded-xl text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
                  />
                </div>

                {error && (
                  <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" variant="primary" fullWidth size="md" disabled={loading}>
                  <Plus size={15} className="mr-1" />
                  <span>{loading ? 'กำลังสร้าง...' : 'สร้างบัญชีคู่และรับรหัสเชิญ'}</span>
                </Button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-500">รหัสเชิญ (จากคู่ของคุณ)</label>
                  <input
                    type="text"
                    value={inviteCodeInput}
                    onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                    placeholder="เช่น PK-8492"
                    required
                    maxLength={10}
                    className="w-full font-mono text-center text-sm font-bold tracking-widest uppercase px-3 py-2.5 bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-border-light dark:border-border-dark rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none placeholder:font-normal"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-500">ชื่อของคุณ</label>
                  <input
                    type="text"
                    value={myName}
                    onChange={(e) => setMyName(e.target.value)}
                    placeholder="เช่น ต้นหยง"
                    required
                    className="w-full px-3 py-2 bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-border-light dark:border-border-dark rounded-xl text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
                  />
                </div>

                {error && (
                  <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" variant="primary" fullWidth size="md" disabled={loading}>
                  <ArrowRight size={15} className="mr-1" />
                  <span>{loading ? 'กำลังเข้าร่วม...' : 'เข้าร่วมบัญชีคู่นี้'}</span>
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
