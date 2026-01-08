// src/components/billing/AddBillDialog.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Banknote, Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaymentForm } from "./PaymentForm";

export function AddBillDialog({ onBillAdded, open: controlledOpen, setOpen: controlledSetOpen }: { 
  onBillAdded: () => void, 
  open?: boolean, 
  setOpen?: (v: boolean) => void 
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedBillId, setSelectedBillId] = useState<string>("");

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledSetOpen !== undefined ? controlledSetOpen : setInternalOpen;

  useEffect(() => {
    if (open) {
      fetch('/api/projects').then(res => res.json()).then(setProjects);
    } else {
      setSelectedProjectId("");
      setSelectedBillId("");
    }
  }, [open]);

  const selectedProject = useMemo(() => 
    projects.find(p => p.id.toString() === selectedProjectId), 
  [projects, selectedProjectId]);

  const dueBills = useMemo(() => {
    if (!selectedProject) return [];
    // Filter for milestones that are not fully paid
    return selectedProject.bills.filter((b: any) => b.status !== 'PAID');
  }, [selectedProject]);

  const activeBill = useMemo(() => 
    dueBills.find((b: any) => b.id.toString() === selectedBillId), 
  [dueBills, selectedBillId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="h-9 gap-2 font-bold uppercase tracking-tight shadow-md">
          <Plus size={16} /> New Bill Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase flex items-center gap-2">
            <Banknote className="text-success" /> New Bill Realization
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">1. Select Project</Label>
              <Select value={selectedProjectId} onValueChange={(v) => { setSelectedProjectId(v); setSelectedBillId(""); }}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Choose project..." /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.projectName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProjectId && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">2. Select Due Milestone</Label>
                <Select value={selectedBillId} onValueChange={setSelectedBillId}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select unpaid milestone..." /></SelectTrigger>
                  <SelectContent>
                    {dueBills.length > 0 ? (
                      dueBills.map((b: any) => (
                        <SelectItem key={b.id} value={b.id.toString()}>
                          {b.billName} ({b.billPercent}%) - {b.status}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No due milestones for this project</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {activeBill && (
            <div className="pt-4 border-t border-dashed animate-in zoom-in-95">
               <PaymentForm 
                  bill={activeBill} 
                  onSuccess={() => { setOpen(false); onBillAdded(); }} 
               />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}