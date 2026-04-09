'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui';
import { Brain, Clock, FileText, AlertTriangle, Bug, RefreshCw, Sparkles, TrendingUp, Shield, ChevronRight } from 'lucide-react';
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

// ---------------------------------------------------------------------------
// Markdown-like rendering
// ---------------------------------------------------------------------------

function renderContent(raw: string): string {
  if (!raw) return '';
  return raw
    // Headers
    .replace(/^### (.*$)/gm, '<h3 class="text-base font-bold text-gray-900 dark:text-white mt-5 mb-2 flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-cyber-500 inline-block"></span>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-3 pb-2 border-b border-gray-200 dark:border-gray-800">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-4">$1</h1>')
    // Bold  
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 dark:text-white font-semibold">$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-cyber-600 dark:text-cyber-400">$1</code>')
    // CVE references - make them stand out
    .replace(/(CVE-\d{4}-\d{4,})/g, '<span class="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-mono font-bold">$1</span>')
    // Lists
    .replace(/^- (.*$)/gm, '<li class="flex items-start gap-2 ml-2 mb-1.5 text-gray-700 dark:text-gray-300 text-sm"><span class="w-1 h-1 rounded-full bg-gray-400 mt-2 shrink-0"></span><span>$1</span></li>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '<div class="my-3"></div>')
    // Single newline
    .replace(/\n/g, '<br/>');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SynthesisPage() {
  const { t, lang } = useLanguage();
  const [syntheses, setSyntheses] = useState<Synthesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fetchSyntheses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/synthesis?limit=30');
      const data = await res.json();
      setSyntheses(data.syntheses || []);
      if (data.syntheses?.length > 0) {
        setSelectedId(data.syntheses[0].id);
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
  const getSlotIcon = (slot: string) => slot === '08:00' ? '🌅' : '🌇';

  const selected = syntheses.find(s => s.id === selectedId);

  return (
    <div className="space-y-6">
      {/* Header */}
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
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* Left sidebar - synthesis list */}
          <div className="space-y-2 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto lg:pr-2">
            {syntheses.map(synthesis => {
              const isSelected = selectedId === synthesis.id;
              return (
                <button
                  key={synthesis.id}
                  onClick={() => setSelectedId(synthesis.id)}
                  className={cn(
                    'w-full text-left rounded-xl border p-3.5 transition-all',
                    isSelected
                      ? 'border-cyber-500 bg-cyber-500/5 dark:bg-cyber-500/10 ring-1 ring-cyber-500/20'
                      : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getSlotIcon(synthesis.time_slot)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 dark:text-white">
                        {getSlotLabel(synthesis.time_slot)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(synthesis.date, lang)}
                      </div>
                    </div>
                    <ChevronRight className={cn('w-4 h-4 text-gray-400 transition-transform', isSelected && 'text-cyber-500')} />
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                      <FileText className="w-3 h-3" /> {synthesis.articles_count}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                      <Bug className="w-3 h-3" /> {synthesis.cves_count}
                    </span>
                    {synthesis.critical_count > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 font-bold">
                        <AlertTriangle className="w-3 h-3" /> {synthesis.critical_count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right content - selected synthesis */}
          {selected && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              {/* Synthesis header */}
              <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/50 dark:to-transparent">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{getSlotIcon(selected.time_slot)}</span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {getSlotLabel(selected.time_slot)}
                    </h2>
                    <p className="text-sm text-gray-500">{formatDate(selected.date, lang)}</p>
                  </div>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 text-center">
                    <FileText className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{selected.articles_count}</div>
                    <div className="text-[10px] uppercase tracking-wide text-gray-500">
                      {lang === 'fr' ? 'Articles' : 'Articles'}
                    </div>
                  </div>
                  <div className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 text-center">
                    <Bug className="w-5 h-5 mx-auto text-orange-500 mb-1" />
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{selected.cves_count}</div>
                    <div className="text-[10px] uppercase tracking-wide text-gray-500">CVEs</div>
                  </div>
                  <div className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 text-center">
                    <AlertTriangle className={cn('w-5 h-5 mx-auto mb-1', selected.critical_count > 0 ? 'text-red-500' : 'text-gray-400')} />
                    <div className={cn('text-xl font-bold', selected.critical_count > 0 ? 'text-red-500' : 'text-gray-900 dark:text-white')}>
                      {selected.critical_count}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-gray-500">
                      {lang === 'fr' ? 'Critiques' : 'Critical'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div
                  className="text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: renderContent(getContent(selected)) }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
