'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';
import { ArticleCard } from '@/components/feeds/ArticleCard';
import { TimePeriodFilter, getStartDateFromPeriod, type TimePeriod, type SortOption } from '@/components/feeds/TimePeriodFilter';
import { Button } from '@/components/ui';
import {
  Search, Filter, X, Download, RefreshCw,
  ChevronLeft, ChevronRight, Rss, ShieldAlert,
  BellRing, Microscope, CheckSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sources } from '@/lib/sources';

interface Article {
  id: number;
  source_id: string;
  title: string;
  title_fr?: string;
  title_en?: string;
  description: string;
  description_fr?: string;
  description_en?: string;
  link: string;
  pub_date: string;
  category: string;
  severity: string;
  country: string;
  language: string;
  collected_at: string;
  read: number;
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type FeedTab = 'flux' | 'conformite' | 'alertes' | 'veille';

interface TabConfig {
  id: FeedTab;
  labelFr: string;
  labelEn: string;
  icon: React.ComponentType<{ className?: string }>;
  descFr: string;
  descEn: string;
  /** Source IDs to include — empty = all sources */
  sourceIds?: string[];
  /** Article categories to include — empty = all */
  articleCategories?: string[];
  /** Severity filter */
  severities?: string[];
  /** Sort default */
  defaultSort?: SortOption;
  /** Period default */
  defaultPeriod?: TimePeriod;
  accentClass: string;
  badgeClass: string;
}

// CERT / gov source IDs for compliance tab
const CERT_SOURCE_IDS = sources
  .filter((s) => s.category === 'cert' || s.category === 'government')
  .map((s) => s.id);

// Research + notable vendor source IDs for cyber watch tab
// Focus: security research, new techniques, tooling, bug bounty, analysis
const WATCH_SOURCE_IDS = sources
  .filter((s) =>
    s.category === 'research' ||
    (s.category === 'vendor' && (
      s.tags.includes('research') ||
      s.tags.includes('zero-day') ||
      s.tags.includes('apt') ||
      s.id === 'google-project-zero' ||
      s.id === 'paloalto-unit42' ||
      s.id === 'cisco-talos' ||
      s.id === 'mandiant-blog' ||
      s.id === 'crowdstrike-blog' ||
      s.id === 'sentinelone-labs' ||
      s.id === 'elastic-security' ||
      s.id === 'kaspersky-securelist' ||
      s.id === 'eset-welivesecurity' ||
      s.id === 'checkpoint-research' ||
      s.id === 'sekoia-blog' ||
      s.id === 'orangecyberdefense' ||
      s.id === 'harfanglab-blog'
    )) ||
    (s.category === 'blog' && (
      s.tags.includes('investigative') ||
      s.tags.includes('analysis') ||
      s.id === 'krebs-on-security' ||
      s.id === 'schneier-security' ||
      s.id === 'sans-isc' ||
      s.id === 'korben'
    )) ||
    (s.category === 'threat-intel' && (
      s.id === 'mitre-attack-blog' ||
      s.id === 'alienvault-otx' ||
      s.id === 'recorded-future' ||
      s.id === 'virustotal-blog'
    ))
  )
  .map((s) => s.id);

const TABS: TabConfig[] = [
  {
    id: 'flux',
    labelFr: 'Flux',
    labelEn: 'Feed',
    icon: Rss,
    descFr: 'Tous les articles collectés, triés par date de publication',
    descEn: 'All collected articles sorted by publication date',
    defaultSort: 'date_desc',
    defaultPeriod: '24h',
    accentClass: 'text-cyber-500',
    badgeClass: 'bg-cyber-500/10 text-cyber-600 dark:text-cyber-400 border-cyber-500/30',
  },
  {
    id: 'conformite',
    labelFr: 'Conformité',
    labelEn: 'Compliance',
    icon: CheckSquare,
    descFr: 'Avis, alertes et publications des CERTs et autorités gouvernementales (ANSSI, CISA, NCSC…)',
    descEn: 'Advisories, alerts and publications from CERTs and government agencies (ANSSI, CISA, NCSC…)',
    sourceIds: CERT_SOURCE_IDS,
    defaultSort: 'date_desc',
    defaultPeriod: '7d',
    accentClass: 'text-blue-500',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  {
    id: 'alertes',
    labelFr: 'Alertes',
    labelEn: 'Alerts',
    icon: BellRing,
    descFr: 'Articles de sévérité critical ou high — menaces actives, incidents, ransomwares',
    descEn: 'Critical and high severity articles — active threats, incidents, ransomware',
    severities: ['critical', 'high'],
    defaultSort: 'severity_desc',
    defaultPeriod: '72h',
    accentClass: 'text-red-500',
    badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
  },
  {
    id: 'veille',
    labelFr: 'Veille Cyber',
    labelEn: 'Cyber Watch',
    icon: Microscope,
    descFr: 'Recherches notables, nouveaux outils, techniques avancées et analyses de fond en cybersécurité',
    descEn: 'Notable research, new tools, advanced techniques and in-depth cybersecurity analysis',
    sourceIds: WATCH_SOURCE_IDS,
    defaultSort: 'date_desc',
    defaultPeriod: '7d',
    accentClass: 'text-violet-500',
    badgeClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30',
  },
];

const CATEGORIES = ['all', 'cve', 'attack', 'vulnerability', 'malware', 'threat', 'policy', 'tool', 'general'];
const SEVERITIES = ['all', 'critical', 'high', 'medium', 'low', 'info'];

// ---------------------------------------------------------------------------

export default function FeedsPage() {
  const { t, lang } = useLanguage();

  const [activeTab, setActiveTab] = useState<FeedTab>('flux');
  const tab = TABS.find((tb) => tb.id === activeTab)!;

  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [period, setPeriod] = useState<TimePeriod>(tab.defaultPeriod ?? 'all');
  const [sortBy, setSortBy] = useState<SortOption>(tab.defaultSort ?? 'date_desc');
  const limit = 20;

  // When tab changes, reset filters/sort to tab defaults
  const handleTabChange = useCallback(
    (newTab: FeedTab) => {
      const cfg = TABS.find((tb) => tb.id === newTab)!;
      setActiveTab(newTab);
      setPage(1);
      setSearch('');
      setCategory('all');
      setSeverity('all');
      setPeriod(cfg.defaultPeriod ?? 'all');
      setSortBy(cfg.defaultSort ?? 'date_desc');
    },
    [],
  );

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (category !== 'all') params.set('category', category);

      // Tab-specific severity filter (overrides manual filter for alertes tab)
      if (tab.severities) {
        params.set('severities', tab.severities.join(','));
      } else if (severity !== 'all') {
        params.set('severity', severity);
      }

      // Tab-specific source filter
      if (tab.sourceIds && tab.sourceIds.length > 0) {
        params.set('sourceIds', tab.sourceIds.join(','));
      }

      const startDate = getStartDateFromPeriod(period);
      if (startDate) params.set('startDate', startDate);
      params.set('sort', sortBy);

      const res = await fetch(`/api/articles?${params}`);
      const data = await res.json();
      setArticles(data.articles || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error('Failed to fetch articles:', e);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, severity, period, sortBy, tab]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  useEffect(() => {
    const interval = setInterval(fetchArticles, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchArticles]);

  useEffect(() => { setPage(1); }, [search, category, severity, period, sortBy, activeTab]);

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setSeverity('all');
    setPeriod(tab.defaultPeriod ?? 'all');
    setSortBy(tab.defaultSort ?? 'date_desc');
    setPage(1);
  };

  const hasFilters =
    search ||
    category !== 'all' ||
    (tab.id !== 'alertes' && severity !== 'all') ||
    period !== (tab.defaultPeriod ?? 'all') ||
    sortBy !== (tab.defaultSort ?? 'date_desc');

  const handleExport = () => {
    const params = new URLSearchParams({ type: 'articles', format: 'csv' });
    if (category !== 'all') params.set('category', category);
    if (severity !== 'all') params.set('severity', severity);
    if (search) params.set('search', search);
    window.open(`/api/export?${params}`, '_blank');
  };

  const categoryLabel = (cat: string) => {
    if (cat === 'all') return lang === 'fr' ? 'Toutes catégories' : 'All categories';
    return t(`feeds.categories.${cat}`) || cat;
  };

  const severityLabel = (sev: string) => {
    if (sev === 'all') return lang === 'fr' ? 'Toutes sévérités' : 'All severities';
    return t(`severity.${sev}`) || sev;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {lang === 'fr' ? 'Flux d\'actualités' : 'News Feeds'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total} {lang === 'fr' ? 'articles' : 'articles'}{total > 0 ? ` · ${lang === 'fr' ? tab.descFr : tab.descEn}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" />
            CSV
          </Button>
          <Button variant="outline" onClick={fetchArticles}>
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700/50 w-fit">
        {TABS.map((tb) => {
          const Icon = tb.icon;
          const isActive = activeTab === tb.id;
          return (
            <button
              key={tb.id}
              onClick={() => handleTabChange(tb.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50',
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? tb.accentClass : '')} />
              <span>{lang === 'fr' ? tb.labelFr : tb.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Tab description */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg border text-sm',
        tab.badgeClass,
      )}>
        {(() => { const Icon = tab.icon; return <Icon className="w-4 h-4 shrink-0" />; })()}
        <span>{lang === 'fr' ? tab.descFr : tab.descEn}</span>
        {tab.sourceIds && (
          <span className="ml-auto text-xs opacity-70">
            {tab.sourceIds.length} {lang === 'fr' ? 'sources' : 'sources'}
          </span>
        )}
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
              placeholder={t('feeds.search')}
              className={cn(
                'w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-colors',
                'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
                'text-gray-900 dark:text-white placeholder-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-cyber-500 focus:border-transparent',
              )}
            />
          </div>
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-1" />
            {lang === 'fr' ? 'Filtres' : 'Filters'}
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-fade-in">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={cn(
                'px-3 py-2 rounded-lg border text-sm',
                'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                'text-gray-900 dark:text-white',
              )}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{categoryLabel(c)}</option>
              ))}
            </select>

            {/* Only show severity filter if not on the "alertes" tab (which forces its own) */}
            {tab.id !== 'alertes' && (
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className={cn(
                  'px-3 py-2 rounded-lg border text-sm',
                  'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                  'text-gray-900 dark:text-white',
                )}
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>{severityLabel(s)}</option>
                ))}
              </select>
            )}

            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                {lang === 'fr' ? 'Effacer' : 'Clear'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Time Period & Sort */}
      <TimePeriodFilter period={period} setPeriod={setPeriod} sortBy={sortBy} setSortBy={setSortBy} />

      {/* Articles List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400 text-lg">{t('feeds.noResults')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article as any} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400 px-4">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
