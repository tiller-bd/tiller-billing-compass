// src/components/billing/RecordPaymentDialog.tsx
"use client";

import { useState } from "react";
import { Banknote } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PaymentForm } from "./PaymentForm";

export function RecordPaymentDialog({ bill, onSuccess }: { bill: any, onSuccess: () => void }) {
  const [open, setOpen] = useState(false);

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
        
        <div className="mt-4">
          <PaymentForm 
            bill={bill} 
            onSuccess={() => { setOpen(false); onSuccess(); }} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}