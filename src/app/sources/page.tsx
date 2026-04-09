'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n';
import { sources, type Source } from '@/lib/sources';
import { Button } from '@/components/ui';
import { Search, ExternalLink, Globe, Rss, Filter, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  cert: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  news: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  blog: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  vendor: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  government: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  research: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
  cve: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  'threat-intel': 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
};

const CATEGORY_LABELS_FR: Record<string, string> = {
  all: 'Toutes',
  cert: 'CERT / Gouvernement',
  news: 'Actualités',
  blog: 'Blogs',
  vendor: 'Éditeurs',
  government: 'Gouvernement',
  research: 'Recherche',
  cve: 'CVE / Vulnérabilités',
  'threat-intel': 'Threat Intelligence',
};

const CATEGORY_LABELS_EN: Record<string, string> = {
  all: 'All',
  cert: 'CERT / Government',
  news: 'News',
  blog: 'Blogs',
  vendor: 'Vendors',
  government: 'Government',
  research: 'Research',
  cve: 'CVE / Vulnerabilities',
  'threat-intel': 'Threat Intelligence',
};

const CATEGORIES = ['all', 'cert', 'news', 'blog', 'vendor', 'government', 'research', 'cve', 'threat-intel'];

export default function SourcesPage() {
  const { lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const labels = lang === 'fr' ? CATEGORY_LABELS_FR : CATEGORY_LABELS_EN;

  const filtered = useMemo(() => {
    let result = sources;
    if (category !== 'all') {
      result = result.filter(s => s.category === category);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(lower) ||
        s.country.toLowerCase().includes(lower) ||
        s.tags.some(t => t.toLowerCase().includes(lower))
      );
    }
    return result.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
  }, [search, category]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const s of sources) {
      stats[s.category] = (stats[s.category] || 0) + 1;
    }
    return stats;
  }, []);

  const countryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const s of filtered) {
      stats[s.country] = (stats[s.country] || 0) + 1;
    }
    return Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 15);
  }, [filtered]);

  const getFlagEmoji = (country: string): string => {
    if (country === 'INTL') return '🌍';
    const codePoints = country
      .toUpperCase()
      .split('')
      .map(c => 0x1F1E6 + c.charCodeAt(0) - 65);
    return String.fromCodePoint(...codePoints);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {lang === 'fr' ? 'Sources' : 'Sources'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {sources.length} {lang === 'fr' ? 'sources configurées' : 'configured sources'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {CATEGORIES.filter(c => c !== 'all').map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(category === cat ? 'all' : cat)}
            className={cn(
              'rounded-lg p-3 text-center transition-all border',
              category === cat
                ? 'border-cyber-500 ring-2 ring-cyber-500/20'
                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700',
              'bg-white dark:bg-gray-900'
            )}
          >
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {categoryStats[cat] || 0}
            </div>
            <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {labels[cat]}
            </div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === 'fr' ? 'Rechercher une source, un pays, un tag...' : 'Search by source, country, tag...'}
          className={cn(
            'w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-colors',
            'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
            'text-gray-900 dark:text-white placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-cyber-500 focus:border-transparent'
          )}
        />
      </div>

      {/* Country breakdown */}
      {countryStats.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {countryStats.map(([country, count]) => (
            <span
              key={country}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              {getFlagEmoji(country)} {country} <span className="text-gray-400">({count})</span>
            </span>
          ))}
        </div>
      )}

      {/* Results info */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {filtered.length} {lang === 'fr' ? 'source(s) trouvée(s)' : 'source(s) found'}
        {category !== 'all' && (
          <button onClick={() => setCategory('all')} className="ml-2 text-cyber-500 hover:text-cyber-400">
            {lang === 'fr' ? '✕ Réinitialiser' : '✕ Reset'}
          </button>
        )}
      </div>

      {/* Sources grid/list */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((source) => (
            <SourceCard key={source.id} source={source} lang={lang} labels={labels} getFlagEmoji={getFlagEmoji} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((source) => (
            <SourceRow key={source.id} source={source} lang={lang} labels={labels} getFlagEmoji={getFlagEmoji} />
          ))}
        </div>
      )}
    </div>
  );
}

function SourceCard({ source, lang, labels, getFlagEmoji }: { source: Source; lang: string; labels: Record<string, string>; getFlagEmoji: (c: string) => string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-all group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{source.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs">{getFlagEmoji(source.country)}</span>
            <span className="text-xs text-gray-400">{source.country}</span>
            <span className="text-xs text-gray-300 dark:text-gray-600">•</span>
            <span className="text-xs text-gray-400 uppercase">{source.language}</span>
          </div>
        </div>
        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase', CATEGORY_COLORS[source.category])}>
          {labels[source.category]}
        </span>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {source.tags.slice(0, 4).map(tag => (
          <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full',
                i < source.priority ? 'bg-gray-300 dark:bg-gray-600' : 'bg-cyber-500'
              )}
            />
          ))}
          <span className="text-[10px] text-gray-400 ml-1">
            P{source.priority}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <a href={source.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-gray-400 hover:text-cyber-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="RSS Feed">
            <Rss className="w-3.5 h-3.5" />
          </a>
          <a href={source.website} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-gray-400 hover:text-cyber-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Website">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

function SourceRow({ source, lang, labels, getFlagEmoji }: { source: Source; lang: string; labels: Record<string, string>; getFlagEmoji: (c: string) => string }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 hover:border-gray-300 dark:hover:border-gray-700 transition-all">
      <span className="text-lg">{getFlagEmoji(source.country)}</span>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">{source.name}</h3>
      </div>
      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase shrink-0', CATEGORY_COLORS[source.category])}>
        {labels[source.category]}
      </span>
      <span className="text-xs text-gray-400 uppercase shrink-0 w-6 text-center">{source.language}</span>
      <span className="text-xs text-gray-400 shrink-0 w-10 text-center">P{source.priority}</span>
      <div className="flex items-center gap-1 shrink-0">
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-gray-400 hover:text-cyber-500 transition-colors">
          <Rss className="w-3.5 h-3.5" />
        </a>
        <a href={source.website} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-gray-400 hover:text-cyber-500 transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
