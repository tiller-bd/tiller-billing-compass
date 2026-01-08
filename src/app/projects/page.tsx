"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RefreshCw, BarChart3, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProjectTable, ProjectTableSkeleton } from '@/components/projects/ProjectTable';
import { AddProjectDialog } from '@/components/projects/AddProjectDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from 'recharts';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (deptFilter !== 'all') params.append('departmentId', deptFilter);
      if (catFilter !== 'all') params.append('categoryId', catFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (yearFilter !== 'all') params.append('year', yearFilter);

      const res = await fetch(`/api/projects?${params.toString()}`);
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, [search, deptFilter, catFilter, statusFilter, yearFilter]);

  useEffect(() => {
    Promise.all([
      fetch('/api/departments').then(res => res.json()),
      fetch('/api/categories').then(res => res.json())
    ]).then(([depts, cats]) => {
      setDepartments(depts);
      setCategories(cats);
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchProjects, 400);
    return () => clearTimeout(timer);
  }, [fetchProjects]);

  // Analytics Logic for Charts (Derived from filtered projects)
  const chartData = useMemo(() => {
    const realization = projects.slice(0, 10).map((p: any) => {
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

    return { realization, trend };
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
            <AddProjectDialog onProjectAdded={fetchProjects} />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 glass-card rounded-xl border border-border/50">
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/30" />
          </div>
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
        ) : (
          <>
            <ProjectTable
              projects={projects.map((p: any) => ({
                ...p,
                name: p.projectName,
                clientName: p.client?.name || 'Unknown',
                signDate: p.startDate,
                totalBudget: Number(p.totalProjectValue),
                status: p.bills.every((b: any) => b.status === 'PAID') ? 'COMPLETED' : 'ONGOING'
              }))}
              onProjectClick={(project: any) => router.push(`/projects/${project.id}`)}
            />

            {/* Charts Section Moved Below Table */}
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
                <h3 className="text-sm font-bold flex items-center gap-2 mb-6"><BarChart3 size={16}/> Budget Realization (Actual Amounts)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.realization} layout="vertical">
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