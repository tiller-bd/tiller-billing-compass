/**
 * Project status — single source of truth.
 *
 * ONGOING          – default; not marked complete, has unpaid bills
 * EXPENSE_COMPLETE – manually set; expenses done, project still running
 * COMPLETED        – manually marked OR all bills paid
 * OUTSTANDING      – manually marked when: all tentative dates passed + ≥1 unpaid bill
 */

// ── Immutable list used for validation everywhere ──────────────────────────
export const PROJECT_STATUSES = ['ONGOING', 'EXPENSE_COMPLETE', 'COMPLETED', 'OUTSTANDING'] as const;
export type ProjectStatus = typeof PROJECT_STATUSES[number];

// Filter context adds 'all'
export type ProjectStatusFilter = 'all' | ProjectStatus;

// ── Effective (derived) status ─────────────────────────────────────────────
export type EffectiveStatus = ProjectStatus;

interface ProjectBill {
  status?: string | null;
  billAmount?: number | any;
  receivedAmount?: number | any;
  tentativeBillingDate?: Date | string | null;
}

interface ProjectWithBills {
  id: number;
  status?: string | null;
  endDate?: Date | string | null;
  bills?: ProjectBill[];
  [key: string]: any;
}

/**
 * Computes effective status from stored status + bill state.
 * Never writes to DB — display/filter only.
 */
export function getEffectiveStatus(project: ProjectWithBills): EffectiveStatus {
  const bills = project.bills ?? [];
  const allBillsPaid  = bills.length > 0 && bills.every(b => b.status === 'PAID');
  const hasUnpaidBills = bills.some(b => b.status === 'PENDING' || b.status === 'PARTIAL');

  // COMPLETED: all bills paid, or explicitly set with no remaining unpaid
  if (allBillsPaid || (project.status === 'COMPLETED' && !hasUnpaidBills)) {
    return 'COMPLETED';
  }

  // EXPENSE_COMPLETE: manual pass-through
  if (project.status === 'EXPENSE_COMPLETE') {
    return 'EXPENSE_COMPLETE';
  }

  // OUTSTANDING: explicitly set, or was marked COMPLETED but unpaid bills exist
  if (project.status === 'OUTSTANDING' || (project.status === 'COMPLETED' && hasUnpaidBills)) {
    return 'OUTSTANDING';
  }

  // ONGOING: default
  return 'ONGOING';
}

/**
 * Returns true when OUTSTANDING can legitimately be set on a project:
 *   – All bills that have a tentative date have that date ≤ today
 *   – At least one bill is still unpaid (PENDING or PARTIAL)
 */
export function canSetOutstanding(project: ProjectWithBills): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bills = project.bills ?? [];
  const hasUnpaid = bills.some(b => b.status === 'PENDING' || b.status === 'PARTIAL');
  if (!hasUnpaid) return false;

  const allTentativePassed = bills
    .filter(b => b.tentativeBillingDate != null)
    .every(b => {
      const d = new Date(b.tentativeBillingDate as string);
      d.setHours(0, 0, 0, 0);
      return d <= today;
    });

  return allTentativePassed;
}

/**
 * Filters projects by effective status.
 */
export function filterProjectsByEffectiveStatus<T extends ProjectWithBills>(
  projects: T[],
  status: string
): T[] {
  if (!status || status === 'all') return projects;
  return projects.filter(p => getEffectiveStatus(p) === status);
}

/**
 * Adds computed effectiveStatus field to each project for frontend display.
 */
export function addEffectiveStatus<T extends ProjectWithBills>(
  projects: T[]
): (T & { effectiveStatus: EffectiveStatus })[] {
  return projects.map(p => ({ ...p, effectiveStatus: getEffectiveStatus(p) }));
}
