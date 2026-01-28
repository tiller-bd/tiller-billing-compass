/**
 * Project status utility functions
 *
 * Computes "effective" status based on multiple conditions:
 * - COMPLETED: status === 'COMPLETED' OR all bills are PAID
 * - ONGOING: endDate > today OR status === 'ONGOING'
 * - PENDING_PAYMENT: status === 'PENDING_PAYMENT' OR (endDate passed but payments remaining) OR (status === 'COMPLETED' but has unpaid bills)
 */

export type EffectiveStatus = 'ONGOING' | 'COMPLETED' | 'PENDING_PAYMENT';

interface ProjectBill {
  status?: string | null;
  billAmount?: number | any;
  receivedAmount?: number | any;
}

interface ProjectWithBills {
  id: number;
  status?: string | null;
  endDate?: Date | string | null;
  bills?: ProjectBill[];
  [key: string]: any;
}

/**
 * Computes the effective status of a project based on multiple conditions
 */
export function getEffectiveStatus(project: ProjectWithBills): EffectiveStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = project.endDate ? new Date(project.endDate) : null;
  if (endDate) endDate.setHours(0, 0, 0, 0);

  const bills = project.bills || [];
  const hasBills = bills.length > 0;

  // Check if all bills are paid
  const allBillsPaid = hasBills && bills.every(bill => bill.status === 'PAID');

  // Check if there are any unpaid/partial bills
  const hasUnpaidBills = hasBills && bills.some(bill =>
    bill.status === 'PENDING' || bill.status === 'PARTIAL'
  );

  // Check if end date has passed
  const endDatePassed = endDate && endDate < today;

  // COMPLETED: status is COMPLETED or all bills are paid
  if (project.status === 'COMPLETED' && !hasUnpaidBills) {
    return 'COMPLETED';
  }
  if (allBillsPaid) {
    return 'COMPLETED';
  }

  // PENDING_PAYMENT: status is PENDING_PAYMENT, or end date passed with remaining payments,
  // or status is COMPLETED but has unpaid bills
  if (project.status === 'PENDING_PAYMENT') {
    return 'PENDING_PAYMENT';
  }
  if (project.status === 'COMPLETED' && hasUnpaidBills) {
    return 'PENDING_PAYMENT';
  }
  if (endDatePassed && hasUnpaidBills) {
    return 'PENDING_PAYMENT';
  }

  // ONGOING: end date hasn't come or status is ONGOING (default)
  return 'ONGOING';
}

/**
 * Filters projects by effective status
 */
export function filterProjectsByEffectiveStatus<T extends ProjectWithBills>(
  projects: T[],
  status: string
): T[] {
  if (!status || status === 'all') {
    return projects;
  }

  return projects.filter(project => getEffectiveStatus(project) === status);
}

/**
 * Adds effectiveStatus field to each project
 */
export function addEffectiveStatus<T extends ProjectWithBills>(
  projects: T[]
): (T & { effectiveStatus: EffectiveStatus })[] {
  return projects.map(project => ({
    ...project,
    effectiveStatus: getEffectiveStatus(project),
  }));
}
