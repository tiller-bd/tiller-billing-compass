"use client";

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PieChartIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ProjectDistributionChartProps {
  data: { name: string; value: number; color: string }[];
  loading?: boolean;
  isExpanded?: boolean;
}

export function ProjectDistributionChart({ data, loading, isExpanded }: ProjectDistributionChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("glass-card rounded-xl p-6", isExpanded ? "h-full" : "h-[350px]")}
    >
      <div className="flex items-center gap-2 mb-6">
        <PieChartIcon className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Project Distribution</h3>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Skeleton className="h-48 w-48 rounded-full" />
        </div>
      ) : (
        <div className={isExpanded ? "h-[500px]" : "h-64"}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214, 20%, 88%)' }}
                formatter={(value: number) => [`${value} projects`, '']}
              />
              <Legend verticalAlign="bottom" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}