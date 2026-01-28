// src/components/layout/DashboardLayout.tsx
"use client";

import { useState, ReactNode, createContext, useContext, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { LockScreen } from '../LockScreen';

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebarContext must be used within DashboardLayout');
  return context;
}

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, isLocked, unlock, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router, mounted]);

  // Show nothing during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/80 relative overflow-hidden flex">
        {/* Background Pattern */}
        <div className="fixed inset-0 pointer-events-none">
          {/* Soft gradient from top-left */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/[0.08] via-transparent to-transparent" />

          {/* Soft gradient from bottom-right */}
          <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tl from-emerald-500/[0.06] via-transparent to-transparent" />

          {/* Subtle dot pattern */}
          <div
            className="absolute inset-0 opacity-[0.4]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.15) 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        {/* Full screen lock overlay - z-index higher than sidebar */}
        <AnimatePresence>
          {isLocked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999]"
            >
              <LockScreen onUnlock={unlock} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Persistent Sidebar - Hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <motion.div
          initial={false}
          animate={{
            marginLeft: collapsed ? '80px' : '280px',
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="hidden md:flex flex-1 flex-col min-w-0 min-h-screen"
        >
          {/* Fixed Header - Outside scrollable area */}
          <div className="sticky top-0 z-40">
            <Header title={title} />
          </div>

          {/* Scrollable Content Wrapper */}
          <main className="flex-1 p-6 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="max-w-7xl mx-auto"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </motion.div>

        {/* Mobile Layout */}
        <div className="flex md:hidden flex-1 flex-col min-w-0 min-h-screen">
          {/* Mobile Header */}
          <div className="sticky top-0 z-40">
            <Header title={title} />
          </div>

          {/* Mobile Content - with bottom padding for nav */}
          <main className="flex-1 p-4 pb-24 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Mobile Bottom Navigation */}
          <MobileNav />
        </div>
      </div>
    </SidebarContext.Provider>
  );
}