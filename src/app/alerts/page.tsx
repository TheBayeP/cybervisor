'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Button, SeverityBadge } from '@/components/ui';
import { TimePeriodFilter, getStartDateFromPeriod, type TimePeriod, type SortOption } from '@/components/feeds/TimePeriodFilter';
import {
  AlertTriangle, CheckCircle, Bell, RefreshCw,
  Shield, Bug, Zap, ExternalLink, ShieldAlert,
} from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';

interface Alert {
  id: number;
  type: string;
  title: string;
  title_fr?: string;
  description: string;
  severity: string;
  source_link?: string;
  acknowledged: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Alert type config
// ---------------------------------------------------------------------------

interface AlertTypeConfig {
  icon: typeof AlertTriangle;
  label: string;
  labelFr: string;
  color: string;
  bg: string;
}

const TYPE_CONFIG: Record<string, AlertTypeConfig> = {
  cve_critical_exploited: {
    icon: Zap,
    label: 'Actively Exploited CVE',
    labelFr: 'CVE Exploitée Activement',
    color: 'text-red-500',
    bg: 'bg-red-100 dark:bg-red-900/30',
  },
  cve_critical_major_vendor: {
    icon: Bug,
    label: 'Critical CVE — Major Vendor',
    labelFr: 'CVE Critique — Éditeur Major',
    color: 'text-orange-500',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
  },
  cve_critical: {
    icon: Bug,
    label: 'Critical CVE',
    labelFr: 'CVE Critique',
    color: 'text-orange-500',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
  },
  major_attack: {
    icon: Shield,
    label: 'Major Attack',
    labelFr: 'Attaque Majeure',
    color: 'text-purple-500',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
  },
  zero_day: {
    icon: ShieldAlert,
    label: 'Zero-Day',
    labelFr: 'Zero-Day',
    color: 'text-red-500',
    bg: 'bg-red-100 dark:bg-red-900/30',
  },
  regulatory_alert: {
    icon: Shield,
    label: 'Regulatory Alert',
    labelFr: 'Alerte Réglementaire',
    color: 'text-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
};

const DEFAULT_CONFIG: AlertTypeConfig = {
  icon: AlertTriangle,
  label: 'Alert',
  labelFr: 'Alerte',
  color: 'text-yellow-500',
  bg: 'bg-yellow-100 dark:bg-yellow-900/30',
};

const BORDER_BY_SEV: Record<string, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-blue-400',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type FilterTab = 'all' | 'new' | 'acknowledged';
type TypeFilter = 'all' | string;

export default function AlertsPage() {
  const { lang } = useLanguage();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('new'); // default to new/unacknowledged
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [period, setPeriod] = useState<TimePeriod>('7d');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (filter === 'new') params.set('acknowledged', 'false');
      if (filter === 'acknowledged') params.set('acknowledged', 'true');
      const startDate = getStartDateFromPeriod(period);
      if (startDate) params.set('since', startDate);
      params.set('sort', sortBy);

      const res = await fetch(`/api/alerts?${params}`);
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (e) {
      console.error('Failed to fetch alerts:', e);
    } finally {
      setLoading(false);
    }
  }, [filter, period, sortBy]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const acknowledge = async (id: number) => {
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: 1 } : a));
    } catch (e) {
      console.error('Failed to acknowledge alert:', e);
    }
  };

  const acknowledgeAll = async () => {
    const unacked = visibleAlerts.filter(a => !a.acknowledged);
    for (const alert of unacked) {
      await acknowledge(alert.id);
    }
  };

  // Collect known types for the type filter
  const knownTypes = Array.from(new Set(alerts.map(a => a.type)));

  const visibleAlerts = typeFilter === 'all'
    ? alerts
    : alerts.filter(a => a.type === typeFilter);

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  const getTitle = (a: Alert) => (lang === 'fr' && a.title_fr) ? a.title_fr : a.title;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {lang === 'fr' ? 'Alertes de sécurité' : 'Security Alerts'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {lang === 'fr'
              ? 'CVE critiques, exploitations actives et attaques majeures'
              : 'Critical CVEs, active exploits and major attacks'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unacknowledgedCount > 0 && filter !== 'acknowledged' && (
            <Button variant="outline" onClick={acknowledgeAll}>
              <CheckCircle className="w-4 h-4 mr-1" />
              {lang === 'fr' ? 'Tout acquitter' : 'Acknowledge all'}
            </Button>
          )}
          <Button variant="outline" onClick={fetchAlerts}>
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {(['new', 'all', 'acknowledged'] as FilterTab[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 text-sm rounded-md transition-colors',
                filter === f
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm font-medium'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {f === 'all' && (lang === 'fr' ? 'Toutes' : 'All')}
              {f === 'new' && (
                <span className="flex items-center gap-1.5">
                  {lang === 'fr' ? 'Non acquittées' : 'Unacknowledged'}
                  {unacknowledgedCount > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                      {unacknowledgedCount > 99 ? '99+' : unacknowledgedCount}
                    </span>
                  )}
                </span>
              )}
              {f === 'acknowledged' && (lang === 'fr' ? 'Acquittées' : 'Acknowledged')}
            </button>
          ))}
        </div>
      </div>

      {/* Type filter chips */}
      {knownTypes.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTypeFilter('all')}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
              typeFilter === 'all'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400'
            )}
          >
            {lang === 'fr' ? 'Tous les types' : 'All types'}
          </button>
          {knownTypes.map(type => {
            const cfg = TYPE_CONFIG[type] ?? DEFAULT_CONFIG;
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                  typeFilter === type
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                )}
              >
                {lang === 'fr' ? cfg.labelFr : cfg.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Time Period & Sort */}
      <TimePeriodFilter period={period} setPeriod={setPeriod} sortBy={sortBy} setSortBy={setSortBy} />

      {/* Alerts List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : visibleAlerts.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {filter === 'new'
              ? (lang === 'fr' ? '✅ Aucune alerte en attente' : '✅ No pending alerts')
              : (lang === 'fr' ? 'Aucune alerte' : 'No alerts')}
          </p>
          {filter === 'new' && (
            <p className="text-sm text-gray-400 mt-2">
              {lang === 'fr' ? 'Toutes les alertes ont été acquittées.' : 'All alerts have been acknowledged.'}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleAlerts.map((alert) => {
            const cfg = TYPE_CONFIG[alert.type] ?? DEFAULT_CONFIG;
            const Icon = cfg.icon;
            const borderColor = BORDER_BY_SEV[alert.severity] ?? 'border-l-gray-400';
            const lines = alert.description?.split('\n').filter(Boolean) ?? [];

            return (
              <div
                key={alert.id}
                className={cn(
                  'rounded-xl border border-l-4 transition-all',
                  'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800',
                  borderColor,
                  alert.acknowledged && 'opacity-60'
                )}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Icon */}
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', cfg.bg, cfg.color)}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Title row */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <SeverityBadge severity={alert.severity as 'critical' | 'high' | 'medium' | 'low'} />
                          <span className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide',
                            cfg.bg, cfg.color
                          )}>
                            {lang === 'fr' ? cfg.labelFr : cfg.label}
                          </span>
                        </div>
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">
                          {getTitle(alert)}
                        </h3>

                        {/* Description lines */}
                        {lines.length > 0 && (
                          <div className="space-y-1">
                            {lines.map((line, i) => (
                              <p key={i} className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                {line}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                          <span>{timeAgo(alert.created_at, lang)}</span>
                          {alert.source_link && (
                            <a
                              href={alert.source_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-500 hover:text-blue-400 font-medium"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {lang === 'fr' ? 'Voir NVD' : 'View NVD'}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Acknowledge button */}
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledge(alert.id)}
                        className={cn(
                          'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
                          'border border-gray-200 dark:border-gray-700',
                          'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
                          'transition-colors'
                        )}
                        title={lang === 'fr' ? 'Marquer comme traitée' : 'Mark as handled'}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {lang === 'fr' ? 'Acquitter' : 'Acknowledge'}
                      </button>
                    )}
                    {alert.acknowledged && (
                      <span className="flex-shrink-0 flex items-center gap-1 text-xs text-green-500 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {lang === 'fr' ? 'Traitée' : 'Handled'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
