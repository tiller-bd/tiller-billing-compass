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
      <div className="glass-card rounded-xl p-3 md:p-6 glow-effect h-[100px] md:h-[128px]">
        <div className="flex items-start justify-between">
          <div className="space-y-2 md:space-y-3">
            <Skeleton className="h-3 md:h-4 w-16 md:w-24" />
            <Skeleton className="h-6 md:h-8 w-20 md:w-32" />
          </div>
          <Skeleton className="h-9 w-9 md:h-12 md:w-12 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card rounded-xl p-3 md:p-6 glow-effect h-[100px] md:h-[128px]"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-0.5 md:space-y-1 min-w-0 flex-1 pr-2">
          <p className="text-[10px] md:text-sm text-muted-foreground font-medium truncate">{title}</p>
          <p className={cn(
            "text-base md:text-2xl font-bold tracking-tight truncate",
            variant === 'primary' && "stat-value",
            variant === 'success' && "text-success",
            variant === 'warning' && "text-warning",
            variant === 'default' && "text-foreground"
          )}>
            {value}
          </p>
        </div>
        <div className={cn(
          "w-9 h-9 md:w-12 md:h-12 rounded-lg flex items-center justify-center shrink-0",
          variant === 'primary' && "bg-primary/20",
          variant === 'success' && "bg-success/20",
          variant === 'warning' && "bg-warning/20",
          variant === 'default' && "bg-muted"
        )}>
          <Icon className={cn(
            "w-4 h-4 md:w-6 md:h-6",
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