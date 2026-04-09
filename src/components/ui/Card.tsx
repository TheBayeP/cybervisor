'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn, severityBgColor, type Severity } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Base Card
// ---------------------------------------------------------------------------

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Disable the hover lift effect */
  noHover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, noHover = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-5 shadow-sm',
        'dark:border-gray-800 dark:bg-gray-900/80',
        !noHover &&
          'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-cyber-400/40 dark:hover:border-cyber-500/40',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
Card.displayName = 'Card';

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: number; label?: string };
}

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, icon, trend, className, ...props }, ref) => (
    <Card ref={ref} className={cn('flex items-start gap-4', className)} {...props}>
      {icon && (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cyber-500/10 text-cyber-500 dark:bg-cyber-400/10 dark:text-cyber-400">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {value}
        </p>
        {trend && (
          <p
            className={cn(
              'mt-1 text-xs font-medium',
              trend.value >= 0
                ? 'text-threat-critical'
                : 'text-threat-low',
            )}
          >
            {trend.value >= 0 ? '+' : ''}
            {trend.value}%{trend.label ? ` ${trend.label}` : ''}
          </p>
        )}
      </div>
    </Card>
  ),
);
StatCard.displayName = 'StatCard';

// ---------------------------------------------------------------------------
// Alert Card
// ---------------------------------------------------------------------------

export interface AlertCardProps extends HTMLAttributes<HTMLDivElement> {
  severity: Severity;
}

export const AlertCard = forwardRef<HTMLDivElement, AlertCardProps>(
  ({ severity, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border-l-4 p-5 shadow-sm',
        'bg-white dark:bg-gray-900/80',
        severityBgColor(severity),
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
AlertCard.displayName = 'AlertCard';
