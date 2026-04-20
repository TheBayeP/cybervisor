'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';
import {
  RefreshCw, ExternalLink, Clock, Search,
  BookOpen, ChevronLeft, ChevronRight, Shield,
  CheckCircle2, AlertCircle, HelpCircle, TrendingUp,
} from 'lucide-react';
import { cn, timeAgo, truncate } from '@/lib/utils';
import { sources } from '@/lib/sources';
import { Button } from '@/components/ui';
import { TimePeriodFilter, getStartDateFromPeriod, type TimePeriod, type SortOption } from '@/components/feeds/TimePeriodFilter';

// ---------------------------------------------------------------------------
// Frameworks GRC
// ---------------------------------------------------------------------------

interface Framework {
  id: string;
  name: string;
  shortName: string;
  color: string;
  keywords: string[];
  description: string;
  descriptionFr: string;
}

const FRAMEWORKS: Framework[] = [
  {
    id: 'nis2',
    name: 'NIS2 Directive',
    shortName: 'NIS2',
    color: 'bg-blue-500',
    keywords: ['nis2', 'nis 2', 'network and information security', 'directive nis'],
    description: 'EU cybersecurity regulation for essential and important entities',
    descriptionFr: 'Directive européenne cybersécurité pour entités essentielles',
  },
  {
    id: 'rgpd',
    name: 'RGPD / GDPR',
    shortName: 'RGPD',
    color: 'bg-green-500',
    keywords: ['rgpd', 'gdpr', 'protection des données', 'data protection', 'cnil', 'edpb'],
    description: 'EU General Data Protection Regulation',
    descriptionFr: 'Règlement Général sur la Protection des Données',
  },
  {
    id: 'iso27001',
    name: 'ISO/IEC 27001',
    shortName: 'ISO 27001',
    color: 'bg-purple-500',
    keywords: ['iso 27001', 'iso/iec 27001', 'isms', 'smsi', 'iso27001'],
    description: 'Information security management system standard',
    descriptionFr: 'Système de management de la sécurité de l\'information',
  },
  {
    id: 'tisax',
    name: 'TISAX / ENX',
    shortName: 'TISAX',
    color: 'bg-orange-500',
    keywords: ['tisax', 'enx', 'vda-isa', 'automotive security', 'iso 21434', 'iso21434'],
    description: 'Automotive industry security assessment',
    descriptionFr: 'Évaluation sécurité industrie automobile',
  },
  {
    id: 'dora',
    name: 'DORA',
    shortName: 'DORA',
    color: 'bg-red-500',
    keywords: ['dora', 'digital operational resilience', 'resilience operationnelle', 'fintech regulation'],
    description: 'Digital Operational Resilience Act (EU financial sector)',
    descriptionFr: 'Acte sur la résilience opérationnelle numérique (secteur financier)',
  },
  {
    id: 'pci',
    name: 'PCI-DSS',
    shortName: 'PCI-DSS',
    color: 'bg-yellow-600',
    keywords: ['pci dss', 'pci-dss', 'payment card', 'pci compliance'],
    description: 'Payment Card Industry Data Security Standard',
    descriptionFr: 'Standard de sécurité des données de l\'industrie des cartes de paiement',
  },
];

// GRC-relevant source IDs
const GRC_SOURCE_IDS = sources
  .filter((s) =>
    s.category === 'government' ||
    s.id === 'cert-fr' ||
    s.id === 'cert-fr-avis' ||
    s.id === 'anssi-actualites' ||
    s.id === 'anssi-publications' ||
    s.id === 'enisa-news' ||
    s.id === 'enisa-publications' ||
    s.id === 'ncsc-uk-news' ||
    s.id === 'ncsc-uk-reports' ||
    s.id === 'cisa-alerts' ||
    s.id === 'enx-tisax' ||
    s.id === 'cyber-malveillance-fr' ||
    s.tags?.includes('policy') ||
    s.tags?.includes('compliance') ||
    s.tags?.includes('regulation') ||
    s.tags?.includes('tisax') ||
    s.tags?.includes('iso21434')
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

// Detect which framework an article relates to
function detectFrameworks(article: Article): string[] {
  const text = [article.title, article.title_fr, article.title_en, article.description, article.description_fr, article.description_en]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return FRAMEWORKS
    .filter(fw => fw.keywords.some(kw => text.includes(kw)))
    .map(fw => fw.id);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FrameworkBadge({ frameworkId }: { frameworkId: string }) {
  const fw = FRAMEWORKS.find(f => f.id === frameworkId);
  if (!fw) return null;
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wide',
      fw.color
    )}>
      {fw.shortName}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CompliancePage() {
  const { lang } = useLanguage();

  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<TimePeriod>('30d');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [activeFramework, setActiveFramework] = useState<string>('all');

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30', sort: sortBy });
      params.set('sourceIds', GRC_SOURCE_IDS.join(','));
      const startDate = getStartDateFromPeriod(period);
      if (startDate) params.set('startDate', startDate);
      if (search) params.set('search', search);

      // Also fetch policy category articles
      const params2 = new URLSearchParams({ page: String(page), limit: '30', sort: sortBy, category: 'policy' });
      if (startDate) params2.set('startDate', startDate);
      if (search) params2.set('search', search);

      const [r1, r2] = await Promise.all([
        fetch(`/api/articles?${params}`),
        fetch(`/api/articles?${params2}`),
      ]);
      const [d1, d2] = await Promise.all([r1.json(), r2.json()]);

      const all = [...(d1.articles || []), ...(d2.articles || [])];
      const seen = new Set<number>();
      const merged = all.filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });

      merged.sort((a, b) => {
        const da = new Date(a.pub_date || a.collected_at).getTime();
        const db = new Date(b.pub_date || b.collected_at).getTime();
        return sortBy === 'date_asc' ? da - db : db - da;
      });

      setArticles(merged.slice((page - 1) * 30, page * 30));
      const combinedTotal = Math.max(d1.total || 0, d2.total || 0);
      setTotal(combinedTotal);
      setTotalPages(Math.max(d1.totalPages || 1, d2.totalPages || 1));
    } catch (e) {
      console.error('Failed to fetch GRC articles:', e);
    } finally {
      setLoading(false);
    }
  }, [page, search, period, sortBy]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);
  useEffect(() => { setPage(1); }, [search, period, sortBy, activeFramework]);

  const sourceName = (id: string) => sources.find(s => s.id === id)?.name ?? id;
  const articleTitle = (a: Article) => (lang === 'fr' ? a.title_fr : a.title_en) ?? a.title_fr ?? a.title_en ?? a.title ?? '';
  const articleDesc = (a: Article) => (lang === 'fr' ? a.description_fr : a.description_en) ?? a.description ?? '';
  const articleDate = (a: Article) => a.pub_date || a.collected_at;

  // Filter by active framework
  const filteredArticles = activeFramework === 'all'
    ? articles
    : articles.filter(a => detectFrameworks(a).includes(activeFramework));

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {lang === 'fr' ? 'GRC & Conformité' : 'GRC & Compliance'}
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {lang === 'fr'
              ? `Veille réglementaire — NIS2, RGPD, ISO 27001, TISAX, DORA · ${total} publications`
              : `Regulatory watch — NIS2, GDPR, ISO 27001, TISAX, DORA · ${total} publications`}
          </p>
        </div>
        <Button variant="outline" onClick={fetchArticles}>
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* Framework reference cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {FRAMEWORKS.map(fw => (
          <button
            key={fw.id}
            onClick={() => setActiveFramework(activeFramework === fw.id ? 'all' : fw.id)}
            className={cn(
              'rounded-xl border p-3 text-left transition-all group',
              activeFramework === fw.id
                ? 'border-blue-500 ring-1 ring-blue-500/30 bg-blue-50/50 dark:bg-blue-500/10'
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
            )}
          >
            <div className={cn('w-2 h-2 rounded-full mb-2', fw.color)} />
            <div className="text-xs font-bold text-gray-900 dark:text-white">{fw.shortName}</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed line-clamp-2">
              {lang === 'fr' ? fw.descriptionFr : fw.description}
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
          placeholder={lang === 'fr'
            ? 'Rechercher NIS2, TISAX, RGPD, ISO 27001, DORA...'
            : 'Search NIS2, TISAX, GDPR, ISO 27001, DORA...'}
          className={cn(
            'w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-colors',
            'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
            'text-gray-900 dark:text-white placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          )}
        />
      </div>

      {/* Period + Sort */}
      <TimePeriodFilter period={period} setPeriod={setPeriod} sortBy={sortBy} setSortBy={setSortBy} />

      {/* Active framework highlight */}
      {activeFramework !== 'all' && (() => {
        const fw = FRAMEWORKS.find(f => f.id === activeFramework);
        if (!fw) return null;
        return (
          <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn('w-2.5 h-2.5 rounded-full', fw.color)} />
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">{fw.name}</span>
              <span className="text-sm text-blue-700 dark:text-blue-300">— {lang === 'fr' ? fw.descriptionFr : fw.description}</span>
            </div>
            <button onClick={() => setActiveFramework('all')} className="text-xs text-blue-500 hover:text-blue-400 font-medium">
              {lang === 'fr' ? 'Voir tout' : 'Show all'}
            </button>
          </div>
        );
      })()}

      {/* Articles */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {lang === 'fr'
              ? 'Aucune publication réglementaire pour cette période.'
              : 'No regulatory publications for this period.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredArticles.map(a => {
            const fwIds = detectFrameworks(a);
            const title = articleTitle(a);
            const desc = articleDesc(a);

            return (
              <a
                key={a.id}
                href={a.link}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-start gap-4 p-4 rounded-xl border transition-all group',
                  'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800',
                  'hover:shadow-sm hover:border-blue-300 dark:hover:border-blue-700'
                )}
              >
                {/* Left: source/meta */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {sourceName(a.source_id)}
                    </span>
                    {fwIds.map(fwId => (
                      <FrameworkBadge key={fwId} frameworkId={fwId} />
                    ))}
                    {a.category && a.category !== 'general' && fwIds.length === 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase tracking-wide">
                        {a.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {title || a.title}
                  </p>
                  {desc && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {truncate(desc, 200)}
                    </p>
                  )}
                </div>

                {/* Right: time + icon */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="flex items-center gap-1 text-[10px] text-gray-400 whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    {timeAgo(articleDate(a), lang)}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-400">{page} / {totalPages}</span>
          <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
