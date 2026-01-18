// src/components/billing/RecordPaymentDialog.tsx
"use client";

import { useState } from "react";
import { Banknote } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PaymentForm } from "./PaymentForm";

// Define proper TypeScript interface for ProjectBill
interface ProjectBill {
  id: number;
  projectId: number;
  slNo?: string | null;
  billName?: string | null;
  billPercent?: number | null;
  billAmount: number;
  tentativeBillingDate?: Date | null;
  receivedPercent?: number | null;
  receivedAmount?: number | null;
  receivedDate?: Date | null;
  remainingAmount?: number | null;
  vat?: number | null;
  it?: number | null;
  status?: string | null;
  createdAt?: Date | null;
}

interface RecordPaymentDialogProps {
  bill: ProjectBill;
  totalProjectValue: number;
  onSuccess: () => void;
}

export function RecordPaymentDialog({ bill, totalProjectValue, onSuccess }: RecordPaymentDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2 font-bold text-xs hover:bg-primary/5">
          <Banknote size={14} /> Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase flex items-center gap-2">
            <Banknote className="text-success" /> Update Received
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <PaymentForm
            bill={bill}
            totalProjectValue={totalProjectValue}
            onSuccess={() => {
              setOpen(false);
              onSuccess();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}