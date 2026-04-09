'use client';

import { useLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export type TimePeriod = '24h' | '72h' | '7d' | '30d' | '1y' | 'all';
export type SortOption = 'date_desc' | 'date_asc' | 'severity_desc' | 'severity_asc';

const PERIODS: TimePeriod[] = ['24h', '72h', '7d', '30d', '1y', 'all'];

const periodTranslationKeys: Record<TimePeriod, string> = {
  '24h': 'filters.last24h',
  '72h': 'filters.last72h',
  '7d': 'filters.lastWeek',
  '30d': 'filters.lastMonth',
  '1y': 'filters.lastYear',
  all: 'filters.all',
};

const sortTranslationKeys: Record<SortOption, string> = {
  date_desc: 'filters.dateDesc',
  date_asc: 'filters.dateAsc',
  severity_desc: 'filters.severityDesc',
  severity_asc: 'filters.severityAsc',
};

const SORT_OPTIONS: SortOption[] = ['date_desc', 'date_asc', 'severity_desc', 'severity_asc'];

export function getStartDateFromPeriod(period: TimePeriod): string | undefined {
  if (period === 'all') return undefined;
  const now = new Date();
  const map: Record<string, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '72h': 72 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '1y': 365 * 24 * 60 * 60 * 1000,
  };
  const ms = map[period];
  if (!ms) return undefined;
  return new Date(now.getTime() - ms).toISOString();
}

interface TimePeriodFilterProps {
  period: TimePeriod;
  setPeriod: (p: TimePeriod) => void;
  sortBy: SortOption;
  setSortBy: (s: SortOption) => void;
}

export function TimePeriodFilter({ period, setPeriod, sortBy, setSortBy }: TimePeriodFilterProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Period pills */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              period === p
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            {t(periodTranslationKeys[p])}
          </button>
        ))}
      </div>

      {/* Sort dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">{t('filters.sortBy')}</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className={cn(
            'px-3 py-1.5 rounded-lg border text-xs',
            'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
            'text-gray-900 dark:text-white',
            'focus:outline-none focus:ring-2 focus:ring-cyber-500 focus:border-transparent'
          )}
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {t(sortTranslationKeys[s])}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
