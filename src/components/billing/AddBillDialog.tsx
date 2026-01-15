// src/components/billing/AddBillDialog.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Banknote, Plus, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaymentForm } from "./PaymentForm";
import { cn } from "@/lib/utils";

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

  // Calculate project status (fully paid or not)
  const projectsWithStatus = useMemo(() => {
    return projects.map(p => {
      const totalValue = Number(p.totalProjectValue || 0);
      const totalReceived = p.bills?.reduce((sum: number, b: any) => sum + Number(b.receivedAmount || 0), 0) || 0;
      const isFullyPaid = totalValue > 0 && totalReceived >= totalValue;
      const receivedPercent = totalValue > 0 ? (totalReceived / totalValue) * 100 : 0;
      return { ...p, isFullyPaid, totalReceived, receivedPercent };
    });
  }, [projects]);

  const selectedProject = useMemo(() =>
    projectsWithStatus.find(p => p.id.toString() === selectedProjectId),
  [projectsWithStatus, selectedProjectId]);

  const dueBills = useMemo(() => {
    if (!selectedProject) return [];
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase flex items-center gap-2">
            <Banknote className="text-success" /> New Bill Received
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Row: Project & Milestone Dropdowns */}
          <div className="grid grid-cols-2 gap-4">
            {/* Select Project */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">1. Select Project</Label>
              <Select
                value={selectedProjectId}
                onValueChange={(v) => { setSelectedProjectId(v); setSelectedBillId(""); }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Choose project..." />
                </SelectTrigger>
                <SelectContent>
                  {projectsWithStatus.map((p) => (
                    <SelectItem
                      key={p.id}
                      value={p.id.toString()}
                      disabled={p.isFullyPaid}
                      className={cn(
                        p.isFullyPaid && "text-success bg-success/5"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn(p.isFullyPaid && "text-success")}>
                          {p.projectName}
                        </span>
                        {p.isFullyPaid && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded">
                            <CheckCircle2 size={10} /> Settled
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select Milestone */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">2. Select Milestone</Label>
              <Select
                value={selectedBillId}
                onValueChange={setSelectedBillId}
                disabled={!selectedProjectId || dueBills.length === 0}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={!selectedProjectId ? "Select project first..." : "Choose milestone..."} />
                </SelectTrigger>
                <SelectContent>
                  {dueBills.length > 0 ? (
                    dueBills.map((b: any) => (
                      <SelectItem key={b.id} value={b.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{b.billName}</span>
                          <span className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded",
                            b.status === 'PARTIAL'
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {b.billPercent}% • {b.status}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      {selectedProjectId ? "No due milestones" : "Select a project first"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment Form */}
          {activeBill && selectedProject && (
            <div className="pt-4 border-t border-dashed animate-in fade-in slide-in-from-top-2">
              <PaymentForm
                bill={activeBill}
                totalProjectValue={Number(selectedProject.totalProjectValue || 0)}
                onSuccess={() => { setOpen(false); onBillAdded(); }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}