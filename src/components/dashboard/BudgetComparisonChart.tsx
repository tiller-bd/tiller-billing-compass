"use client";

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface BudgetComparisonChartProps {
  data: { name: string; received: number; remaining: number }[];
  loading?: boolean;
  isExpanded?: boolean;
}

export function BudgetComparisonChart({ data, loading, isExpanded }: BudgetComparisonChartProps) {
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
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Budget vs Received</h3>
      </div>
      
      {loading ? (
        <Skeleton className="w-full h-[250px] rounded-lg" />
      ) : (
        <div className={isExpanded ? "h-[500px]" : "h-64"}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" horizontal={false} />
              <XAxis 
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }}
                tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
              />
              <YAxis 
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 11 }}
                width={100}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214, 20%, 88%)' }}
                formatter={(value: number) => [formatCurrency(value), '']}
              />
              <Legend
                verticalAlign="top"
                iconType="circle"
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground capitalize">{value}</span>
                )}
              />
              <Bar dataKey="received" stackId="a" fill="hsl(173, 80%, 36%)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="remaining" stackId="a" fill="hsl(214, 20%, 85%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}