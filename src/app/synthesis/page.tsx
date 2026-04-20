'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui';
import {
  Brain, Clock, FileText, AlertTriangle, Bug,
  RefreshCw, Sparkles, ChevronRight, Download,
} from 'lucide-react';
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
// Markdown renderer — styled for executive reading
// ---------------------------------------------------------------------------

function renderContent(raw: string): string {
  if (!raw) return '';
  return raw
    // H2 sections — main sections with bottom border
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold text-gray-900 dark:text-white mt-6 mb-3 pb-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">$1</h2>')
    // H3 sub-sections
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-2">$1</h3>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em class="text-gray-600 dark:text-gray-400">$1</em>')
    // Inline code (CVE IDs etc.)
    .replace(/`(CVE-[\d-]+)`/g, '<code class="px-1.5 py-0.5 bg-orange-50 dark:bg-orange-900/20 rounded text-xs font-mono font-bold text-orange-700 dark:text-orange-400">$1</code>')
    .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-700 dark:text-gray-300">$1</code>')
    // CVE references standalone
    .replace(/(CVE-\d{4}-\d{4,})/g, '<span class="inline-flex items-center px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-xs font-mono font-bold">$1</span>')
    // List items — styled
    .replace(/^- 🔴 (.+)$/gm, '<li class="flex items-start gap-2 mb-2 pl-1"><span class="mt-0.5 flex-shrink-0 text-sm">🔴</span><span class="text-sm text-gray-700 dark:text-gray-300">$1</span></li>')
    .replace(/^- 🟠 (.+)$/gm, '<li class="flex items-start gap-2 mb-2 pl-1"><span class="mt-0.5 flex-shrink-0 text-sm">🟠</span><span class="text-sm text-gray-700 dark:text-gray-300">$1</span></li>')
    .replace(/^- 🟡 (.+)$/gm, '<li class="flex items-start gap-2 mb-2 pl-1"><span class="mt-0.5 flex-shrink-0 text-sm">🟡</span><span class="text-sm text-gray-700 dark:text-gray-300">$1</span></li>')
    .replace(/^- ✅ (.+)$/gm, '<li class="flex items-start gap-2 mb-2 pl-1"><span class="mt-0.5 flex-shrink-0 text-sm">✅</span><span class="text-sm text-gray-700 dark:text-gray-300">$1</span></li>')
    .replace(/^- 📊 (.+)$/gm, '<li class="flex items-start gap-2 mb-2 pl-1"><span class="mt-0.5 flex-shrink-0 text-sm">📊</span><span class="text-sm text-gray-700 dark:text-gray-300">$1</span></li>')
    .replace(/^- (.+)$/gm, '<li class="flex items-start gap-2 mb-1.5 pl-1"><span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0"></span><span class="text-sm text-gray-700 dark:text-gray-300">$1</span></li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">')
    .replace(/\n/g, '<br/>');
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SynthesisPage() {
  const { lang } = useLanguage();
  const [syntheses, setSyntheses] = useState<Synthesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
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
    setGenerateError(null);
    try {
      const res = await fetch('/api/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeSlot }),
      });
      if (res.ok) {
        await fetchSyntheses();
      } else {
        const err = await res.json();
        setGenerateError(err.error || 'Erreur lors de la génération');
      }
    } catch (e) {
      console.error('Failed to generate synthesis:', e);
      setGenerateError('Erreur de connexion');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getContent = (s: Synthesis) =>
    lang === 'fr' ? (s.content_fr || s.content_en) : (s.content_en || s.content_fr);

  const getSlotLabel = (slot: string) =>
    slot === '08:00'
      ? (lang === 'fr' ? '☀️ Brief Matin' : '☀️ Morning Brief')
      : (lang === 'fr' ? '🌆 Brief Après-midi' : '🌆 Afternoon Brief');

  const selected = syntheses.find(s => s.id === selectedId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {lang === 'fr' ? 'Synthèse RSSI' : 'CISO Brief'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {lang === 'fr'
              ? 'Brief executif généré par IA — focus sur ce qui compte vraiment'
              : 'AI-generated executive brief — only what matters'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => handleGenerate('08:00')} disabled={generating}>
            {generating ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
            {lang === 'fr' ? 'Matin' : 'Morning'}
          </Button>
          <Button variant="outline" onClick={() => handleGenerate('14:00')} disabled={generating}>
            {generating ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
            {lang === 'fr' ? 'Après-midi' : 'Afternoon'}
          </Button>
          {selected && (
            <Button variant="ghost" onClick={handlePrint} title={lang === 'fr' ? 'Imprimer / Exporter PDF' : 'Print / Export PDF'}>
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Generation error */}
      {generateError && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          ⚠️ {generateError}
        </div>
      )}

      {/* Generating notice */}
      {generating && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 flex items-center gap-3">
          <Brain className="w-5 h-5 text-blue-500 animate-pulse" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {lang === 'fr'
              ? "Analyse des événements de sécurité en cours… 30-60 secondes."
              : "Analyzing security events… 30-60 seconds."}
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : syntheses.length === 0 ? (
        <div className="text-center py-20">
          <Brain className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {lang === 'fr' ? 'Aucun brief généré pour le moment' : 'No briefs generated yet'}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            {lang === 'fr'
              ? 'Cliquez sur "Matin" ou "Après-midi" pour générer votre premier brief.'
              : 'Click "Morning" or "Afternoon" to generate your first brief.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Left sidebar */}
          <div className="space-y-2 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto lg:pr-2">
            {syntheses.map(s => {
              const isSelected = selectedId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={cn(
                    'w-full text-left rounded-xl border p-3.5 transition-all',
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 ring-1 ring-blue-500/20'
                      : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {getSlotLabel(s.time_slot)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {formatDate(s.date, lang)}
                      </div>
                    </div>
                    <ChevronRight className={cn('w-4 h-4 text-gray-400 transition-transform flex-shrink-0', isSelected && 'text-blue-500')} />
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                      <FileText className="w-3 h-3" /> {s.articles_count}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                      <Bug className="w-3 h-3" /> {s.cves_count} CVE
                    </span>
                    {s.critical_count > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 font-bold">
                        <AlertTriangle className="w-3 h-3" /> {s.critical_count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right — selected synthesis */}
          {selected && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden print-brief">
              {/* Brief header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-slate-50 to-white dark:from-gray-800/50 dark:to-gray-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Brain className="w-5 h-5 text-blue-500" />
                      <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider">
                        {lang === 'fr' ? 'Brief Cybersécurité' : 'Cybersecurity Brief'}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {getSlotLabel(selected.time_slot)}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(selected.date, lang)}
                    </p>
                  </div>
                  {/* Metrics */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{selected.articles_count}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wide">{lang === 'fr' ? 'Articles' : 'Articles'}</div>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-500">{selected.cves_count}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wide">CVEs</div>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                    <div className="text-center">
                      <div className={cn('text-xl font-bold', selected.critical_count > 0 ? 'text-red-500' : 'text-gray-400')}>
                        {selected.critical_count}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wide">{lang === 'fr' ? 'Critiques' : 'Critical'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-5">
                <div
                  className="prose-sm max-w-none"
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
