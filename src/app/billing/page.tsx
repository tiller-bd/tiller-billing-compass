"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BillingTable, BillingTableSkeleton } from '@/components/billing/BillingTable';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function BillingMasterPage() {
  const router = useRouter();
  const [bills, setBills] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dept, setDept] = useState('all');
  const [year, setYear] = useState('all');

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status !== 'all') params.append('status', status);
      if (dept !== 'all') params.append('departmentId', dept);
      if (year !== 'all') params.append('year', year);

      const res = await fetch(`/api/bills?${params.toString()}`);
      const data = await res.json();
      setBills(data);
    } catch (error) {
      console.error("Failed to fetch bills:", error);
    } finally {
      setLoading(false);
    }
  }, [search, status, dept, year]);

  useEffect(() => {
    fetch('/api/departments').then(res => res.json()).then(setDepartments);
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchBills, 400);
    return () => clearTimeout(timer);
  }, [fetchBills]);

  return (
    <DashboardLayout title="Billing" currentPath="/billing" onNavigate={(p) => router.push(p)}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Billing & Collections</h1>
            <p className="text-muted-foreground text-sm font-medium">Global milestone tracking and revenue realization.</p>
          </div>
          <Button variant="outline" size="icon" onClick={fetchBills} className="rounded-full">
            <RefreshCw className={cn(loading && "animate-spin")} size={16} />
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 glass-card rounded-2xl border-border/50 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search milestone or project..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-9 bg-secondary/30 border-none h-11 font-medium" 
            />
          </div>
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