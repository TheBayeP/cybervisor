'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui';
import { Brain, Clock, FileText, AlertTriangle, Bug, RefreshCw, ChevronDown, Sparkles } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface Synthesis {
  id: number;
  date: string;
  time_slot: string;
  content_fr: string;
  content_en: string;
  articles_count: number;
  cves_count: number;
  critical_count: number;
  created_at: string;
}

export default function SynthesisPage() {
  const { t, lang } = useLanguage();
  const [syntheses, setSyntheses] = useState<Synthesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchSyntheses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/synthesis?limit=30');
      const data = await res.json();
      setSyntheses(data.syntheses || []);
      if (data.syntheses?.length > 0) {
        setExpandedId(data.syntheses[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch syntheses:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSyntheses(); }, []);

  const handleGenerate = async (timeSlot: '08:00' | '14:00') => {
    setGenerating(true);
    try {
      const res = await fetch('/api/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeSlot }),
      });
      if (res.ok) {
        await fetchSyntheses();
      }
    } catch (e) {
      console.error('Failed to generate synthesis:', e);
    } finally {
      setGenerating(false);
    }
  };

  const getContent = (s: Synthesis) => lang === 'fr' ? (s.content_fr || s.content_en) : (s.content_en || s.content_fr);
  const getSlotLabel = (slot: string) => slot === '08:00' ? t('synthesis.morning') : t('synthesis.afternoon');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('synthesis.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {lang === 'fr' ? 'Brief cybersécurité généré par IA' : 'AI-generated cybersecurity brief'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleGenerate('08:00')} disabled={generating}>
            {generating ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
            {t('synthesis.morning')}
          </Button>
          <Button variant="outline" onClick={() => handleGenerate('14:00')} disabled={generating}>
            {generating ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
            {t('synthesis.afternoon')}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : syntheses.length === 0 ? (
        <div className="text-center py-20">
          <Brain className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">{t('synthesis.noSynthesis')}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            {lang === 'fr'
              ? 'Cliquez sur un des boutons ci-dessus pour générer votre premier brief.'
              : 'Click one of the buttons above to generate your first brief.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {syntheses.map((synthesis) => {
            const isExpanded = expandedId === synthesis.id;
            const content = getContent(synthesis);

            return (
              <div
                key={synthesis.id}
                className={cn(
                  'rounded-xl border transition-all duration-200',
                  'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800',
                  isExpanded && 'ring-2 ring-cyber-500/30'
                )}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : synthesis.id)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      synthesis.time_slot === '08:00'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                    )}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {getSlotLabel(synthesis.time_slot)}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(synthesis.date, lang)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        <FileText className="w-3 h-3" />
                        {synthesis.articles_count}
                      </span>
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        <Bug className="w-3 h-3" />
                        {synthesis.cves_count}
                      </span>
                      {synthesis.critical_count > 0 && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600">
                          <AlertTriangle className="w-3 h-3" />
                          {synthesis.critical_count}
                        </span>
                      )}
                    </div>
                    <ChevronDown className={cn(
                      'w-5 h-5 text-gray-400 transition-transform',
                      isExpanded && 'rotate-180'
                    )} />
                  </div>
                </button>

                {isExpanded && content && (
                  <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800">
                    <div className="pt-4 prose prose-sm dark:prose-invert max-w-none">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: content
                            .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2">$1</h3>')
                            .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-3">$1</h2>')
                            .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-3">$1</h1>')
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/^- (.*$)/gm, '<li class="ml-4 text-gray-700 dark:text-gray-300">$1</li>')
                            .replace(/\n\n/g, '<br/><br/>')
                            .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm">$1</code>')
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
