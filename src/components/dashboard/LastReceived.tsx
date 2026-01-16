"use client";

import { motion } from 'framer-motion';
import { ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import IndexCounter from './IndexCounter';

interface LastReceivedProps {
  data: { projectName: string; amount: number; date: Date | string }[];
  loading?: boolean;
  isExpanded?: boolean;
}

export function LastReceived({ data, loading, isExpanded }: LastReceivedProps) {
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
        <ArrowDownRight className="w-5 h-5 text-success" />
        <h3 className="font-semibold text-foreground">Last Received</h3>
      </div>


      <div className="space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments received yet</p>
        ) : (
          data.map((payment, index) => (
            <div key={index} className="relative p-3 rounded-lg bg-success/5 border border-success/20 flex justify-between items-center">
              <IndexCounter index={index} position="center" />
              <div>
                <p className="text-sm font-medium text-foreground">{payment.projectName}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(payment.date), 'MMM dd, yyyy')}</p>
              </div>
              <p className="text-sm font-bold text-success">{formatCurrency(payment.amount)}</p>
            </div>
          ))
        )}

      </div>
    </motion.div>
  );
}