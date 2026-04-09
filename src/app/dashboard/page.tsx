'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Bug,
  AlertTriangle,
  Radio,
  RefreshCw,
  ArrowRight,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { cn, timeAgo, type Severity } from '@/lib/utils';
import { Card, StatCard, AlertCard } from '@/components/ui/Card';
import { SeverityBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SkeletonStatCard, Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { SeverityPieChart, type SeverityData } from '@/components/charts/SeverityPieChart';
import { CategoryBarChart, type CategoryData } from '@/components/charts/CategoryBarChart';
import { CvssHistogram, type CvssData } from '@/components/charts/CvssHistogram';
import { TimelineChart, type TimelinePoint } from '@/components/charts/TimelineChart';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardStats {
  articles: { last24h: number; last7d: number; last30d: number; total: number };
  cves: { last24h: number; last7d: number; last30d: number; total: number };
  alerts: {
    last24h: number;
    last7d: number;
    last30d: number;
    total: number;
    unacknowledged: number;
  };
  critical: { last24h: number; last7d: number; last30d: number };
  syntheses: { total: number };
  topCategories: Array<{ category: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
}

interface AlertRow {
  id: number;
  type: string;
  title: string;
  title_fr?: string | null;
  description?: string | null;
  severity: string;
  source_link?: string | null;
  acknowledged: number;
  created_at: string;
}

interface SynthesisRow {
  id: number;
  date: string;
  time_slot: string;
  content_fr?: string | null;
  content_en?: string | null;
  articles_count?: number | null;
  cves_count?: number | null;
  critical_count?: number | null;
  created_at: string;
}

interface ArticleRow {
  id: number;
  source_id: string;
  title: string;
  category?: string | null;
  severity?: string | null;
  collected_at: string;
  pub_date?: string | null;
}

interface CveRow {
  id: number;
  cve_id: string;
  cvss_score?: number | null;
  severity?: string | null;
  collected_at: string;
}

// ---------------------------------------------------------------------------
// Data-fetching hook
// ---------------------------------------------------------------------------

const REFRESH_INTERVAL = 120_000;

interface DashboardData {
  stats: DashboardStats | null;
  alerts: AlertRow[];
  synthesis: SynthesisRow | null;
  severityDist: SeverityData[];
  categories: CategoryData[];
  cvssHist: CvssData[];
  timeline: TimelinePoint[];
  topSources: CategoryData[];
  trendingTopics: string[];
}

function useDashboardData() {
  const [data, setData] = useState<DashboardData>({
    stats: null,
    alerts: [],
    synthesis: null,
    severityDist: [],
    categories: [],
    cvssHist: [],
    timeline: [],
    topSources: [],
    trendingTopics: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, alertsRes, synthesisRes, articlesRes, cvesRes] =
        await Promise.all([
          fetch('/api/stats'),
          fetch('/api/alerts?acknowledged=false&limit=5'),
          fetch('/api/synthesis?limit=1'),
          fetch('/api/articles?limit=50'),
          fetch('/api/cves?limit=50'),
        ]);

      // Check for failed responses
      if (!statsRes.ok || !alertsRes.ok || !synthesisRes.ok || !articlesRes.ok || !cvesRes.ok) {
        throw new Error('One or more API requests failed');
      }

      const statsJson = await statsRes.json();
      const alertsJson = await alertsRes.json();
      const synthesisJson = await synthesisRes.json();
      const articlesJson = await articlesRes.json();
      const cvesJson = await cvesRes.json();

      const stats: DashboardStats = statsJson;
      const alerts: AlertRow[] = alertsJson.alerts ?? [];
      const syntheses: SynthesisRow[] = synthesisJson.syntheses ?? [];
      const synthesis = syntheses[0] ?? null;
      const articles: ArticleRow[] = articlesJson.articles ?? [];
      const cvesParsed = cvesJson?.cves ?? [];

      // --- Severity distribution from alerts + articles ---
      const sevCounts: Record<string, number> = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
      };
      for (const a of articles) {
        const sev = (a.severity as string | undefined)?.toLowerCase();
        if (sev && sev in sevCounts) sevCounts[sev]++;
      }
      const severityDist: SeverityData[] = Object.entries(sevCounts).map(
        ([name, value]) => ({ name, value }),
      );

      // --- Categories ---
      const categories: CategoryData[] = stats.topCategories.map((c) => ({
        category: c.category,
        count: c.count,
      }));

      // --- CVSS histogram ---
      const cvssBuckets: Record<string, number> = {};
      const ranges = ['0-1', '1-2', '2-3', '3-4', '4-5', '5-6', '6-7', '7-8', '8-9', '9-10'];
      for (const r of ranges) cvssBuckets[r] = 0;
      for (const c of cvesParsed) {
        const score = c.cvss_score;
        if (score == null) continue;
        const idx = Math.min(Math.floor(score), 9);
        const rangeKey = ranges[idx];
        if (rangeKey) cvssBuckets[rangeKey]++;
      }
      const cvssHist: CvssData[] = ranges.map((range) => ({
        range,
        count: cvssBuckets[range],
      }));

      // --- Timeline: articles/cves per hour over last 24h ---
      const now = new Date();
      const hourBuckets: Record<string, { articles: number; cves: number }> = {};
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 3600_000);
        const key = `${String(d.getHours()).padStart(2, '0')}:00`;
        hourBuckets[key] = { articles: 0, cves: 0 };
      }
      const cutoff24h = new Date(now.getTime() - 24 * 3600_000);
      for (const a of articles) {
        const d = new Date(a.collected_at);
        if (d < cutoff24h) continue;
        const key = `${String(d.getHours()).padStart(2, '0')}:00`;
        if (hourBuckets[key]) hourBuckets[key].articles++;
      }
      for (const c of cvesParsed) {
        const d = new Date(c.collected_at);
        if (d < cutoff24h) continue;
        const key = `${String(d.getHours()).padStart(2, '0')}:00`;
        if (hourBuckets[key]) hourBuckets[key].cves++;
      }
      const timeline: TimelinePoint[] = Object.entries(hourBuckets).map(
        ([hour, v]) => ({ hour, articles: v.articles, cves: v.cves }),
      );

      // --- Top sources ---
      const sourceCounts: Record<string, number> = {};
      for (const a of articles) {
        sourceCounts[a.source_id] = (sourceCounts[a.source_id] || 0) + 1;
      }
      const topSources: CategoryData[] = Object.entries(sourceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([category, count]) => ({ category, count }));

      // --- Trending topics (extract from titles) ---
      const stopWords = new Set([
        'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or',
        'is', 'are', 'was', 'were', 'be', 'has', 'have', 'had', 'with', 'from',
        'by', 'as', 'it', 'its', 'this', 'that', 'de', 'la', 'le', 'les', 'des',
        'un', 'une', 'et', 'en', 'du', 'au', 'aux', 'sur', 'par', 'pour', 'dans',
        'est', 'sont', 'qui', 'que', 'pas', 'plus', 'avec', 'se', 'ce', 'ou',
        '-', '--', '|', '/', ':', 'new', 'via', 'can', 'may', 'now', 'how',
      ]);
      const wordCounts: Record<string, number> = {};
      for (const a of articles) {
        const words = a.title
          .toLowerCase()
          .replace(/[^a-z0-9\u00C0-\u024F\s-]/gi, '')
          .split(/\s+/)
          .filter((w) => w.length > 2 && !stopWords.has(w));
        for (const w of words) {
          wordCounts[w] = (wordCounts[w] || 0) + 1;
        }
      }
      const trendingTopics = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word]) => word);

      setData({
        stats,
        alerts,
        synthesis,
        severityDist,
        categories,
        cvssHist,
        timeline,
        topSources,
        trendingTopics,
      });
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(fetchAll, REFRESH_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchAll]);

  return { ...data, loading, error, lastRefresh, refresh: fetchAll };
}

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------

function ChartSkeleton() {
  return (
    <Card noHover className="flex flex-col">
      <Skeleton className="mb-4 h-5 w-40" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-full min-h-[200px] w-full rounded-lg" />
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Sources horizontal bar (reusing CategoryBarChart layout but horizontal)
// ---------------------------------------------------------------------------

function SourcesBar({
  data,
  className,
}: {
  data: CategoryData[];
  className?: string;
}) {
  const maxCount = useMemo(
    () => Math.max(...data.map((d) => d.count), 1),
    [data],
  );

  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center text-sm text-gray-400', className)}>
        No data
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {data.map((s) => (
        <div key={s.category} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs text-gray-600 dark:text-gray-400">
            {s.category}
          </span>
          <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-cyber-500 transition-all duration-500"
              style={{ width: `${(s.count / maxCount) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
            {s.count}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trending topics as tag cloud
// ---------------------------------------------------------------------------

function TopicCloud({
  topics,
  className,
}: {
  topics: string[];
  className?: string;
}) {
  if (topics.length === 0) {
    return (
      <div className={cn('flex items-center justify-center text-sm text-gray-400', className)}>
        No data
      </div>
    );
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {topics.map((topic, i) => {
        // First few are bigger/bolder
        const isTop = i < 5;
        const isMid = i >= 5 && i < 12;
        return (
          <span
            key={topic}
            className={cn(
              'inline-flex items-center rounded-full border px-3 py-1 transition-colors',
              'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60',
              'hover:border-cyber-400 hover:bg-cyber-50 dark:hover:border-cyber-500 dark:hover:bg-cyber-900/30',
              isTop && 'text-sm font-semibold text-gray-900 dark:text-white',
              isMid && 'text-xs font-medium text-gray-700 dark:text-gray-300',
              !isTop && !isMid && 'text-xs text-gray-500 dark:text-gray-400',
            )}
          >
            {topic}
          </span>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const {
    stats,
    alerts,
    synthesis,
    severityDist,
    categories,
    cvssHist,
    timeline,
    topSources,
    trendingTopics,
    loading,
    error,
    lastRefresh,
    refresh,
  } = useDashboardData();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Count active sources from topSources (unique source_ids seen)
  const activeSourcesCount = topSources.length;

  // Critical alerts count (unacknowledged)
  const criticalCount = stats?.alerts.unacknowledged ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('dashboard.title')}
          </h1>
          {lastRefresh && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              {t('common.lastUpdate')}: {timeAgo(lastRefresh, lang === 'en' ? 'en' : 'fr')}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />}
          loading={refreshing}
          onClick={handleRefresh}
        >
          {t('common.refresh')}
        </Button>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800/60 dark:bg-red-900/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              {t('common.error') ?? 'Error'}: {error}
            </p>
          </div>
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {t('common.tryAgain') ?? 'Click refresh to retry.'}
          </p>
        </div>
      )}

      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard
              label={t('dashboard.totalArticles')}
              value={stats?.articles.last24h ?? 0}
              icon={<ShieldCheck className="h-5 w-5" />}
              trend={
                stats && stats.articles.last7d > 0
                  ? {
                      value: Math.round(
                        ((stats.articles.last24h - stats.articles.last7d / 7) /
                          Math.max(stats.articles.last7d / 7, 1)) *
                          100,
                      ),
                      label: t('dashboard.last24h'),
                    }
                  : undefined
              }
            />
            <StatCard
              label={t('dashboard.totalCves')}
              value={stats?.cves.last24h ?? 0}
              icon={<Bug className="h-5 w-5" />}
              trend={
                stats && stats.cves.last7d > 0
                  ? {
                      value: Math.round(
                        ((stats.cves.last24h - stats.cves.last7d / 7) /
                          Math.max(stats.cves.last7d / 7, 1)) *
                          100,
                      ),
                      label: t('dashboard.last24h'),
                    }
                  : undefined
              }
            />
            <StatCard
              label={t('dashboard.criticalAlerts')}
              value={criticalCount}
              icon={
                <AlertTriangle
                  className={cn(
                    'h-5 w-5',
                    criticalCount > 0 && 'animate-pulse text-threat-critical',
                  )}
                />
              }
              className={cn(
                criticalCount > 0 &&
                  'border-red-300 dark:border-red-800/60',
              )}
            />
            <StatCard
              label={t('dashboard.sourcesActive')}
              value={activeSourcesCount}
              icon={<Radio className="h-5 w-5" />}
            />
          </>
        )}
      </div>

      {/* Row 2: Severity Pie + Category Bar */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <Card noHover>
              <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('dashboard.severityDistribution')}
              </h2>
              <SeverityPieChart data={severityDist} className="h-64" />
            </Card>
            <Card noHover>
              <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('dashboard.articlesByCategory')}
              </h2>
              <CategoryBarChart data={categories} className="h-64" />
            </Card>
          </>
        )}
      </div>

      {/* Row 3: CVSS Histogram + Timeline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <Card noHover>
              <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('dashboard.cvssDistribution')}
              </h2>
              <CvssHistogram data={cvssHist} className="h-64" />
            </Card>
            <Card noHover>
              <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('dashboard.timeline')}
              </h2>
              <TimelineChart
                data={timeline}
                articlesLabel={t('dashboard.totalArticles')}
                cvesLabel={t('dashboard.totalCves')}
                className="h-64"
              />
            </Card>
          </>
        )}
      </div>

      {/* Row 4: Recent Alerts + Latest Synthesis */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            {/* Recent Critical Alerts */}
            <Card noHover>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('dashboard.recentAlerts')}
                </h2>
                <Link
                  href="/alerts"
                  className="flex items-center gap-1 text-xs text-cyber-500 hover:text-cyber-600 dark:text-cyber-400 dark:hover:text-cyber-300"
                >
                  {t('alerts.title')}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {alerts.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                  {t('alerts.allAcknowledged')}
                </p>
              ) : (
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <AlertCard
                      key={alert.id}
                      severity={alert.severity as Severity}
                      className="px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <SeverityBadge severity={alert.severity as Severity} />
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {timeAgo(alert.created_at, lang === 'en' ? 'en' : 'fr')}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                            {lang === 'fr' && alert.title_fr
                              ? alert.title_fr
                              : alert.title}
                          </p>
                          {alert.description && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                              {alert.description}
                            </p>
                          )}
                        </div>
                        {alert.source_link && (
                          <a
                            href={alert.source_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-gray-400 hover:text-cyber-500"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </AlertCard>
                  ))}
                </div>
              )}
            </Card>

            {/* Latest Synthesis Preview */}
            <Card noHover>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('synthesis.title')}
                </h2>
                <Link
                  href="/synthesis"
                  className="flex items-center gap-1 text-xs text-cyber-500 hover:text-cyber-600 dark:text-cyber-400 dark:hover:text-cyber-300"
                >
                  {t('synthesis.previous')}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {synthesis ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      {t('synthesis.date')}: {synthesis.date}
                    </span>
                    <span>
                      {t('synthesis.articlesAnalyzed')}:{' '}
                      {synthesis.articles_count ?? 0}
                    </span>
                    <span>
                      {t('synthesis.cvesDetected')}: {synthesis.cves_count ?? 0}
                    </span>
                    {(synthesis.critical_count ?? 0) > 0 && (
                      <span className="font-medium text-threat-critical">
                        {t('synthesis.criticalEvents')}:{' '}
                        {synthesis.critical_count}
                      </span>
                    )}
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                    <p className="line-clamp-6 whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                      {lang === 'fr'
                        ? synthesis.content_fr ?? synthesis.content_en ?? ''
                        : synthesis.content_en ?? synthesis.content_fr ?? ''}
                    </p>
                  </div>
                  <Link
                    href="/synthesis"
                    className="inline-flex items-center gap-1 text-sm font-medium text-cyber-500 hover:text-cyber-600 dark:text-cyber-400 dark:hover:text-cyber-300"
                  >
                    {t('feeds.readMore')}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                  {t('synthesis.noSynthesis')}
                </p>
              )}
            </Card>
          </>
        )}
      </div>

      {/* Row 5: Top Sources + Trending Topics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <Card noHover>
              <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('dashboard.topSources')}
              </h2>
              <SourcesBar data={topSources} />
            </Card>
            <Card noHover>
              <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('dashboard.trendingTopics')}
              </h2>
              <TopicCloud topics={trendingTopics} />
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
