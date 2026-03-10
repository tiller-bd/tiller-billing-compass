"use client";

import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LabelList,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface BudgetComparisonChartProps {
  data: { name: string; received: number; remaining: number }[];
  loading?: boolean;
  isExpanded?: boolean;
}

const BAR_HEIGHT     = 30;
const CHART_OVERHEAD = 72;
const CARD_PADDING   = 90;

// ── Flash shape rendered on hover (replaces recharts default active bar) ──────
const FlashBar = (props: any) => {
  const { x, y, width, height, fill } = props;
  if (!width || !height) return null;
  return (
    <>
      <style>{`
        @keyframes barFlash {
          0%,100% { filter: brightness(1);   opacity: 1;    }
          45%      { filter: brightness(1.6); opacity: 0.75; }
        }
      `}</style>
      <rect
        x={x} y={y} width={width} height={height}
        fill={fill}
        rx={2}
        style={{ animation: 'barFlash 0.65s ease-in-out infinite' }}
      />
    </>
  );
};

export function BudgetComparisonChart({ data, loading, isExpanded }: BudgetComparisonChartProps) {
  const fmt = (v: number) =>
    `৳${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(v))}`;

  const fmtCompact = (v: number) =>
    `৳${new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(v)}`;

  const chartH = Math.max(240, data.length * BAR_HEIGHT + CHART_OVERHEAD);
  const cardH  = isExpanded ? '100%' : `${chartH + CARD_PADDING}px`;

  // X-axis ticks at exactly 1 crore (1,00,00,000) intervals
  const CR = 10_000_000;
  const maxVal = Math.max(...data.map(d => d.received + d.remaining), 0);
  const xTicks = Array.from({ length: Math.ceil(maxVal / CR) + 1 }, (_, i) => i * CR);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const received  = payload.find((p: any) => p.dataKey === 'received')?.value  ?? 0;
    const remaining = payload.find((p: any) => p.dataKey === 'remaining')?.value ?? 0;
    const total     = received + remaining;
    const recPct  = total > 0 ? Math.round((received  / total) * 100) : 0;
    const remPct  = total > 0 ? Math.round((remaining / total) * 100) : 0;
    return (
      <div className="bg-background/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-xl text-xs min-w-[190px]">
        <p className="font-bold text-foreground text-[13px] mb-2 leading-tight">{label}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Total</span>
            <span className="font-bold text-foreground">{fmt(total)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-emerald-600 font-medium">Received</span>
            <span className="font-bold text-emerald-600">
              {fmt(received)} <span className="text-[10px] font-normal">({recPct}%)</span>
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-red-500 font-medium">Remaining</span>
            <span className="font-bold text-red-500">
              {fmt(remaining)} <span className="text-[10px] font-normal">({remPct}%)</span>
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn('glass-card rounded-xl p-6 flex flex-col')}
      style={{ height: cardH }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Budget vs Received</h3>
      </div>

      {/* ── Body ── */}
      {loading ? (
        <Skeleton className="w-full flex-1 rounded-lg" />
      ) : (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 110, left: 8, bottom: 4 }}
              barCategoryGap="20%"
              barGap={2}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(214,20%,88%)"
                horizontal={false}
              />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(215,16%,37%)', fontSize: 11, fontWeight: 700 }}
                tickFormatter={fmtCompact}
                ticks={xTicks}
                domain={[0, xTicks[xTicks.length - 1]]}
              />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(215,16%,37%)', fontSize: 11, fontWeight: 700 }}
                width={100}
              />
              {/* cursor=false removes the gray row background entirely */}
              <Tooltip
                content={<CustomTooltip />}
                cursor={false}
              />
              <Legend
                verticalAlign="top"
                iconType="circle"
                iconSize={8}
                formatter={v => (
                  <span className="text-[11px] font-semibold text-muted-foreground capitalize">{v}</span>
                )}
              />
              <Bar
                dataKey="received"
                stackId="a"
                name="Received"
                fill="hsl(142,72%,29%)"
                barSize={10}
                radius={[0, 0, 0, 0]}
                isAnimationActive
                animationDuration={400}
                activeBar={<FlashBar fill="hsl(142,72%,29%)" />}
              />
              <Bar
                dataKey="remaining"
                stackId="a"
                name="Remaining"
                fill="hsl(0,72%,51%)"
                barSize={10}
                radius={[0, 4, 4, 0]}
                isAnimationActive
                animationDuration={400}
                activeBar={<FlashBar fill="hsl(0,72%,51%)" />}
              >
                <LabelList
                  valueAccessor={(entry: { received: number; remaining: number }) =>
                    entry.received + entry.remaining
                  }
                  position="right"
                  formatter={(v: number) => fmt(v)}
                  style={{ fill: 'hsl(215,16%,37%)', fontSize: 10, fontWeight: 700 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
