"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, CalendarDays } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface RevenueChartProps {
  data: { month: string; received: number }[];
  yearlyData?: { year: string; received: number }[];
  loading?: boolean;
  loadingYearly?: boolean;
  isExpanded?: boolean;
  isAllYears?: boolean;
}

export function RevenueChart({
  data,
  yearlyData = [],
  loading,
  loadingYearly,
  isExpanded,
  isAllYears = false
}: RevenueChartProps) {
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');

  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(value));
    return `৳${formatted}`;
  };

  const isLoading = viewMode === 'monthly' ? loading : loadingYearly;
  const chartData = viewMode === 'monthly' ? data : yearlyData;
  const xKey = viewMode === 'monthly' ? 'month' : 'year';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("glass-card rounded-xl p-6", isExpanded ? "h-full" : "h-[350px]")}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">
            {viewMode === 'monthly' ? 'Monthly' : 'Yearly'} Revenue
          </h3>
        </div>

        {/* Toggle - Only show when All Years is selected */}
        {isAllYears && (
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as 'monthly' | 'yearly')}
            className="bg-muted/50 rounded-lg p-0.5"
          >
            <ToggleGroupItem
              value="monthly"
              aria-label="Monthly view"
              className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-3 py-1.5 text-xs font-medium gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Monthly</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="yearly"
              aria-label="Yearly view"
              className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-3 py-1.5 text-xs font-medium gap-1.5"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Yearly</span>
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>

      {isLoading ? (
        <div className="w-full h-[250px] flex flex-col gap-4">
          <Skeleton className="w-full h-full rounded-lg" />
        </div>
      ) : (
        <div className={isExpanded ? "h-[500px]" : "h-64"}>
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'monthly' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(173, 80%, 36%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(173, 80%, 36%)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" vertical={false} />
                <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }} tickFormatter={(val) => `৳${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val)}`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Received']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214, 20%, 88%)' }}
                />
                <Area type="monotone" dataKey="received" stroke="hsl(173, 80%, 36%)" strokeWidth={2} fill="url(#revenueGradient)" />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="yearlyBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(173, 80%, 36%)" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(173, 80%, 36%)" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" vertical={false} />
                <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }} tickFormatter={(val) => `৳${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val)}`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Received']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214, 20%, 88%)' }}
                />
                <Bar dataKey="received" fill="url(#yearlyBarGradient)" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
