'use client';

import { ThemeProvider } from '@/lib/theme/context';
import { LanguageProvider } from '@/lib/i18n/context';
import { MainLayout } from '@/components/layout/MainLayout';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <MainLayout>{children}</MainLayout>
      </LanguageProvider>
    </ThemeProvider>
  );
}
