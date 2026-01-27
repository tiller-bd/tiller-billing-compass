// src/app/projects/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw, BarChart3, TrendingUp, Wallet, TrendingDown, FolderKanban, Shield } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProjectTable, ProjectTableSkeleton } from '@/components/projects/ProjectTable';
import { AddProjectDialog } from '@/components/projects/AddProjectDialog';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { ErrorDisplay } from '@/components/error/ErrorDisplay';
import { ApiClientError, apiFetch } from '@/lib/api-client';
import { useSharedFilters } from '@/contexts/FilterContext';
import { getCalendarYearOptions, getFiscalYearOptions, getCurrentFiscalYear, YearType } from '@/lib/date-utils';

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { debouncedSearch } = useSharedFilters();

  const [projects, setProjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiClientError | null>(null);

  // Local state to control the dialog visibility
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);

  // Filter State (search comes from header via shared context)
  const [deptFilter, setDeptFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  // Default to 'all' years
  const [yearType, setYearType] = useState<YearType | 'all'>('all');
  const [yearFilter, setYearFilter] = useState('all');

  // Generate year options
  const calendarYearOptions = useMemo(() => getCalendarYearOptions(), []);
  const fiscalYearOptions = useMemo(() => getFiscalYearOptions(), []);

  // Get current year options based on selected type
  const yearOptions = yearType === 'fiscal' ? fiscalYearOptions :
                       yearType === 'calendar' ? calendarYearOptions : [];

  // Handle year type change
  const handleYearTypeChange = (newType: YearType | 'all') => {
    setYearType(newType);
    if (newType === 'all') {
      setYearFilter('all');
    } else if (newType === 'fiscal') {
      setYearFilter(getCurrentFiscalYear());
    } else {
      setYearFilter(new Date().getFullYear().toString());
    }
  };

  // Construct year parameter for API
  const getYearParam = (): string => {
    if (yearType === 'all' || yearFilter === 'all') return 'all';
    return yearType === 'fiscal' ? `fy-${yearFilter}` : `cal-${yearFilter}`;
  };

  // Trigger dialog if URL contains ?new=true
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsAddProjectOpen(true);
    }
  }, [searchParams]);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (deptFilter !== 'all') params.append('departmentId', deptFilter);
      if (catFilter !== 'all') params.append('categoryId', catFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const yearParam = getYearParam();
      if (yearParam !== 'all') params.append('year', yearParam);

      const data = await apiFetch(`/api/projects?${params.toString()}`);
      setProjects(data as any[]);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err);
      }
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, deptFilter, catFilter, statusFilter, yearType, yearFilter]);

  // Fetch filter options when year changes
  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        const yearParam = getYearParam();
        const yearQuery = yearParam !== 'all' ? `?year=${yearParam}` : '';

        const [depts, cats] = await Promise.all([
          apiFetch(`/api/departments${yearQuery}`),
          apiFetch('/api/categories') // Categories don't need year filter
        ]);

        const newDepartments = depts as any[];
        const newCategories = cats as any[];

        setDepartments(newDepartments);
        setCategories(newCategories);

        // Reset department selection if current value is no longer available
        if (deptFilter !== 'all' && !newDepartments.some((d: any) => d.id.toString() === deptFilter)) {
          setDeptFilter('all');
        }
      } catch (err) {
        console.error("Failed to fetch filters:", err);
      }
    }
    fetchFilterOptions();
  }, [yearType, yearFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchProjects, 400);
    return () => clearTimeout(timer);
  }, [fetchProjects]);

  // Calculate metrics from filtered projects using bill-based logic
  const metrics = useMemo(() => {
    // Get all bills from all projects
    const allBills = projects.flatMap((p) => p.bills || []);

    // Total Budget = sum of ALL bills' billAmount (regardless of status)
    const totalBudget = allBills.reduce(
      (sum, b: any) => sum + Number(b.billAmount || 0),
      0
    );

    // Total Received = sum of PAID + PARTIAL bills' receivedAmount
    const totalReceived = allBills
      .filter((b: any) => b.status === 'PAID' || b.status === 'PARTIAL')
      .reduce((sum, b: any) => sum + Number(b.receivedAmount || 0), 0);

    // Total Remaining = sum of PENDING bills' billAmount
    const totalRemaining = allBills
      .filter((b: any) => b.status === 'PENDING')
      .reduce((sum, b: any) => sum + Number(b.billAmount || 0), 0);

    // Active projects = projects with at least one unpaid bill
    const activeCount = projects.filter((p) => {
      const hasUnpaidBills = p.bills?.some((b: any) => b.status !== 'PAID');
      return hasUnpaidBills;
    }).length;

    // PG Metrics
    const pgDeposited = projects.reduce((sum, p) => {
      if (p.pgStatus === 'PENDING' || p.pgStatus === 'CLEARED') {
        return sum + Number(p.pgUserDeposit || 0);
      }
      return sum;
    }, 0);

    const pgCleared = projects.reduce((sum, p) => {
      if (p.pgStatus === 'CLEARED') {
        return sum + Number(p.pgUserDeposit || 0);
      }
      return sum;
    }, 0);

    const pgPending = projects.reduce((sum, p) => {
      if (p.pgStatus === 'PENDING') {
        return sum + Number(p.pgUserDeposit || 0);
      }
      return sum;
    }, 0);

    // Collection percentage
    const collectionPercent = totalBudget > 0
      ? Math.round((totalReceived / totalBudget) * 100)
      : 0;

    return {
      totalBudget,
      totalReceived,
      totalRemaining,
      activeCount,
      collectionPercent,
      pgDeposited,
      pgCleared,
      pgPending,
    };
  }, [projects]);

  const chartData = useMemo(() => {
    const received = projects.slice(0, 10).map((p: any) => {
      const rec = p.bills.reduce((s: number, b: any) => s + Number(b.receivedAmount || 0), 0);
      return {
        name: p.projectName.length > 12 ? p.projectName.substring(0, 10) + '..' : p.projectName,
        received: rec,
        due: Number(p.totalProjectValue) - rec
      };
    });

    const trend = projects.reduce((acc: any[], p: any) => {
      const month = new Date(p.startDate).toLocaleDateString('en-US', { month: 'short' });
      const exist = acc.find(i => i.month === month);
      if (exist) exist.count += 1;
      else acc.push({ month, count: 1 });
      return acc;
    }, []).reverse();

    return { received, trend };
  }, [projects]);

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(amount));
    return `৳${formatted}`;
  };

  const hasPgData = metrics.pgDeposited > 0 || metrics.pgCleared > 0 || metrics.pgPending > 0;

  return (
    <DashboardLayout title="Projects" >
      <div className="space-y-4 md:space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-lg md:text-2xl font-bold">Project Management</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchProjects} disabled={loading} className="h-9 w-9">
              <RefreshCw className={loading ? "animate-spin" : ""} size={16} />
            </Button>
            <AddProjectDialog
              open={isAddProjectOpen}
              setOpen={setIsAddProjectOpen}
              onProjectAdded={fetchProjects}
            />
          </div>
        </div>

        {/* Summary Metrics - Similar to Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="relative group">
            <Button variant="ghost" size="icon" className="absolute top-1 right-1 md:top-2 md:right-2 z-10 opacity-0 group-hover:opacity-100 h-6 w-6 md:h-7 md:w-7" onClick={fetchProjects}>
              <RefreshCw className="h-3 w-3 md:h-3.5 md:w-3.5" />
            </Button>
            <MetricCard loading={loading} title="Total Budget" value={formatCurrency(metrics.totalBudget)} icon={Wallet} variant="primary" />
          </div>
          <div className="relative group">
            <Button variant="ghost" size="icon" className="absolute top-1 right-1 md:top-2 md:right-2 z-10 opacity-0 group-hover:opacity-100 h-6 w-6 md:h-7 md:w-7" onClick={fetchProjects}>
              <RefreshCw className="h-3 w-3 md:h-3.5 md:w-3.5" />
            </Button>
            <MetricCard loading={loading} title="Total Received" value={formatCurrency(metrics.totalReceived)} description={`${metrics.collectionPercent}% collected`} icon={TrendingUp} variant="success" />
          </div>
          <div className="relative group">
            <Button variant="ghost" size="icon" className="absolute top-1 right-1 md:top-2 md:right-2 z-10 opacity-0 group-hover:opacity-100 h-6 w-6 md:h-7 md:w-7" onClick={fetchProjects}>
              <RefreshCw className="h-3 w-3 md:h-3.5 md:w-3.5" />
            </Button>
            <MetricCard loading={loading} title="Total Pending" value={formatCurrency(metrics.totalRemaining)} description={`${100 - metrics.collectionPercent}% remaining`} icon={TrendingDown} variant="warning" />
          </div>
          <div className="relative group">
            <Button variant="ghost" size="icon" className="absolute top-1 right-1 md:top-2 md:right-2 z-10 opacity-0 group-hover:opacity-100 h-6 w-6 md:h-7 md:w-7" onClick={fetchProjects}>
              <RefreshCw className="h-3 w-3 md:h-3.5 md:w-3.5" />
            </Button>
            <MetricCard loading={loading} title="Active Projects" value={metrics.activeCount.toString()} description={`${projects.length} total`} icon={FolderKanban} />
          </div>
        </div>

        {/* PG Metrics - Conditional Display */}
        {hasPgData && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Shield className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-muted-foreground">
                Project Guarantee (PG) Overview
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <div className="relative group">
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 md:top-2 md:right-2 z-10 opacity-0 group-hover:opacity-100 h-6 w-6 md:h-7 md:w-7" onClick={fetchProjects}>
                  <RefreshCw className="h-3 w-3 md:h-3.5 md:w-3.5" />
                </Button>
                <MetricCard
                  loading={loading}
                  title="PG Deposited"
                  value={formatCurrency(metrics.pgDeposited)}
                  icon={Shield}
                  variant="default"
                />
              </div>
              <div className="relative group">
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 md:top-2 md:right-2 z-10 opacity-0 group-hover:opacity-100 h-6 w-6 md:h-7 md:w-7" onClick={fetchProjects}>
                  <RefreshCw className="h-3 w-3 md:h-3.5 md:w-3.5" />
                </Button>
                <MetricCard
                  loading={loading}
                  title="PG Cleared"
                  value={formatCurrency(metrics.pgCleared)}
                  icon={TrendingUp}
                  variant="success"
                />
              </div>
              <div className="relative group">
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 md:top-2 md:right-2 z-10 opacity-0 group-hover:opacity-100 h-6 w-6 md:h-7 md:w-7" onClick={fetchProjects}>
                  <RefreshCw className="h-3 w-3 md:h-3.5 md:w-3.5" />
                </Button>
                <MetricCard
                  loading={loading}
                  title="PG Pending"
                  value={formatCurrency(metrics.pgPending)}
                  icon={TrendingDown}
                  variant="warning"
                />
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar - Scrollable on mobile */}
        <div className="glass-card rounded-xl border border-border/50 p-3 md:p-4 overflow-x-auto">
          <div className="flex md:grid md:grid-cols-5 gap-2 md:gap-3 min-w-max md:min-w-0">
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="bg-secondary/30 w-32 md:w-full text-xs md:text-sm"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d: any) => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="bg-secondary/30 w-32 md:w-full text-xs md:text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-secondary/30 w-28 md:w-full text-xs md:text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ONGOING">Ongoing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
            {/* Year Type Selector - Fiscal prioritized */}
            <Select value={yearType} onValueChange={(v) => handleYearTypeChange(v as YearType | 'all')}>
              <SelectTrigger className="bg-secondary/30 w-24 md:w-full text-xs md:text-sm">
                <SelectValue placeholder="Year Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="fiscal">Fiscal</SelectItem>
                <SelectItem value="calendar">Calendar</SelectItem>
              </SelectContent>
            </Select>
            {/* Year Value Selector - Only shown when year type is selected */}
            {yearType !== 'all' && (
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="bg-secondary/30 w-24 md:w-full text-xs md:text-sm">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y}>
                      {yearType === 'fiscal' ? `FY ${y}` : y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {loading ? (
          <ProjectTableSkeleton />
        ) : error ? (
          <ErrorDisplay
            error={error}
            code={error.code}
            message={error.message}
            onRetry={fetchProjects}
          />
        ) : (
          <>
            <ProjectTable
              projects={projects.map((p: any) => ({
                ...p,
                name: p.projectName,
                clientName: p.client?.name || 'Unknown',
                signDate: p.startDate,
                totalBudget: Number(p.totalProjectValue),
                status: p.bills?.every((b: any) => b.status === 'PAID') ? 'COMPLETED' : 'ONGOING'
              }))}
              onProjectClick={(project: any) => router.push(`/projects/${project.id}`)}
            />

            {/* Charts - Hidden on mobile for performance, shown on tablet+ */}
            <div className="hidden sm:grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-8">
              <div className="glass-card p-4 md:p-6 rounded-xl border border-border/50">
                <h3 className="text-xs md:text-sm font-bold flex items-center gap-2 mb-4 md:mb-6"><TrendingUp size={16}/> Onboarding Trend</h3>
                <div className="h-48 md:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.trend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{r: 3}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-4 md:p-6 rounded-xl border border-border/50">
                <h3 className="text-xs md:text-sm font-bold flex items-center gap-2 mb-4 md:mb-6"><BarChart3 size={16}/> Budget Received</h3>
                <div className="h-48 md:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.received} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" fontSize={9} tickFormatter={(v) => `৳${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(v)}`} />
                      <YAxis dataKey="name" type="category" fontSize={9} width={60} />
                      <Tooltip formatter={(v: number) => `৳${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(v)}`} />
                      <Legend wrapperStyle={{fontSize: '10px'}} />
                      <Bar name="Received" dataKey="received" stackId="a" fill="hsl(173, 80%, 36%)" />
                      <Bar name="Due" dataKey="due" stackId="a" fill="hsl(var(--destructive))" opacity={0.3} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
