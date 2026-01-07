// Project tracking types for Tiller Consultancy

export type UserRole = 'SUPERADMIN' | 'USER';

export type ProjectStatus = 'FUTURE' | 'ONGOING' | 'COMPLETED';

export type ProjectCategory = 'SOFTWARE_DEV' | 'PLANNING_DEV';

export type ProjectType = 'FOREIGN' | 'DOMESTIC' | 'GOVERNMENT';

// Updated to include PARTIAL status from database triggers
export type BillStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  suspended: boolean;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  totalBudget: number;
  status: ProjectStatus;
  category: ProjectCategory;
  types: ProjectType[];
  signDate: Date;
  createdAt: Date;
  phases: Phase[];
  bills: Bill[];
}

export interface Phase {
  id: string;
  projectId: string;
  title: string;
  percentage: number;
  amount: number;
  tentativeDate: Date;
}

export interface Bill {
  id: string;
  projectId: string;
  phaseId?: string; // Made optional as some bills might not link to a specific phase
  amount: number; // Corresponds to bill_amount
  receivedAmount?: number; // Added: received_amount
  remainingAmount?: number; // Added: remaining_amount
  vat?: number; // Added: vat
  it?: number; // Added: it
  dueDate: Date; // Corresponds to tentative_billing_date
  receivedDate?: Date;
  status: BillStatus;
  createdAt: Date;
}

export interface DashboardMetrics {
  totalBudget: number;
  totalReceived: number;
  totalRemaining: number;
  lastReceived: {
    projectName: string;
    amount: number;
    date: Date;
  } | null;
  upcomingDeadlines: {
    projectName: string;
    amount: number;
    dueDate: Date;
  }[];
}