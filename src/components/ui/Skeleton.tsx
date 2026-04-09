'use client';

import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Base Skeleton
// ---------------------------------------------------------------------------

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Width as a Tailwind class, e.g. "w-32" */
  width?: string;
  /** Height as a Tailwind class, e.g. "h-4" */
  height?: string;
  /** Render as a circle */
  circle?: boolean;
}

export function Skeleton({
  width,
  height,
  circle = false,
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700/60',
        circle && 'rounded-full',
        width,
        height,
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Skeleton presets
// ---------------------------------------------------------------------------

export function SkeletonText({
  lines = 3,
  className,
  ...props
}: { lines?: number } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-2.5', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-3.5',
            i === lines - 1 ? 'w-3/4' : 'w-full',
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/80',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3 mb-4">
        <Skeleton circle className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/5" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonStatCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/80',
        'flex items-start gap-4',
        className,
      )}
      {...props}
    >
      <Skeleton className="h-11 w-11 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}
