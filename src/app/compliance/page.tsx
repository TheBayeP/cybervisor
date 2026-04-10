'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';
import {
  RefreshCw, ExternalLink, Clock,
  Search, Megaphone, AlertOctagon, BookOpen,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn, timeAgo, truncate } from '@/lib/utils';
import { sources } from '@/lib/sources';
import { Button } from '@/components/ui';
import { TimePeriodFilter, getStartDateFromPeriod, type TimePeriod, type SortOption } from '@/components/feeds/TimePeriodFilter';

// ---------------------------------------------------------------------------
// Sources réglementaires / conformité
// Inclut: gouvernements, CERTs avec tag policy/france/eu, + catégorie "policy"
// ---------------------------------------------------------------------------

const COMPLIANCE_SOURCE_IDS = sources
  .filter((s) =>
    s.category === 'government' ||
    (s.category === 'cert' && (
      s.tags.includes('france') ||
      s.tags.includes('eu') ||
      s.id === 'cert-fr' ||
      s.id === 'cert-fr-avis' ||
      s.id === 'anssi-actualites' ||
      s.id === 'anssi-publications' ||
      s.id === 'enisa-news' ||
      s.id === 'enisa-publications' ||
      s.id === 'ncsc-uk' ||
      s.id === 'ncsc-uk-news' ||
      s.id === 'cisa-alerts'
    ))
  )
  .map((s) => s.id);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Article {
  id: number;
  source_id: string;
  title: string;
  title_fr?: string | null;
  title_en?: string | null;
  description?: string | null;
  description_fr?: string | null;
  description_en?: string | null;
  link: string;
  pub_date?: string | null;
  category?: string | null;
  severity?: string | null;
  collected_at: string;
}

const SEVERITY_BORDER: Record<string, string> = {
  critical: 'border-l-red-600',
  high:     'border-l-orange-500',
  medium:   'border-l-yellow-500',
  low:      'border-l-blue-400',
  info:     'border-l-gray-400',
};

const SEVERITY_BG: Record<string, string> = {
  critical: 'bg-red-50 dark:bg-red-950/20',
  high:     'bg-orange-50 dark:bg-orange-950/15',
  medium:   '',
  low:      '',
  info:     '',
};

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  high:     'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  medium:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  low:      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  info:     'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CompliancePage() {
  const { lang } = useLanguage();

  const [articles, setArticles]     = useState<Article[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [period, setPeriod]         = useState<TimePeriod>('7d');
  const [sortBy, setSortBy]         = useState<SortOption>('date_desc');

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch from gov/cert sources + policy category, merged and deduped
      const params = new URLSearchParams({ page: String(page), limit: '20', sort: sortBy });
      params.set('sourceIds', COMPLIANCE_SOURCE_IDS.join(','));
      const startDate = getStartDateFromPeriod(period);
      if (startDate) params.set('startDate', startDate);
      if (search) params.set('search', search);

      const [res1, res2] = await Promise.all([
        fetch(`/api/articles?${params}`),
        fetch(`/api/articles?category=policy&sort=${sortBy}&limit=20&page=${page}${startDate ? `&startDate=${startDate}` : ''}${search ? `&search=${search}` : ''}`),
      ]);
      const [d1, d2] = await Promise.all([res1.json(), res2.json()]);

      const all = [...(d1.articles || []), ...(d2.articles || [])];
      const seen = new Set<number>();
      const merged = all.filter((a) => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });

      merged.sort((a, b) => {
        const da = new Date(a.pub_date || a.collected_at).getTime();
        const db = new Date(b.pub_date || b.collected_at).getTime();
        return sortBy === 'date_asc' ? da - db : db - da;
      });

      setArticles(merged.slice((page - 1) * 20, page * 20));
      const combinedTotal = Math.max(d1.total || 0, d2.total || 0);
      setTotal(combinedTotal);
      setTotalPages(Math.max(d1.totalPages || 1, d2.totalPages || 1));
    } catch (e) {
      console.error('Failed to fetch compliance articles:', e);
    } finally {
      setLoading(false);
    }
  }, [page, search, period, sortBy]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);
  useEffect(() => { setPage(1); }, [search, period, sortBy]);

  const sourceName = (id: string) => sources.find((s) => s.id === id)?.name ?? id;
  const articleTitle = (a: Article) => (lang === 'fr' ? a.title_fr : a.title_en) ?? a.title_fr ?? a.title_en ?? '';
  const articleDesc  = (a: Article) => (lang === 'fr' ? a.description_fr : a.description_en) ?? a.description ?? '';
  const articleDate  = (a: Article) => a.pub_date || a.collected_at;

  const urgentArticles  = articles.filter((a) => a.severity === 'critical' || a.severity === 'high');
  const regularArticles = articles.filter((a) => a.severity !== 'critical' && a.severity !== 'high');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {lang === 'fr' ? 'Conformité' : 'Compliance'}
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {lang === 'fr'
              ? `Publications réglementaires — ANSSI, CISA, ENISA, NCSC, NIS2, RGPD… · ${total} articles`
              : `Regulatory publications — ANSSI, CISA, ENISA, NCSC, NIS2, GDPR… · ${total} articles`}
          </p>
        </div>
        <Button variant="outline" onClick={fetchArticles}>
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === 'fr' ? 'Rechercher NIS2, RGPD, ANSSI, certification...' : 'Search NIS2, GDPR, ANSSI, certification...'}
          className={cn(
            'w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-colors',
            'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
            'text-gray-900 dark:text-white placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          )}
        />
      </div>

      {/* Period + sort */}
      <TimePeriodFilter period={period} setPeriod={setPeriod} sortBy={sortBy} setSortBy={setSortBy} />

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {lang === 'fr' ? 'Aucune publication réglementaire pour cette période.' : 'No regulatory publications for this period.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* === URGENT === */}
          {urgentArticles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                <AlertOctagon className="w-3.5 h-3.5" />
                {lang === 'fr' ? 'Priorité haute — action requise' : 'High priority — action required'}
              </div>
              <div className="space-y-2">
                {urgentArticles.map((a) => (
                  <a
                    key={a.id}
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-start gap-4 p-4 rounded-xl border-l-4 border border-gray-200 dark:border-gray-800',
                      'bg-white dark:bg-gray-900 hover:shadow-md transition-all group',
                      SEVERITY_BORDER[a.severity ?? 'info'],
                      SEVERITY_BG[a.severity ?? 'info'],
                    )}
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {a.severity && (
                          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide', SEVERITY_BADGE[a.severity])}>
                            {a.severity}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{sourceName(a.source_id)}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {articleTitle(a)}
                      </p>
                      {articleDesc(a) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                          {truncate(articleDesc(a), 200)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="flex items-center gap-1 text-[10px] text-gray-400 whitespace-nowrap">
                        <Clock className="w-3 h-3" />{timeAgo(articleDate(a), lang)}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* === REGULAR === */}
          {regularArticles.length > 0 && (
            <div className="space-y-2">
              {urgentArticles.length > 0 && (
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pt-2">
                  {lang === 'fr' ? 'Dernières publications' : 'Latest publications'}
                </div>
              )}
              <div className="space-y-2">
                {regularArticles.map((a) => (
                  <a
                    key={a.id}
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-start gap-4 p-4 rounded-xl border-l-4 border border-gray-200 dark:border-gray-800',
                      'bg-white dark:bg-gray-900 hover:shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-all group',
                      SEVERITY_BORDER[a.severity ?? 'info'] ?? 'border-l-gray-300',
                    )}
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{sourceName(a.source_id)}</span>
                        {a.category && a.category !== 'general' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase tracking-wide">
                            {a.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {articleTitle(a)}
                      </p>
                      {articleDesc(a) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                          {truncate(articleDesc(a), 180)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="flex items-center gap-1 text-[10px] text-gray-400 whitespace-nowrap">
                        <Clock className="w-3 h-3" />{timeAgo(articleDate(a), lang)}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">{page} / {totalPages}</span>
              <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
