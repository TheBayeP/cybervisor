'use client';

import { useCallback, useMemo, type ChangeEvent } from 'react';
import { Search, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui';
import { useLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { sources, type Source } from '@/lib/sources';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FilterValues {
  search: string;
  category: string;
  severity: string;
  country: string;
  source: string;
  startDate: string;
  endDate: string;
  minScore: string;
  maxScore: string;
  sort: string;
}

export interface FilterBarProps {
  /** Current filter state */
  filters: FilterValues;
  /** Called whenever any filter changes */
  onChange: (filters: FilterValues) => void;
  /** Which filter controls to render */
  variant: 'feeds' | 'cves';
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  'cve',
  'attack',
  'vulnerability',
  'malware',
  'threat',
  'policy',
  'tool',
  'general',
] as const;

const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getUniqueCountries(src: Source[]): string[] {
  const set = new Set(src.map((s) => s.country));
  return Array.from(set).sort();
}

const COUNTRY_FLAG: Record<string, string> = {
  FR: '\uD83C\uDDEB\uD83C\uDDF7',
  US: '\uD83C\uDDFA\uD83C\uDDF8',
  GB: '\uD83C\uDDEC\uD83C\uDDE7',
  DE: '\uD83C\uDDE9\uD83C\uDDEA',
  EU: '\uD83C\uDDEA\uD83C\uDDFA',
  BE: '\uD83C\uDDE7\uD83C\uDDEA',
  NL: '\uD83C\uDDF3\uD83C\uDDF1',
  CH: '\uD83C\uDDE8\uD83C\uDDED',
  AT: '\uD83C\uDDE6\uD83C\uDDF9',
  SE: '\uD83C\uDDF8\uD83C\uDDEA',
  FI: '\uD83C\uDDEB\uD83C\uDDEE',
  NO: '\uD83C\uDDF3\uD83C\uDDF4',
  DK: '\uD83C\uDDE9\uD83C\uDDF0',
  PL: '\uD83C\uDDF5\uD83C\uDDF1',
  UA: '\uD83C\uDDFA\uD83C\uDDE6',
  RO: '\uD83C\uDDF7\uD83C\uDDF4',
  CZ: '\uD83C\uDDE8\uD83C\uDDFF',
  SK: '\uD83C\uDDF8\uD83C\uDDF0',
  EE: '\uD83C\uDDEA\uD83C\uDDEA',
  LT: '\uD83C\uDDF1\uD83C\uDDF9',
  LV: '\uD83C\uDDF1\uD83C\uDDFB',
  ES: '\uD83C\uDDEA\uD83C\uDDF8',
  PT: '\uD83C\uDDF5\uD83C\uDDF9',
  IT: '\uD83C\uDDEE\uD83C\uDDF9',
  GR: '\uD83C\uDDEC\uD83C\uDDF7',
  IL: '\uD83C\uDDEE\uD83C\uDDF1',
  JP: '\uD83C\uDDEF\uD83C\uDDF5',
  KR: '\uD83C\uDDF0\uD83C\uDDF7',
  AU: '\uD83C\uDDE6\uD83C\uDDFA',
  NZ: '\uD83C\uDDF3\uD83C\uDDFF',
  CA: '\uD83C\uDDE8\uD83C\uDDE6',
  IN: '\uD83C\uDDEE\uD83C\uDDF3',
  SG: '\uD83C\uDDF8\uD83C\uDDEC',
  BR: '\uD83C\uDDE7\uD83C\uDDF7',
  RU: '\uD83C\uDDF7\uD83C\uDDFA',
  CN: '\uD83C\uDDE8\uD83C\uDDF3',
  TW: '\uD83C\uDDF9\uD83C\uDDFC',
  GLOBAL: '\uD83C\uDF10',
};

export function countryFlag(code: string): string {
  return COUNTRY_FLAG[code.toUpperCase()] ?? '\uD83C\uDF10';
}

// ---------------------------------------------------------------------------
// Shared select styling
// ---------------------------------------------------------------------------

const selectCls = cn(
  'h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm',
  'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200',
  'focus:outline-none focus:ring-2 focus:ring-cyber-500/40',
  'transition-colors',
);

const inputCls = cn(
  'h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm',
  'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200',
  'focus:outline-none focus:ring-2 focus:ring-cyber-500/40',
  'transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500',
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FilterBar({ filters, onChange, variant, className }: FilterBarProps) {
  const { t } = useLanguage();

  const countries = useMemo(() => getUniqueCountries(sources), []);
  const sourceList = useMemo(() => sources.slice().sort((a, b) => a.name.localeCompare(b.name)), []);

  const set = useCallback(
    (key: keyof FilterValues, value: string) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange],
  );

  const handleInput = useCallback(
    (key: keyof FilterValues) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      set(key, e.target.value);
    },
    [set],
  );

  const hasActiveFilters = useMemo(() => {
    if (variant === 'feeds') {
      return !!(
        filters.search ||
        filters.category ||
        filters.severity ||
        filters.country ||
        filters.source ||
        filters.startDate ||
        filters.endDate
      );
    }
    return !!(
      filters.search ||
      filters.severity ||
      filters.minScore ||
      filters.maxScore
    );
  }, [filters, variant]);

  const clearAll = useCallback(() => {
    onChange({
      search: '',
      category: '',
      severity: '',
      country: '',
      source: '',
      startDate: '',
      endDate: '',
      minScore: '',
      maxScore: '',
      sort: variant === 'feeds' ? 'date_desc' : 'score_desc',
    });
  }, [onChange, variant]);

  const ns = variant === 'feeds' ? 'feeds' : 'cves';

  return (
    <div className={cn('space-y-3', className)}>
      {/* -- Row 1: Search + primary filters -- */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={handleInput('search')}
            placeholder={t(`${ns}.search`)}
            className={cn(inputCls, 'w-full pl-9')}
          />
        </div>

        {/* Severity (shared) */}
        <select
          value={filters.severity}
          onChange={handleInput('severity')}
          className={selectCls}
          aria-label={t('feeds.filterBySeverity')}
        >
          <option value="">{t('feeds.filterBySeverity')}</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {t(`severity.${s}`)}
            </option>
          ))}
        </select>

        {/* --- Feeds-specific filters --- */}
        {variant === 'feeds' && (
          <>
            {/* Category */}
            <select
              value={filters.category}
              onChange={handleInput('category')}
              className={selectCls}
              aria-label={t('feeds.filterByCategory')}
            >
              <option value="">{t('feeds.filterByCategory')}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`feeds.categories.${c}`)}
                </option>
              ))}
            </select>

            {/* Country */}
            <select
              value={filters.country}
              onChange={handleInput('country')}
              className={selectCls}
              aria-label={t('feeds.filterByCountry')}
            >
              <option value="">{t('feeds.filterByCountry')}</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {countryFlag(c)} {c}
                </option>
              ))}
            </select>

            {/* Source */}
            <select
              value={filters.source}
              onChange={handleInput('source')}
              className={selectCls}
              aria-label={t('feeds.filterBySource')}
            >
              <option value="">{t('feeds.filterBySource')}</option>
              {sourceList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </>
        )}

        {/* --- CVE-specific filters --- */}
        {variant === 'cves' && (
          <>
            <div className="flex items-center gap-1">
              <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {t('cves.minScore')}
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={filters.minScore}
                onChange={handleInput('minScore')}
                className={cn(inputCls, 'w-20')}
                placeholder="0"
              />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {t('cves.maxScore')}
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={filters.maxScore}
                onChange={handleInput('maxScore')}
                className={cn(inputCls, 'w-20')}
                placeholder="10"
              />
            </div>
          </>
        )}

        {/* Clear */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} icon={<X className="h-4 w-4" />}>
            {t(`${ns}.clearFilters`)}
          </Button>
        )}
      </div>

      {/* -- Row 2: Date range (feeds only) + sort -- */}
      {variant === 'feeds' && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={filters.startDate}
              onChange={handleInput('startDate')}
              className={cn(inputCls, 'w-[140px]')}
              aria-label={t('feeds.dateFrom')}
            />
          </div>
          <span className="text-gray-400 text-sm">&mdash;</span>
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={filters.endDate}
              onChange={handleInput('endDate')}
              className={cn(inputCls, 'w-[140px]')}
              aria-label={t('feeds.dateTo')}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterBar;
