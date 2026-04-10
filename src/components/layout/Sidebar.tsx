'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Newspaper,
  Bug,
  Brain,
  AlertTriangle,
  Settings,
  ShieldCheck,
  Sun,
  Moon,
  X,
  Languages,
  Radar,
  ClipboardCheck,
  Rss,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';
import { useTheme } from '@/lib/theme/context';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
  badge?: number;
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  alertCount?: number;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function Sidebar({ open, onClose, alertCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const { t, lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const navItems: NavItem[] = [
    { href: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
    { href: '/watch', labelKey: 'nav.watch', icon: Radar },
    { href: '/feeds', labelKey: 'nav.feeds', icon: Newspaper },
    { href: '/cves', labelKey: 'nav.cves', icon: Bug },
    { href: '/synthesis', labelKey: 'nav.synthesis', icon: Brain },
    {
      href: '/alerts',
      labelKey: 'nav.alerts',
      icon: AlertTriangle,
      badge: alertCount,
    },
    { href: '/sources', labelKey: 'nav.sources', icon: Rss },
    { href: '/settings', labelKey: 'nav.settings', icon: Settings },
  ];

  const isActive = useCallback(
    (href: string) => {
      if (href === '/dashboard') {
        return pathname === '/' || pathname.startsWith('/dashboard');
      }
      return pathname.startsWith(href);
    },
    [pathname],
  );

  const toggleLang = useCallback(() => {
    setLang(lang === 'fr' ? 'en' : 'fr');
  }, [lang, setLang]);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r',
          'bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800',
          'transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5"
            onClick={onClose}
          >
            <ShieldCheck className="h-7 w-7 text-cyber-500" />
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-tight tracking-tight cyber-gradient-text">
                {t('app.name')}
              </span>
              <span className="text-[10px] font-medium leading-tight text-gray-500 dark:text-gray-500">
                {t('app.tagline')}
              </span>
            </div>
          </Link>
          {/* Mobile close button */}
          <button
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
            onClick={onClose}
            aria-label={t('common.toggleSidebar')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn('nav-link', active && 'nav-active')}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{t(item.labelKey)}</span>
                {item.badge != null && item.badge > 0 && (
                  <span
                    className={cn(
                      'ml-auto inline-flex h-5 min-w-[20px] items-center justify-center',
                      'rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white',
                    )}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div className="border-t border-gray-200 px-3 py-3 dark:border-gray-800">
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
              'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
            )}
            aria-label={t('common.language')}
          >
            <Languages className="h-5 w-5 shrink-0" />
            <span className="flex-1 text-left">{t('common.language')}</span>
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold uppercase dark:bg-gray-800">
              {lang}
            </span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
              'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
            )}
            aria-label={t('common.theme')}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 shrink-0" />
            ) : (
              <Moon className="h-5 w-5 shrink-0" />
            )}
            <span className="flex-1 text-left">{t('common.theme')}</span>
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold capitalize dark:bg-gray-800">
              {theme === 'dark' ? t('settings.dark') : t('settings.light')}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
