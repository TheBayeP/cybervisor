'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Button, SeverityBadge } from '@/components/ui';
import { AlertTriangle, CheckCircle, Bell, RefreshCw, Shield, Bug, Zap } from 'lucide-react';
import { cn, formatDate, timeAgo } from '@/lib/utils';

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

const typeIcons: Record<string, typeof AlertTriangle> = {
  cve_critical: Bug,
  major_attack: Shield,
  zero_day: Zap,
};

export default function AlertsPage() {
  const { t, lang } = useLanguage();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'acknowledged'>('all');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filter === 'new') params.set('acknowledged', 'false');
      if (filter === 'acknowledged') params.set('acknowledged', 'true');

      const res = await fetch(`/api/alerts?${params}`);
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (e) {
      console.error('Failed to fetch alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, [filter]);

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
    const unacked = alerts.filter(a => !a.acknowledged);
    for (const alert of unacked) {
      await acknowledge(alert.id);
    }
  };

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  const getTitle = (a: Alert) => (lang === 'fr' && a.title_fr) ? a.title_fr : a.title;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('alerts.title')}</h1>
          {unacknowledgedCount > 0 && (
            <p className="text-sm text-red-500 mt-1">
              {unacknowledgedCount} {lang === 'fr' ? 'non acquittée(s)' : 'unacknowledged'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unacknowledgedCount > 0 && (
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

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
        {(['all', 'new', 'acknowledged'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 text-sm rounded-md transition-colors',
              filter === f
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            {f === 'all' && (lang === 'fr' ? 'Toutes' : 'All')}
            {f === 'new' && t('alerts.new')}
            {f === 'acknowledged' && t('alerts.acknowledged')}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {filter === 'new' ? t('alerts.allAcknowledged') : (lang === 'fr' ? 'Aucune alerte' : 'No alerts')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = typeIcons[alert.type] || AlertTriangle;
            const borderColor =
              alert.severity === 'critical' ? 'border-l-red-500' :
              alert.severity === 'high' ? 'border-l-orange-500' :
              alert.severity === 'medium' ? 'border-l-yellow-500' :
              'border-l-green-500';

            return (
              <div
                key={alert.id}
                className={cn(
                  'rounded-xl border border-l-4 p-4 transition-all',
                  'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800',
                  borderColor,
                  alert.acknowledged && 'opacity-60'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                      alert.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-500' :
                      alert.severity === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-500' :
                      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500'
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {getTitle(alert)}
                        </h3>
                        <SeverityBadge severity={alert.severity as any} />
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                          {t(`alerts.types.${alert.type}`) || alert.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>{timeAgo(alert.created_at, lang)}</span>
                        {alert.source_link && (
                          <a
                            href={alert.source_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyber-500 hover:text-cyber-400"
                          >
                            {lang === 'fr' ? 'Voir la source' : 'View source'}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <Button
                      variant="ghost"
                      onClick={() => acknowledge(alert.id)}
                      className="flex-shrink-0"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {t('alerts.acknowledge')}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
