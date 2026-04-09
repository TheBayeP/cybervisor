'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/lib/i18n';
import { SeverityBadge } from '@/components/ui';
import { TimePeriodFilter, getStartDateFromPeriod, type TimePeriod, type SortOption } from '@/components/feeds/TimePeriodFilter';
import { Shield, Bug, AlertTriangle, Newspaper, ExternalLink, RefreshCw, ChevronDown, Eye } from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WatchEvent {
  id: number;
  type: 'article' | 'cve' | 'alert';
  title: string;
  description?: string;
  severity?: string;
  link?: string;
  source_id?: string;
  category?: string;
  cve_id?: string;
  cvss_score?: number;
  date: string;
}

interface DayGroup {
  date: string;
  label: string;
  events: WatchEvent[];
  stats: { articles: number; cves: number; alerts: number; critical: number };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WatchPage() {
  const { t, lang } = useLanguage();
  const [events, setEvents] = useState<WatchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [period, setPeriod] = useState<TimePeriod>('7d');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [typeFilter, setTypeFilter] = useState<'all' | 'article' | 'cve' | 'alert'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);

  const fetchEvents = useCallback(async (pageNum: number, append: boolean = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: '50' });
      const startDate = getStartDateFromPeriod(period);
      if (startDate) params.set('startDate', startDate);
      params.set('sort', sortBy);
      if (typeFilter !== 'all') params.set('type', typeFilter);

      const res = await fetch(`/api/watch?${params}`);
      const data = await res.json();
      const newEvents = data.events || [];

      if (append) {
        setEvents(prev => [...prev, ...newEvents]);
      } else {
        setEvents(newEvents);
      }
      setHasMore(newEvents.length === 50);
    } catch (e) {
      console.error('Failed to fetch watch events:', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [period, sortBy, typeFilter]);

  useEffect(() => {
    setPage(1);
    fetchEvents(1);
  }, [fetchEvents]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchEvents(nextPage, true);
  };

  // Group events by day
  const dayGroups: DayGroup[] = (() => {
    const groups = new Map<string, DayGroup>();

    for (const event of events) {
      const d = new Date(event.date);
      const dateKey = d.toISOString().split('T')[0];

      if (!groups.has(dateKey)) {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        let label: string;
        if (dateKey === today) label = lang === 'fr' ? 'Aujourd\'hui' : 'Today';
        else if (dateKey === yesterday) label = lang === 'fr' ? 'Hier' : 'Yesterday';
        else label = d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });

        groups.set(dateKey, { date: dateKey, label, events: [], stats: { articles: 0, cves: 0, alerts: 0, critical: 0 } });
      }

      const group = groups.get(dateKey)!;
      group.events.push(event);
      if (event.type === 'article') group.stats.articles++;
      else if (event.type === 'cve') group.stats.cves++;
      else if (event.type === 'alert') group.stats.alerts++;
      if (event.severity === 'critical') group.stats.critical++;
    }

    return Array.from(groups.values()).sort((a, b) =>
      sortBy === 'date_asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
    );
  })();

  const TYPE_ICONS = { article: Newspaper, cve: Bug, alert: AlertTriangle };
  const TYPE_COLORS = {
    article: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
    cve: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30',
    alert: 'text-red-500 bg-red-100 dark:bg-red-900/30',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {lang === 'fr' ? 'Veille Cyber' : 'Cyber Watch'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {lang === 'fr' ? 'Timeline unifiée des événements cybersécurité' : 'Unified cybersecurity event timeline'}
          </p>
        </div>
        <button
          onClick={() => { setPage(1); fetchEvents(1); }}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4 text-gray-500', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'article', 'cve', 'alert'] as const).map(type => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              typeFilter === type
                ? 'bg-cyber-500 text-white'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
            )}
          >
            {type === 'all' ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              (() => { const Icon = TYPE_ICONS[type]; return <Icon className="w-3.5 h-3.5" />; })()
            )}
            {type === 'all' ? (lang === 'fr' ? 'Tout' : 'All') :
             type === 'article' ? 'Articles' :
             type === 'cve' ? 'CVEs' :
             (lang === 'fr' ? 'Alertes' : 'Alerts')}
          </button>
        ))}
      </div>

      {/* Period filter */}
      <TimePeriodFilter period={period} setPeriod={setPeriod} sortBy={sortBy} setSortBy={setSortBy} />

      {/* Timeline */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <Shield className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {lang === 'fr' ? 'Aucun événement trouvé' : 'No events found'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {dayGroups.map(group => (
            <div key={group.date}>
              {/* Day header */}
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">{group.label}</h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-blue-500">
                    <Newspaper className="w-3 h-3" /> {group.stats.articles}
                  </span>
                  <span className="flex items-center gap-1 text-orange-500">
                    <Bug className="w-3 h-3" /> {group.stats.cves}
                  </span>
                  <span className="flex items-center gap-1 text-red-500">
                    <AlertTriangle className="w-3 h-3" /> {group.stats.alerts}
                  </span>
                  {group.stats.critical > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 font-bold">
                      {group.stats.critical} {lang === 'fr' ? 'critiques' : 'critical'}
                    </span>
                  )}
                </div>
              </div>

              {/* Events */}
              <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-800 space-y-3">
                {group.events.map(event => {
                  const Icon = TYPE_ICONS[event.type];
                  const colorClass = TYPE_COLORS[event.type];

                  return (
                    <div key={`${event.type}-${event.id}`} className="relative">
                      {/* Timeline dot */}
                      <div className={cn('absolute -left-[31px] w-4 h-4 rounded-full border-2 border-white dark:border-gray-950', colorClass)} />

                      <div className={cn(
                        'rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3',
                        'hover:border-gray-300 dark:hover:border-gray-700 transition-all'
                      )}>
                        <div className="flex items-start gap-3">
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', colorClass)}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium text-sm text-gray-900 dark:text-white">
                                {event.cve_id ? `${event.cve_id}: ` : ''}{event.title}
                              </h3>
                              {event.severity && <SeverityBadge severity={event.severity as any} />}
                              {event.cvss_score != null && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                  CVSS {event.cvss_score}
                                </span>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{event.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                              <span>{timeAgo(event.date, lang)}</span>
                              {event.source_id && <span>{event.source_id}</span>}
                              {event.category && (
                                <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{event.category}</span>
                              )}
                              {event.link && (
                                <a href={event.link} target="_blank" rel="noopener noreferrer" className="text-cyber-500 hover:text-cyber-400 flex items-center gap-0.5">
                                  <ExternalLink className="w-3 h-3" />
                                  {lang === 'fr' ? 'Source' : 'Source'}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Load more */}
          {hasMore && (
            <div ref={observerRef} className="flex justify-center pt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className={cn(
                  'flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all',
                  'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800',
                  'hover:border-gray-300 dark:hover:border-gray-700',
                  'text-gray-600 dark:text-gray-400'
                )}
              >
                {loadingMore ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                {lang === 'fr' ? 'Charger plus' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
