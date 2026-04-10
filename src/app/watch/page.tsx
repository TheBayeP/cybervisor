'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';
import { TimePeriodFilter, getStartDateFromPeriod, type TimePeriod, type SortOption } from '@/components/feeds/TimePeriodFilter';
import {
  ExternalLink, RefreshCw, Clock, Search,
  FlaskConical, Microscope, Shield, Cpu, Bug, Target, Zap, BookOpen,
} from 'lucide-react';
import { cn, timeAgo, truncate } from '@/lib/utils';
import { sources } from '@/lib/sources';
import { Button } from '@/components/ui';

// ---------------------------------------------------------------------------
// Source selection — elite research & threat-intel sources
// ---------------------------------------------------------------------------

const WATCH_SOURCE_IDS = sources
  .filter((s) =>
    s.category === 'research' ||
    (s.category === 'vendor' && (
      s.tags.includes('research') ||
      s.tags.includes('zero-day') ||
      s.tags.includes('apt') ||
      [
        'google-project-zero', 'paloalto-unit42', 'cisco-talos', 'mandiant-blog',
        'crowdstrike-blog', 'sentinelone-labs', 'elastic-security', 'kaspersky-securelist',
        'eset-welivesecurity', 'checkpoint-research', 'sekoia-blog', 'orangecyberdefense',
        'harfanglab-blog', 'symantec-threat', 'trendmicro-research', 'microsoft-security',
        'microsoft-msrc', 'google-threat', 'malwarebytes-labs',
      ].includes(s.id)
    )) ||
    (s.category === 'blog' && [
      'krebs-on-security', 'schneier-security', 'sans-isc', 'korben',
      'nakedsecurity-sophos', 'graham-cluley',
    ].includes(s.id)) ||
    (s.category === 'threat-intel' && [
      'mitre-attack-blog', 'alienvault-otx', 'recorded-future', 'virustotal-blog',
      'any-run-blog', 'socradar-blog', 'greynoise-blog', 'trellix-blog',
    ].includes(s.id))
  )
  .map((s) => s.id);

// ---------------------------------------------------------------------------
// Theme tags for categorization display
// ---------------------------------------------------------------------------

const THEME_TAGS: { label_fr: string; label_en: string; keywords: string[]; icon: React.ComponentType<{className?:string}>; color: string }[] = [
  { label_fr: 'APT / Nation-State', label_en: 'APT / Nation-State', keywords: ['apt', 'nation-state', 'nation state', 'espionnage', 'state-sponsored'], icon: Target, color: 'text-red-500' },
  { label_fr: 'Malware / Ransomware', label_en: 'Malware / Ransomware', keywords: ['malware', 'ransomware', 'trojan', 'backdoor', 'botnet'], icon: Bug, color: 'text-orange-500' },
  { label_fr: 'Zero-Day / Exploit', label_en: 'Zero-Day / Exploit', keywords: ['zero-day', 'zero day', '0day', 'exploit', 'poc', 'rce', 'lpe'], icon: Zap, color: 'text-yellow-500' },
  { label_fr: 'Outil / Technique', label_en: 'Tool / Technique', keywords: ['tool', 'framework', 'outil', 'technique', 'method', 'bypass', 'evasion'], icon: Cpu, color: 'text-purple-500' },
  { label_fr: 'Recherche', label_en: 'Research', keywords: ['research', 'analyse', 'analysis', 'paper', 'étude', 'study', 'whitepaper'], icon: FlaskConical, color: 'text-blue-500' },
  { label_fr: 'Défense / Blue Team', label_en: 'Defense / Blue Team', keywords: ['defense', 'detection', 'hunting', 'siem', 'edr', 'monitoring', 'yara'], icon: Shield, color: 'text-green-500' },
];

function detectTheme(title: string, desc: string) {
  const text = (title + ' ' + desc).toLowerCase();
  for (const theme of THEME_TAGS) {
    if (theme.keywords.some((kw) => text.includes(kw))) return theme;
  }
  return null;
}

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WatchPage() {
  const { lang } = useLanguage();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<TimePeriod>('7d');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '24', sort: sortBy });
      params.set('sourceIds', WATCH_SOURCE_IDS.join(','));
      const startDate = getStartDateFromPeriod(period);
      if (startDate) params.set('startDate', startDate);
      if (search) params.set('search', search);

      const res = await fetch(`/api/articles?${params}`);
      const data = await res.json();
      setArticles(data.articles || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      console.error('Failed to fetch watch articles:', e);
    } finally {
      setLoading(false);
    }
  }, [period, sortBy, search, page]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);
  useEffect(() => { setPage(1); }, [period, sortBy, search]);

  const sourceName = (id: string) => sources.find((s) => s.id === id)?.name ?? id;
  const articleTitle = (a: Article) => (lang === 'fr' ? a.title_fr : a.title_en) ?? a.title_fr ?? a.title_en ?? '';
  const articleDesc = (a: Article) => (lang === 'fr' ? a.description_fr : a.description_en) ?? a.description ?? '';
  const articleDate = (a: Article) => a.pub_date || a.collected_at;

  // Separate featured (top 3 with theme) from grid
  const featured = articles.slice(0, 3);
  const grid = articles.slice(3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Microscope className="w-6 h-6 text-violet-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {lang === 'fr' ? 'Veille Cyber' : 'Cyber Watch'}
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {lang === 'fr'
              ? `Publications remarquables : chercheurs, labs, threat intel — ${total} articles`
              : `Notable publications: researchers, labs, threat intel — ${total} articles`}
          </p>
        </div>
        <Button variant="outline" onClick={() => { setPage(1); fetchArticles(); }}>
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* Source legend */}
      <div className="flex flex-wrap gap-1.5">
        {THEME_TAGS.map((t) => {
          const Icon = t.icon;
          return (
            <span key={t.label_en} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              <Icon className={cn('w-3 h-3', t.color)} />
              {lang === 'fr' ? t.label_fr : t.label_en}
            </span>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === 'fr' ? 'Rechercher APT, technique, outil...' : 'Search APT, technique, tool...'}
          className={cn(
            'w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-colors',
            'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
            'text-gray-900 dark:text-white placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent',
          )}
        />
      </div>

      {/* Period filter */}
      <TimePeriodFilter period={period} setPeriod={setPeriod} sortBy={sortBy} setSortBy={setSortBy} />

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-52 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-14 h-14 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {lang === 'fr' ? 'Aucun article de recherche trouvé pour cette période.' : 'No research articles found for this period.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Featured cards — large */}
          {featured.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featured.map((a) => {
                const theme = detectTheme(articleTitle(a), articleDesc(a));
                const Icon = theme?.icon ?? BookOpen;
                return (
                  <a
                    key={a.id}
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex flex-col gap-3 p-5 rounded-xl border border-gray-200 dark:border-gray-800',
                      'bg-white dark:bg-gray-900 hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-700',
                      'transition-all group cursor-pointer',
                    )}
                  >
                    {/* Theme badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Icon className={cn('w-4 h-4', theme?.color ?? 'text-gray-400')} />
                        <span className={cn('text-xs font-semibold', theme?.color ?? 'text-gray-400')}>
                          {theme ? (lang === 'fr' ? theme.label_fr : theme.label_en) : 'Intel'}
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-violet-500 transition-colors" />
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-3 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-snug">
                      {articleTitle(a)}
                    </h3>

                    {/* Description */}
                    {articleDesc(a) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                        {truncate(articleDesc(a), 180)}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-xs font-medium text-violet-600 dark:text-violet-400 truncate">{sourceName(a.source_id)}</span>
                      <span className="ml-auto flex items-center gap-1 text-[10px] text-gray-400 shrink-0">
                        <Clock className="w-3 h-3" />{timeAgo(articleDate(a), lang)}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          {/* Rest — compact grid */}
          {grid.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {grid.map((a) => {
                const theme = detectTheme(articleTitle(a), articleDesc(a));
                const Icon = theme?.icon ?? BookOpen;
                return (
                  <a
                    key={a.id}
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex flex-col gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-800',
                      'bg-white dark:bg-gray-900 hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700',
                      'transition-all group cursor-pointer',
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className={cn('w-3.5 h-3.5 shrink-0', theme?.color ?? 'text-gray-400')} />
                      <span className={cn('text-[10px] font-semibold uppercase tracking-wide', theme?.color ?? 'text-gray-400')}>
                        {theme ? (lang === 'fr' ? theme.label_fr : theme.label_en) : 'Intel'}
                      </span>
                      <span className="ml-auto flex items-center gap-1 text-[10px] text-gray-400">
                        <Clock className="w-2.5 h-2.5" />{timeAgo(articleDate(a), lang)}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-snug">
                      {articleTitle(a)}
                    </h3>
                    {articleDesc(a) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {truncate(articleDesc(a), 150)}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-1 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-xs text-violet-600 dark:text-violet-400 font-medium truncate">{sourceName(a.source_id)}</span>
                      <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-violet-500 transition-colors shrink-0" />
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                ←
              </Button>
              <span className="text-sm text-gray-500">{page} / {totalPages}</span>
              <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                →
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
