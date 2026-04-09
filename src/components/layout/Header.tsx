'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Menu, Search } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface HeaderProps {
  onMenuToggle: () => void;
  alertCount?: number;
  lastUpdate?: string | null;
}

/* ------------------------------------------------------------------ */
/* Route-to-title mapping                                              */
/* ------------------------------------------------------------------ */

const routeTitleKeys: Record<string, string> = {
  '/dashboard': 'dashboard.title',
  '/feeds': 'feeds.title',
  '/cves': 'cves.title',
  '/synthesis': 'synthesis.title',
  '/alerts': 'alerts.title',
  '/settings': 'settings.title',
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function Header({
  onMenuToggle,
  alertCount = 0,
  lastUpdate,
}: HeaderProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const titleKey = useMemo(() => {
    for (const [route, key] of Object.entries(routeTitleKeys)) {
      if (pathname === route || pathname.startsWith(route + '/')) {
        return key;
      }
    }
    // Default fallback for root
    if (pathname === '/') return 'dashboard.title';
    return 'app.name';
  }, [pathname]);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center gap-4 border-b px-4 lg:px-6',
        'bg-white/80 border-gray-200 backdrop-blur-md',
        'dark:bg-gray-900/80 dark:border-gray-800',
      )}
    >
      {/* Mobile hamburger */}
      <button
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
        onClick={onMenuToggle}
        aria-label={t('common.toggleSidebar')}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title */}
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 lg:text-xl">
        {t(titleKey)}
      </h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search bar */}
      <div className="hidden items-center md:flex">
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-1.5',
            'border-gray-200 bg-gray-50 text-gray-500',
            'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400',
            'focus-within:border-cyber-500 focus-within:ring-1 focus-within:ring-cyber-500/30',
          )}
        >
          <Search className="h-4 w-4 shrink-0" />
          <input
            type="text"
            placeholder={t('common.search')}
            className={cn(
              'w-48 bg-transparent text-sm outline-none placeholder:text-gray-400',
              'dark:placeholder:text-gray-500 lg:w-64',
            )}
          />
          <kbd className="hidden rounded border border-gray-300 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:border-gray-600 lg:inline-block">
            /
          </kbd>
        </div>
      </div>

      {/* Last update */}
      {lastUpdate && (
        <span className="hidden text-xs text-gray-500 dark:text-gray-500 xl:inline">
          {t('common.lastUpdate')}: {lastUpdate}
        </span>
      )}

      {/* Notification bell */}
      <button
        className={cn(
          'relative rounded-lg p-2 text-gray-500',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
        )}
        aria-label={t('common.notifications')}
      >
        <Bell className="h-5 w-5" />
        {alertCount > 0 && (
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center',
              'rounded-full bg-red-500 px-1 text-[10px] font-bold text-white',
            )}
          >
            {alertCount > 99 ? '99+' : alertCount}
          </span>
        )}
      </button>
    </header>
  );
}
