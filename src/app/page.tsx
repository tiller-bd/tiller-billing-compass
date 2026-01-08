"use client";

import { useState, useEffect, useCallback } from 'react';
import { Wallet, TrendingUp, TrendingDown, FolderKanban, Maximize2, RefreshCw, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { ProjectDistributionChart } from '@/components/dashboard/ProjectDistributionChart';
import { BudgetComparisonChart } from '@/components/dashboard/BudgetComparisonChart';
import { UpcomingDeadlines } from '@/components/dashboard/UpcomingDeadlines';
import { LastReceived } from '@/components/dashboard/LastReceived';
import { ProjectTable } from '@/components/projects/ProjectTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [revenue, setRevenue] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [budgetComparison, setBudgetComparison] = useState([]);
  const [lastReceived, setLastReceived] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Individual Loading States for Refetching
  const [loadingStates, setLoadingStates] = useState({
    metrics: true,
    revenue: true,
    distribution: true,
    budget: true,
    lastReceived: true,
    deadlines: true,
    projects: true
  });

  const router = useRouter();

  const updateLoading = (key: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  // Specialized Fetchers
  const fetchMetrics = useCallback(async () => {
    updateLoading('metrics', true);
    const res = await fetch('/api/dashboard/metrics');
    setMetrics(await res.json());
    updateLoading('metrics', false);
  }, []);

  const fetchRevenue = useCallback(async (year: string) => {
    updateLoading('revenue', true);
    const res = await fetch(`/api/dashboard/revenue?year=${year}`);
    setRevenue(await res.json());
    updateLoading('revenue', false);
  }, []);

  const fetchDistribution = useCallback(async () => {
    updateLoading('distribution', true);
    const res = await fetch('/api/dashboard/distribution');
    setDistribution(await res.json());
    updateLoading('distribution', false);
  }, []);

  const fetchBudgetComparison = useCallback(async () => {
    updateLoading('budget', true);
    const res = await fetch('/api/dashboard/budget-comparison');
    setBudgetComparison(await res.json());
    updateLoading('budget', false);
  }, []);

  const fetchLastReceived = useCallback(async () => {
    updateLoading('lastReceived', true);
    const res = await fetch('/api/dashboard/last-received');
    setLastReceived(await res.json());
    updateLoading('lastReceived', false);
  }, []);

  const fetchDeadlines = useCallback(async () => {
    updateLoading('deadlines', true);
    const res = await fetch('/api/dashboard/deadlines');
    setDeadlines(await res.json());
    updateLoading('deadlines', false);
  }, []);

  const fetchProjects = useCallback(async () => {
    updateLoading('projects', true);
    const res = await fetch('/api/dashboard/projects');
    setProjects(await res.json());
    updateLoading('projects', false);
  }, []);



  useEffect(() => {
    fetchMetrics();
    fetchRevenue(selectedYear);
    fetchDistribution();
    fetchBudgetComparison();
    fetchLastReceived();
    fetchDeadlines();
    fetchProjects();
  }, [selectedYear, fetchMetrics, fetchRevenue, fetchDistribution, fetchBudgetComparison, fetchLastReceived, fetchDeadlines, fetchProjects]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DashboardLayout title="Dashboard" >

      {/* Expanded View Modal */}
      {expandedCard && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-card border w-full max-w-6xl h-[80vh] rounded-xl shadow-2xl relative p-8">
            <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={() => setExpandedCard(null)}>
              <X className="h-5 w-5" />
            </Button>
            {expandedCard === 'revenue' && <RevenueChart data={revenue} isExpanded />}
            {expandedCard === 'budget' && <BudgetComparisonChart data={budgetComparison} isExpanded />}
            {expandedCard === 'distribution' && <ProjectDistributionChart data={distribution} isExpanded />}
            {expandedCard === 'lastReceived' && <LastReceived data={lastReceived} isExpanded />}
            {expandedCard === 'deadlines' && <UpcomingDeadlines deadlines={deadlines} isExpanded />}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Top Metric Cards - Refetch Only */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative group">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 h-7 w-7" onClick={fetchMetrics}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <MetricCard loading={loadingStates.metrics} title="Total Budget" value={formatCurrency(metrics?.totalBudget || 0)} icon={Wallet} variant="primary" />
          </div>
          <div className="relative group">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 h-7 w-7" onClick={fetchMetrics}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <MetricCard loading={loadingStates.metrics} title="Total Received" value={formatCurrency(metrics?.totalReceived || 0)} icon={TrendingUp} variant="success" />
          </div>
          <div className="relative group">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 h-7 w-7" onClick={fetchMetrics}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <MetricCard loading={loadingStates.metrics} title="Total Remaining" value={formatCurrency(metrics?.totalRemaining || 0)} icon={TrendingDown} variant="warning" />
          </div>
          <div className="relative group">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 h-7 w-7" onClick={fetchMetrics}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <MetricCard loading={loadingStates.metrics} title="Active Projects" value={metrics?.activeCount?.toString() || "0"} icon={FolderKanban} />
          </div>
        </div>

        <Tabs defaultValue="charts">
          <TabsList className="glass-card mb-4">
            <TabsTrigger value="charts">Charts Overview</TabsTrigger>
            <TabsTrigger value="projects">All Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="relative group">
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => fetchRevenue(selectedYear)}><RefreshCw className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedCard('revenue')}><Maximize2 className="h-3.5 w-3.5" /></Button>
                </div>
                <div className="absolute top-4 right-16 z-20 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Year:</span>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="h-8 w-24 bg-background/50 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026].map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <RevenueChart loading={loadingStates.revenue} data={revenue} />
              </div>

              <div className="relative group">
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchBudgetComparison}><RefreshCw className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedCard('budget')}><Maximize2 className="h-3.5 w-3.5" /></Button>
                </div>
                <BudgetComparisonChart loading={loadingStates.budget} data={budgetComparison} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative group">
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchDistribution}><RefreshCw className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedCard('distribution')}><Maximize2 className="h-3.5 w-3.5" /></Button>
                </div>
                <ProjectDistributionChart loading={loadingStates.distribution} data={distribution} />
              </div>
              <div className="relative group">
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchLastReceived}><RefreshCw className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedCard('lastReceived')}><Maximize2 className="h-3.5 w-3.5" /></Button>
                </div>
                <LastReceived loading={loadingStates.lastReceived} data={lastReceived} />
              </div>
              <div className="relative group">
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchDeadlines}><RefreshCw className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedCard('deadlines')}><Maximize2 className="h-3.5 w-3.5" /></Button>
                </div>
                <UpcomingDeadlines loading={loadingStates.deadlines} deadlines={deadlines} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="projects">
            <div className="relative group">
              <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchProjects}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
              <ProjectTable projects={projects.map((p: any) => ({
                ...p,
                name: p.projectName,
                clientName: p.client?.name || 'Unknown',
                signDate: p.startDate,
                totalBudget: Number(p.totalProjectValue)
              }))} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}