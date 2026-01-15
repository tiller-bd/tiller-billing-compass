// src/app/billing/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BillingTable, BillingTableSkeleton } from '@/components/billing/BillingTable';
import { AddBillDialog } from '@/components/billing/AddBillDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ErrorDisplay } from '@/components/error/ErrorDisplay';
import { ApiClientError, apiFetch } from '@/lib/api-client';
import { useSharedFilters } from '@/contexts/FilterContext';

export default function BillingMasterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { debouncedSearch } = useSharedFilters();

  const [bills, setBills] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiClientError | null>(null);

  // Local state to control the creation dialog
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);

  // Filter State (search comes from header via shared context)
  const [status, setStatus] = useState('all');
  const [dept, setDept] = useState('all');
  const [project, setProject] = useState('all');
  const [year, setYear] = useState('all');

  // Detect ?new=true from Sidebar
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsAddBillOpen(true);
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
      if (year !== 'all') params.append('year', year);

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
  }, [debouncedSearch, status, dept, project, year]);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/departments'),
      apiFetch('/api/projects')
    ]).then(([depts, projs]) => {
      setDepartments(depts as any);
      setProjects(projs as any);
    }).catch(err => console.error("Failed to fetch filter data:", err));
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchBills, 400);
    return () => clearTimeout(timer);
  }, [fetchBills]);

  return (
    <DashboardLayout title="Billing" >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Billing & Collections</h1>
            <p className="text-muted-foreground text-sm font-medium">Global milestone tracking and revenue received.</p>
          </div>
          {/* New Button Layout: Refresh + New Bill Entry */}
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchBills} className="rounded-full">
              <RefreshCw className={cn(loading && "animate-spin")} size={16} />
            </Button>
            <AddBillDialog 
              open={isAddBillOpen} 
              setOpen={setIsAddBillOpen} 
              onBillAdded={fetchBills} 
            />
          </div>
        </div>

        {/* Filter Bar - Search is in header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 glass-card rounded-2xl border-border/50 shadow-sm">
          <Select value={project} onValueChange={setProject}>
            <SelectTrigger className="bg-secondary/30 border-none h-11 font-bold">
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
            <SelectTrigger className="bg-secondary/30 border-none h-11 font-bold">
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
            <SelectTrigger className="bg-secondary/30 border-none h-11 font-bold">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d: any) => (
                <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="bg-secondary/30 border-none h-11 font-bold">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {[2024, 2025, 2026].map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
    </DashboardLayout>
  );
}