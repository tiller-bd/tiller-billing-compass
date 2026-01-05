import { useState } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  FolderKanban 
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { ProjectDistributionChart } from '@/components/dashboard/ProjectDistributionChart';
import { BudgetComparisonChart } from '@/components/dashboard/BudgetComparisonChart';
import { UpcomingDeadlines } from '@/components/dashboard/UpcomingDeadlines';
import { LastReceived } from '@/components/dashboard/LastReceived';
import { ProjectTable } from '@/components/projects/ProjectTable';
import {
  mockProjects,
  calculateDashboardMetrics,
  getMonthlyRevenue,
  getProjectDistribution,
  getBudgetByProject,
} from '@/data/mockData';

const Index = () => {
  const [currentPath, setCurrentPath] = useState('/');
  
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

  return (
    <DashboardLayout
      title="Dashboard"
      currentPath={currentPath}
      onNavigate={setCurrentPath}
    >
      <div className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Budget"
            value={formatCurrency(metrics.totalBudget)}
            subtitle="All active projects"
            icon={Wallet}
            variant="primary"
            delay={0}
          />
          <MetricCard
            title="Total Received"
            value={formatCurrency(metrics.totalReceived)}
            subtitle="Payments collected"
            icon={TrendingUp}
            variant="success"
            trend={{ value: 12.5, isPositive: true }}
            delay={0.1}
          />
          <MetricCard
            title="Total Remaining"
            value={formatCurrency(metrics.totalRemaining)}
            subtitle="Outstanding amount"
            icon={TrendingDown}
            variant="warning"
            delay={0.15}
          />
          <MetricCard
            title="Active Projects"
            value={mockProjects.filter(p => p.status === 'ONGOING').length.toString()}
            subtitle={`${mockProjects.length} total projects`}
            icon={FolderKanban}
            delay={0.2}
          />
        </div>

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

        {/* Projects Table */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">All Projects</h2>
          <ProjectTable projects={mockProjects} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
