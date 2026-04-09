'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-cyber-500 text-white shadow-sm',
    'hover:bg-cyber-600 active:bg-cyber-700',
    'dark:bg-cyber-600 dark:hover:bg-cyber-500 dark:active:bg-cyber-400',
    'focus-visible:ring-cyber-500/50',
  ),
  secondary: cn(
    'bg-gray-100 text-gray-900 shadow-sm',
    'hover:bg-gray-200 active:bg-gray-300',
    'dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 dark:active:bg-gray-600',
    'focus-visible:ring-gray-400/50',
  ),
  outline: cn(
    'border border-gray-300 bg-transparent text-gray-700',
    'hover:bg-gray-50 active:bg-gray-100',
    'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700',
    'focus-visible:ring-gray-400/50',
  ),
  ghost: cn(
    'bg-transparent text-gray-600',
    'hover:bg-gray-100 active:bg-gray-200',
    'dark:text-gray-400 dark:hover:bg-gray-800 dark:active:bg-gray-700',
    'focus-visible:ring-gray-400/50',
  ),
  danger: cn(
    'bg-red-600 text-white shadow-sm',
    'hover:bg-red-700 active:bg-red-800',
    'dark:bg-red-700 dark:hover:bg-red-600 dark:active:bg-red-500',
    'focus-visible:ring-red-500/50',
  ),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-10 gap-2 rounded-lg px-4 text-sm',
  lg: 'h-12 gap-2.5 rounded-xl px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      iconRight,
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'dark:focus-visible:ring-offset-gray-900',
          'disabled:pointer-events-none disabled:opacity-50',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          icon
        )}
        {children}
        {iconRight}
      </button>
    );
  },
);
Button.displayName = 'Button';
