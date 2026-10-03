import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none';

  const sizeStyles = {
    sm: 'min-h-[38px] px-3 text-xs rounded-xl gap-1.5',
    md: 'min-h-[44px] px-4 text-sm rounded-2xl gap-2', // min 44px tap target
    lg: 'min-h-[50px] px-6 text-base rounded-2xl gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100',
    secondary: 'bg-surfaceElevated-light dark:bg-surfaceElevated-dark text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-border-light dark:border-border-dark',
    outline: 'bg-transparent text-neutral-700 dark:text-neutral-300 border border-border-light dark:border-border-dark hover:bg-neutral-100 dark:hover:bg-neutral-800',
    danger: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/60',
    ghost: 'bg-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
