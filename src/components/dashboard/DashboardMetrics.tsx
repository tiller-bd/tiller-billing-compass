"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, FolderKanban, RefreshCw, Receipt } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api-client';

interface DashboardMetricsProps {
  // Filter parameters
  departmentId?: string;
  clientId?: string;
  categoryId?: string;
  status?: string;
  yearParam: string; // 'all', 'fy-2024', 'cal-2026', etc.

  // Display mode
  variant?: 'dashboard' | 'projects' | 'billing';

  // For billing page - pass bill count directly since it's calculated from filtered bills
  billCount?: number;

  // Optional: external refresh trigger
  refreshTrigger?: number;

  // Optional: callback when metrics are loaded
  onMetricsLoaded?: (metrics: any) => void;
}

export function DashboardMetrics({
  departmentId = 'all',
  clientId = 'all',
  categoryId = 'all',
  status = 'all',
  yearParam = 'all',
  variant = 'dashboard',
  billCount,
  refreshTrigger,
  onMetricsLoaded,
}: DashboardMetricsProps) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  // Check if a specific year is selected
  const isYearSelected = yearParam !== 'all';

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (departmentId !== 'all') params.append('departmentId', departmentId);
      if (clientId !== 'all') params.append('clientId', clientId);
      if (categoryId !== 'all') params.append('categoryId', categoryId);
      if (status !== 'all') params.append('status', status);
      params.append('year', yearParam);

      const data = await apiFetch(`/api/dashboard/metrics?${params.toString()}`);
      setMetrics(data);
      onMetricsLoaded?.(data);
    } catch (err) {
      console.error("Metrics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [departmentId, clientId, categoryId, status, yearParam, onMetricsLoaded]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics, refreshTrigger]);

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(amount));
    return `৳${formatted}`;
  };

  // Computed values
  const computed = useMemo(() => {
    const totalBudget = metrics?.totalBudget ?? 0;
    const totalReceived = metrics?.totalReceived ?? 0;
    const totalRemaining = metrics?.totalRemaining ?? 0;
    const activeCount = metrics?.activeCount ?? 0;
    const receivedFromScheduledYear = metrics?.receivedFromScheduledYear ?? totalReceived;
    const receivedFromEarlierYears = metrics?.receivedFromEarlierYears ?? 0;

    // Collection percentage - when year is selected, base on scheduled year received
    const collectionPercent = totalBudget > 0
      ? Math.round((isYearSelected ? receivedFromScheduledYear : totalReceived) / totalBudget * 100)
      : 0;

    return {
      totalBudget,
      totalReceived,
      totalRemaining,
      activeCount,
      collectionPercent,
      receivedFromScheduledYear,
      receivedFromEarlierYears,
    };
  }, [metrics, isYearSelected]);

  // Description for Total Received based on year selection
  const receivedDescription = useMemo(() => {
    if (isYearSelected && computed.receivedFromEarlierYears > 0) {
      return `${computed.collectionPercent}% of year | +${formatCurrency(computed.receivedFromEarlierYears)} earlier dues`;
    }
    return `${computed.collectionPercent}% collected`;
  }, [isYearSelected, computed]);

  // Fourth metric changes based on variant
  const fourthMetric = useMemo(() => {
    if (variant === 'billing') {
      return {
        title: 'Total Bills',
        value: (billCount ?? 0).toString(),
        icon: Receipt,
        description: undefined,
      };
    }
    return {
      title: 'Active Projects',
      value: computed.activeCount.toString(),
      icon: FolderKanban,
      description: undefined,
    };
  }, [variant, billCount, computed.activeCount]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <div className="relative group">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 md:top-2 md:right-2 z-10 opacity-0 group-hover:opacity-100 h-6 w-6 md:h-7 md:w-7"
          onClick={fetchMetrics}
        >
          <RefreshCw className="h-3 w-3 md:h-3.5 md:w-3.5" />
        </Button>
        <MetricCard
          loading={loading}
          title="Total Budget"
          value={formatCurrency(computed.totalBudget)}
          icon={Wallet}
          variant="primary"
        />
      </div>

      <div className="relative group">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 md:top-2 md:right-2 z-10 opacity-0 group-hover:opacity-100 h-6 w-6 md:h-7 md:w-7"
          onClick={fetchMetrics}
        >
          <RefreshCw className="h-3 w-3 md:h-3.5 md:w-3.5" />
        </Button>
        <MetricCard
          loading={loading}
          title="Total Received"
          value={formatCurrency(computed.totalReceived)}
          description={receivedDescription}
          icon={TrendingUp}
          variant="success"
        />
      </div>

      <div className="relative group">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 md:top-2 md:right-2 z-10 opacity-0 group-hover:opacity-100 h-6 w-6 md:h-7 md:w-7"
          onClick={fetchMetrics}
        >
          <RefreshCw className="h-3 w-3 md:h-3.5 md:w-3.5" />
        </Button>
        <MetricCard
          loading={loading}
          title={variant === 'dashboard' ? 'Total Remaining' : 'Total Pending'}
          value={formatCurrency(computed.totalRemaining)}
          description={`${100 - computed.collectionPercent}% remaining`}
          icon={TrendingDown}
          variant="warning"
        />
      </div>

      <div className="relative group">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 md:top-2 md:right-2 z-10 opacity-0 group-hover:opacity-100 h-6 w-6 md:h-7 md:w-7"
          onClick={fetchMetrics}
        >
          <RefreshCw className="h-3 w-3 md:h-3.5 md:w-3.5" />
        </Button>
        <MetricCard
          loading={loading}
          title={fourthMetric.title}
          value={fourthMetric.value}
          description={fourthMetric.description}
          icon={fourthMetric.icon}
        />
      </div>
    </div>
  );
}
