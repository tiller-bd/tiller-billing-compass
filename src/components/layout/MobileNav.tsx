// src/components/layout/MobileNav.tsx
"use client";

import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  ReceiptText,
  Plus,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const navItems = [
  { name: 'Home', path: '/', icon: LayoutDashboard },
  { name: 'Projects', path: '/projects', icon: Briefcase },
  { name: 'Billing', path: '/billing', icon: ReceiptText },
  { name: 'Clients', path: '/clients', icon: Building2 },
  { name: 'Users', path: '/users', icon: Users },
];

export function MobileNav() {
  const pathname = usePathname();
  const [showQuickActions, setShowQuickActions] = useState(false);

  return (
    <>
      {/* Quick Actions Overlay */}
      {showQuickActions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[60] md:hidden"
          onClick={() => setShowQuickActions(false)}
        />
      )}

      {/* Quick Actions Menu */}
      {showQuickActions && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[70] md:hidden"
        >
          <div className="bg-card rounded-2xl shadow-xl border border-border p-4 flex flex-col gap-3 min-w-[200px]">
            <Link href="/projects?new=true" onClick={() => setShowQuickActions(false)}>
              <Button className="w-full justify-start gap-3" size="lg">
                <Briefcase className="w-5 h-5" />
                New Project
              </Button>
            </Link>
            <Link href="/billing?new=true" onClick={() => setShowQuickActions(false)}>
              <Button variant="outline" className="w-full justify-start gap-3" size="lg">
                <ReceiptText className="w-5 h-5" />
                New Bill
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.slice(0, 2).map((item) => {
            const isActive = item.path === '/'
              ? pathname === '/'
              : pathname === item.path || pathname.startsWith(`${item.path}/`);
            return (
              <Link key={item.path} href={item.path} className="flex-1">
                <motion.div
                  className={cn(
                    "flex flex-col items-center justify-center py-2 rounded-xl transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  whileTap={{ scale: 0.9 }}
                >
                  <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                  <span className="text-[10px] font-medium mt-1">{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="mobileActiveTab"
                      className="absolute -bottom-0 w-12 h-1 bg-primary rounded-t-full"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}

          {/* Center FAB Button */}
          <div className="flex-1 flex justify-center -mt-6">
            <motion.button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors",
                showQuickActions
                  ? "bg-destructive text-white"
                  : "bg-primary text-primary-foreground"
              )}
              whileTap={{ scale: 0.9 }}
              animate={{ rotate: showQuickActions ? 45 : 0 }}
            >
              {showQuickActions ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            </motion.button>
          </div>

          {navItems.slice(2, 4).map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
            return (
              <Link key={item.path} href={item.path} className="flex-1">
                <motion.div
                  className={cn(
                    "flex flex-col items-center justify-center py-2 rounded-xl transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  whileTap={{ scale: 0.9 }}
                >
                  <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                  <span className="text-[10px] font-medium mt-1">{item.name}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
