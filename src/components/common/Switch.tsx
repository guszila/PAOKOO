import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
  icon?: React.ReactNode;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  id,
  icon,
}) => {
  const switchId = id || `pk-switch-${Math.random().toString(36).slice(2, 8)}`;

  // Size styling map
  const sizeMap = {
    sm: {
      track: 'w-10 h-6 p-0.5',
      thumb: 'w-5 h-5',
      translate: 'translate-x-4',
    },
    md: {
      track: 'w-12 h-7 p-0.5',
      thumb: 'w-6 h-6',
      translate: 'translate-x-5',
    },
    lg: {
      track: 'w-14 h-8 p-1',
      thumb: 'w-6 h-6',
      translate: 'translate-x-6',
    },
  }[size];

  const handleToggle = () => {
    if (disabled) return;
    onChange(!checked);
  };

  return (
    <div
      onClick={handleToggle}
      className={`inline-flex items-center justify-between gap-3 select-none cursor-pointer group ${
        disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
      }`}
    >
      {(label || description || icon) && (
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && <div className="shrink-0">{icon}</div>}
          <div className="flex flex-col">
            {label && (
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                {label}
              </span>
            )}
            {description && (
              <span className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-tight">
                {description}
              </span>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        id={switchId}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        className={`relative inline-flex items-center shrink-0 rounded-full transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 active:scale-95 ${
          sizeMap.track
        } ${
          checked
            ? 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
            : 'bg-neutral-300 dark:bg-neutral-700/80 hover:bg-neutral-350 dark:hover:bg-neutral-600/80'
        }`}
      >
        <span
          className={`inline-block rounded-full bg-white dark:bg-white shadow-[0_2px_5px_rgba(0,0,0,0.2)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active:w-[1.4rem] ${
            sizeMap.thumb
          } ${checked ? sizeMap.translate : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
};
