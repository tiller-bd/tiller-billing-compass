"use client";

import { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, FolderKanban } from 'lucide-react';
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
import {
  mockProjects,
  calculateDashboardMetrics,
  getMonthlyRevenue,
  getProjectDistribution,
  getBudgetByProject,
} from '@/data/mockData';

export default function Index() {
  const [currentPath, setCurrentPath] = useState('/');
  const router = useRouter();

  const metrics = calculateDashboardMetrics(mockProjects);
  const monthlyRevenue = getMonthlyRevenue(mockProjects);
  const projectDistribution = getProjectDistribution(mockProjects);
  const budgetByProject = getBudgetByProject(mockProjects);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    router.push(path);
  };

  return (
    <DashboardLayout title="Dashboard" currentPath={currentPath} onNavigate={handleNavigate}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total Budget" value={formatCurrency(metrics.totalBudget)} icon={Wallet} variant="primary" delay={0} />
          <MetricCard title="Total Received" value={formatCurrency(metrics.totalReceived)} icon={TrendingUp} variant="success" delay={0.1} />
          <MetricCard title="Total Remaining" value={formatCurrency(metrics.totalRemaining)} icon={TrendingDown} variant="warning" delay={0.15} />
          <MetricCard title="Active Projects" value={mockProjects.filter(p => p.status === 'ONGOING').length.toString()} icon={FolderKanban} delay={0.2} />
        </div>

        <Tabs defaultValue="charts" className="w-full">
          <TabsList className="glass-card mb-4">
            <TabsTrigger value="charts">Charts Overview</TabsTrigger>
            <TabsTrigger value="projects">All Projects</TabsTrigger>
          </TabsList>
          <TabsContent value="charts" className="space-y-6">
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart data={monthlyRevenue} />
              <BudgetComparisonChart data={budgetByProject} />
            </div>

            {/* Secondary Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ProjectDistributionChart data={projectDistribution} />
              <LastReceived data={metrics.lastReceived} />
              <UpcomingDeadlines deadlines={metrics.upcomingDeadlines} />
            </div>
          </TabsContent>
          <TabsContent value="projects">
            <ProjectTable projects={mockProjects} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}