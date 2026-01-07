"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Banknote, Loader2, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function RecordPaymentDialog({ bill, onSuccess }: { bill: any, onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      receivedAmount: bill.receivedAmount?.toString() || "0",
      receivedDate: bill.receivedDate ? new Date(bill.receivedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
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

    setLoading(true);
    try {
      const res = await fetch(`/api/bills/${bill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error();
      toast.success("Payment recorded successfully");
      setOpen(false);
      onSuccess();
    } catch (err) {
      toast.error("Failed to update payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2 font-bold text-xs hover:bg-primary/5">
          <Banknote size={14} /> Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase flex items-center gap-2">
            <Banknote className="text-success" /> Update Realization
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 bg-muted/30 rounded-xl mb-4">
          <p className="text-[10px] font-black uppercase text-muted-foreground">Milestone: {bill.billName}</p>
          <p className="text-lg font-black">Target: {new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(billAmount)}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

          <Button type="submit" className="w-full h-12 font-black uppercase tracking-widest" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2" /> : "Confirm Transaction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}