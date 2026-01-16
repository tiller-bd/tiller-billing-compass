"use client";

import { motion } from 'framer-motion';
import { Calendar, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import IndexCounter from './IndexCounter';

interface Deadline {
  projectName: string;
  amount: number;
  dueDate: Date | string;
}

interface UpcomingDeadlinesProps {
  deadlines: Deadline[];
  loading?: boolean;
  isExpanded?: boolean;
}

export function UpcomingDeadlines({ deadlines, loading, isExpanded }: UpcomingDeadlinesProps) {
  const formatCurrency = (amount: number) => {
    // Use Indian numbering system (Lakh/Crore): 1,00,00,000 for 1 crore, 1,00,000 for 1 lakh
    const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(amount));
    return `৳${formatted}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "glass-card rounded-xl p-6 flex flex-col",
        isExpanded ? "h-full" : "h-full"
      )}
    >
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Upcoming Deadlines</h3>
      </div>

      <div className="space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
        ) : deadlines.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
        ) : (
          deadlines.map((deadline, index) => {
            const daysUntil = differenceInDays(new Date(deadline.dueDate), new Date());
            const isUrgent = daysUntil <= 7;

            return (
              <div
                key={index}
                className={cn(
                  "relative flex items-center justify-between p-3 rounded-lg border",
                  isUrgent ? "border-warning/50 bg-warning/5" : "border-border bg-secondary/50"
                )}
              >
                <div className="flex items-center gap-3">
                  {isUrgent && <AlertCircle className="w-4 h-4 text-warning" />}
                  <div>
                    <p className="text-sm font-medium text-foreground">{deadline.projectName}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(deadline.dueDate), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
                <IndexCounter index={index} />
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(deadline.amount)}</p>
                  <p className={cn("text-xs", isUrgent ? "text-warning" : "text-muted-foreground")}>
                    {daysUntil < 0 ? 'Overdue' : `${daysUntil} days left`}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}