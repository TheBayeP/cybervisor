'use client';

import { useCallback, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface MainLayoutProps {
  children: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // TODO: replace with real data from an alerts API / context
  const alertCount = 0;
  const lastUpdate: string | null = null;

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={closeSidebar}
        alertCount={alertCount}
      />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onMenuToggle={toggleSidebar}
          alertCount={alertCount}
          lastUpdate={lastUpdate}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto max-w-7xl animate-page-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
