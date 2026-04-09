'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';
import { ArticleCard } from '@/components/feeds/ArticleCard';
import { Button } from '@/components/ui';
import { Search, Filter, X, Download, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const CATEGORIES = ['all', 'cve', 'attack', 'vulnerability', 'malware', 'threat', 'policy', 'tool', 'general'];
const SEVERITIES = ['all', 'critical', 'high', 'medium', 'low', 'info'];

export default function FeedsPage() {
  const { t, lang } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const limit = 20;

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (category !== 'all') params.set('category', category);
      if (severity !== 'all') params.set('severity', severity);

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
  }, [page, search, category, severity]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  useEffect(() => {
    const interval = setInterval(fetchArticles, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchArticles]);

  useEffect(() => { setPage(1); }, [search, category, severity]);

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setSeverity('all');
    setPage(1);
  };

  const hasFilters = search || category !== 'all' || severity !== 'all';

  const handleExport = () => {
    const params = new URLSearchParams({ type: 'articles', format: 'csv' });
    if (category !== 'all') params.set('category', category);
    if (severity !== 'all') params.set('severity', severity);
    if (search) params.set('search', search);
    window.open(`/api/export?${params}`, '_blank');
  };

  const categoryLabel = (cat: string) => {
    if (cat === 'all') return lang === 'fr' ? 'Toutes' : 'All';
    return t(`feeds.categories.${cat}`) || cat;
  };

  const severityLabel = (sev: string) => {
    if (sev === 'all') return lang === 'fr' ? 'Toutes' : 'All';
    return t(`severity.${sev}`) || sev;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('feeds.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total} {lang === 'fr' ? 'articles' : 'articles'}
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
                'focus:outline-none focus:ring-2 focus:ring-cyber-500 focus:border-transparent'
              )}
            />
          </div>
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-1" />
            Filters
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
                'text-gray-900 dark:text-white'
              )}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{categoryLabel(c)}</option>
              ))}
            </select>

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
                <option key={s} value={s}>{severityLabel(s)}</option>
              ))}
            </select>

            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                {lang === 'fr' ? 'Effacer' : 'Clear'}
              </Button>
            )}
          </div>
        )}
      </div>

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
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400 px-4">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
