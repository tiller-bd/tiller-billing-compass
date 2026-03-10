"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Clock, CircleDollarSign, CheckCheck, Info } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PROJECT_STATUSES, ProjectStatus, canSetOutstanding } from '@/lib/project-status';

interface ChangeStatusDialogProps {
  project: any;
  onSuccess: () => void;
}

// ── Shared status display config ──────────────────────────────────────────
export const STATUS_CONFIG: Record<ProjectStatus, {
  label: string;
  color: string;
  icon: typeof Clock;
}> = {
  ONGOING: {
    label: 'Ongoing',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    icon: Clock,
  },
  EXPENSE_COMPLETE: {
    label: 'Expense Complete',
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    icon: CheckCheck,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-green-500/10 text-green-600 border-green-500/20',
    icon: CheckCircle2,
  },
  OUTSTANDING: {
    label: 'Outstanding',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    icon: CircleDollarSign,
  },
};

export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status as ProjectStatus] ?? STATUS_CONFIG.ONGOING;
}

export function ChangeStatusDialog({ project, onSuccess }: ChangeStatusDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentStatus: ProjectStatus = (PROJECT_STATUSES as readonly string[]).includes(project.status)
    ? project.status as ProjectStatus
    : 'ONGOING';

  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>(currentStatus);

  const bills = project.bills ?? [];
  const pendingBills  = bills.filter((b: any) => b.status === 'PENDING');
  const partialBills  = bills.filter((b: any) => b.status === 'PARTIAL');
  const unpaidBills   = [...pendingBills, ...partialBills];
  const hasUnpaidBills = unpaidBills.length > 0;

  const totalPending = pendingBills.reduce((s: number, b: any) => s + Number(b.billAmount ?? 0), 0);
  const totalPartialRemaining = partialBills.reduce((s: number, b: any) =>
    s + (Number(b.billAmount ?? 0) - Number(b.receivedAmount ?? 0)), 0);
  const totalOutstanding = totalPending + totalPartialRemaining;

  // Can OUTSTANDING be selected?
  const outstandingAllowed = canSetOutstanding(project);

  const fmt = (v: number) =>
    `৳${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(v))}`;

  const handleStatusChange = async () => {
    if (selectedStatus === currentStatus) { setOpen(false); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update status');
      }

      toast.success(`Status changed to ${getStatusConfig(selectedStatus).label}`);
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const cfg = getStatusConfig(currentStatus);
  const StatusIcon = cfg.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2 font-bold border", cfg.color)}>
          <StatusIcon size={14} />
          {cfg.label}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-black">Change Project Status</DialogTitle>
          <DialogDescription>Update the status of "{project.projectName}"</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current status */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <span className="text-sm text-muted-foreground">Current Status:</span>
            <Badge variant="outline" className={cn("font-bold", cfg.color)}>{cfg.label}</Badge>
          </div>

          {/* New status selector */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">New Status</label>
            <Select value={selectedStatus} onValueChange={v => setSelectedStatus(v as ProjectStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map(s => {
                  const c = STATUS_CONFIG[s];
                  const Icon = c.icon;
                  const isDisabled = s === 'OUTSTANDING' && !outstandingAllowed;
                  return (
                    <SelectItem key={s} value={s} disabled={isDisabled}>
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={isDisabled ? 'text-muted-foreground' : ''} />
                        <span className={isDisabled ? 'text-muted-foreground' : ''}>{c.label}</span>
                        {isDisabled && (
                          <span className="text-[10px] text-muted-foreground ml-1">(conditions not met)</span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* OUTSTANDING conditions notice */}
          {selectedStatus !== 'OUTSTANDING' && !outstandingAllowed && (
            <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <p>
                <span className="font-semibold">Outstanding</span> requires: all tentative billing dates
                passed &amp; at least one unpaid bill.
              </p>
            </div>
          )}

          {/* Warning: unpaid bills when setting COMPLETED or EXPENSE_COMPLETE */}
          {hasUnpaidBills && (selectedStatus === 'COMPLETED' || selectedStatus === 'EXPENSE_COMPLETE') && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-700 dark:text-amber-500">Outstanding Payments</p>
                  <p className="text-sm text-amber-600/80">This project has unpaid bills.</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {pendingBills.length > 0 && (
                  <div className="flex justify-between p-2 bg-amber-500/10 rounded">
                    <span className="text-amber-700 dark:text-amber-400">Pending ({pendingBills.length})</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">{fmt(totalPending)}</span>
                  </div>
                )}
                {partialBills.length > 0 && (
                  <div className="flex justify-between p-2 bg-amber-500/10 rounded">
                    <span className="text-amber-700 dark:text-amber-400">Partial Remaining ({partialBills.length})</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">{fmt(totalPartialRemaining)}</span>
                  </div>
                )}
                <div className="flex justify-between p-2 bg-amber-600/20 rounded font-bold">
                  <span className="text-amber-800 dark:text-amber-300">Total</span>
                  <span className="text-amber-800 dark:text-amber-300">{fmt(totalOutstanding)}</span>
                </div>
              </div>
            </div>
          )}

          {/* All clear for COMPLETED */}
          {!hasUnpaidBills && selectedStatus === 'COMPLETED' && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-700 dark:text-green-400">
                All bills are fully paid. Ready to mark as Completed.
              </p>
            </div>
          )}

          {/* EXPENSE_COMPLETE info */}
          {selectedStatus === 'EXPENSE_COMPLETE' && (
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-start gap-2 text-xs text-purple-700 dark:text-purple-400">
              <CheckCheck className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <p>Marks project expenses as complete while the project continues running.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleStatusChange}
            disabled={loading || selectedStatus === currentStatus || (selectedStatus === 'OUTSTANDING' && !outstandingAllowed)}
            className={cn(
              selectedStatus === 'COMPLETED' && hasUnpaidBills && "bg-amber-600 hover:bg-amber-700"
            )}
          >
            {loading ? 'Updating…' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
