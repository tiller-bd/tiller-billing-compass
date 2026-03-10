'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CheckCircle2, Clock, CircleDollarSign, Receipt } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

interface BillStatusData {
  status: string;
  count: number;
  total: number;
}

interface BillStatusWidgetProps {
  yearParam: string;
  departmentId: string;
  clientId: string;
  status: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  PAID:    { label: 'Paid',    color: 'hsl(142,72%,29%)', icon: CheckCircle2     },
  PARTIAL: { label: 'Partial', color: 'hsl(38,92%,50%)',  icon: CircleDollarSign },
  PENDING: { label: 'Pending', color: 'hsl(0,72%,51%)',   icon: Clock            },
};

const fmt = (v: number) =>
  `৳${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(v))}`;

const fmtCompact = (v: number) =>
  `৳${new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(v)}`;

export function BillStatusWidget({ yearParam, departmentId, clientId, status }: BillStatusWidgetProps) {
  const [data, setData]       = useState<BillStatusData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (yearParam !== 'all')  params.set('year', yearParam);
    if (departmentId !== 'all') params.set('departmentId', departmentId);
    if (clientId !== 'all')     params.set('clientId', clientId);
    if (status !== 'all')       params.set('status', status);

    fetch(`/api/dashboard/bill-status?${params}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [yearParam, departmentId, clientId, status]);

  const total = data.reduce((s, d) => s + d.total, 0);
  const totalCount = data.reduce((s, d) => s + d.count, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const cfg = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.PENDING;
    const pct = total > 0 ? ((d.total / total) * 100).toFixed(1) : '0';
    return (
      <div className="bg-background/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-xl text-xs min-w-[170px]">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
          <span className="font-bold text-[13px]">{cfg.label}</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Bills</span>
            <span className="font-semibold">{d.count}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold" style={{ color: cfg.color }}>{fmt(d.total)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Share</span>
            <span className="font-semibold">{pct}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card rounded-xl p-5 flex flex-col gap-4"
    >
      <div className="flex items-center gap-2">
        <Receipt className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Bill Status Breakdown</h3>
        {!loading && (
          <span className="ml-auto text-xs text-muted-foreground">{totalCount} bills</span>
        )}
      </div>

      {loading ? (
        <div className="flex gap-4 items-center">
          <Skeleton className="w-32 h-32 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No bill data available</p>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {/* Donut */}
          <div className="w-36 h-36 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  innerRadius={42}
                  outerRadius={66}
                  paddingAngle={3}
                  isAnimationActive
                  animationDuration={500}
                >
                  {data.map((d, i) => (
                    <Cell key={i} fill={STATUS_CONFIG[d.status]?.color ?? '#888'} stroke="hsl(var(--background))" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend rows */}
          <div className="flex-1 w-full space-y-2">
            {(['PAID', 'PARTIAL', 'PENDING'] as const).map(s => {
              const d   = data.find(x => x.status === s);
              const cfg = STATUS_CONFIG[s];
              const Icon = cfg.icon;
              const pct = total > 0 && d ? ((d.total / total) * 100).toFixed(0) : '0';
              return (
                <div key={s} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: cfg.color }} />
                  <span className="text-xs font-medium text-foreground w-14 flex-shrink-0">{cfg.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-border/50 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: cfg.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                  <span className="text-[10px] font-semibold text-foreground ml-1">{d ? fmtCompact(d.total) : '৳0'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
