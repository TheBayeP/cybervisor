'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui';
import { Save, CheckCircle, Mail, Key, Server, TestTube, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsState {
  claude_api_key: string;
  notification_email: string;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_password: string;
  email_enabled: string;
}

const defaultSettings: SettingsState = {
  claude_api_key: '',
  notification_email: '',
  smtp_host: '',
  smtp_port: '587',
  smtp_user: '',
  smtp_password: '',
  email_enabled: 'false',
};

export default function SettingsPage() {
  const { t, lang, setLang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [triggeringCollector, setTriggeringCollector] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.settings) {
          const s = { ...defaultSettings };
          for (const { key, value } of data.settings) {
            if (key in s) (s as any)[key] = value || '';
          }
          setSettings(s);
        }
      } catch (e) {
        console.error('Failed to fetch settings:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Failed to save settings:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!settings.notification_email) return;
    setTestingEmail(true);
    setEmailTestResult(null);
    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: settings.notification_email }),
      });
      const data = await res.json();
      setEmailTestResult({ ok: res.ok, msg: data.message || data.error });
    } catch (e) {
      setEmailTestResult({ ok: false, msg: 'Connection failed' });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTriggerCollector = async () => {
    setTriggeringCollector(true);
    try {
      await fetch('/api/collector', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      setTriggeringCollector(false);
    }
  };

  const inputCn = cn(
    'w-full px-4 py-2.5 rounded-lg border text-sm transition-colors',
    'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    'text-gray-900 dark:text-white placeholder-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-cyber-500 focus:border-transparent'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>

      {/* Appearance */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
          {lang === 'fr' ? 'Apparence' : 'Appearance'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('settings.language')}
            </label>
            <div className="flex gap-2">
              {(['fr', 'en'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={cn(
                    'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border',
                    lang === l
                      ? 'bg-cyber-500 text-white border-cyber-500'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  {l === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('settings.theme')}
            </label>
            <div className="flex gap-2">
              {(['light', 'dark'] as const).map(th => (
                <button
                  key={th}
                  onClick={() => setTheme(th)}
                  className={cn(
                    'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border',
                    theme === th
                      ? 'bg-cyber-500 text-white border-cyber-500'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  {th === 'light' ? `☀️ ${t('settings.light')}` : `🌙 ${t('settings.dark')}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Claude API */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
          <Key className="w-5 h-5 inline mr-2" />
          {t('settings.apiKey')}
        </h2>
        <div>
          <input
            type="password"
            value={settings.claude_api_key}
            onChange={(e) => setSettings(s => ({ ...s, claude_api_key: e.target.value }))}
            placeholder="sk-ant-..."
            className={inputCn}
          />
          <p className="text-xs text-gray-400 mt-1">
            {lang === 'fr'
              ? 'Utilisé pour les synthèses RSSI quotidiennes (8h et 14h)'
              : 'Used for daily CISO briefs (8am and 2pm)'}
          </p>
        </div>
      </section>

      {/* Email Notifications */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
          <Mail className="w-5 h-5 inline mr-2" />
          {t('settings.notifications')}
        </h2>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.email_enabled === 'true'}
            onChange={(e) => setSettings(s => ({ ...s, email_enabled: String(e.target.checked) }))}
            className="w-4 h-4 rounded border-gray-300 text-cyber-500 focus:ring-cyber-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">{t('settings.enableEmail')}</span>
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('settings.email')}
          </label>
          <input
            type="email"
            value={settings.notification_email}
            onChange={(e) => setSettings(s => ({ ...s, notification_email: e.target.value }))}
            placeholder={t('settings.emailPlaceholder')}
            className={inputCn}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.smtpHost')}
            </label>
            <input
              type="text"
              value={settings.smtp_host}
              onChange={(e) => setSettings(s => ({ ...s, smtp_host: e.target.value }))}
              placeholder="smtp.gmail.com"
              className={inputCn}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.smtpPort')}
            </label>
            <input
              type="text"
              value={settings.smtp_port}
              onChange={(e) => setSettings(s => ({ ...s, smtp_port: e.target.value }))}
              placeholder="587"
              className={inputCn}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.smtpUser')}
            </label>
            <input
              type="text"
              value={settings.smtp_user}
              onChange={(e) => setSettings(s => ({ ...s, smtp_user: e.target.value }))}
              className={inputCn}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.smtpPassword')}
            </label>
            <input
              type="password"
              value={settings.smtp_password}
              onChange={(e) => setSettings(s => ({ ...s, smtp_password: e.target.value }))}
              className={inputCn}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleTestEmail} disabled={testingEmail || !settings.notification_email}>
            {testingEmail ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <TestTube className="w-4 h-4 mr-1" />}
            {lang === 'fr' ? 'Tester l\'email' : 'Test email'}
          </Button>
          {emailTestResult && (
            <span className={cn('text-sm', emailTestResult.ok ? 'text-green-500' : 'text-red-500')}>
              {emailTestResult.msg}
            </span>
          )}
        </div>
      </section>

      {/* Manual Actions */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
          <Server className="w-5 h-5 inline mr-2" />
          {lang === 'fr' ? 'Actions manuelles' : 'Manual Actions'}
        </h2>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleTriggerCollector} disabled={triggeringCollector}>
            {triggeringCollector ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
            {lang === 'fr' ? 'Lancer la collecte' : 'Trigger collection'}
          </Button>
        </div>
      </section>

      {/* Save Button */}
      <div className="sticky bottom-4 flex justify-end">
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-4 h-4 mr-1" />
          ) : (
            <Save className="w-4 h-4 mr-1" />
          )}
          {saved ? t('settings.saved') : t('settings.save')}
        </Button>
      </div>
    </div>
  );
}
