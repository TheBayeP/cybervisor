'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cn, type Severity } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Severity Badge
// ---------------------------------------------------------------------------

const severityStyles: Record<Severity, string> = {
  critical:
    'bg-red-600/15 text-red-600 border-red-600/30 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30',
  high:
    'bg-orange-500/15 text-orange-600 border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30',
  medium:
    'bg-yellow-500/15 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/15 dark:text-yellow-400 dark:border-yellow-500/30',
  low:
    'bg-green-500/15 text-green-700 border-green-500/30 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/30',
  info:
    'bg-blue-500/15 text-blue-700 border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30',
};

export interface SeverityBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  severity: Severity;
}

export const SeverityBadge = forwardRef<HTMLSpanElement, SeverityBadgeProps>(
  ({ severity, className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
        severityStyles[severity],
        className,
      )}
      {...props}
    >
      {children ?? severity}
    </span>
  ),
);
SeverityBadge.displayName = 'SeverityBadge';

// ---------------------------------------------------------------------------
// Category Badge
// ---------------------------------------------------------------------------

export interface CategoryBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  category: string;
}

export const CategoryBadge = forwardRef<HTMLSpanElement, CategoryBadgeProps>(
  ({ category, className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        'border-cyber-500/30 bg-cyber-500/10 text-cyber-700',
        'dark:border-cyber-400/30 dark:bg-cyber-400/10 dark:text-cyber-300',
        className,
      )}
      {...props}
    >
      {children ?? category}
    </span>
  ),
);
CategoryBadge.displayName = 'CategoryBadge';

// ---------------------------------------------------------------------------
// Generic Badge
// ---------------------------------------------------------------------------

export type BadgeVariant = 'default' | 'outline' | 'solid';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    'border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300',
  outline:
    'border-gray-300 bg-transparent text-gray-600 dark:border-gray-600 dark:text-gray-400',
  solid:
    'border-transparent bg-cyber-500 text-white dark:bg-cyber-600',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  ),
);
Badge.displayName = 'Badge';
