import { Project, Bill, DashboardMetrics, User } from '@/types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'CEO Admin',
    email: 'ceo@tiller.com.bd',
    role: 'SUPERADMIN',
    suspended: false,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Project Manager',
    email: 'pm@tiller.com.bd',
    role: 'USER',
    suspended: false,
    createdAt: new Date('2024-02-15'),
  },
  {
    id: '3',
    name: 'Finance Officer',
    email: 'finance@tiller.com.bd',
    role: 'USER',
    suspended: true,
    createdAt: new Date('2024-03-10'),
  },
];

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'E-Government Portal',
    clientName: 'Ministry of ICT',
    totalBudget: 15000000,
    status: 'ONGOING',
    category: 'SOFTWARE_DEV',
    types: ['GOVERNMENT', 'DOMESTIC'],
    signDate: new Date('2024-06-15'),
    createdAt: new Date('2024-06-15'),
    phases: [
      { id: 'p1-1', projectId: '1', title: 'Inception', percentage: 10, amount: 1500000, tentativeDate: new Date('2024-07-01') },
      { id: 'p1-2', projectId: '1', title: 'Deliverable 1', percentage: 25, amount: 3750000, tentativeDate: new Date('2024-09-01') },
      { id: 'p1-3', projectId: '1', title: 'Deliverable 2', percentage: 25, amount: 3750000, tentativeDate: new Date('2024-11-01') },
      { id: 'p1-4', projectId: '1', title: 'Final Handover', percentage: 40, amount: 6000000, tentativeDate: new Date('2025-02-01') },
    ],
    bills: [
      { id: 'b1-1', projectId: '1', phaseId: 'p1-1', amount: 1500000, dueDate: new Date('2024-07-15'), receivedDate: new Date('2024-07-20'), status: 'PAID', createdAt: new Date('2024-07-01') },
      { id: 'b1-2', projectId: '1', phaseId: 'p1-2', amount: 3750000, dueDate: new Date('2024-09-15'), receivedDate: new Date('2024-09-25'), status: 'PAID', createdAt: new Date('2024-09-01') },
      { id: 'b1-3', projectId: '1', phaseId: 'p1-3', amount: 3750000, dueDate: new Date('2025-01-15'), status: 'PENDING', createdAt: new Date('2024-11-01') },
    ],
  },
  {
    id: '2',
    name: 'Smart City Infrastructure',
    clientName: 'Dhaka North City Corp',
    totalBudget: 25000000,
    status: 'ONGOING',
    category: 'PLANNING_DEV',
    types: ['GOVERNMENT', 'DOMESTIC'],
    signDate: new Date('2024-03-20'),
    createdAt: new Date('2024-03-20'),
    phases: [
      { id: 'p2-1', projectId: '2', title: 'Inception', percentage: 15, amount: 3750000, tentativeDate: new Date('2024-04-15') },
      { id: 'p2-2', projectId: '2', title: 'Phase 1', percentage: 30, amount: 7500000, tentativeDate: new Date('2024-08-01') },
      { id: 'p2-3', projectId: '2', title: 'Phase 2', percentage: 30, amount: 7500000, tentativeDate: new Date('2024-12-01') },
      { id: 'p2-4', projectId: '2', title: 'Final Handover', percentage: 25, amount: 6250000, tentativeDate: new Date('2025-04-01') },
    ],
    bills: [
      { id: 'b2-1', projectId: '2', phaseId: 'p2-1', amount: 3750000, dueDate: new Date('2024-04-30'), receivedDate: new Date('2024-05-10'), status: 'PAID', createdAt: new Date('2024-04-15') },
      { id: 'b2-2', projectId: '2', phaseId: 'p2-2', amount: 7500000, dueDate: new Date('2024-08-15'), receivedDate: new Date('2024-08-20'), status: 'PAID', createdAt: new Date('2024-08-01') },
      { id: 'b2-3', projectId: '2', phaseId: 'p2-3', amount: 7500000, dueDate: new Date('2025-01-10'), status: 'PENDING', createdAt: new Date('2024-12-01') },
    ],
  },
  {
    id: '3',
    name: 'Export Management System',
    clientName: 'Bangladesh Trade Corp',
    totalBudget: 8500000,
    status: 'COMPLETED',
    category: 'SOFTWARE_DEV',
    types: ['FOREIGN', 'GOVERNMENT'],
    signDate: new Date('2023-09-01'),
    createdAt: new Date('2023-09-01'),
    phases: [
      { id: 'p3-1', projectId: '3', title: 'Inception', percentage: 20, amount: 1700000, tentativeDate: new Date('2023-10-01') },
      { id: 'p3-2', projectId: '3', title: 'Development', percentage: 50, amount: 4250000, tentativeDate: new Date('2024-02-01') },
      { id: 'p3-3', projectId: '3', title: 'Final Handover', percentage: 30, amount: 2550000, tentativeDate: new Date('2024-05-01') },
    ],
    bills: [
      { id: 'b3-1', projectId: '3', phaseId: 'p3-1', amount: 1700000, dueDate: new Date('2023-10-15'), receivedDate: new Date('2023-10-20'), status: 'PAID', createdAt: new Date('2023-10-01') },
      { id: 'b3-2', projectId: '3', phaseId: 'p3-2', amount: 4250000, dueDate: new Date('2024-02-15'), receivedDate: new Date('2024-02-25'), status: 'PAID', createdAt: new Date('2024-02-01') },
      { id: 'b3-3', projectId: '3', phaseId: 'p3-3', amount: 2550000, dueDate: new Date('2024-05-15'), receivedDate: new Date('2024-05-20'), status: 'PAID', createdAt: new Date('2024-05-01') },
    ],
  },
  {
    id: '4',
    name: 'Digital Banking Platform',
    clientName: 'First National Bank',
    totalBudget: 35000000,
    status: 'FUTURE',
    category: 'SOFTWARE_DEV',
    types: ['DOMESTIC'],
    signDate: new Date('2025-02-01'),
    createdAt: new Date('2024-12-15'),
    phases: [
      { id: 'p4-1', projectId: '4', title: 'Inception', percentage: 10, amount: 3500000, tentativeDate: new Date('2025-03-01') },
      { id: 'p4-2', projectId: '4', title: 'Core Development', percentage: 40, amount: 14000000, tentativeDate: new Date('2025-08-01') },
      { id: 'p4-3', projectId: '4', title: 'Integration', percentage: 25, amount: 8750000, tentativeDate: new Date('2025-12-01') },
      { id: 'p4-4', projectId: '4', title: 'Final Handover', percentage: 25, amount: 8750000, tentativeDate: new Date('2026-03-01') },
    ],
    bills: [],
  },
  {
    id: '5',
    name: 'Agricultural Data System',
    clientName: 'FAO Bangladesh',
    totalBudget: 12000000,
    status: 'ONGOING',
    category: 'SOFTWARE_DEV',
    types: ['FOREIGN'],
    signDate: new Date('2024-08-10'),
    createdAt: new Date('2024-08-10'),
    phases: [
      { id: 'p5-1', projectId: '5', title: 'Inception', percentage: 15, amount: 1800000, tentativeDate: new Date('2024-09-01') },
      { id: 'p5-2', projectId: '5', title: 'Development', percentage: 45, amount: 5400000, tentativeDate: new Date('2025-02-01') },
      { id: 'p5-3', projectId: '5', title: 'Final Handover', percentage: 40, amount: 4800000, tentativeDate: new Date('2025-06-01') },
    ],
    bills: [
      { id: 'b5-1', projectId: '5', phaseId: 'p5-1', amount: 1800000, dueDate: new Date('2024-09-15'), receivedDate: new Date('2024-09-20'), status: 'PAID', createdAt: new Date('2024-09-01') },
      { id: 'b5-2', projectId: '5', phaseId: 'p5-2', amount: 5400000, dueDate: new Date('2025-02-15'), status: 'PENDING', createdAt: new Date('2025-01-01') },
    ],
  },
];

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
