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
  const baseStyles = 'inline-flex items-center justify-center font-silkscreen font-bold tracking-tight transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none select-none';

  const sizeStyles = {
    sm: 'min-h-[34px] px-3 text-xs rounded-lg gap-1.5',
    md: 'min-h-[42px] px-4 text-xs rounded-xl gap-2',
    lg: 'min-h-[48px] px-6 text-sm rounded-xl gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#8B1E43] text-white hover:bg-[#9B234C] border-2 border-[#242A20] dark:border-[#3C4A38] shadow-[2.5px_2.5px_0px_#242A20] dark:shadow-[2.5px_2.5px_0px_#0A0F0A] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none',
    secondary:
      'bg-surfaceElevated-light dark:bg-surfaceElevated-dark text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 border-2 border-[#242A20] dark:border-[#3C4A38] shadow-[2.5px_2.5px_0px_#242A20] dark:shadow-[2.5px_2.5px_0px_#0A0F0A] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none',
    outline:
      'bg-transparent text-neutral-800 dark:text-neutral-200 border-2 border-[#242A20] dark:border-[#3C4A38] shadow-[2px_2px_0px_#242A20] dark:shadow-[2px_2px_0px_#0A0F0A] hover:bg-neutral-200/50 dark:hover:bg-neutral-800 active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none',
    danger:
      'bg-red-600 text-white border-2 border-[#242A20] dark:border-[#3C4A38] shadow-[2.5px_2.5px_0px_#242A20] dark:shadow-[2.5px_2.5px_0px_#0A0F0A] hover:bg-red-700 active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none',
    ghost:
      'bg-transparent text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white',
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
