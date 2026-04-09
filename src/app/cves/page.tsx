'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';
import { CveCard } from '@/components/feeds/CveCard';
import { Button } from '@/components/ui';
import { Search, RefreshCw, ChevronLeft, ChevronRight, Download, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Cve {
  id: number;
  cve_id: string;
  description: string;
  description_fr?: string;
  cvss_score: number | null;
  cvss_vector?: string;
  severity: string;
  published_date: string;
  modified_date?: string;
  references_json?: string;
  affected_products?: string;
}

const SEVERITIES = ['all', 'critical', 'high', 'medium', 'low'];

export default function CvesPage() {
  const { t, lang } = useLanguage();
  const [cves, setCves] = useState<Cve[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('all');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const limit = 20;

  const fetchCves = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (severity !== 'all') params.set('severity', severity);
      if (minScore) params.set('minScore', minScore);
      if (maxScore) params.set('maxScore', maxScore);

      const res = await fetch(`/api/cves?${params}`);
      const data = await res.json();
      setCves(data.cves || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error('Failed to fetch CVEs:', e);
    } finally {
      setLoading(false);
    }
  }, [page, search, severity, minScore, maxScore]);

  useEffect(() => { fetchCves(); }, [fetchCves]);
  useEffect(() => { setPage(1); }, [search, severity, minScore, maxScore]);

  const handleExport = () => {
    const params = new URLSearchParams({ type: 'cves', format: 'csv' });
    if (severity !== 'all') params.set('severity', severity);
    if (search) params.set('search', search);
    window.open(`/api/export?${params}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('cves.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total} CVE{total > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" onClick={fetchCves}>
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('cves.search')}
              className={cn(
                'w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-colors',
                'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
                'text-gray-900 dark:text-white placeholder-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-cyber-500 focus:border-transparent'
              )}
            />
          </div>
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-4 h-4 mr-1" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-fade-in">
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className={cn(
                'px-3 py-2 rounded-lg border text-sm',
                'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                'text-gray-900 dark:text-white'
              )}
            >
              {SEVERITIES.map(s => (
                <option key={s} value={s}>
                  {s === 'all' ? (lang === 'fr' ? 'Toutes sévérités' : 'All severities') : t(`cves.${s}`)}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">CVSS:</span>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                placeholder="Min"
                className={cn(
                  'w-20 px-2 py-2 rounded-lg border text-sm text-center',
                  'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                  'text-gray-900 dark:text-white'
                )}
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                placeholder="Max"
                className={cn(
                  'w-20 px-2 py-2 rounded-lg border text-sm text-center',
                  'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                  'text-gray-900 dark:text-white'
                )}
              />
            </div>
          </div>
        )}
      </div>

      {/* CVE List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : cves.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400 text-lg">{t('feeds.noResults')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cves.map((cve) => (
            <CveCard key={cve.id} cve={cve} lang={lang} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400 px-4">{page} / {totalPages}</span>
          <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
