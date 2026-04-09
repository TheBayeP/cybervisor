import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

// ---------------------------------------------------------------------------
// Class name merging (clsx + tailwind-merge)
// ---------------------------------------------------------------------------

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

type SupportedLocale = 'fr' | 'en';

const localeMap = { fr, en: enUS } as const;

export function formatDate(
  date: Date | string | number,
  locale: SupportedLocale = 'fr',
  pattern?: string,
): string {
  const d = date instanceof Date ? date : new Date(date);
  const defaultPattern = locale === 'fr' ? 'dd/MM/yyyy HH:mm' : 'MM/dd/yyyy h:mm a';
  return format(d, pattern ?? defaultPattern, { locale: localeMap[locale] });
}

export function timeAgo(
  date: Date | string | number,
  locale: SupportedLocale = 'fr',
): string {
  const d = date instanceof Date ? date : new Date(date);
  return formatDistanceToNow(d, {
    addSuffix: true,
    locale: localeMap[locale],
  });
}

// ---------------------------------------------------------------------------
// Severity helpers
// ---------------------------------------------------------------------------

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export function severityColor(severity: Severity): string {
  const map: Record<Severity, string> = {
    critical: 'text-threat-critical',
    high: 'text-threat-high',
    medium: 'text-threat-medium',
    low: 'text-threat-low',
    info: 'text-threat-info',
  };
  return map[severity] ?? 'text-gray-400';
}

export function severityBgColor(severity: Severity): string {
  const map: Record<Severity, string> = {
    critical: 'bg-red-600/20 border-threat-critical',
    high: 'bg-orange-600/20 border-threat-high',
    medium: 'bg-yellow-500/20 border-threat-medium',
    low: 'bg-green-500/20 border-threat-low',
    info: 'bg-blue-500/20 border-threat-info',
  };
  return map[severity] ?? 'bg-gray-500/20 border-gray-500';
}

export function cvssToSeverity(score: number): Severity {
  if (score >= 9.0) return 'critical';
  if (score >= 7.0) return 'high';
  if (score >= 4.0) return 'medium';
  if (score >= 0.1) return 'low';
  return 'info';
}

// ---------------------------------------------------------------------------
// String utilities
// ---------------------------------------------------------------------------

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trimEnd() + '\u2026';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// Category icon mapping (lucide-react icon names)
// ---------------------------------------------------------------------------

export function categoryIcon(category: string): string {
  const map: Record<string, string> = {
    vulnerability: 'Shield',
    malware: 'Bug',
    ransomware: 'Lock',
    phishing: 'Fish',
    breach: 'DatabaseZap',
    exploit: 'Zap',
    patch: 'Wrench',
    advisory: 'Info',
    threat: 'AlertTriangle',
    network: 'Network',
    identity: 'UserCheck',
    cloud: 'Cloud',
    iot: 'Cpu',
    apt: 'Target',
    ddos: 'Activity',
    default: 'ShieldAlert',
  };
  return map[category.toLowerCase()] ?? map.default;
}
