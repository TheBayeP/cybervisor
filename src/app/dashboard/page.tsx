'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, Bug, AlertTriangle, Radio,
  RefreshCw, ArrowRight, Clock, ExternalLink,
  TrendingUp, Newspaper, CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { cn, timeAgo, type Severity } from '@/lib/utils';
import { Card, StatCard, AlertCard } from '@/components/ui/Card';
import { SeverityBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SkeletonStatCard, Skeleton } from '@/components/ui/Skeleton';
import { SeverityPieChart, type SeverityData } from '@/components/charts/SeverityPieChart';
import { CategoryBarChart, type CategoryData } from '@/components/charts/CategoryBarChart';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardStats {
  articles: { last24h: number; last7d: number; last30d: number; total: number };
  cves: { last24h: number; last7d: number; last30d: number; total: number };
  alerts: { last24h: number; last7d: number; last30d: number; total: number; unacknowledged: number };
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
  title_fr?: string | null;
  title_en?: string | null;
  category?: string | null;
  severity?: string | null;
  link: string;
  pub_date?: string | null;
  collected_at: string;
}

// ---------------------------------------------------------------------------
// Data-fetching hook
// ---------------------------------------------------------------------------

const REFRESH_INTERVAL = 120_000;

function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [synthesis, setSynthesis] = useState<SynthesisRow | null>(null);
  const [recentArticles, setRecentArticles] = useState<ArticleRow[]>([]);
  const [severityDist, setSeverityDist] = useState<SeverityData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [statsRes, alertsRes, synthesisRes, articlesRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/alerts?acknowledged=false&limit=10&sort=severity_desc'),
        fetch('/api/synthesis?limit=1'),
        fetch('/api/articles?limit=20&sort=severity_desc'), // recent high-severity articles
      ]);

      if (!statsRes.ok) throw new Error('Stats API failed');

      const statsJson = await statsRes.json();
      const alertsJson = await alertsRes.json();
      const synthesisJson = await synthesisRes.json();
      const articlesJson = await articlesRes.json();

      const defaultCounts = { last24h: 0, last7d: 0, last30d: 0, total: 0 };
      const parsedStats: DashboardStats = statsJson?.articles
        ? statsJson
        : { articles: defaultCounts, cves: defaultCounts, alerts: { ...defaultCounts, unacknowledged: 0 }, critical: { last24h: 0, last7d: 0, last30d: 0 }, syntheses: { total: 0 }, topCategories: [], topCountries: [] };

      const parsedAlerts: AlertRow[] = alertsJson.alerts ?? [];
      const syntheses: SynthesisRow[] = synthesisJson.syntheses ?? [];
      const parsedArticles: ArticleRow[] = articlesJson.articles ?? [];

      // Severity distribution
      const sevCounts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
      for (const a of parsedArticles) {
        const sev = (a.severity as string | undefined)?.toLowerCase();
        if (sev && sev in sevCounts) sevCounts[sev]++;
      }
      const dist: SeverityData[] = Object.entries(sevCounts).map(([name, value]) => ({ name, value }));

      // Top categories
      const cats: CategoryData[] = parsedStats.topCategories.map(c => ({ category: c.category, count: c.count }));

      setStats(parsedStats);
      setAlerts(parsedAlerts);
      setSynthesis(syntheses[0] ?? null);
      setRecentArticles(
        // Only show critical/high severity articles on dashboard
        parsedArticles.filter(a => a.severity === 'critical' || a.severity === 'high').slice(0, 6)
      );
      setSeverityDist(dist);
      setCategories(cats);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(fetchAll, REFRESH_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchAll]);

  return { stats, alerts, synthesis, recentArticles, severityDist, categories, loading, error, lastRefresh, refresh: fetchAll };
}

// ---------------------------------------------------------------------------
// Synthesis preview renderer — strips markdown for plain text
// ---------------------------------------------------------------------------

function plainText(md: string, maxLen: number): string {
  return md
    .replace(/^#{1,3} .+$/gm, '') // remove headings
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/^- /gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLen) + (md.length > maxLen ? '…' : '');
}

// ---------------------------------------------------------------------------
// Main Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const { stats, alerts, synthesis, recentArticles, severityDist, categories, loading, error, lastRefresh, refresh } = useDashboardData();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const criticalCount = stats?.alerts.unacknowledged ?? 0;

  const getArticleTitle = (a: ArticleRow) =>
    (lang === 'fr' ? a.title_fr : a.title_en) ?? a.title_fr ?? a.title_en ?? a.title;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {lang === 'fr' ? 'Tableau de bord' : 'Dashboard'}
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
            <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Row 1: KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            {/* Critical unacknowledged alerts */}
            <StatCard
              label={lang === 'fr' ? 'Alertes à traiter' : 'Pending Alerts'}
              value={criticalCount}
              icon={
                <AlertTriangle className={cn('h-5 w-5', criticalCount > 0 && 'animate-pulse text-red-500')} />
              }
              className={cn(criticalCount > 0 && 'border-red-300 dark:border-red-800/60')}
            />
            {/* Critical CVEs last 24h */}
            <StatCard
              label={lang === 'fr' ? 'CVE critiques (24h)' : 'Critical CVEs (24h)'}
              value={stats?.critical.last24h ?? 0}
              icon={<Bug className="h-5 w-5" />}
              trend={
                stats && stats.critical.last7d > 0
                  ? {
                      value: Math.round(((stats.critical.last24h - stats.critical.last7d / 7) / Math.max(stats.critical.last7d / 7, 1)) * 100),
                      label: lang === 'fr' ? 'vs moy. 7j' : 'vs 7d avg',
                    }
                  : undefined
              }
            />
            {/* Articles collected last 24h */}
            <StatCard
              label={lang === 'fr' ? 'Articles collectés (24h)' : 'Articles (24h)'}
              value={stats?.articles.last24h ?? 0}
              icon={<Newspaper className="h-5 w-5" />}
              trend={
                stats && stats.articles.last7d > 0
                  ? {
                      value: Math.round(((stats.articles.last24h - stats.articles.last7d / 7) / Math.max(stats.articles.last7d / 7, 1)) * 100),
                      label: lang === 'fr' ? 'vs moy. 7j' : 'vs 7d avg',
                    }
                  : undefined
              }
            />
            {/* Syntheses generated */}
            <StatCard
              label={lang === 'fr' ? 'Briefs générés' : 'Briefs Generated'}
              value={stats?.syntheses.total ?? 0}
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
          </>
        )}
      </div>

      {/* Row 2: Latest synthesis preview (full width) */}
      {!loading && synthesis && (
        <Card noHover className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {lang === 'fr' ? 'Dernier brief RSSI' : 'Latest CISO Brief'}
              </h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                — {synthesis.date}
                {synthesis.time_slot === '08:00' ? ' ☀️' : ' 🌆'}
              </span>
            </div>
            <Link
              href="/synthesis"
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 font-medium"
            >
              {lang === 'fr' ? 'Brief complet' : 'Full brief'}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
            {synthesis.critical_count != null && synthesis.critical_count > 0 && (
              <span className="font-semibold text-red-500">
                🔴 {synthesis.critical_count} {lang === 'fr' ? 'critique(s)' : 'critical'}
              </span>
            )}
            <span>📰 {synthesis.articles_count ?? 0} {lang === 'fr' ? 'articles analysés' : 'articles'}</span>
            <span>🛡️ {synthesis.cves_count ?? 0} CVEs</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {plainText(
              lang === 'fr'
                ? synthesis.content_fr ?? synthesis.content_en ?? ''
                : synthesis.content_en ?? synthesis.content_fr ?? '',
              350
            )}
          </p>
        </Card>
      )}

      {/* Row 3: Critical alerts + Severity distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {loading ? (
          <>
            <div className="h-72 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            <div className="h-72 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          </>
        ) : (
          <>
            {/* Critical alerts */}
            <Card noHover>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {lang === 'fr' ? '🚨 Alertes en attente' : '🚨 Pending Alerts'}
                </h2>
                <Link href="/alerts" className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 font-medium">
                  {lang === 'fr' ? 'Tout voir' : 'View all'}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {alerts.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    {lang === 'fr' ? '✅ Aucune alerte en attente' : '✅ No pending alerts'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.slice(0, 5).map(alert => (
                    <AlertCard key={alert.id} severity={alert.severity as Severity} className="px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <SeverityBadge severity={alert.severity as Severity} />
                            <span className="text-xs text-gray-400">
                              {timeAgo(alert.created_at, lang === 'en' ? 'en' : 'fr')}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                            {lang === 'fr' && alert.title_fr ? alert.title_fr : alert.title}
                          </p>
                        </div>
                        {alert.source_link && (
                          <a href={alert.source_link} target="_blank" rel="noopener noreferrer"
                            className="shrink-0 text-gray-400 hover:text-blue-500">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </AlertCard>
                  ))}
                </div>
              )}
            </Card>

            {/* Severity distribution */}
            <Card noHover>
              <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('dashboard.severityDistribution')}
              </h2>
              <SeverityPieChart data={severityDist} className="h-52" />
            </Card>
          </>
        )}
      </div>

      {/* Row 4: Recent critical/high articles + Top categories */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {loading ? (
          <>
            <div className="h-72 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            <div className="h-72 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          </>
        ) : (
          <>
            {/* Recent high-severity articles */}
            <Card noHover>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {lang === 'fr' ? '🔥 Articles critiques récents' : '🔥 Recent Critical Articles'}
                </h2>
                <Link href="/feeds" className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 font-medium">
                  {lang === 'fr' ? 'Voir tout' : 'View all'}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {recentArticles.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">
                  {lang === 'fr' ? 'Aucun article critique récent.' : 'No recent critical articles.'}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {recentArticles.map(a => (
                    <a
                      key={a.id}
                      href={a.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2.5 group"
                    >
                      <div className={cn(
                        'mt-1 w-2 h-2 rounded-full flex-shrink-0',
                        a.severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-500 transition-colors">
                          {getArticleTitle(a)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {a.source_id} · {timeAgo(a.pub_date || a.collected_at, lang === 'en' ? 'en' : 'fr')}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </Card>

            {/* Top categories */}
            <Card noHover>
              <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('dashboard.articlesByCategory')}
              </h2>
              <CategoryBarChart data={categories} className="h-52" />
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
