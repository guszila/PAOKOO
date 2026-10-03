import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Mail, Lock, User, AlertCircle, X } from 'lucide-react';
import { APP_NAME } from '../../config/app';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, pass: string) => Promise<any>;
  onRegister: (email: string, pass: string, name: string) => Promise<any>;
  error?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  error,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim() || !password) {
      setLocalError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await onLogin(email.trim(), password);
      } else {
        await onRegister(email.trim(), password, name.trim() || 'สมาชิก');
      }
      onClose();
    } catch (err: any) {
      setLocalError(err.message);
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
          <div className="flex items-center gap-2.5">
            <img
              src="/paokoo-logo-dark.svg"
              alt="PAOKOO Logo"
              className="w-10 h-10 object-contain drop-shadow-sm"
            />
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {mode === 'login' ? 'เข้าสู่ระบบบัญชีคู่' : 'สร้างบัญชีผู้ใช้ใหม่'}
              </h3>
              <p className="text-xs text-neutral-500">เพื่อซิงค์ข้อมูลเรียลไทม์ 2 คน ({APP_NAME})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-surfaceElevated-light dark:bg-surfaceElevated-dark rounded-xl border border-border-light dark:border-border-dark">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setLocalError(null);
            }}
            className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-surface-light dark:bg-surface-dark text-neutral-900 dark:text-white shadow-sm border border-border-light dark:border-border-dark'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setLocalError(null);
            }}
            className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-surface-light dark:bg-surface-dark text-neutral-900 dark:text-white shadow-sm border border-border-light dark:border-border-dark'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            สมัครใหม่
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-[11px] text-neutral-500">ชื่อของคุณ (ที่ให้คู่ของคุณเห็น)</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น โฟกัส หรือ ต้นหยง"
                  className="w-full pl-9 pr-3 py-2 bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-border-light dark:border-border-dark rounded-xl text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] text-neutral-500">อีเมล</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                className="w-full pl-9 pr-3 py-2 bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-border-light dark:border-border-dark rounded-xl text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-neutral-500">รหัสผ่าน</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                required
                minLength={6}
                className="w-full pl-9 pr-3 py-2 bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-border-light dark:border-border-dark rounded-xl text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
            </div>
          </div>

          {(localError || error) && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <AlertCircle size={14} className="shrink-0" />
              <span>{localError || error}</span>
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth size="md" disabled={loading}>
            {loading ? 'กำลังดำเนินการ...' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชีผู้ใช้'}
          </Button>
        </form>
      </div>
    </div>
  );
};
