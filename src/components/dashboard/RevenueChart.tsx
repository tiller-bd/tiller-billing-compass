"use client";

import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface RevenueChartProps {
  data: { month: string; received: number }[];
  loading?: boolean;
  isExpanded?: boolean;
}

export function RevenueChart({ data, loading, isExpanded }: RevenueChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("glass-card rounded-xl p-6", isExpanded ? "h-full" : "h-[350px]")}
    >
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Monthly Revenue</h3>
      </div>
      
      {loading ? (
        <div className="w-full h-[250px] flex flex-col gap-4">
          <Skeleton className="w-full h-full rounded-lg" />
        </div>
      ) : (
        <div className={isExpanded ? "h-[500px]" : "h-64"}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(173, 80%, 36%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(173, 80%, 36%)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }} tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Received']}
                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214, 20%, 88%)' }}
              />
              <Area type="monotone" dataKey="received" stroke="hsl(173, 80%, 36%)" strokeWidth={2} fill="url(#revenueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}