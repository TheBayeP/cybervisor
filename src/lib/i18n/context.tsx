'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { translations, type Language, type TranslationTree } from './translations';

const STORAGE_KEY = 'cybervisor-lang';
const DEFAULT_LANG: Language = 'fr';

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return path;
    }
    current = (current as Record<string, unknown>)[key];
  }

  if (typeof current === 'string') {
    return current;
  }

  return path;
}

function getInitialLang(): Language {
  if (typeof window === 'undefined') {
    return DEFAULT_LANG;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'fr' || stored === 'en') {
      return stored;
    }
  } catch {
    // localStorage may be unavailable
  }

  return DEFAULT_LANG;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(DEFAULT_LANG);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLangState(getInitialLang());
    setMounted(true);
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      const tree = translations[lang] as unknown as Record<string, unknown>;
      return getNestedValue(tree, key);
    },
    [lang],
  );

  // Avoid hydration mismatch by rendering default lang until mounted
  const contextLang = mounted ? lang : DEFAULT_LANG;
  const contextT = useCallback(
    (key: string): string => {
      const tree = translations[contextLang] as unknown as Record<string, unknown>;
      return getNestedValue(tree, key);
    },
    [contextLang],
  );

  return (
    <LanguageContext.Provider value={{ lang: contextLang, setLang, t: contextT }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
