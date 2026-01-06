"use client";

import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, FolderKanban } from 'lucide-react';
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
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [revenue, setRevenue] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [budgetComparison, setBudgetComparison] = useState([]);
  const [lastReceived, setLastReceived] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const [currentPath, setCurrentPath] = useState('/');

  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [mRes, dRes, bcRes, lrRes, deadRes, pRes] = await Promise.all([
          fetch('/api/dashboard/metrics'),
          fetch('/api/dashboard/distribution'),
          fetch('/api/dashboard/budget-comparison'),
          fetch('/api/dashboard/last-received'),
          fetch('/api/dashboard/deadlines'),
          fetch('/api/dashboard/projects')
        ]);

        setMetrics(await mRes.json());
        setDistribution(await dRes.json());
        setBudgetComparison(await bcRes.json());
        setLastReceived(await lrRes.json());
        setDeadlines(await deadRes.json());
        setProjects(await pRes.json());
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);


  // Fetch Revenue when year changes
  useEffect(() => {
    fetch(`/api/dashboard/revenue?year=${selectedYear}`)
      .then(res => res.json())
      .then(setRevenue);
  }, [selectedYear]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  if (loading) return <div className="p-10 text-center font-medium">Loading Dashboard Data...</div>;
  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    router.push(path);
  };
  return (
    <DashboardLayout title="Dashboard" currentPath={currentPath} onNavigate={handleNavigate}>
      <div className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Budget"
            value={formatCurrency(metrics?.totalBudget || 0)}
            icon={Wallet}
            variant="primary"
          />
          <MetricCard
            title="Total Received"
            value={formatCurrency(metrics?.totalReceived || 0)}
            icon={TrendingUp}
            variant="success"
          />
          <MetricCard
            title="Total Remaining"
            value={formatCurrency(metrics?.totalRemaining || 0)}
            icon={TrendingDown}
            variant="warning"
          />
          <MetricCard
            title="Active Projects"
            value={metrics?.activeCount?.toString() || "0"}
            icon={FolderKanban}
          />
        </div>

        <Tabs defaultValue="charts" className="w-full">
          <TabsList className="glass-card mb-4">
            <TabsTrigger value="charts">Charts Overview</TabsTrigger>
            <TabsTrigger value="projects">All Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart with Year Filter */}
              <div className="relative">
                <div className="absolute top-4 right-6 z-10 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Year:</span>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="h-8 w-[100px] bg-background/50 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2023, 2024, 2025, 2026].map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <RevenueChart data={revenue} />
              </div>
              <BudgetComparisonChart data={budgetComparison} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ProjectDistributionChart data={distribution} />
              <LastReceived data={lastReceived} />
              <UpcomingDeadlines deadlines={deadlines} />
            </div>
          </TabsContent>

          <TabsContent value="projects">
            {/* Map Database fields to component expectations */}
            <ProjectTable projects={projects.map((p: any) => ({
              ...p,
              name: p.projectName,
              clientName: p.client?.name || 'Unknown',
              signDate: p.startDate,
              totalBudget: Number(p.totalProjectValue)
            }))} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}