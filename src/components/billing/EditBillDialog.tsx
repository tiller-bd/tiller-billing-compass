// src/components/billing/EditBillDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProjectBill {
  id: number;
  projectId: number;
  slNo?: string | null;
  billName?: string | null;
  billPercent?: number | null;
  billAmount: number;
  tentativeBillingDate?: Date | string | null;
  receivedPercent?: number | null;
  receivedAmount?: number | null;
  receivedDate?: Date | string | null;
  remainingAmount?: number | null;
  vat?: number | null;
  it?: number | null;
  status?: string | null;
}

interface EditBillDialogProps {
  bill: ProjectBill;
  totalProjectValue: number;
  onSuccess: () => void;
  triggerButton?: React.ReactNode;
}

interface BillFormData {
  billName: string;
  billPercent: string;
  billAmount: string;
  tentativeBillingDate: string;
  status: string;
}

export function EditBillDialog({ bill, totalProjectValue, onSuccess, triggerButton }: EditBillDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<BillFormData | null>(null);

  const formatDateForInput = (dateStr: Date | string | null | undefined) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toISOString().split("T")[0];
  };

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<BillFormData>({
    defaultValues: {
      billName: bill.billName || "",
      billPercent: String(bill.billPercent || 0),
      billAmount: String(bill.billAmount || 0),
      tentativeBillingDate: formatDateForInput(bill.tentativeBillingDate),
      status: bill.status || "PENDING",
    },
  });

  // Reset form when bill changes or dialog opens
  useEffect(() => {
    if (open) {
      reset({
        billName: bill.billName || "",
        billPercent: String(bill.billPercent || 0),
        billAmount: String(bill.billAmount || 0),
        tentativeBillingDate: formatDateForInput(bill.tentativeBillingDate),
        status: bill.status || "PENDING",
      });
    }
  }, [open, bill, reset]);

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(amount));
    return `৳${formatted}`;
  };

  // Handle percent change - calculate amount
  const handlePercentChange = (percentStr: string) => {
    const percent = Number(percentStr || 0);
    setValue("billPercent", percentStr);
    if (totalProjectValue > 0) {
      const amount = Math.round((percent / 100) * totalProjectValue);
      setValue("billAmount", String(amount));
    }
  };

  // Handle amount change - calculate percent
  const handleAmountChange = (amountStr: string) => {
    const amount = Number(amountStr || 0);
    setValue("billAmount", amountStr);
    if (totalProjectValue > 0) {
      const percent = ((amount / totalProjectValue) * 100).toFixed(2);
      setValue("billPercent", percent);
    }
  };

  const onSubmit = (data: BillFormData) => {
    setPendingData(data);
    setShowConfirmation(true);
  };

  const handleConfirmUpdate = async () => {
    if (!pendingData) return;

    setLoading(true);
    setShowConfirmation(false);

    try {
      const response = await fetch(`/api/bills/${bill.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billName: pendingData.billName,
          billPercent: Number(pendingData.billPercent),
          billAmount: Number(pendingData.billAmount),
          tentativeBillingDate: pendingData.tentativeBillingDate || null,
          status: pendingData.status,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update milestone");
      }

      toast.success("Milestone updated successfully");
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to update milestone");
    } finally {
      setLoading(false);
      setPendingData(null);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setShowDeleteConfirm(false);

    try {
      const response = await fetch(`/api/bills/${bill.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete milestone");
      }

      toast.success("Milestone deleted successfully");
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete milestone");
    } finally {
      setLoading(false);
    }
  };

  const watchedAmount = watch("billAmount");
  const watchedPercent = watch("billPercent");
  const watchedStatus = watch("status");

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {triggerButton || (
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pencil size={14} />
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase flex items-center gap-2">
              <Pencil className="text-primary" size={20} /> Edit Milestone
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
            {/* Summary */}
            <div className="p-4 bg-muted/30 rounded-xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Project Value:</span>
                <span className="font-bold">{formatCurrency(totalProjectValue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Received:</span>
                <span className="font-bold text-success">{formatCurrency(Number(bill.receivedAmount || 0))}</span>
              </div>
            </div>

            {/* Bill Name */}
            <div className="space-y-2">
              <Label htmlFor="billName" className="text-xs font-black uppercase text-muted-foreground">
                Milestone Name *
              </Label>
              <Input
                id="billName"
                {...register("billName", { required: "Milestone name is required" })}
                className="h-11 font-medium"
                placeholder="e.g., Advance Payment, Final Delivery"
              />
              {errors.billName && (
                <p className="text-xs text-destructive font-bold">{errors.billName.message}</p>
              )}
            </div>

            {/* Percent and Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billPercent" className="text-xs font-black uppercase text-muted-foreground">
                  Allocation (%)
                </Label>
                <Input
                  id="billPercent"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={watchedPercent}
                  onChange={(e) => handlePercentChange(e.target.value)}
                  className="h-11 font-bold"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billAmount" className="text-xs font-black uppercase text-muted-foreground">
                  Amount (BDT) *
                </Label>
                <Input
                  id="billAmount"
                  type="number"
                  step="1"
                  min="0"
                  value={watchedAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="h-11 font-bold"
                  placeholder="0"
                />
              </div>
            </div>
            {watchedAmount && Number(watchedAmount) > 0 && (
              <p className="text-xs text-muted-foreground -mt-3">
                Display: <span className="font-bold text-primary">{formatCurrency(Number(watchedAmount))}</span>
              </p>
            )}

            {/* Tentative Date */}
            <div className="space-y-2">
              <Label htmlFor="tentativeBillingDate" className="text-xs font-black uppercase text-muted-foreground">
                Tentative Billing Date
              </Label>
              <Input
                id="tentativeBillingDate"
                type="date"
                {...register("tentativeBillingDate")}
                className="h-10"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-muted-foreground">Status</Label>
              <Select value={watchedStatus} onValueChange={(value) => setValue("status", value)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="destructive"
                className="gap-2"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
              >
                <Trash2 size={14} /> Delete
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 font-black uppercase tracking-wider"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Milestone"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Milestone Update
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Please review the changes before confirming:
                </p>

                {pendingData && (
                  <div className="p-4 bg-muted/30 rounded-lg space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Milestone:</span>
                      <span className="font-bold">{pendingData.billName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Allocation:</span>
                      <span className="font-bold">{pendingData.billPercent}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Amount:</span>
                      <span className="font-bold text-primary">
                        {formatCurrency(Number(pendingData.billAmount))}
                      </span>
                    </div>
                    {pendingData.tentativeBillingDate && (
                      <div className="flex justify-between">
                        <span className="font-medium">Tentative Date:</span>
                        <span className="font-bold">
                          {new Date(pendingData.tentativeBillingDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <span className="font-bold">{pendingData.status}</span>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground italic">
                  This will update the milestone details in the system.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmUpdate}
              disabled={loading}
              className="bg-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Yes, Update Milestone"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete Milestone
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="text-sm">
                Are you sure you want to delete <span className="font-bold">"{bill.billName}"</span>?
              </p>
              <p className="text-sm mt-2 text-destructive font-medium">
                This action cannot be undone. All payment records associated with this milestone will be lost.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Yes, Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
