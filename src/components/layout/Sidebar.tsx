// src/components/layout/Sidebar.tsx
"use client";

import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Building2,
  Briefcase,
  ReceiptText,
  LogOut,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSidebarContext } from './DashboardLayout';
import tillerLogo from '@/assets/images/tiller.jpeg';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Projects', path: '/projects', icon: Briefcase },
  { name: 'Billing', path: '/billing', icon: ReceiptText },
  { name: 'Clients', path: '/clients', icon: Building2 },
  { name: 'Users', path: '/users', icon: Users },
];

export function Sidebar() {
  const { collapsed, setCollapsed } = useSidebarContext();
  const { logout, user } = useAuth();
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-50"
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
            <Image width="40" height="40" src={tillerLogo} alt="Tiller Logo" className='object-cover' />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                <h1 className="font-bold text-lg text-sidebar-foreground whitespace-nowrap">Tiller Bill Mgt.</h1>
                <p className="text-xs text-muted-foreground">{user?.role === 'SUPERADMIN' ? 'Super Admin' : 'Bill Tracker'}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <motion.div
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all cursor-pointer mb-2",
                  isActive ? "bg-sidebar-accent text-primary" : "hover:bg-sidebar-accent text-muted-foreground hover:text-foreground"
                )}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                {!collapsed && <span className="font-medium">{item.name}</span>}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-2">
        {!collapsed && (
            <div className="flex flex-col gap-2 mb-4">
                <Link href="/projects"><Button size="sm" className="w-full justify-start gap-2"><PlusCircle className="w-4 h-4"/> Add Project</Button></Link>
                <Link href="/billing"><Button size="sm" variant="outline" className="w-full justify-start gap-2"><Receipt className="w-4 h-4"/> Add Bill</Button></Link>
            </div>
        )}
        <Button onClick={logout} variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center shadow-sm"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
}