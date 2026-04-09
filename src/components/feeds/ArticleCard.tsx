'use client';

import { memo, useCallback, type MouseEvent } from 'react';
import { ExternalLink, CheckCircle2, Clock } from 'lucide-react';
import { SeverityBadge, CategoryBadge, Card } from '@/components/ui';
import { useLanguage } from '@/lib/i18n';
import {
  cn,
  truncate,
  timeAgo,
  type Severity,
} from '@/lib/utils';
import { countryFlag } from './FilterBar';
import { sources } from '@/lib/sources';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Article {
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
  country?: string | null;
  language?: string | null;
  collected_at: string;
  read: number;
}

export interface ArticleCardProps {
  article: Article;
  onMarkRead?: (id: number) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Severity-border mapping
// ---------------------------------------------------------------------------

const borderColor: Record<string, string> = {
  critical: 'border-l-red-600',
  high: 'border-l-orange-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-green-500',
  info: 'border-l-blue-500',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ArticleCard = memo(function ArticleCard({
  article,
  onMarkRead,
  className,
}: ArticleCardProps) {
  const { t, lang } = useLanguage();

  // Resolve localized title / description
  const title =
    (lang === 'fr' ? article.title_fr : article.title_en) ?? article.title;
  const description =
    (lang === 'fr' ? article.description_fr : article.description_en) ??
    article.description ??
    '';

  const severity = (article.severity ?? 'info') as Severity;
  const sourceMeta = sources.find((s) => s.id === article.source_id);
  const country = article.country ?? sourceMeta?.country ?? '';

  const handleMarkRead = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onMarkRead?.(article.id);
    },
    [article.id, onMarkRead],
  );

  const handleOpenLink = useCallback(() => {
    window.open(article.link, '_blank', 'noopener,noreferrer');
  }, [article.link]);

  return (
    <Card
      className={cn(
        'relative border-l-4 cursor-pointer group',
        borderColor[severity] ?? 'border-l-gray-400',
        article.read ? 'opacity-60' : '',
        className,
      )}
      onClick={handleOpenLink}
    >
      <div className="flex flex-col gap-2">
        {/* -- Header row: severity + category + time -- */}
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={severity} />
          {article.category && (
            <CategoryBadge category={t(`feeds.categories.${article.category}`) || article.category} />
          )}
          <span className="ml-auto flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            <Clock className="h-3 w-3" />
            {article.pub_date ? timeAgo(article.pub_date, lang) : timeAgo(article.collected_at, lang)}
          </span>
        </div>

        {/* -- Title -- */}
        <h3 className="text-sm font-semibold leading-snug text-gray-900 dark:text-white group-hover:text-cyber-600 dark:group-hover:text-cyber-400 transition-colors line-clamp-2">
          {title}
        </h3>

        {/* -- Description preview -- */}
        {description && (
          <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
            {truncate(description, 150)}
          </p>
        )}

        {/* -- Footer: source + country + actions -- */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {sourceMeta?.name ?? article.source_id}
          </span>
          {country && (
            <span className="text-xs text-gray-500 dark:text-gray-400" title={country}>
              {countryFlag(country)} {country}
            </span>
          )}

          <div className="ml-auto flex items-center gap-1">
            {!article.read && onMarkRead && (
              <button
                onClick={handleMarkRead}
                className={cn(
                  'flex items-center gap-1 rounded-md px-2 py-1 text-xs',
                  'text-gray-500 hover:text-cyber-600 hover:bg-cyber-50',
                  'dark:text-gray-400 dark:hover:text-cyber-400 dark:hover:bg-cyber-900/30',
                  'transition-colors',
                )}
                title={t('feeds.markAsRead')}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('feeds.markAsRead')}</span>
              </button>
            )}
            {article.read === 1 && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('feeds.markedAsRead')}</span>
              </span>
            )}
            <ExternalLink className="h-3.5 w-3.5 text-gray-400 group-hover:text-cyber-500 transition-colors" />
          </div>
        </div>
      </div>
    </Card>
  );
});

export default ArticleCard;
