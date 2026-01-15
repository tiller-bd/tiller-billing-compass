// src/components/projects/AddProjectDialog.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2, Loader2, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddProjectDialogProps {
  onProjectAdded: () => void;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

const DRAFT_KEY = "addProjectDraft";

export function AddProjectDialog({ onProjectAdded, open: controlledOpen, setOpen: controlledSetOpen }: AddProjectDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lookups, setLookups] = useState({ clients: [], categories: [], departments: [] });
  const [isNewClient, setIsNewClient] = useState(false);
  const [ignoreTotalCheck, setIgnoreTotalCheck] = useState(false);
  const [amountErrors, setAmountErrors] = useState<Record<number, boolean>>({});

  // Use controlled state if provided, otherwise fallback to local state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledSetOpen !== undefined ? controlledSetOpen : setInternalOpen;

  // Get current date in YYYY-MM-DD format for default value
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const { register, control, handleSubmit, reset, watch, setValue, getValues } = useForm({
    defaultValues: {
      projectName: "",
      clientId: "",
      categoryId: "",
      departmentId: "",
      totalProjectValue: "",
      startDate: getCurrentDate(),
      newClient: { name: "", contactPerson: "", contactEmail: "", contactPhone: "" },
      bills: [
        { billName: "Inception", billPercent: "20", billAmount: "", tentativeBillingDate: "" },
        { billName: "Final handover", billPercent: "80", billAmount: "", tentativeBillingDate: "" }
      ]
    }
  });

  const { fields, remove, insert } = useFieldArray({ control, name: "bills" });

  const watchedBills = watch("bills");
  const totalValue = parseFloat(watch("totalProjectValue") || "0");

  const totalPercentage = useMemo(() => {
    return watchedBills.reduce((sum, bill) => sum + parseFloat(bill.billPercent || "0"), 0);
  }, [watchedBills]);

  const isPercentValid = ignoreTotalCheck || Math.abs(totalPercentage - 100) < 0.01;
  const percentDifference = 100 - totalPercentage;
  const isOverAllocated = totalPercentage > 100;
  const isUnderAllocated = totalPercentage < 100 && Math.abs(percentDifference) > 0.01;

  // Load draft when dialog opens
  useEffect(() => {
    if (open) {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft);
          // Restore all form values including the bypass checkbox
          Object.keys(parsedDraft).forEach((key) => {
            if (key === 'ignoreTotalCheck') {
              setIgnoreTotalCheck(parsedDraft[key]);
            } else if (key === 'isNewClient') {
              setIsNewClient(parsedDraft[key]);
            } else {
              setValue(key as any, parsedDraft[key]);
            }
          });
          toast.info("Draft restored from previous session");
        } catch (e) {
          console.error("Failed to load draft:", e);
        }
      }
    }
  }, [open, setValue]);

  // Auto-save draft whenever form values change
  useEffect(() => {
    if (open) {
      const saveDraft = () => {
        const formData = getValues();
        const draftData = {
          ...formData,
          ignoreTotalCheck,
          isNewClient
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      };

      const timeoutId = setTimeout(saveDraft, 1000); // Debounce 1 second
      return () => clearTimeout(timeoutId);
    }
  }, [watchedBills, watch("projectName"), watch("totalProjectValue"), watch("clientId"),
    watch("categoryId"), watch("departmentId"), watch("startDate"),
    watch("newClient"), ignoreTotalCheck, isNewClient, open, getValues]);

  const validateAmount = (index: number, amount: string) => {
    const amt = parseFloat(amount || "0");

    // Check if amount is negative
    if (amt < 0) {
      setAmountErrors(prev => ({ ...prev, [index]: true }));
      return false;
    }

    // Check if amount exceeds total project value
    if (totalValue > 0 && amt > totalValue) {
      setAmountErrors(prev => ({ ...prev, [index]: true }));
      toast.error("Amount cannot exceed total project value");
      return false;
    }

    setAmountErrors(prev => ({ ...prev, [index]: false }));
    return true;
  };

  const handlePercentChange = (index: number, value: string) => {
    let pct = parseFloat(value || "0");
    if (pct > 100) {
      pct = 100;
      setValue(`bills.${index}.billPercent`, "100");
      toast.warning("Percentage cannot exceed 100%");
    }
    if (pct < 0) {
      pct = 0;
      setValue(`bills.${index}.billPercent`, "0");
    }

    if (totalValue > 0) {
      const amount = (pct / 100) * totalValue;
      const roundedAmount = Math.round(amount).toString();
      setValue(`bills.${index}.billAmount`, roundedAmount);
      validateAmount(index, roundedAmount);
    }
  };

  const handleAmountChange = (index: number, value: string) => {
    const amt = parseFloat(value || "0");

    // Don't allow negative amounts
    if (amt < 0) {
      setValue(`bills.${index}.billAmount`, "0");
      setAmountErrors(prev => ({ ...prev, [index]: false }));
      return;
    }

    if (totalValue > 0) {
      const percent = (amt / totalValue) * 100;
      const roundedPercent = Math.min(100, Math.max(0, percent)).toFixed(2);
      setValue(`bills.${index}.billPercent`, roundedPercent);
    }

    validateAmount(index, value);
  };

  const handleAmountBlur = (index: number) => {
    const amount = watch(`bills.${index}.billAmount`);
    validateAmount(index, amount);
  };

  const handleTotalValueChange = (val: string) => {
    const total = parseFloat(val || "0");
    watchedBills.forEach((bill, i) => {
      const amt = (parseFloat(bill.billPercent || "0") / 100) * total;
      const roundedAmount = Math.round(amt).toString();
      setValue(`bills.${i}.billAmount`, roundedAmount);
      validateAmount(i, roundedAmount);
    });
  };

  const addDeliverable = () => {
    const deliverableCount = watchedBills.filter(b => b.billName.includes("Deliverable")).length;
    const finalIndex = watchedBills.findIndex(b => b.billName.toLowerCase().includes("final"));
    const indexToInsert = finalIndex !== -1 ? finalIndex : watchedBills.length;

    // Calculate default amount based on 5% of total value
    const defaultPercent = "5";
    const defaultAmount = totalValue > 0 ? Math.round((5 / 100) * totalValue).toString() : "0";

    insert(indexToInsert, {
      billName: `Deliverable-${deliverableCount + 1}`,
      billPercent: defaultPercent,
      billAmount: defaultAmount,
      tentativeBillingDate: ""
    });
  };

  useEffect(() => {
    if (open) {
      Promise.all([
        fetch('/api/clients').then(res => res.json()),
        fetch('/api/categories').then(res => res.json()),
        fetch('/api/departments').then(res => res.json())
      ]).then(([cl, cat, dept]) => {
        setLookups({ clients: cl, categories: cat, departments: dept });
      });
    }
  }, [open]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
  };

  const onSubmit = async (data: any) => {
    // Check for amount errors
    const hasAmountErrors = Object.values(amountErrors).some(error => error);
    if (hasAmountErrors) {
      toast.error("Please fix amount validation errors before submitting");
      return;
    }

    // Validate percentage only if bypass is NOT checked
    if (!ignoreTotalCheck && Math.abs(totalPercentage - 100) > 0.01) {
      toast.error(`Invalid Allocation: Total is ${totalPercentage.toFixed(2)}%. It must be exactly 100%.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error();
      toast.success("Project Authorized: Billing milestones initialized.");

      // Clear draft after successful submission
      clearDraft();

      setOpen(false);
      reset({
        projectName: "",
        clientId: "",
        categoryId: "",
        departmentId: "",
        totalProjectValue: "",
        startDate: getCurrentDate(),
        newClient: { name: "", contactPerson: "", contactEmail: "", contactPhone: "" },
        bills: [
          { billName: "Inception", billPercent: "20", billAmount: "", tentativeBillingDate: "" },
          { billName: "Final handover", billPercent: "80", billAmount: "", tentativeBillingDate: "" }
        ]
      });
      setIsNewClient(false);
      setIgnoreTotalCheck(false);
      setAmountErrors({});
      onProjectAdded();
    } catch (err) {
      toast.error("Process Failed: Please verify all required fields.");
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = (newOpen: boolean) => {
    if (!newOpen) {
      // Save draft when closing
      const formData = getValues();
      const draftData = {
        ...formData,
        ignoreTotalCheck,
        isNewClient
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      toast.info("Draft saved automatically");
    }
    setOpen(newOpen);
  };

  // Get status color and message for budget allocation
  const getAllocationStatus = () => {
    if (ignoreTotalCheck) {
      return {
        color: "info",
        icon: CheckCircle2,
        message: "Budget Allocation",
        description: "Guardrail bypassed"
      };
    }

    if (isPercentValid) {
      return {
        color: "success",
        icon: CheckCircle2,
        message: "Perfect Allocation",
        description: "100% allocated"
      };
    }

    if (isOverAllocated) {
      return {
        color: "danger",
        icon: AlertCircle,
        message: "Over-Allocated",
        description: `Exceeded by ${Math.abs(percentDifference).toFixed(2)}%`
      };
    }

    return {
      color: "warning",
      icon: AlertTriangle,
      message: "Under-Allocated",
      description: `${percentDifference.toFixed(2)}% remaining`
    };
  };

  const allocationStatus = getAllocationStatus();

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-bold shadow-md hover:shadow-lg transition-all">
          <Plus className="w-4 h-4" /> Create New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-primary" /> Project Authorization
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Project Identity</Label>
              <Input {...register("projectName")} placeholder="Enter Project Name..." className="h-11 font-bold" required />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Total Project Valuation (BDT)</Label>
              <Input
                type="number"
                {...register("totalProjectValue")}
                placeholder="0"
                className="h-11 font-black text-primary text-lg bg-primary/5"
                required
                onChange={(e) => handleTotalValueChange(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Client Entity</Label>
              <Select
                value={isNewClient ? "new" : watch("clientId")}
                onValueChange={(v) => {
                  if (v === "new") {
                    setIsNewClient(true);
                    setValue("clientId", "");
                  } else {
                    setIsNewClient(false);
                    setValue("clientId", v);
                  }
                }}
              >
                <SelectTrigger className="h-10"><SelectValue placeholder="Select Client" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new" className="text-primary font-black">+ Create New Client</SelectItem>
                  {lookups.clients.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Domain / Category</Label>
              <Select value={watch("categoryId")} onValueChange={(v) => setValue("categoryId", v)}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {lookups.categories.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Division</Label>
              <Select value={watch("departmentId")} onValueChange={(v) => setValue("departmentId", v)}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Dept" /></SelectTrigger>
                <SelectContent>
                  {lookups.departments.map((d: any) => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Agreement Date</Label>
              <Input type="date" {...register("startDate")} className="h-10" required />
            </div>
          </div>

          {isNewClient && (
            <div className="p-6 bg-primary/[0.02] border border-primary/10 rounded-2xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
              <Input placeholder="Client Name" {...register("newClient.name")} required />
              <Input placeholder="POC Person" {...register("newClient.contactPerson")} />
              <Input placeholder="Email" type="email" {...register("newClient.contactEmail")} />
              <Input placeholder="Contact No" {...register("newClient.contactPhone")} />
            </div>
          )}

          <div className="space-y-6 border-t pt-8">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <Label className="text-xl font-black uppercase tracking-tight">Financial Milestones</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ignoreTotal"
                    checked={ignoreTotalCheck}
                    onCheckedChange={(checked) => setIgnoreTotalCheck(!!checked)}
                  />
                  <label htmlFor="ignoreTotal" className="text-[10px] font-black text-muted-foreground cursor-pointer uppercase">
                    Bypass 100% Guardrail
                  </label>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" className="font-bold h-9 border-primary/20 text-primary" onClick={addDeliverable}>
                <Plus className="w-4 h-4 mr-2" /> Add Deliverable
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-3 items-end bg-secondary/10 p-4 rounded-xl border border-border/50 group hover:border-primary/20 transition-all">
                  <div className="col-span-12 md:col-span-4 space-y-1">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Milestone Description</Label>
                    <Input {...register(`bills.${index}.billName`)} placeholder="Phase Name" required />
                  </div>

                  <div className="col-span-4 md:col-span-2 space-y-1">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Value (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...register(`bills.${index}.billPercent`)}
                      className="font-black text-primary"
                      onChange={(e) => handlePercentChange(index, e.target.value)}
                    />
                  </div>

                  <div className="col-span-4 md:col-span-2 space-y-1">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Target Date</Label>
                    <Input type="date" {...register(`bills.${index}.tentativeBillingDate`)} required />
                  </div>

                  <div className="col-span-4 md:col-span-3 space-y-1">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Amount (BDT)</Label>
                    <Input
                      type="number"
                      min="0"
                      {...register(`bills.${index}.billAmount`)}
                      className={cn(
                        "font-bold",
                        amountErrors[index] && "border-red-500 focus-visible:ring-red-500"
                      )}
                      required
                      onChange={(e) => handleAmountChange(index, e.target.value)}
                      onBlur={() => handleAmountBlur(index)}
                    />
                    {amountErrors[index] && (
                      <p className="text-[10px] text-red-500 font-bold mt-1">
                        Amount exceeds total value
                      </p>
                    )}
                  </div>

                  <div className="col-span-12 md:col-span-1 flex justify-end">
                    <Button type="button" variant="ghost" size="icon" className="text-destructive h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => remove(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className={cn(
              "flex items-center justify-between p-4 rounded-xl border-2 transition-all",
              allocationStatus.color === "success" && "bg-green-500/5 border-green-500/20 text-green-600 dark:text-green-400",
              allocationStatus.color === "warning" && "bg-yellow-500/5 border-yellow-500/20 text-yellow-600 dark:text-yellow-400",
              allocationStatus.color === "danger" && "bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400",
              allocationStatus.color === "info" && "bg-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400"
            )}>
              <div className="flex items-center gap-3">
                <allocationStatus.icon className="w-5 h-5" />
                <div>
                  <div className="text-sm font-black uppercase">{allocationStatus.message}</div>
                  <div className="text-xs font-bold opacity-80">{totalPercentage.toFixed(2)}% • {allocationStatus.description}</div>
                </div>
              </div>
              {ignoreTotalCheck && (
                <span className="text-[10px] font-black bg-primary/20 px-3 py-1 rounded-full uppercase">
                  Bypass Active
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-14 text-sm font-black uppercase"
              onClick={() => {
                clearDraft();
                toast.success("Draft cleared");
              }}
            >
              Clear Draft
            </Button>
            <Button type="submit" className="flex-1 h-14 text-lg font-black uppercase tracking-widest" disabled={loading}>
              {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : "Authorize Project Creation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}