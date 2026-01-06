import { Project, Bill, DashboardMetrics, User } from '@/types';
import { usersData } from './users';
import { projectsData } from './projects';

// Re-export mock data for backward compatibility
export const mockUsers: User[] = usersData;
export const mockProjects: Project[] = projectsData;

export function calculateDashboardMetrics(projects: Project[]): DashboardMetrics {
  const allBills = projects.flatMap(p => p.bills);
  const paidBills = allBills.filter(b => b.status === 'PAID');
  const pendingBills = allBills.filter(b => b.status === 'PENDING' || b.status === 'OVERDUE');

  const totalBudget = projects.reduce((sum, p) => sum + p.totalBudget, 0);
  const totalReceived = paidBills.reduce((sum, b) => sum + b.amount, 0);
  const totalRemaining = totalBudget - totalReceived;

  // Last received
  const sortedPaidBills = paidBills
    .filter(b => b.receivedDate)
    .sort((a, b) => new Date(b.receivedDate!).getTime() - new Date(a.receivedDate!).getTime());

  const lastReceivedBill = sortedPaidBills[0];
  const lastReceivedProject = lastReceivedBill
    ? projects.find(p => p.id === lastReceivedBill.projectId)
    : null;

  // Upcoming deadlines
  const upcomingDeadlines = pendingBills
    .filter(b => new Date(b.dueDate) > new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3)
    .map(b => ({
      projectName: projects.find(p => p.id === b.projectId)?.name || 'Unknown',
      amount: b.amount,
      dueDate: b.dueDate,
    }));

  return {
    totalBudget,
    totalReceived,
    totalRemaining,
    lastReceived: lastReceivedProject && lastReceivedBill
      ? {
          projectName: lastReceivedProject.name,
          amount: lastReceivedBill.amount,
          date: lastReceivedBill.receivedDate!,
        }
      : null,
    upcomingDeadlines,
  };
}

export function getMonthlyRevenue(projects: Project[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  
  const allBills = projects.flatMap(p => 
    p.bills.filter(b => b.status === 'PAID' && b.receivedDate)
  );

  return months.map((month, index) => {
    const received = allBills
      .filter(b => {
        const date = new Date(b.receivedDate!);
        return date.getMonth() === index && date.getFullYear() === currentYear;
      })
      .reduce((sum, b) => sum + b.amount, 0);

    return { month, received: received / 1000000 }; // In millions
  });
}

export function getProjectDistribution(projects: Project[]) {
  return [
    { name: 'Software Dev', value: projects.filter(p => p.category === 'SOFTWARE_DEV').length, color: 'hsl(173, 80%, 36%)' },
    { name: 'Planning Dev', value: projects.filter(p => p.category === 'PLANNING_DEV').length, color: 'hsl(190, 70%, 40%)' },
  ];
}

export function getBudgetByProject(projects: Project[]) {
  return projects.map(p => {
    const received = p.bills
      .filter(b => b.status === 'PAID')
      .reduce((sum, b) => sum + b.amount, 0);
    const remaining = p.totalBudget - received;

    return {
      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
      received: received / 1000000,
      remaining: remaining / 1000000,
    };
  });
}
