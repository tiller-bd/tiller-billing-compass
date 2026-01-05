import { useState, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { motion } from 'framer-motion';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function DashboardLayout({ children, title, currentPath, onNavigate }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentPath={currentPath} onNavigate={onNavigate} />
      <motion.main
        initial={{ marginLeft: 280 }}
        className="min-h-screen transition-all duration-300"
        style={{ marginLeft: 280 }}
      >
        <Header title={title} />
        <div className="p-6">
          {children}
        </div>
      </motion.main>
    </div>
  );
}
