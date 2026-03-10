"use client";

import { useState, useEffect, useCallback } from 'react';
import { Maximize2, RefreshCw, X, Shield, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { ProjectDistributionChart } from '@/components/dashboard/ProjectDistributionChart';
import { BudgetComparisonChart } from '@/components/dashboard/BudgetComparisonChart';
import { UpcomingDeadlines } from '@/components/dashboard/UpcomingDeadlines';
import { LastReceived } from '@/components/dashboard/LastReceived';
import { CalendarCard } from '@/components/dashboard/CalendarCard';
import { ProjectTable } from '@/components/projects/ProjectTable';
import { Button } from '@/components/ui/button';
import { useSharedFilters } from '@/contexts/FilterContext';
import { DashboardFilter } from '@/components/dashboard/DashboardFilter';
import { ApiClientError, apiFetch } from '@/lib/api-client';

export default function DashboardPage() {
  const [metricsData, setMetricsData] = useState<any>(null);
  const [metricsRefreshTrigger, setMetricsRefreshTrigger] = useState(0);
  const [revenue, setRevenue] = useState([]);
  const [revenueYearly, setRevenueYearly] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [budgetComparison, setBudgetComparison] = useState([]);
  const [lastReceived, setLastReceived] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [chartSlid, setChartSlid] = useState(false);
  const [infoRowOpen, setInfoRowOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [isLg, setIsLg] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsLg(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsLg(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const { departmentId, clientId, status, yearType, selectedYear } = useSharedFilters();

  // Construct year parameter with prefix for API calls
  // "all" means no year filter
  const yearParam = selectedYear === 'all'
    ? 'all'
    : (yearType === 'fiscal' ? `fy-${selectedYear}` : `cal-${selectedYear}`);

  // Individual Loading States for Refetching
  const [loadingStates, setLoadingStates] = useState({
    revenue: true,
    revenueYearly: true,
    distribution: true,
    budget: true,
    lastReceived: true,
    deadlines: true,
    calendar: true,
    projects: true
  });

  // Error states for each section
  const [errors, setErrors] = useState<{
    revenue: ApiClientError | null;
    revenueYearly: ApiClientError | null;
    distribution: ApiClientError | null;
    budget: ApiClientError | null;
    lastReceived: ApiClientError | null;
    deadlines: ApiClientError | null;
    calendar: ApiClientError | null;
    projects: ApiClientError | null;
  }>({
    revenue: null,
    revenueYearly: null,
    distribution: null,
    budget: null,
    lastReceived: null,
    deadlines: null,
    calendar: null,
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
    if (status !== 'all') params.append('status', status);
    return params.toString();
  };

  // Specialized Fetchers with error handling
  const fetchRevenue = useCallback(async () => {
    updateLoading('revenue', true);
    updateError('revenue', null);
    try {
      const params = getFilterQueryParams();
      const data = await apiFetch(`/api/dashboard/revenue?year=${yearParam}&${params}`);
      setRevenue(data as any);
    } catch (err) {
      if (err instanceof ApiClientError) {
        updateError('revenue', err);
      }
    } finally {
      updateLoading('revenue', false);
    }
  }, [yearParam, departmentId, clientId, status]);

  const fetchRevenueYearly = useCallback(async () => {
    updateLoading('revenueYearly', true);
    updateError('revenueYearly', null);
    try {
      const params = getFilterQueryParams();
      const data = await apiFetch(`/api/dashboard/revenue-yearly?${params}`);
      setRevenueYearly(data as any);
    } catch (err) {
      if (err instanceof ApiClientError) {
        updateError('revenueYearly', err);
      }
    } finally {
      updateLoading('revenueYearly', false);
    }
  }, [departmentId, clientId, status]);

  const fetchDistribution = useCallback(async () => {
    updateLoading('distribution', true);
    updateError('distribution', null);
    try {
      const params = getFilterQueryParams();
      const data = await apiFetch(`/api/dashboard/distribution?year=${yearParam}&${params}`);
      setDistribution(data as any);
    } catch (err) {
      if (err instanceof ApiClientError) {
        updateError('distribution', err);
      }
    } finally {
      updateLoading('distribution', false);
    }
  }, [departmentId, clientId, status, yearParam]);

  const fetchBudgetComparison = useCallback(async () => {
    updateLoading('budget', true);
    updateError('budget', null);
    try {
      const params = getFilterQueryParams();
      const data = await apiFetch(`/api/dashboard/budget-comparison?year=${yearParam}&${params}`);
      setBudgetComparison(data as any);
    } catch (err) {
      if (err instanceof ApiClientError) {
        updateError('budget', err);
      }
    } finally {
      updateLoading('budget', false);
    }
  }, [departmentId, clientId, status, yearParam]);

  const fetchLastReceived = useCallback(async () => {
    updateLoading('lastReceived', true);
    updateError('lastReceived', null);
    try {
      const params = getFilterQueryParams();
      const data = await apiFetch(`/api/dashboard/last-received?year=${yearParam}&${params}`);
      setLastReceived(data as any);
    } catch (err) {
      if (err instanceof ApiClientError) {
        updateError('lastReceived', err);
      }
    } finally {
      updateLoading('lastReceived', false);
    }
  }, [departmentId, clientId, status, yearParam]);

  const fetchDeadlines = useCallback(async () => {
    updateLoading('deadlines', true);
    updateError('deadlines', null);
    try {
      const params = getFilterQueryParams();
      const data = await apiFetch(`/api/dashboard/deadlines?year=${yearParam}&${params}`);
      setDeadlines(data as any);
    } catch (err) {
      if (err instanceof ApiClientError) {
        updateError('deadlines', err);
      }
    } finally {
      updateLoading('deadlines', false);
    }
  }, [departmentId, clientId, status, yearParam]);

  const fetchCalendar = useCallback(async () => {
    updateLoading('calendar', true);
    updateError('calendar', null);
    try {
      const params = getFilterQueryParams();
      const data = await apiFetch(`/api/dashboard/calendar?year=${yearParam}&${params}`);
      setCalendarEvents(data as any);
    } catch (err) {
      if (err instanceof ApiClientError) {
        updateError('calendar', err);
      }
    } finally {
      updateLoading('calendar', false);
    }
  }, [departmentId, clientId, status, yearParam]);

  const fetchProjects = useCallback(async () => {
    updateLoading('projects', true);
    updateError('projects', null);
    try {
      const params = getFilterQueryParams();
      const data = await apiFetch(`/api/dashboard/projects?year=${yearParam}&${params}`);
      setProjects(data as any);
    } catch (err) {
      if (err instanceof ApiClientError) {
        updateError('projects', err);
      }
    } finally {
      updateLoading('projects', false);
    }
  }, [departmentId, clientId, status, yearParam]);


  useEffect(() => {
    fetchRevenue();
    fetchRevenueYearly();
    fetchDistribution();
    fetchBudgetComparison();
    fetchLastReceived();
    fetchDeadlines();
    fetchCalendar();
    fetchProjects();
  }, [yearParam, departmentId, clientId, status, fetchRevenue, fetchRevenueYearly, fetchDistribution, fetchBudgetComparison, fetchLastReceived, fetchDeadlines, fetchCalendar, fetchProjects]);

  const formatCurrency = (amount: number) => {
    // Use Indian numbering system (Lakh/Crore): 1,00,00,000 for 1 crore, 1,00,000 for 1 lakh
    const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(amount));
    return `৳${formatted}`;
  };

  return (
    <>
      {/* Expanded View Modal - Full screen on mobile */}
      {expandedCard && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-2 md:p-6">
          <div className="bg-card  w-full max-w-6xl h-[90vh] md:h-[80vh] rounded-xl shadow-2xl relative p-1 md:p-3">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 md:top-4 md:right-4 z-[9999]" onClick={() => setExpandedCard(null)}>
              <X className="h-5 w-5" />
            </Button>
            {expandedCard === 'revenue' && <RevenueChart data={revenue} yearlyData={revenueYearly} isExpanded isAllYears={selectedYear === 'all'} />}
            {expandedCard === 'budget' && <BudgetComparisonChart data={budgetComparison} isExpanded />}
            {expandedCard === 'distribution' && <ProjectDistributionChart data={distribution} isExpanded />}
            {expandedCard === 'lastReceived' && <LastReceived data={lastReceived} isExpanded />}
            {expandedCard === 'deadlines' && <UpcomingDeadlines deadlines={deadlines} isExpanded />}
            {expandedCard === 'calendar' && <CalendarCard events={calendarEvents} isExpanded />}
          </div>
        </div>
      )}

      <div className="space-y-4 md:space-y-6" data-testid="dashboard-page-content">
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/40 -mx-4 md:-mx-6 px-4 md:px-6">
          <DashboardFilter />
        </div>
        {/* Top Metric Cards */}
        <DashboardMetrics
          departmentId={departmentId}
          clientId={clientId}
          status={status}
          yearParam={yearParam}
          variant="dashboard"
          refreshTrigger={metricsRefreshTrigger}
          onMetricsLoaded={setMetricsData}
        />

        {/* Project Guarantee (PG) Metrics - Conditional Display */}
        {metricsData && (metricsData.pgDeposited > 0 || metricsData.pgCleared > 0 || metricsData.pgPending > 0) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Shield className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-muted-foreground">
                Project Guarantee (PG) Overview
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <div className="relative group">
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 md:top-2 md:right-2 z-10 opacity-0 group-hover:opacity-100 h-6 w-6 md:h-7 md:w-7" onClick={() => setMetricsRefreshTrigger(t => t + 1)}>
                  <RefreshCw className="h-3 w-3 md:h-3.5 md:w-3.5" />
                </Button>
                <MetricCard
                  title="PG Deposited"
                  value={formatCurrency(metricsData?.pgDeposited || 0)}
                  icon={Shield}
                  variant="default"
                />
              </div>
              <div className="relative group">
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 md:top-2 md:right-2 z-10 opacity-0 group-hover:opacity-100 h-6 w-6 md:h-7 md:w-7" onClick={() => setMetricsRefreshTrigger(t => t + 1)}>
                  <RefreshCw className="h-3 w-3 md:h-3.5 md:w-3.5" />
                </Button>
                <MetricCard
                  title="PG Cleared"
                  value={formatCurrency(metricsData?.pgCleared || 0)}
                  icon={TrendingUp}
                  variant="success"
                />
              </div>
              <div className="relative group">
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 md:top-2 md:right-2 z-10 opacity-0 group-hover:opacity-100 h-6 w-6 md:h-7 md:w-7" onClick={() => setMetricsRefreshTrigger(t => t + 1)}>
                  <RefreshCw className="h-3 w-3 md:h-3.5 md:w-3.5" />
                </Button>
                <MetricCard
                  title="PG Pending"
                  value={formatCurrency(metricsData?.pgPending || 0)}
                  icon={TrendingDown}
                  variant="warning"
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 md:space-y-6">
            {/* ── Sliding 150% row: Client Distribution ↔ Budget vs Received ── */}
            <div className="relative overflow-hidden rounded-xl px-[4%]">

              {/* Inner row — 150% wide, two equal cards (each 75% of container) */}
              <motion.div
                className="flex"
                style={{ width: '150%' }}
                animate={{ x: chartSlid ? '-33.33%' : '0%' }}
                transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
              >
                {/* Card 1 — Client Distribution */}
                <div className="flex-none pr-3" style={{ width: '50%' }}>
                  <div className="relative group">
                    <div className="absolute top-2 right-5 z-10 opacity-0 group-hover:opacity-100 flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchDistribution}><RefreshCw className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hidden md:flex" onClick={() => setExpandedCard('distribution')}><Maximize2 className="h-3.5 w-3.5" /></Button>
                    </div>
                    <ProjectDistributionChart loading={loadingStates.distribution} data={distribution} />
                  </div>
                </div>

                {/* Card 2 — Budget vs Received */}
                <div className="flex-none" style={{ width: '50%' }}>
                  <div className="relative group">
                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchBudgetComparison}><RefreshCw className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hidden md:flex" onClick={() => setExpandedCard('budget')}><Maximize2 className="h-3.5 w-3.5" /></Button>
                    </div>
                    <BudgetComparisonChart loading={loadingStates.budget} data={budgetComparison} />
                  </div>
                </div>
              </motion.div>

              {/* ── Slide toggle button ── */}
              <button
                onClick={() => setChartSlid(s => !s)}
                className={`absolute top-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center
                  gap-1 py-5 px-1.5 rounded-lg shadow-lg border border-border/60
                  bg-background/80 backdrop-blur-sm hover:bg-background transition-all duration-300
                  ${chartSlid ? 'left-2' : 'right-2'}`}
                title={chartSlid ? 'Back to Client Distribution' : 'View Budget vs Received'}
              >
                {chartSlid
                  ? <ChevronLeft  className="w-4 h-4 text-muted-foreground" />
                  : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                }
                <span
                  className="text-[9px] font-medium text-muted-foreground"
                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                  {chartSlid ? 'Distribution' : 'Budget'}
                </span>
              </button>

            </div>

            {/* Monthly Revenue — hidden for now */}
            {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <div className="relative group">
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { fetchRevenue(); fetchRevenueYearly(); }}><RefreshCw className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 hidden md:flex" onClick={() => setExpandedCard('revenue')}><Maximize2 className="h-3.5 w-3.5" /></Button>
                </div>
                <RevenueChart
                  loading={loadingStates.revenue}
                  loadingYearly={loadingStates.revenueYearly}
                  data={revenue}
                  yearlyData={revenueYearly}
                  isAllYears={selectedYear === 'all'}
                />
              </div>
            </div> */}

            {/* ── Projects Table (collapsible, default expanded) ── */}
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="relative group/hdr flex items-center hover:bg-muted/40 transition-colors">
                {/* clickable toggle area */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setProjectsOpen(o => !o)}
                  onKeyDown={e => e.key === 'Enter' && setProjectsOpen(o => !o)}
                  className="flex-1 flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                >
                  <span className="text-sm font-semibold text-foreground">Projects</span>
                  <motion.div animate={{ rotate: projectsOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                </div>
                {/* refresh — sibling, not inside the toggle div */}
                <div className="pr-2 opacity-0 group-hover/hdr:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchProjects}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <AnimatePresence initial={false}>
                {projectsOpen && (
                  <motion.div
                    key="projects-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="border-t border-border/40">
                      <ProjectTable projects={projects.map((p: any) => ({
                        ...p,
                        name: p.projectName,
                        clientName: p.client?.name || 'Unknown',
                        signDate: p.startDate,
                        totalBudget: Number(p.totalProjectValue)
                      }))} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Collapsible info row: Last Received · Deadlines · Calendar ── */}
            <div className="glass-card rounded-xl overflow-hidden">
              <button
                onClick={() => setInfoRowOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground sm:hidden">
                    <span>Received</span>
                    <span className="text-border/60">·</span>
                    <span>Deadlines</span>
                    <span className="text-border/60">·</span>
                    <span>Calendar</span>
                  </span>
                  <span className="hidden sm:flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span>Last Received</span>
                    <span className="text-border/60">·</span>
                    <span>Upcoming Deadlines</span>
                    <span className="text-border/60">·</span>
                    <span>Project Calendar</span>
                  </span>
                </div>
                <motion.div animate={{ rotate: infoRowOpen ? 180 : 0 }} transition={{ duration: 0.25 }} className="flex-shrink-0 ml-2">
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {infoRowOpen && (
                  <motion.div
                    key="info-row"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_2fr] gap-4 p-4 border-t border-border/40">
                      <div className="relative group">
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchLastReceived}><RefreshCw className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hidden md:flex" onClick={() => setExpandedCard('lastReceived')}><Maximize2 className="h-3.5 w-3.5" /></Button>
                        </div>
                        <LastReceived loading={loadingStates.lastReceived} data={lastReceived} />
                      </div>
                      <div className="relative group">
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchDeadlines}><RefreshCw className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hidden md:flex" onClick={() => setExpandedCard('deadlines')}><Maximize2 className="h-3.5 w-3.5" /></Button>
                        </div>
                        <UpcomingDeadlines loading={loadingStates.deadlines} deadlines={deadlines} />
                      </div>
                      <div className="relative group">
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchCalendar}><RefreshCw className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hidden md:flex" onClick={() => setExpandedCard('calendar')}><Maximize2 className="h-3.5 w-3.5" /></Button>
                        </div>
                        <CalendarCard loading={loadingStates.calendar} events={calendarEvents} compact={isLg} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
        </div>
      </div>
    </>
  );
}