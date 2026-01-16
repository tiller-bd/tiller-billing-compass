// src/components/billing/PaymentForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
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
import { ApiClientError, apiPatch } from "@/lib/api-client";
import {
  roundAmount,
  calculatePercentage,
  calculateAmountFromPercentage,
  validatePercentageInput,
  formatBDT,
} from "@/lib/financial-utils";

interface ProjectBill {
  id: number;
  projectId: number;
  billName?: string | null;
  billPercent?: number | null;
  billAmount: number;
  receivedAmount?: number | null;
  receivedDate?: Date | null;
  tentativeBillingDate?: Date | null;
  status?: string | null;
}

interface PaymentFormProps {
  bill: ProjectBill;
  totalProjectValue: number;
  onSuccess: () => void;
}

interface PaymentFormData {
  receivedAmount: string;
  receivedPercent: string;
  receivedDate: string;
}

const DRAFT_KEY_PREFIX = "paymentDraft_";

export function PaymentForm({ bill, totalProjectValue, onSuccess }: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingData, setPendingData] = useState<PaymentFormData | null>(null);

  const draftKey = `${DRAFT_KEY_PREFIX}${bill.id}`;

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Core values - Amount is the source of truth (integers only)
  const projectTotal = roundAmount(Number(totalProjectValue || 0));
  const billAmount = roundAmount(Number(bill.billAmount));
  const billPercent = Number(bill.billPercent || 0);
  const currentReceived = roundAmount(Number(bill.receivedAmount || 0));
  const remainingAmount = billAmount - currentReceived;

  // All percentages are derived from amounts (calculated, not stored)
  const billPercentOfProject = calculatePercentage(billAmount, projectTotal);
  const currentReceivedPercentOfProject = calculatePercentage(currentReceived, projectTotal);
  const remainingPercentOfProject = calculatePercentage(remainingAmount, projectTotal);

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<PaymentFormData>({
    defaultValues: {
      receivedAmount: "0",
      receivedPercent: "0",
      receivedDate: getCurrentDate()
    }
  });

  // Load draft when component mounts
  useEffect(() => {
    const draft = localStorage.getItem(draftKey);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setValue("receivedAmount", parsedDraft.receivedAmount);
        setValue("receivedPercent", parsedDraft.receivedPercent);
        setValue("receivedDate", parsedDraft.receivedDate);
        toast.info("Draft restored from previous session");
      } catch (e) {
        console.error("Failed to load draft:", e);
      }
    }
  }, [draftKey, setValue]);

  // Auto-save draft whenever form values change
  useEffect(() => {
    const saveDraft = () => {
      const formData = getValues();
      localStorage.setItem(draftKey, JSON.stringify(formData));
    };

    const timeoutId = setTimeout(saveDraft, 1000); // Debounce 1 second
    return () => clearTimeout(timeoutId);
  }, [watch("receivedAmount"), watch("receivedPercent"), watch("receivedDate"), draftKey, getValues]);

  const watchedAmount = watch("receivedAmount");

  // Handle amount change - Amount is the source of truth
  const handleAmountChange = (value: string) => {
    let amount = roundAmount(Number(value || 0));

    if (amount < 0) {
      setValue("receivedAmount", "0");
      setValue("receivedPercent", "0");
      return;
    }

    if (amount > remainingAmount) {
      toast.warning(`Amount cannot exceed remaining ${formatCurrency(remainingAmount)}`);
      amount = remainingAmount;
    }

    setValue("receivedAmount", amount.toString());
    // Percentage is always derived from amount
    const percentOfProject = calculatePercentage(amount, projectTotal);
    setValue("receivedPercent", percentOfProject.toFixed(2));
  };

  // Handle percentage change - Convert to amount first (amount is source of truth)
  const handlePercentChange = (value: string) => {
    const percent = Number(value || 0);

    if (percent < 0) {
      setValue("receivedPercent", "0");
      setValue("receivedAmount", "0");
      return;
    }

    // Use the utility to validate and convert
    const result = validatePercentageInput(percent, projectTotal, remainingAmount);

    if (!result.valid && result.message) {
      toast.warning(result.message);
    }

    // Set the corrected/validated amount (source of truth)
    setValue("receivedAmount", result.amount.toString());
    // Set the recalculated percentage from the actual amount
    setValue("receivedPercent", result.percentage.toFixed(2));
  };

  // Calculate final values for confirmation (percentages derived from amounts)
  const calculateFinalValues = (data: PaymentFormData) => {
    const newReceivedAmount = roundAmount(Number(data.receivedAmount));
    const totalReceivedAmount = currentReceived + newReceivedAmount;
    // Percentages are always derived from amounts
    const totalReceivedPercentOfProject = calculatePercentage(totalReceivedAmount, projectTotal);
    const newRemainingAmount = billAmount - totalReceivedAmount;
    const newRemainingPercentOfProject = calculatePercentage(newRemainingAmount, projectTotal);
    const newStatus = totalReceivedAmount >= billAmount ? "PAID" : totalReceivedAmount > 0 ? "PARTIAL" : "PENDING";

    return {
      newReceivedAmount,
      totalReceivedAmount,
      totalReceivedPercentOfProject,
      newRemainingAmount,
      newRemainingPercentOfProject,
      newStatus
    };
  };

  const onSubmit = (data: PaymentFormData) => {
    const amount = Number(data.receivedAmount);
    
    // Validation
    if (amount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    if (amount > remainingAmount) {
      toast.error(`Amount cannot exceed remaining ${formatCurrency(remainingAmount)}`);
      return;
    }

    // Show confirmation dialog
    setPendingData(data);
    setShowConfirmation(true);
  };

  const handleConfirmPayment = async () => {
    if (!pendingData) return;

    setLoading(true);
    setShowConfirmation(false);

    try {
      const finalValues = calculateFinalValues(pendingData);
      const totalReceivedAmount = finalValues.totalReceivedAmount;

      await apiPatch(`/api/bills/${bill.id}`, {
        receivedAmount: totalReceivedAmount,
        receivedDate: pendingData.receivedDate,
        receivedPercent: finalValues.totalReceivedPercentOfProject,
        remainingAmount: finalValues.newRemainingAmount,
        status: finalValues.newStatus
      });

      // Clear draft after successful submission
      localStorage.removeItem(draftKey);

      toast.success(
        finalValues.newStatus === "PAID"
          ? "Payment recorded - Milestone fully settled!"
          : "Partial payment recorded successfully"
      );
      onSuccess();
    } catch (error) {
      console.error("Payment update error:", error);
      if (error instanceof ApiClientError) {
        if (error.code === 'UNAUTHORIZED') {
          // The API client will handle redirect to login
          return;
        }
        toast.error(error.message || "Failed to record payment. Please try again.");
      } else {
        toast.error("Failed to record payment. Please try again.");
      }
    } finally {
      setLoading(false);
      setPendingData(null);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(draftKey);
    setValue("receivedAmount", "0");
    setValue("receivedPercent", "0");
    setValue("receivedDate", getCurrentDate());
    toast.success("Draft cleared");
  };

  // Use Indian numbering system (Lakh/Crore): 1,00,00,000 for 1 crore, 1,00,000 for 1 lakh
  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(amount));
    return `৳${formatted}`;
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Bill Summary - All percentages relative to Total Project Value (100%) */}
        <div className="p-4 bg-muted/30 rounded-xl space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground font-medium">Milestone:</span>
            <span className="font-bold">{bill.billName}</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="text-muted-foreground font-medium">Total Project Value (100%):</span>
            <span className="font-bold">{formatCurrency(projectTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground font-medium">Bill Allocation:</span>
            <span className="font-bold">
              {formatCurrency(billAmount)} <span className="text-xs text-muted-foreground">({billPercentOfProject.toFixed(1)}%)</span>
            </span>
          </div>
          {currentReceived > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-medium">Already Received:</span>
                <span className="font-bold text-success">
                  {formatCurrency(currentReceived)} <span className="text-xs">({currentReceivedPercentOfProject.toFixed(2)}%)</span>
                </span>
              </div>
              {bill.receivedDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Partial Receive Date:</span>
                  <span className="font-medium text-success">
                    {new Date(bill.receivedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
            </>
          )}
          {bill.tentativeBillingDate && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Tentative Date:</span>
              <span className="font-medium">
                {new Date(bill.tentativeBillingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="text-muted-foreground font-medium">Remaining to Collect:</span>
            <span className="font-bold text-primary">
              {formatCurrency(remainingAmount)} <span className="text-xs">({remainingPercentOfProject.toFixed(2)}%)</span>
            </span>
          </div>
        </div>

        {/* Payment Amount and Percentage (% of Total Project) */}
        {/* IMPORTANT: Amount is the source of truth. Percentage is derived from amount. */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="receivedAmount" className="text-xs font-black uppercase text-muted-foreground">
              Amount (BDT) *
            </Label>
            <Input
              id="receivedAmount"
              type="number"
              step="1"
              min="0"
              max={remainingAmount}
              {...register("receivedAmount", {
                required: "Amount is required",
                min: { value: 1, message: "Amount must be at least 1" },
                max: { value: remainingAmount, message: `Cannot exceed ${formatCurrency(remainingAmount)}` }
              })}
              className="h-12 font-bold text-lg"
              placeholder="0"
              onChange={(e) => handleAmountChange(e.target.value)}
            />
            {errors.receivedAmount && (
              <p className="text-xs text-destructive font-bold">
                {errors.receivedAmount.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="receivedPercent" className="text-xs font-black uppercase text-muted-foreground">
              % of Project
            </Label>
            <Input
              id="receivedPercent"
              type="number"
              step="0.01"
              min="0"
              {...register("receivedPercent")}
              className="h-12 font-bold text-lg text-primary"
              placeholder="0.00"
              onChange={(e) => handlePercentChange(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Max: {remainingPercentOfProject.toFixed(2)}% (auto-corrects)
            </p>
          </div>
        </div>

        {/* Real-time Status Preview - Percentages relative to Total Project */}
        {watchedAmount && Number(watchedAmount) > 0 && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-black uppercase text-primary">Payment Preview</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">This Payment:</span>
                <span className="font-bold">
                  {formatCurrency(Number(watchedAmount))}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({projectTotal > 0 ? ((Number(watchedAmount) / projectTotal) * 100).toFixed(2) : 0}%)
                  </span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total After Payment:</span>
                <span className="font-bold text-success">
                  {formatCurrency(currentReceived + Number(watchedAmount))}
                  <span className="text-xs ml-1">
                    ({projectTotal > 0 ? (((currentReceived + Number(watchedAmount)) / projectTotal) * 100).toFixed(2) : 0}%)
                  </span>
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-muted-foreground">New Remaining:</span>
                <span className="font-bold text-destructive">
                  {formatCurrency(remainingAmount - Number(watchedAmount))}
                  <span className="text-xs ml-1">
                    ({projectTotal > 0 ? (((remainingAmount - Number(watchedAmount)) / projectTotal) * 100).toFixed(2) : 0}%)
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Date */}
        <div className="space-y-2">
          <Label htmlFor="receivedDate" className="text-xs font-black uppercase text-muted-foreground">
            Payment Date *
          </Label>
          <Input
            id="receivedDate"
            type="date"
            {...register("receivedDate", { required: "Date is required" })}
            className="h-10"
          />
          {errors.receivedDate && (
            <p className="text-xs text-destructive font-bold">
              {errors.receivedDate.message}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-11 font-bold uppercase text-xs"
            onClick={clearDraft}
          >
            Clear Draft
          </Button>
          <Button
            type="submit"
            className="flex-1 h-11 font-black uppercase tracking-wider"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Record Payment"
            )}
          </Button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Payment Recording
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Please review the payment details before confirming:
                </p>
                
                {pendingData && (
                  <div className="p-4 bg-muted/30 rounded-lg space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Milestone:</span>
                      <span className="font-bold">{bill.billName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Payment Amount:</span>
                      <span className="font-bold text-primary">
                        {formatCurrency(Number(pendingData.receivedAmount))}
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          ({projectTotal > 0 ? ((Number(pendingData.receivedAmount) / projectTotal) * 100).toFixed(2) : 0}%)
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Payment Date:</span>
                      <span className="font-bold">
                        {new Date(pendingData.receivedDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Current Received:</span>
                        <span>
                          {formatCurrency(currentReceived)}
                          <span className="text-xs text-muted-foreground ml-1">
                            ({currentReceivedPercentOfProject.toFixed(2)}%)
                          </span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Total After Payment:</span>
                        <span className="font-bold text-success">
                          {formatCurrency(calculateFinalValues(pendingData).totalReceivedAmount)}
                          <span className="text-xs font-normal ml-1">
                            ({calculateFinalValues(pendingData).totalReceivedPercentOfProject.toFixed(2)}%)
                          </span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Remaining Balance:</span>
                        <span className="font-bold text-destructive">
                          {formatCurrency(calculateFinalValues(pendingData).newRemainingAmount)}
                          <span className="text-xs font-normal ml-1">
                            ({calculateFinalValues(pendingData).newRemainingPercentOfProject.toFixed(2)}%)
                          </span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-medium">New Status:</span>
                        <span className={`font-black text-xs px-3 py-1 rounded-full uppercase ${
                          calculateFinalValues(pendingData).newStatus === "PAID"
                            ? "bg-success/10 text-success"
                            : "bg-amber-500/10 text-amber-600"
                        }`}>
                          {calculateFinalValues(pendingData).newStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground italic">
                  This action will update the project's billing records.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmPayment}
              disabled={loading}
              className="bg-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                "Yes, Record Payment"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}