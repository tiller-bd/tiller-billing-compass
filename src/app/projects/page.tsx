// src/app/projects/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw, BarChart3, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProjectTable, ProjectTableSkeleton } from '@/components/projects/ProjectTable';
import { AddProjectDialog } from '@/components/projects/AddProjectDialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { ErrorDisplay } from '@/components/error/ErrorDisplay';
import { ApiClientError, apiFetch } from '@/lib/api-client';
import { useSharedFilters } from '@/contexts/FilterContext';

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
  const [yearFilter, setYearFilter] = useState('all');

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
      if (yearFilter !== 'all') params.append('year', yearFilter);

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
  }, [debouncedSearch, deptFilter, catFilter, statusFilter, yearFilter]);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/departments'),
      apiFetch('/api/categories')
    ]).then(([depts, cats]) => {
      setDepartments(depts as any);
      setCategories(cats as any);
    }).catch(err => console.error("Failed to fetch filters:", err));
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchProjects, 400);
    return () => clearTimeout(timer);
  }, [fetchProjects]);

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

  return (
    <DashboardLayout title="Projects" >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Project Management</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchProjects} disabled={loading}>
              <RefreshCw className={loading ? "animate-spin" : ""} size={16} />
            </Button>
            {/* Controlled AddProjectDialog */}
            <AddProjectDialog 
              open={isAddProjectOpen} 
              setOpen={setIsAddProjectOpen} 
              onProjectAdded={fetchProjects} 
            />
          </div>
        </div>

        {/* Filter Bar - Search is in header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 glass-card rounded-xl border border-border/50">
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d: any) => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ONGOING">Ongoing</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {[2024, 2025, 2026].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              <div className="glass-card p-6 rounded-xl border border-border/50">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-6"><TrendingUp size={16}/> Onboarding Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.trend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} dot={{r: 4}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl border border-border/50">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-6"><BarChart3 size={16}/> Budget Received (Actual Amounts)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.received} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" fontSize={10} tickFormatter={(v) => `৳${v.toLocaleString()}`} />
                      <YAxis dataKey="name" type="category" fontSize={10} width={80} />
                      <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
                      <Legend />
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