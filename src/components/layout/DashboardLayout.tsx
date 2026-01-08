// src/components/layout/DashboardLayout.tsx
"use client";

import { useState, ReactNode, createContext, useContext, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
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
  const { user, isLocked, unlock, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="min-h-screen bg-background relative overflow-hidden flex">
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

        {/* Persistent Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <motion.div
          initial={false}
          animate={{ 
            paddingLeft: collapsed ? '80px' : '280px',
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex-1 flex flex-col min-w-0"
        >
          {/* Persistent Header */}
          <Header title={title} />
          
          {/* Scrollable Content Wrapper */}
          <main className="flex-1 p-6 mt-16 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname} // Re-animate only content when path changes
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
      </div>
    </SidebarContext.Provider>
  );
}