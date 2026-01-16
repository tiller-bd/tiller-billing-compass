"use client";

import { useState, useEffect, useCallback } from 'react';
import { Wallet, TrendingUp, TrendingDown, FolderKanban, Maximize2, RefreshCw, X } from 'lucide-react';
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
import { useSharedFilters } from '@/contexts/FilterContext';
import { DashboardFilter } from '@/components/dashboard/DashboardFilter';
import { ApiClientError, apiFetch } from '@/lib/api-client';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [revenue, setRevenue] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [budgetComparison, setBudgetComparison] = useState([]);
  const [lastReceived, setLastReceived] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [projects, setProjects] = useState([]);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const { departmentId, clientId, projectId } = useSharedFilters();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

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

  // Error states for each section
  const [errors, setErrors] = useState<{
    metrics: ApiClientError | null;
    revenue: ApiClientError | null;
    distribution: ApiClientError | null;
    budget: ApiClientError | null;
    lastReceived: ApiClientError | null;
    deadlines: ApiClientError | null;
    projects: ApiClientError | null;
  }>({
    metrics: null,
    revenue: null,
    distribution: null,
    budget: null,
    lastReceived: null,
    deadlines: null,
    projects: null
  });

  const updateLoading = (key: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  const updateError = (key: keyof typeof errors, error: ApiClientError | null) => {
    setErrors(prev => ({ ...prev, [key]: error }));
  };

  const getFilterQueryParams = () => {
    const params = new URLSearchParams();
    if (departmentId !== 'all') params.append('departmentId', departmentId);
    if (clientId !== 'all') params.append('clientId', clientId);
    if (projectId !== 'all') params.append('projectId', projectId);
    return params.toString();
  };

  // Specialized Fetchers with error handling
  const fetchMetrics = useCallback(async () => {
    updateLoading('metrics', true);
    updateError('metrics', null);
    try {
      const params = getFilterQueryParams();
      const data = await apiFetch(`/api/dashboard/metrics?${params}`);
      setMetrics(data);
    } catch (err) {
      if (err instanceof ApiClientError) {
        updateError('metrics', err);
      }
    } finally {
      updateLoading('metrics', false);
    }
  }, [departmentId, clientId, projectId]);

  const fetchRevenue = useCallback(async (year: string) => {
    updateLoading('revenue', true);
    updateError('revenue', null);
    try {
      const params = getFilterQueryParams();
      const data = await apiFetch(`/api/dashboard/revenue?year=${year}&${params}`);
      setRevenue(data as any);
    } catch (err) {
      if (err instanceof ApiClientError) {
        updateError('revenue', err);
      }
    } finally {
      updateLoading('revenue', false);
    }
  }, [selectedYear, departmentId, clientId, projectId]);

  const fetchDistribution = useCallback(async () => {
    updateLoading('distribution', true);
    updateError('distribution', null);
    try {
      const params = getFilterQueryParams();
      const data = await apiFetch(`/api/dashboard/distribution?${params}`);
      setDistribution(data as any);
    } catch (err) {
      if (err instanceof ApiClientError) {
        updateError('distribution', err);
      }
    } finally {
      updateLoading('distribution', false);
    }
  }, [departmentId, clientId, projectId]);

  const fetchBudgetComparison = useCallback(async () => {
    updateLoading('budget', true);
    updateError('budget', null);
    try {
      const params = getFilterQueryParams();
      const data = await apiFetch(`/api/dashboard/budget-comparison?${params}`);
      setBudgetComparison(data as any);
    } catch (err) {
      if (err instanceof ApiClientError) {
        updateError('budget', err);
      }
    } finally {
      updateLoading('budget', false);
    }
  }, [departmentId, clientId, projectId]);

  const fetchLastReceived = useCallback(async () => {
    updateLoading('lastReceived', true);
    updateError('lastReceived', null);
    try {
      const params = getFilterQueryParams();
      const data = await apiFetch(`/api/dashboard/last-received?${params}`);
      setLastReceived(data as any);
    } catch (err) {
      if (err instanceof ApiClientError) {
        updateError('lastReceived', err);
      }
    } finally {
      updateLoading('lastReceived', false);
    }
  }, [departmentId, clientId, projectId]);

  const fetchDeadlines = useCallback(async () => {
    updateLoading('deadlines', true);
    updateError('deadlines', null);
    try {
      const params = getFilterQueryParams();
      const data = await apiFetch(`/api/dashboard/deadlines?${params}`);
      setDeadlines(data as any);
    } catch (err) {
      if (err instanceof ApiClientError) {
        updateError('deadlines', err);
      }
    } finally {
      updateLoading('deadlines', false);
    }
  }, [departmentId, clientId, projectId]);

  const fetchProjects = useCallback(async () => {
    updateLoading('projects', true);
    updateError('projects', null);
    try {
      const params = getFilterQueryParams();
      const data = await apiFetch(`/api/dashboard/projects?${params}`);
      setProjects(data as any);
    } catch (err) {
      if (err instanceof ApiClientError) {
        updateError('projects', err);
      }
    } finally {
      updateLoading('projects', false);
    }
  }, [departmentId, clientId, projectId]);


  useEffect(() => {
    fetchMetrics();
    fetchRevenue(selectedYear);
    fetchDistribution();
    fetchBudgetComparison();
    fetchLastReceived();
    fetchDeadlines();
    fetchProjects();
  }, [selectedYear, departmentId, clientId, projectId, fetchMetrics, fetchRevenue, fetchDistribution, fetchBudgetComparison, fetchLastReceived, fetchDeadlines, fetchProjects]);

  const formatCurrency = (amount: number) => {
    // Use Indian numbering system (Lakh/Crore): 1,00,00,000 for 1 crore, 1,00,000 for 1 lakh
    const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(amount));
    return `৳${formatted}`;
  };

  return (
    <DashboardLayout title="Dashboard" >

      {/* Expanded View Modal - Full screen on mobile */}
      {expandedCard && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-2 md:p-6">
          <div className="bg-card border w-full max-w-6xl h-[90vh] md:h-[80vh] rounded-xl shadow-2xl relative p-4 md:p-8">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 md:top-4 md:right-4" onClick={() => setExpandedCard(null)}>
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

      <div className="space-y-4 md:space-y-6" data-testid="dashboard-page-content">
        <DashboardFilter />
        {/* Top Metric Cards - 2x2 grid on mobile, 4 cols on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="relative group">
            <Button variant="ghost" size="icon" className="absolute top-1 right-1 md:top-2 md:right-2 z-10 opacity-0 group-hover:opacity-100 h-6 w-6 md:h-7 md:w-7" onClick={fetchMetrics}>
              <RefreshCw className="h-3 w-3 md:h-3.5 md:w-3.5" />
            </Button>
            <MetricCard loading={loadingStates.metrics} title="Total Budget" value={formatCurrency(metrics?.totalBudget || 0)} icon={Wallet} variant="primary" />
          </div>
          <div className="relative group">
            <Button variant="ghost" size="icon" className="absolute top-1 right-1 md:top-2 md:right-2 z-10 opacity-0 group-hover:opacity-100 h-6 w-6 md:h-7 md:w-7" onClick={fetchMetrics}>
              <RefreshCw className="h-3 w-3 md:h-3.5 md:w-3.5" />
            </Button>
            <MetricCard loading={loadingStates.metrics} title="Total Received" value={formatCurrency(metrics?.totalReceived || 0)} icon={TrendingUp} variant="success" />
          </div>
          <div className="relative group">
            <Button variant="ghost" size="icon" className="absolute top-1 right-1 md:top-2 md:right-2 z-10 opacity-0 group-hover:opacity-100 h-6 w-6 md:h-7 md:w-7" onClick={fetchMetrics}>
              <RefreshCw className="h-3 w-3 md:h-3.5 md:w-3.5" />
            </Button>
            <MetricCard loading={loadingStates.metrics} title="Total Remaining" value={formatCurrency(metrics?.totalRemaining || 0)} icon={TrendingDown} variant="warning" />
          </div>
          <div className="relative group">
            <Button variant="ghost" size="icon" className="absolute top-1 right-1 md:top-2 md:right-2 z-10 opacity-0 group-hover:opacity-100 h-6 w-6 md:h-7 md:w-7" onClick={fetchMetrics}>
              <RefreshCw className="h-3 w-3 md:h-3.5 md:w-3.5" />
            </Button>
            <MetricCard loading={loadingStates.metrics} title="Active Projects" value={metrics?.activeCount?.toString() || "0"} icon={FolderKanban} />
          </div>
        </div>

        <Tabs defaultValue="charts">
          <TabsList className="glass-card mb-4 w-full md:w-auto">
            <TabsTrigger value="charts" className="flex-1 md:flex-none text-xs md:text-sm">Charts</TabsTrigger>
            <TabsTrigger value="projects" className="flex-1 md:flex-none text-xs md:text-sm">Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-4 md:space-y-6">
            {/* Revenue & Budget Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <div className="relative group">
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => fetchRevenue(selectedYear)}><RefreshCw className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 hidden md:flex" onClick={() => setExpandedCard('revenue')}><Maximize2 className="h-3.5 w-3.5" /></Button>
                </div>
                <div className="absolute top-3 right-12 md:top-4 md:right-16 z-20 flex items-center gap-1 md:gap-2">
                  <span className="text-[10px] md:text-xs text-muted-foreground hidden sm:inline">Year:</span>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="h-7 w-20 md:h-8 md:w-24 bg-background/50 text-[10px] md:text-xs"><SelectValue /></SelectTrigger>
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
                  <Button variant="ghost" size="icon" className="h-7 w-7 hidden md:flex" onClick={() => setExpandedCard('budget')}><Maximize2 className="h-3.5 w-3.5" /></Button>
                </div>
                <BudgetComparisonChart loading={loadingStates.budget} data={budgetComparison} />
              </div>
            </div>

            {/* Distribution, Last Received, Deadlines */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="relative group md:col-span-2 lg:col-span-2">
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchDistribution}><RefreshCw className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 hidden md:flex" onClick={() => setExpandedCard('distribution')}><Maximize2 className="h-3.5 w-3.5" /></Button>
                </div>
                <ProjectDistributionChart loading={loadingStates.distribution} data={distribution} />
              </div>
              <div className="relative group">
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchLastReceived}><RefreshCw className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 hidden md:flex" onClick={() => setExpandedCard('lastReceived')}><Maximize2 className="h-3.5 w-3.5" /></Button>
                </div>
                <LastReceived loading={loadingStates.lastReceived} data={lastReceived} />
              </div>
              <div className="relative group md:col-span-2 lg:col-span-3">
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchDeadlines}><RefreshCw className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 hidden md:flex" onClick={() => setExpandedCard('deadlines')}><Maximize2 className="h-3.5 w-3.5" /></Button>
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