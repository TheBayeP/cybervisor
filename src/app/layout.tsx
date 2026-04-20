import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'CyberVisor - Cybersecurity Watch',
  description:
    'Real-time cybersecurity monitoring dashboard. Track CVEs, threat intelligence feeds, and CISO synthesis reports.',
  keywords: [
    'cybersecurity',
    'CVE',
    'threat intelligence',
    'CISO',
    'security monitoring',
  ],
  authors: [{ name: 'CyberVisor' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <body
        className={`${inter.className} bg-gray-50 transition-colors duration-200 dark:bg-gray-950`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
