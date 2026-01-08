// src/components/billing/PaymentForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { Banknote, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface PaymentFormProps {
  bill: any;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function PaymentForm({ bill, onSuccess }: PaymentFormProps) {
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm({
    defaultValues: {
      receivedAmount: bill.receivedAmount?.toString() || "0",
      receivedDate: bill.receivedDate 
        ? new Date(bill.receivedDate).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0]
    }
  });

  const watchedAmount = parseFloat(watch("receivedAmount") || "0");
  const billAmount = Number(bill.billAmount);
  const percentCleared = ((watchedAmount / billAmount) * 100).toFixed(1);

  const onSubmit = async (data: any) => {
    if (parseFloat(data.receivedAmount) > billAmount) {
      toast.error("Received amount cannot exceed bill amount.");
      return;
    }

    try {
      const res = await fetch(`/api/bills/${bill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error();
      toast.success("Realization updated successfully");
      onSuccess();
    } catch (err) {
      toast.error("Failed to update realization");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
        <p className="text-[10px] font-black uppercase text-muted-foreground">Active Milestone</p>
        <p className="font-bold text-sm truncate">{bill.billName}</p>
        <p className="text-lg font-black mt-1">
          Target: {new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(billAmount)}
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-black uppercase">Received Amount (BDT)</Label>
        <div className="relative">
          <Input type="number" {...register("receivedAmount")} className="h-12 text-xl font-black pr-16" />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground bg-muted px-2 py-1 rounded">
            {percentCleared}%
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-black uppercase">Collection Date</Label>
        <Input type="date" {...register("receivedDate")} className="h-11" />
      </div>

      <Button type="submit" className="w-full h-12 font-black uppercase tracking-widest" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "Confirm Transaction"}
      </Button>
    </form>
  );
}