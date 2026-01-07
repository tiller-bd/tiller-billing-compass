"use client";

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  loading?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  loading = false,
  variant = 'default'
}: MetricCardProps) {
  if (loading) {
    return (
      <div className="glass-card rounded-xl p-6 glow-effect h-[128px]">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-12 w-12 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card rounded-xl p-6 glow-effect h-[128px]"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className={cn(
            "text-2xl font-bold tracking-tight",
            variant === 'primary' && "stat-value",
            variant === 'success' && "text-success",
            variant === 'warning' && "text-warning",
            variant === 'default' && "text-foreground"
          )}>
            {value}
          </p>
        </div>
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center",
          variant === 'primary' && "bg-primary/20",
          variant === 'success' && "bg-success/20",
          variant === 'warning' && "bg-warning/20",
          variant === 'default' && "bg-muted"
        )}>
          <Icon className={cn(
            "w-6 h-6",
            variant === 'primary' && "text-primary",
            variant === 'success' && "text-success",
            variant === 'warning' && "text-warning",
            variant === 'default' && "text-muted-foreground"
          )} />
        </div>
      </div>
    </motion.div>
  );
}