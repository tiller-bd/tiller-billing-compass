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
  description?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  loading = false,
  variant = 'default',
  description
}: MetricCardProps) {
  if (loading) {
    return (
      <div className="glass-card rounded-xl p-3 md:p-6 glow-effect h-[100px] md:h-[128px]">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <Skeleton className="h-8 w-8 md:h-10 md:w-10 rounded-lg" />
            <Skeleton className="h-3 md:h-4 w-20 md:w-28" />
          </div>
          <Skeleton className="h-6 md:h-8 w-24 md:w-36 mt-auto" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card rounded-xl p-3 md:p-6 glow-effect h-[120px] md:h-full"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-2 md:mb-3">
          <div className={cn(
            "w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0",
            variant === 'primary' && "bg-primary/20",
            variant === 'success' && "bg-success/20",
            variant === 'warning' && "bg-warning/20",
            variant === 'default' && "bg-muted"
          )}>
            <Icon className={cn(
              "w-4 h-4 md:w-5 md:h-5",
              variant === 'primary' && "text-primary",
              variant === 'success' && "text-success",
              variant === 'warning' && "text-warning",
              variant === 'default' && "text-muted-foreground"
            )} />
          </div>
          <p className="text-[10px] md:text-sm text-muted-foreground font-medium truncate">{title}</p>
          
        </div>
        <div className="mt-auto">
          {description && (
            <p className="text-[9px] md:text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
          <p className={cn(
            "text-base md:text-2xl font-bold tracking-tight",
            variant === 'primary' && "stat-value",
            variant === 'success' && "text-success",
            variant === 'warning' && "text-warning",
            variant === 'default' && "text-foreground"
          )}>
            {value}
          </p>
          
        </div>
      </div>
    </motion.div>
  );
}