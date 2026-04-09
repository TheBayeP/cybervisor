'use client';

import { cn, severityColor, severityBgColor, formatDate } from '@/lib/utils';
import { SeverityBadge } from '@/components/ui';
import { ExternalLink, Calendar, Package } from 'lucide-react';

interface Cve {
  id: number;
  cve_id: string;
  description: string;
  description_fr?: string;
  cvss_score: number | null;
  cvss_vector?: string;
  severity: string;
  published_date: string;
  modified_date?: string;
  references_json?: string;
  affected_products?: string;
}

interface CveCardProps {
  cve: Cve;
  lang?: string;
}

export function CveCard({ cve, lang = 'fr' }: CveCardProps) {
  const score = cve.cvss_score ?? 0;
  const scorePercent = (score / 10) * 100;

  const scoreColorClass =
    score >= 9 ? 'bg-red-500' :
    score >= 7 ? 'bg-orange-500' :
    score >= 4 ? 'bg-yellow-500' :
    'bg-green-500';

  const references = cve.references_json ? JSON.parse(cve.references_json) : [];
  const products = cve.affected_products ? cve.affected_products.split(',').slice(0, 5) : [];
  const desc = (lang === 'fr' && cve.description_fr) ? cve.description_fr : cve.description;

  return (
    <div className={cn(
      'group rounded-xl border p-5 transition-all duration-200 hover:shadow-lg',
      'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800',
      'hover:border-cyber-400 dark:hover:border-cyber-600'
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white font-mono">
              {cve.cve_id}
            </h3>
            <SeverityBadge severity={(cve.severity || 'info') as any} />
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
            {desc}
          </p>

          {products.length > 0 && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Package className="w-3.5 h-3.5 text-gray-400" />
              {products.map((p, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  {p.trim()}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(cve.published_date, lang as any)}
            </span>
            {references.length > 0 && (
              <a
                href={references[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-cyber-500 hover:text-cyber-400 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {references.length} ref{references.length > 1 ? 's' : ''}
              </a>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 w-20 text-center">
          <div className={cn(
            'text-2xl font-bold rounded-xl p-3',
            score >= 9 ? 'text-red-500 bg-red-50 dark:bg-red-950/30' :
            score >= 7 ? 'text-orange-500 bg-orange-50 dark:bg-orange-950/30' :
            score >= 4 ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/30' :
            'text-green-500 bg-green-50 dark:bg-green-950/30'
          )}>
            {score.toFixed(1)}
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', scoreColorClass)}
              style={{ width: `${scorePercent}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">CVSS</span>
        </div>
      </div>
    </div>
  );
}
