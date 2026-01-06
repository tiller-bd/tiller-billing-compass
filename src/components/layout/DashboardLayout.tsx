import { useState, ReactNode, createContext, useContext } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { motion } from 'framer-motion';

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within DashboardLayout');
  }
  return context;
}

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function DashboardLayout({ children, title, currentPath, onNavigate }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="min-h-screen bg-background">
        <Sidebar currentPath={currentPath} onNavigate={onNavigate} />
        <motion.main
          initial={false}
          animate={{ marginLeft: collapsed ? 80 : 280 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="min-h-screen"
        >
          <Header title={title} />
          <div className="p-6">
            {children}
          </div>
        </motion.main>
      </div>
    </SidebarContext.Provider>
  );
}
