"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Clock, CircleDollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChangeStatusDialogProps {
  project: any;
  onSuccess: () => void;
}

type ProjectStatus = 'ONGOING' | 'COMPLETED' | 'OUTSTANDING';

export function ChangeStatusDialog({ project, onSuccess }: ChangeStatusDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>(project.status || 'ONGOING');

  const currentStatus = project.status || 'ONGOING';
  const bills = project.bills || [];

  // Calculate pending amounts
  const pendingBills = bills.filter((b: any) => b.status === 'PENDING');
  const partialBills = bills.filter((b: any) => b.status === 'PARTIAL');
  const unpaidBills = [...pendingBills, ...partialBills];

  const totalPending = pendingBills.reduce((sum: number, b: any) => sum + Number(b.billAmount || 0), 0);
  const totalPartialRemaining = partialBills.reduce((sum: number, b: any) => {
    const billAmount = Number(b.billAmount || 0);
    const received = Number(b.receivedAmount || 0);
    return sum + (billAmount - received);
  }, 0);
  const totalOutstanding = totalPending + totalPartialRemaining;

  const hasUnpaidBills = unpaidBills.length > 0;

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(amount));
    return `${formatted}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { label: 'Completed', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle2 };
      case 'OUTSTANDING':
        return { label: 'Outstanding', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: CircleDollarSign };
      case 'ONGOING':
      default:
        return { label: 'Ongoing', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Clock };
    }
  };

  const handleStatusChange = async () => {
    if (selectedStatus === currentStatus) {
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status');
      }

      toast.success(`Project status changed to ${getStatusBadge(selectedStatus).label}`);
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = getStatusBadge(currentStatus).icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2 font-bold border", getStatusBadge(currentStatus).color)}>
          <StatusIcon size={14} />
          {getStatusBadge(currentStatus).label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-black">Change Project Status</DialogTitle>
          <DialogDescription>
            Update the status of "{project.projectName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <span className="text-sm text-muted-foreground">Current Status:</span>
            <Badge variant="outline" className={cn("font-bold", getStatusBadge(currentStatus).color)}>
              {getStatusBadge(currentStatus).label}
            </Badge>
          </div>

          {/* New Status Selector */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">New Status</label>
            <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as ProjectStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ONGOING">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-blue-600" />
                    <span>Ongoing</span>
                  </div>
                </SelectItem>
                <SelectItem value="COMPLETED">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-600" />
                    <span>Completed</span>
                  </div>
                </SelectItem>
                <SelectItem value="OUTSTANDING">
                  <div className="flex items-center gap-2">
                    <CircleDollarSign size={14} className="text-amber-600" />
                    <span>Outstanding</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Warning for unpaid bills */}
          {hasUnpaidBills && (selectedStatus === 'COMPLETED' || selectedStatus === 'OUTSTANDING') && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-700 dark:text-amber-500">Outstanding Payments</p>
                  <p className="text-sm text-amber-600/80 dark:text-amber-400/80">
                    This project has unpaid bills. Please review before changing status.
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {pendingBills.length > 0 && (
                  <div className="flex justify-between items-center p-2 bg-amber-500/10 rounded">
                    <span className="text-amber-700 dark:text-amber-400">
                      Pending Bills ({pendingBills.length})
                    </span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">
                      {formatCurrency(totalPending)}
                    </span>
                  </div>
                )}
                {partialBills.length > 0 && (
                  <div className="flex justify-between items-center p-2 bg-amber-500/10 rounded">
                    <span className="text-amber-700 dark:text-amber-400">
                      Partial Remaining ({partialBills.length})
                    </span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">
                      {formatCurrency(totalPartialRemaining)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center p-2 bg-amber-600/20 rounded font-bold">
                  <span className="text-amber-800 dark:text-amber-300">Total Outstanding</span>
                  <span className="text-amber-800 dark:text-amber-300">{formatCurrency(totalOutstanding)}</span>
                </div>
              </div>

              {selectedStatus === 'COMPLETED' && (
                <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                  Consider marking as "Outstanding" instead if bills are still unpaid.
                </p>
              )}
            </div>
          )}

          {/* Success message when all bills paid */}
          {!hasUnpaidBills && selectedStatus === 'COMPLETED' && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-700 dark:text-green-400">
                  All bills are fully paid. Project can be marked as completed.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleStatusChange}
            disabled={loading || selectedStatus === currentStatus}
            className={cn(
              selectedStatus === 'COMPLETED' && hasUnpaidBills && "bg-amber-600 hover:bg-amber-700"
            )}
          >
            {loading ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
