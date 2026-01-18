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
import {
  roundAmount,
  calculatePercentage,
  calculateAmountFromPercentage,
  isApproximatelyEqual,
} from "@/lib/financial-utils";

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
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [isNewDepartment, setIsNewDepartment] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const [ignoreTotalCheck, setIgnoreTotalCheck] = useState(false);
  const [amountErrors, setAmountErrors] = useState<Record<number, boolean>>({});
  const [pgEnabled, setPgEnabled] = useState(false);
  const [pgInputType, setPgInputType] = useState<'percentage' | 'amount'>('percentage');
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

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
      newCategory: { name: "", description: "" },
      newDepartment: { name: "", description: "" },
      bills: [
        { billName: "Inception", billPercent: "20", billAmount: "", tentativeBillingDate: "" },
        { billName: "Final handover", billPercent: "80", billAmount: "", tentativeBillingDate: "" }
      ],
      pg: { percent: "", amount: "", bankSharePercent: "50" }
    }
  });

  const { fields, remove, insert } = useFieldArray({ control, name: "bills" });

  const watchedBills = watch("bills");
  const watchedPg = watch("pg");
  // Use roundAmount for consistent integer handling
  const totalValue = roundAmount(parseFloat(watch("totalProjectValue") || "0"));

  const totalPercentage = useMemo(() => {
    return watchedBills.reduce((sum, bill) => sum + parseFloat(bill.billPercent || "0"), 0);
  }, [watchedBills]);

  // Calculate total of all bill amounts
  const totalBillAmounts = useMemo(() => {
    return watchedBills.reduce((sum, bill) => sum + roundAmount(parseFloat(bill.billAmount || "0")), 0);
  }, [watchedBills]);

  // Calculate PG values
  const calculatedPgValues = useMemo(() => {
    if (!pgEnabled || !watchedPg) return null;

    const pgPercent = parseFloat(watchedPg.percent || "0");
    const pgAmount = parseFloat(watchedPg.amount || "0");
    const bankSharePercent = parseFloat(watchedPg.bankSharePercent || "0");

    let finalPgAmount = 0;
    if (pgInputType === 'percentage' && pgPercent > 0 && totalValue > 0) {
      finalPgAmount = (pgPercent / 100) * totalValue;
    } else if (pgInputType === 'amount' && pgAmount > 0) {
      finalPgAmount = pgAmount;
    }

    const userSharePercent = 100 - bankSharePercent;
    const userDeposit = (userSharePercent / 100) * finalPgAmount;
    const bankShare = (bankSharePercent / 100) * finalPgAmount;

    return {
      pgAmount: roundAmount(finalPgAmount),
      userDeposit: roundAmount(userDeposit),
      bankShare: roundAmount(bankShare),
      bankSharePercent
    };
  }, [watchedPg, pgEnabled, pgInputType, totalValue]);

  // Use epsilon tolerance for floating-point comparison (0.01% tolerance for 100% check)
  const isPercentValid = ignoreTotalCheck || isApproximatelyEqual(totalPercentage, 100, 0.01);
  const percentDifference = 100 - totalPercentage;
  const isOverAllocated = totalPercentage > 100 && !isApproximatelyEqual(totalPercentage, 100, 0.01);
  const isUnderAllocated = totalPercentage < 100 && !isApproximatelyEqual(totalPercentage, 100, 0.01);

  // Validate total amounts don't exceed project value
  const amountDifference = totalValue - totalBillAmounts;
  const isAmountValid = ignoreTotalCheck || totalBillAmounts <= totalValue;
  const isAmountOverAllocated = totalBillAmounts > totalValue;

  // Master validation: can only submit if ALL validations pass OR bypass is checked
  const canSubmit = ignoreTotalCheck || (
    isApproximatelyEqual(totalPercentage, 100, 0.01) &&
    totalBillAmounts <= totalValue &&
    !Object.values(amountErrors).some(error => error)
  );

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
            } else if (key === 'isNewCategory') {
              setIsNewCategory(parsedDraft[key]);
            } else if (key === 'isNewDepartment') {
              setIsNewDepartment(parsedDraft[key]);
            } else if (key === 'pgEnabled') {
              setPgEnabled(parsedDraft[key]);
            } else if (key === 'pgInputType') {
              setPgInputType(parsedDraft[key]);
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
          isNewClient,
          isNewCategory,
          isNewDepartment,
          pgEnabled,
          pgInputType
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      };

      const timeoutId = setTimeout(saveDraft, 1000); // Debounce 1 second
      return () => clearTimeout(timeoutId);
    }
  }, [watchedBills, watch("projectName"), watch("totalProjectValue"), watch("clientId"),
    watch("categoryId"), watch("departmentId"), watch("startDate"),
    watch("newClient"), watch("newCategory"), watch("newDepartment"), watchedPg,
    ignoreTotalCheck, isNewClient, isNewCategory, isNewDepartment, pgEnabled, pgInputType, open, getValues]);

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

  // Handle percentage change - just update the value (no calculation on change)
  const handlePercentChange = (index: number, value: string) => {
    setValue(`bills.${index}.billPercent`, value);
  };

  // Handle amount change - just update the value (no calculation on change)
  const handleAmountChange = (index: number, value: string) => {
    setValue(`bills.${index}.billAmount`, value);
  };

  // On blur of percentage field - calculate amount from percentage
  const handlePercentBlur = (index: number) => {
    let pct = parseFloat(watch(`bills.${index}.billPercent`) || "0");

    // Clamp percentage to valid range
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
      // Calculate amount from percentage
      const amount = calculateAmountFromPercentage(pct, totalValue);
      setValue(`bills.${index}.billAmount`, amount.toString());
      // Recalculate percentage from the rounded amount to ensure consistency
      const actualPercent = calculatePercentage(amount, totalValue);
      setValue(`bills.${index}.billPercent`, actualPercent.toFixed(2));
      validateAmount(index, amount.toString());
    }
  };

  // On blur of amount field - calculate percentage from amount
  const handleAmountBlur = (index: number) => {
    let amt = roundAmount(parseFloat(watch(`bills.${index}.billAmount`) || "0"));

    // Don't allow negative amounts
    if (amt < 0) {
      amt = 0;
      setValue(`bills.${index}.billAmount`, "0");
      setValue(`bills.${index}.billPercent`, "0");
      setAmountErrors(prev => ({ ...prev, [index]: false }));
      return;
    }

    // Set the rounded amount
    setValue(`bills.${index}.billAmount`, amt.toString());

    if (totalValue > 0) {
      // Calculate percentage from amount
      const percent = calculatePercentage(amt, totalValue);
      setValue(`bills.${index}.billPercent`, percent.toFixed(2));
    }

    validateAmount(index, amt.toString());
  };

  // On blur of total value - recalculate all amounts from their percentages
  const handleTotalValueBlur = () => {
    const total = roundAmount(parseFloat(watch("totalProjectValue") || "0"));

    watchedBills.forEach((bill, i) => {
      const percent = parseFloat(bill.billPercent || "0");
      // Recalculate amount from percentage using new total
      const amount = calculateAmountFromPercentage(percent, total);
      setValue(`bills.${i}.billAmount`, amount.toString());
      validateAmount(i, amount.toString());
    });

    // Also recalculate PG if using percentage mode
    if (pgEnabled && pgInputType === 'percentage') {
      const pgPercent = parseFloat(watch("pg.percent") || "0");
      if (pgPercent > 0 && total > 0) {
        const amount = calculateAmountFromPercentage(pgPercent, total);
        setValue("pg.amount", amount.toString());
      }
    } else if (pgEnabled && pgInputType === 'amount') {
      // Recalculate percentage if using amount mode
      const pgAmount = parseFloat(watch("pg.amount") || "0");
      if (pgAmount > 0 && total > 0) {
        const percent = calculatePercentage(pgAmount, total);
        setValue("pg.percent", percent.toFixed(2));
      }
    }
  };

  // Handle PG percentage blur - calculate amount from percentage
  const handlePgPercentBlur = () => {
    const percent = parseFloat(watch("pg.percent") || "0");
    if (percent > 100) {
      setValue("pg.percent", "100");
      toast.warning("PG percentage cannot exceed 100%");
    }
    if (percent < 0) {
      setValue("pg.percent", "0");
    }

    const validPercent = Math.min(Math.max(parseFloat(watch("pg.percent") || "0"), 0), 100);
    if (totalValue > 0 && validPercent > 0) {
      const amount = calculateAmountFromPercentage(validPercent, totalValue);
      setValue("pg.amount", amount.toString());
    }
  };

  // Handle PG amount blur - calculate percentage from amount
  const handlePgAmountBlur = () => {
    const amount = roundAmount(parseFloat(watch("pg.amount") || "0"));

    if (amount < 0) {
      setValue("pg.amount", "0");
      setValue("pg.percent", "0");
      return;
    }

    if (amount > totalValue) {
      toast.warning("PG amount cannot exceed total project value");
      setValue("pg.amount", totalValue.toString());
    }

    const validAmount = Math.min(amount, totalValue);
    setValue("pg.amount", validAmount.toString());

    if (totalValue > 0 && validAmount > 0) {
      const percent = calculatePercentage(validAmount, totalValue);
      setValue("pg.percent", percent.toFixed(2));
    }
  };

  const addDeliverable = () => {
    const deliverableCount = watchedBills.filter(b => b.billName.includes("Deliverable")).length;
    const finalIndex = watchedBills.findIndex(b => b.billName.toLowerCase().includes("final"));
    const indexToInsert = finalIndex !== -1 ? finalIndex : watchedBills.length;

    // Calculate default amount based on 5% of total value using financial utilities
    const defaultPercent = 5;
    const defaultAmount = totalValue > 0 ? calculateAmountFromPercentage(defaultPercent, totalValue) : 0;

    insert(indexToInsert, {
      billName: `Deliverable-${deliverableCount + 1}`,
      billPercent: defaultPercent.toString(),
      billAmount: defaultAmount.toString(),
      tentativeBillingDate: ""
    });
  };

  // Create new client immediately
  const handleCreateClient = async () => {
    const clientData = watch("newClient");
    if (!clientData.name || !clientData.name.trim()) {
      toast.error("Client name is required");
      return;
    }

    setCreatingClient(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
      });
      if (!res.ok) throw new Error();
      const newClient = await res.json();

      // Refresh clients list
      const clientsRes = await fetch('/api/clients');
      const clients = await clientsRes.json();
      setLookups(prev => ({ ...prev, clients }));

      // Select the newly created client
      setValue("clientId", newClient.id.toString());
      setIsNewClient(false);
      setValue("newClient", { name: "", contactPerson: "", contactEmail: "", contactPhone: "" });
      toast.success("Client created successfully");
    } catch (err) {
      toast.error("Failed to create client");
    } finally {
      setCreatingClient(false);
    }
  };

  // Create new category immediately
  const handleCreateCategory = async () => {
    const categoryData = watch("newCategory");
    if (!categoryData.name || !categoryData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setCreatingCategory(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      });
      if (!res.ok) throw new Error();
      const newCategory = await res.json();

      // Refresh categories list
      const categoriesRes = await fetch('/api/categories');
      const categories = await categoriesRes.json();
      setLookups(prev => ({ ...prev, categories }));

      // Select the newly created category
      setValue("categoryId", newCategory.id.toString());
      setIsNewCategory(false);
      setValue("newCategory", { name: "", description: "" });
      toast.success("Category created successfully");
    } catch (err) {
      toast.error("Failed to create category");
    } finally {
      setCreatingCategory(false);
    }
  };

  // Create new department immediately
  const handleCreateDepartment = async () => {
    const departmentData = watch("newDepartment");
    if (!departmentData.name || !departmentData.name.trim()) {
      toast.error("Department name is required");
      return;
    }

    setCreatingDepartment(true);
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(departmentData)
      });
      if (!res.ok) throw new Error();
      const newDepartment = await res.json();

      // Refresh departments list
      const departmentsRes = await fetch('/api/departments');
      const departments = await departmentsRes.json();
      setLookups(prev => ({ ...prev, departments }));

      // Select the newly created department
      setValue("departmentId", newDepartment.id.toString());
      setIsNewDepartment(false);
      setValue("newDepartment", { name: "", description: "" });
      toast.success("Department created successfully");
    } catch (err) {
      toast.error("Failed to create department");
    } finally {
      setCreatingDepartment(false);
    }
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

    // Validate percentage only if bypass is NOT checked (use epsilon tolerance)
    if (!ignoreTotalCheck && !isApproximatelyEqual(totalPercentage, 100, 0.01)) {
      toast.error(`Invalid Allocation: Total is ${totalPercentage.toFixed(2)}%. It must be exactly 100%.`);
      return;
    }

    // Validate total bill amounts don't exceed project value
    if (!ignoreTotalCheck && totalBillAmounts > totalValue) {
      toast.error(`Total bill amounts (৳${totalBillAmounts.toLocaleString('en-IN')}) exceed project value (৳${totalValue.toLocaleString('en-IN')})`);
      return;
    }

    setLoading(true);
    try {
      // Don't send newClient, newCategory, newDepartment, pg (handle separately) as they're created separately
      const { newClient, newCategory, newDepartment, pg: _, ...projectData } = data;

      const payload: any = {
        ...projectData
      };

      // Only add PG if enabled
      if (pgEnabled) {
        payload.pg = {
          inputType: pgInputType,
          percent: data.pg.percent,
          amount: data.pg.amount,
          bankSharePercent: data.pg.bankSharePercent
        };
      }

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
        newCategory: { name: "", description: "" },
        newDepartment: { name: "", description: "" },
        bills: [
          { billName: "Inception", billPercent: "20", billAmount: "", tentativeBillingDate: "" },
          { billName: "Final handover", billPercent: "80", billAmount: "", tentativeBillingDate: "" }
        ],
        pg: { percent: "", amount: "", bankSharePercent: "50" }
      });
      setIsNewClient(false);
      setIsNewCategory(false);
      setIsNewDepartment(false);
      setIgnoreTotalCheck(false);
      setPgEnabled(false);
      setPgInputType('percentage');
      setAmountErrors({});
      onProjectAdded();
    } catch (err) {
      toast.error("Process Failed: Please verify all required fields.");
    } finally {
      setLoading(false);
    }
  };

  // Check if form has meaningful data
  const hasFormData = () => {
    const formData = getValues();
    return !!(
      formData.projectName?.trim() ||
      formData.totalProjectValue ||
      formData.clientId ||
      formData.departmentId ||
      formData.categoryId ||
      (formData.bills && formData.bills.some(b => b.billName || b.billAmount || b.billPercent))
    );
  };

  const handleDialogClose = (newOpen: boolean) => {
    if (!newOpen && hasFormData()) {
      // Show confirmation if there's data
      setShowCloseConfirmation(true);
    } else if (!newOpen) {
      // No data, just close
      setOpen(false);
    } else {
      setOpen(newOpen);
    }
  };

  const confirmClose = () => {
    // Save draft when closing
    const formData = getValues();
    const draftData = {
      ...formData,
      ignoreTotalCheck,
      isNewClient,
      isNewCategory,
      isNewDepartment,
      pgEnabled,
      pgInputType
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    toast.info("Draft saved automatically");
    setShowCloseConfirmation(false);
    setOpen(false);
  };

  const cancelClose = () => {
    setShowCloseConfirmation(false);
  };

  // Get status color and message for budget allocation
  const getAllocationStatus = () => {
    // ALWAYS show actual values - never mislead
    const actualPercentDisplay = `${totalPercentage.toFixed(2)}%`;
    const actualAmountDisplay = `৳${totalBillAmounts.toLocaleString('en-IN')} / ৳${totalValue.toLocaleString('en-IN')}`;

    if (ignoreTotalCheck) {
      return {
        color: "info",
        icon: CheckCircle2,
        message: "Bypass Active",
        description: `${actualPercentDisplay} • ${actualAmountDisplay}`
      };
    }

    // Check amounts first - this is more critical
    if (isAmountOverAllocated) {
      return {
        color: "danger",
        icon: AlertCircle,
        message: "AMOUNT EXCEEDS TOTAL",
        description: `${actualPercentDisplay} • Exceeds by ৳${Math.abs(amountDifference).toLocaleString('en-IN')}`
      };
    }

    if (isOverAllocated) {
      return {
        color: "danger",
        icon: AlertCircle,
        message: "OVER-ALLOCATED",
        description: `${actualPercentDisplay} • Exceeded by ${Math.abs(percentDifference).toFixed(2)}%`
      };
    }

    if (isUnderAllocated) {
      return {
        color: "warning",
        icon: AlertTriangle,
        message: "UNDER-ALLOCATED",
        description: `${actualPercentDisplay} • ${Math.abs(percentDifference).toFixed(2)}% remaining`
      };
    }

    // Only show success if BOTH percentage AND amount are valid
    if (isApproximatelyEqual(totalPercentage, 100, 0.01) && totalBillAmounts <= totalValue) {
      return {
        color: "success",
        icon: CheckCircle2,
        message: "Perfect Allocation",
        description: `${actualPercentDisplay} • ${actualAmountDisplay}`
      };
    }

    // Fallback - should not reach here
    return {
      color: "warning",
      icon: AlertTriangle,
      message: "Check Allocation",
      description: `${actualPercentDisplay} • ${actualAmountDisplay}`
    };
  };

  const allocationStatus = getAllocationStatus();

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(amount));
    return `৳${formatted}`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogTrigger asChild>
          <Button className="gap-2 font-bold shadow-md hover:shadow-lg transition-all">
            <Plus className="w-4 h-4" /> Create New Project
          </Button>
        </DialogTrigger>
        <DialogContent
          className="max-w-5xl max-h-[95vh] overflow-y-auto"
          // onInteractOutside={(e) => {
          //   e.preventDefault();
          //   if (hasFormData()) {
          //     setShowCloseConfirmation(true);
          //   }
          // }}
          // onEscapeKeyDown={(e) => {
          //   e.preventDefault();
          //   if (hasFormData()) {
          //     setShowCloseConfirmation(true);
          //   }
          // }}
        >
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
                value={watch("totalProjectValue") || ""}
                placeholder="0"
                className="h-11 font-black text-primary text-lg bg-primary/5"
                required
                onChange={(e) => setValue("totalProjectValue", e.target.value)}
                onBlur={handleTotalValueBlur}
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
              <Select
                value={isNewCategory ? "new" : watch("categoryId")}
                onValueChange={(v) => {
                  if (v === "new") {
                    setIsNewCategory(true);
                    setValue("categoryId", "");
                  } else {
                    setIsNewCategory(false);
                    setValue("categoryId", v);
                  }
                }}
              >
                <SelectTrigger className="h-10"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new" className="text-primary font-black">+ Create New Category</SelectItem>
                  {lookups.categories.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Division</Label>
              <Select
                value={isNewDepartment ? "new" : watch("departmentId")}
                onValueChange={(v) => {
                  if (v === "new") {
                    setIsNewDepartment(true);
                    setValue("departmentId", "");
                  } else {
                    setIsNewDepartment(false);
                    setValue("departmentId", v);
                  }
                }}
              >
                <SelectTrigger className="h-10"><SelectValue placeholder="Dept" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new" className="text-primary font-black">+ Create New Department</SelectItem>
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
            <div className="p-6 bg-primary/[0.02] border border-primary/10 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input placeholder="Client Name *" {...register("newClient.name")} required />
                <Input placeholder="POC Person" {...register("newClient.contactPerson")} />
                <Input placeholder="Email" type="email" {...register("newClient.contactEmail")} />
                <Input placeholder="Contact No" {...register("newClient.contactPhone")} />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleCreateClient}
                  disabled={creatingClient}
                  className="h-9 font-bold"
                >
                  {creatingClient ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Client"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsNewClient(false);
                    setValue("clientId", "");
                    setValue("newClient", { name: "", contactPerson: "", contactEmail: "", contactPhone: "" });
                  }}
                  className="h-9 font-bold"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {isNewCategory && (
            <div className="p-6 bg-primary/[0.02] border border-primary/10 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Category Name *" {...register("newCategory.name")} required />
                <Input placeholder="Description (optional)" {...register("newCategory.description")} />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={creatingCategory}
                  className="h-9 font-bold"
                >
                  {creatingCategory ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Category"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsNewCategory(false);
                    setValue("newCategory", { name: "", description: "" });
                  }}
                  className="h-9 font-bold"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {isNewDepartment && (
            <div className="p-6 bg-primary/[0.02] border border-primary/10 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Department Name *" {...register("newDepartment.name")} required />
                <Input placeholder="Description (optional)" {...register("newDepartment.description")} />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleCreateDepartment}
                  disabled={creatingDepartment}
                  className="h-9 font-bold"
                >
                  {creatingDepartment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Department"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsNewDepartment(false);
                    setValue("newDepartment", { name: "", description: "" });
                  }}
                  className="h-9 font-bold"
                >
                  Cancel
                </Button>
              </div>
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
                      value={watch(`bills.${index}.billPercent`) || ""}
                      className="font-black text-primary"
                      onChange={(e) => handlePercentChange(index, e.target.value)}
                      onBlur={() => handlePercentBlur(index)}
                      required
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
                      value={watch(`bills.${index}.billAmount`) || ""}
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
                  <div className="text-xs font-bold opacity-80">{allocationStatus.description}</div>
                </div>
              </div>
              {ignoreTotalCheck && (
                <span className="text-[10px] font-black bg-primary/20 px-3 py-1 rounded-full uppercase">
                  Bypass Active
                </span>
              )}
            </div>
          </div>

          {/* Project Guarantee (PG) Section */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <Label className="text-xl font-black uppercase tracking-tight">
                Project Guarantee (PG)
              </Label>
              <Checkbox
                checked={pgEnabled}
                onCheckedChange={(checked) => setPgEnabled(!!checked)}
              />
            </div>

            {pgEnabled && (
              <div className="space-y-4 p-4 bg-secondary/10 rounded-xl border border-border/50">
                {/* Input Type Toggle */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={pgInputType === 'percentage' ? 'default' : 'outline'}
                    onClick={() => setPgInputType('percentage')}
                    className="flex-1 h-10 font-bold"
                  >
                    By Percentage
                  </Button>
                  <Button
                    type="button"
                    variant={pgInputType === 'amount' ? 'default' : 'outline'}
                    onClick={() => setPgInputType('amount')}
                    className="flex-1 h-10 font-bold"
                  >
                    By Amount
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Percentage or Amount Input */}
                  {pgInputType === 'percentage' ? (
                    <div className="space-y-2">
                      <Label htmlFor="pgPercent" className="text-[10px] font-black uppercase text-muted-foreground">
                        PG Percentage (%)
                      </Label>
                      <Input
                        id="pgPercent"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        {...register("pg.percent")}
                        placeholder="e.g., 5"
                        className="h-10 font-bold"
                        onBlur={handlePgPercentBlur}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="pgAmount" className="text-[10px] font-black uppercase text-muted-foreground">
                        PG Amount (BDT)
                      </Label>
                      <Input
                        id="pgAmount"
                        type="number"
                        min="0"
                        {...register("pg.amount")}
                        placeholder="e.g., 50000"
                        className="h-10 font-bold"
                        onBlur={handlePgAmountBlur}
                      />
                    </div>
                  )}

                  {/* Bank Share */}
                  <div className="space-y-2">
                    <Label htmlFor="pgBankShare" className="text-[10px] font-black uppercase text-muted-foreground">
                      Bank Share (%)
                    </Label>
                    <Input
                      id="pgBankShare"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...register("pg.bankSharePercent")}
                      placeholder="e.g., 50"
                      className="h-10 font-bold"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Your share: {100 - parseFloat(watch("pg.bankSharePercent") || "0")}%
                    </p>
                  </div>
                </div>

                {/* Display Calculated Values */}
                {calculatedPgValues && calculatedPgValues.pgAmount > 0 && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2 text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-xs font-black uppercase text-primary">PG Calculation</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total PG Amount:</span>
                      <span className="font-bold">{formatCurrency(calculatedPgValues.pgAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">Your Deposit ({100 - calculatedPgValues.bankSharePercent}%):</span>
                      <span className="font-bold text-primary">{formatCurrency(calculatedPgValues.userDeposit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bank Share ({calculatedPgValues.bankSharePercent}%):</span>
                      <span className="font-bold">{formatCurrency(calculatedPgValues.bankShare)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
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
            <Button
              type="submit"
              className="flex-1 h-14 text-lg font-black uppercase tracking-widest"
              disabled={loading || !canSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Processing...
                </>
              ) : !canSubmit ? (
                "Fix Validation Errors"
              ) : (
                "Authorize Project Creation"
              )}
            </Button>
          </div>
        </form>
        </DialogContent>
      </Dialog>

      {/* Close Confirmation Dialog */}
      <Dialog open={showCloseConfirmation} onOpenChange={cancelClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Confirm Close
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              You have unsaved changes in this form. Closing will save your progress as a draft.
            </p>
            <p className="text-xs text-muted-foreground font-bold">
              Your draft will be automatically loaded when you reopen this dialog.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={cancelClose}
              className="font-bold"
            >
              Continue Editing
            </Button>
            <Button
              onClick={confirmClose}
              className="font-bold bg-amber-500 hover:bg-amber-600"
            >
              Close & Save Draft
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}