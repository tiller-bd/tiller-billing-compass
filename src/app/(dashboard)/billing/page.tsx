// src/app/billing/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw, Plus } from 'lucide-react';
import { BillingTable, BillingTableSkeleton } from '@/components/billing/BillingTable';
import { AddBillDialog } from '@/components/billing/AddBillDialog';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ErrorDisplay } from '@/components/error/ErrorDisplay';
import { ApiClientError, apiFetch } from '@/lib/api-client';
import { useSharedFilters } from '@/contexts/FilterContext';
import { getCalendarYearOptions, getFiscalYearOptions, getCurrentFiscalYear, YearType } from '@/lib/date-utils';

export default function BillingMasterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { debouncedSearch } = useSharedFilters();

  const [bills, setBills] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiClientError | null>(null);
  const [metricsRefreshTrigger, setMetricsRefreshTrigger] = useState(0);

  // Local state to control the creation dialog
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);

  // Filter State (search comes from header via shared context)
  const [status, setStatus] = useState('all');
  const [dept, setDept] = useState('all');
  const [project, setProject] = useState('all');
  // Default to fiscal year (prioritized)
  const [yearType, setYearType] = useState<YearType | 'all'>('all');
  const [year, setYear] = useState('all');

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
      setYear('all');
    } else if (newType === 'fiscal') {
      setYear(getCurrentFiscalYear());
    } else {
      setYear(new Date().getFullYear().toString());
    }
  };

  // Construct year parameter for API
  const getYearParam = (): string => {
    if (yearType === 'all' || year === 'all') return 'all';
    return yearType === 'fiscal' ? `fy-${year}` : `cal-${year}`;
  };

  // Detect ?new=true from Sidebar, then clear the param
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsAddBillOpen(true);
      window.history.replaceState(null, '', '/billing');
    }
  }, [searchParams]);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (status !== 'all') params.append('status', status);
      if (dept !== 'all') params.append('departmentId', dept);
      if (project !== 'all') params.append('projectId', project);
      const yearParam = getYearParam();
      if (yearParam !== 'all') params.append('year', yearParam);

      const data = await apiFetch(`/api/bills?${params.toString()}`);
      setBills(data as any);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err);
      }
      console.error("Failed to fetch bills:", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, dept, project, yearType, year]);

  // Fetch filter options when year changes
  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        const yearParam = getYearParam();
        const yearQuery = yearParam !== 'all' ? `?year=${yearParam}` : '';

        const [depts, projs] = await Promise.all([
          apiFetch(`/api/departments${yearQuery}`),
          apiFetch(`/api/projects${yearQuery}`)
        ]);

        const newDepartments = depts as any[];
        const newProjects = projs as any[];

        setDepartments(newDepartments);
        setProjects(newProjects);

        // Reset selections if current value is no longer available
        if (dept !== 'all' && !newDepartments.some((d: any) => d.id.toString() === dept)) {
          setDept('all');
        }
        if (project !== 'all' && !newProjects.some((p: any) => p.id.toString() === project)) {
          setProject('all');
        }
      } catch (err) {
        console.error("Failed to fetch filter data:", err);
      }
    }
    fetchFilterOptions();
  }, [yearType, year]);

  useEffect(() => {
    const timer = setTimeout(fetchBills, 400);
    return () => clearTimeout(timer);
  }, [fetchBills]);

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(amount));
    return `৳${formatted}`;
  };

  return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex justify-between items-center gap-2">
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-black tracking-tight uppercase truncate">Billing & Collections</h1>
            <p className="text-muted-foreground text-xs md:text-sm font-medium hidden sm:block">Global milestone tracking and revenue received.</p>
          </div>
          {/* New Button Layout: Refresh + New Bill Entry */}
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="icon" onClick={() => { fetchBills(); setMetricsRefreshTrigger(t => t + 1); }} className="rounded-full h-9 w-9">
              <RefreshCw className={cn(loading && "animate-spin")} size={16} />
            </Button>
            <Button variant="default" size="sm" className="h-9 gap-2 font-bold uppercase tracking-tight shadow-md" onClick={() => setIsAddBillOpen(true)}>
              <Plus size={16} /> New Bill Entry
            </Button>
            <AddBillDialog
              open={isAddBillOpen}
              setOpen={setIsAddBillOpen}
              onBillAdded={fetchBills}
            />
          </div>
        </div>

        {/* Summary Metrics */}
        <DashboardMetrics
          departmentId={dept}
          status={status}
          yearParam={getYearParam()}
          variant="billing"
          billCount={bills.length}
          refreshTrigger={metricsRefreshTrigger}
        />

        {/* Filter Bar - Scrollable on mobile */}
        <div className="glass-card rounded-2xl border-border/50 shadow-sm p-3 md:p-4 overflow-x-auto">
          <div className="flex md:grid md:grid-cols-5 gap-2 md:gap-3 min-w-max md:min-w-0">
            <Select value={project} onValueChange={setProject}>
              <SelectTrigger className="bg-secondary/30 border-none h-10 md:h-11 font-bold w-32 md:w-full text-xs md:text-sm">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p: any) => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.projectName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-secondary/30 border-none h-10 md:h-11 font-bold w-28 md:w-full text-xs md:text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger className="bg-secondary/30 border-none h-10 md:h-11 font-bold w-32 md:w-full text-xs md:text-sm">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d: any) => (
                  <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Year Type Selector - Fiscal prioritized */}
            <Select value={yearType} onValueChange={(v) => handleYearTypeChange(v as YearType | 'all')}>
              <SelectTrigger className="bg-secondary/30 border-none h-10 md:h-11 font-bold w-24 md:w-full text-xs md:text-sm">
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
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="bg-secondary/30 border-none h-10 md:h-11 font-bold w-24 md:w-full text-xs md:text-sm">
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
          <BillingTableSkeleton />
        ) : error ? (
          <ErrorDisplay
            error={error}
            code={error.code}
            message={error.message}
            onRetry={fetchBills}
          />
        ) : (
          <BillingTable
            bills={bills}
            onRefresh={fetchBills}
            onProjectNavigate={(id: string) => router.push(`/projects/${id}`)}
          />
        )}
      </div>
  );
}
