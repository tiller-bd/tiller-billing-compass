// src/components/projects/EditProjectDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2, AlertTriangle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

interface Project {
  id: number;
  projectName: string;
  startDate?: string | null;
  endDate?: string | null;
  totalProjectValue?: number | null;
  clientId: number;
  departmentId: number;
  categoryId: number;
  client?: { id: number; name: string };
  department?: { id: number; name: string };
  category?: { id: number; name: string };
  pgPercent?: number | null;
  pgAmount?: number | null;
  pgBankSharePercent?: number | null;
  pgUserDeposit?: number | null;
  pgStatus?: string | null;
  pgClearanceDate?: string | null;
}

interface EditProjectDialogProps {
  project: Project;
  onSuccess: () => void;
}

interface ProjectFormData {
  projectName: string;
  startDate: string;
  endDate: string;
  totalProjectValue: string;
  clientId: string;
  departmentId: string;
  categoryId: string;
  pg?: {
    inputType: 'percentage' | 'amount';
    percent: string;
    amount: string;
    bankSharePercent: string;
  };
}

export function EditProjectDialog({ project, onSuccess }: EditProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingData, setPendingData] = useState<ProjectFormData | null>(null);

  // PG state
  const [pgEnabled, setPgEnabled] = useState(false);
  const [pgInputType, setPgInputType] = useState<'percentage' | 'amount'>('percentage');
  const [calculatedPgValues, setCalculatedPgValues] = useState<{
    pgAmount: number;
    userDeposit: number;
    bankShare: number;
  } | null>(null);

  // Dropdown data
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  const formatDateForInput = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toISOString().split("T")[0];
  };

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ProjectFormData>({
    defaultValues: {
      projectName: project.projectName || "",
      startDate: formatDateForInput(project.startDate),
      endDate: formatDateForInput(project.endDate),
      totalProjectValue: String(project.totalProjectValue || 0),
      clientId: String(project.clientId),
      departmentId: String(project.departmentId),
      categoryId: String(project.categoryId),
      pg: {
        inputType: 'percentage',
        percent: String(project.pgPercent || ''),
        amount: String(project.pgAmount || ''),
        bankSharePercent: String(project.pgBankSharePercent || '0'),
      },
    },
  });

  // Fetch dropdown data
  useEffect(() => {
    if (open) {
      // Fetch clients
      fetch("/api/clients")
        .then((res) => res.json())
        .then((data) => setClients(data || []))
        .catch(() => setClients([]));

      // Fetch departments
      fetch("/api/departments")
        .then((res) => res.json())
        .then((data) => setDepartments(data || []))
        .catch(() => setDepartments([]));

      // Fetch categories
      fetch("/api/categories")
        .then((res) => res.json())
        .then((data) => setCategories(data || []))
        .catch(() => setCategories([]));
    }
  }, [open]);

  // Reset form when project changes
  useEffect(() => {
    if (open) {
      // Pre-populate PG state
      const hasPg = project.pgAmount && Number(project.pgAmount) > 0;
      setPgEnabled(!!hasPg);

      if (hasPg) {
        // Determine input type based on which value is more precise
        const pgPercent = Number(project.pgPercent || 0);
        const pgAmount = Number(project.pgAmount || 0);
        setPgInputType(pgPercent > 0 ? 'percentage' : 'amount');

        // Calculate and display values
        const totalValue = Number(project.totalProjectValue || 0);
        const bankShare = Number(project.pgBankSharePercent || 0);
        const userDeposit = Number(project.pgUserDeposit || 0);
        const bankShareAmount = pgAmount - userDeposit;

        setCalculatedPgValues({
          pgAmount,
          userDeposit,
          bankShare: bankShareAmount,
        });
      } else {
        setCalculatedPgValues(null);
      }

      reset({
        projectName: project.projectName || "",
        startDate: formatDateForInput(project.startDate),
        endDate: formatDateForInput(project.endDate),
        totalProjectValue: String(project.totalProjectValue || 0),
        clientId: String(project.clientId),
        departmentId: String(project.departmentId),
        categoryId: String(project.categoryId),
        pg: {
          inputType: 'percentage',
          percent: String(project.pgPercent || ''),
          amount: String(project.pgAmount || ''),
          bankSharePercent: String(project.pgBankSharePercent || '0'),
        },
      });
    }
  }, [open, project, reset]);

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(amount));
    return `৳${formatted}`;
  };

  // PG calculation handlers
  const handlePgPercentBlur = () => {
    const percent = parseFloat(watch("pg.percent") || "0");
    const totalValue = parseFloat(watch("totalProjectValue") || "0");
    const bankSharePercent = parseFloat(watch("pg.bankSharePercent") || "0");

    if (totalValue > 0 && percent > 0) {
      const amount = (percent / 100) * totalValue;
      setValue("pg.amount", amount.toString());

      const userSharePercent = 100 - bankSharePercent;
      const userDeposit = (userSharePercent / 100) * amount;
      const bankShare = amount - userDeposit;

      setCalculatedPgValues({
        pgAmount: amount,
        userDeposit,
        bankShare,
      });
    } else {
      setCalculatedPgValues(null);
    }
  };

  const handlePgAmountBlur = () => {
    const amount = parseFloat(watch("pg.amount") || "0");
    const totalValue = parseFloat(watch("totalProjectValue") || "0");
    const bankSharePercent = parseFloat(watch("pg.bankSharePercent") || "0");

    if (totalValue > 0 && amount > 0) {
      const percent = (amount / totalValue) * 100;
      setValue("pg.percent", percent.toString());

      const userSharePercent = 100 - bankSharePercent;
      const userDeposit = (userSharePercent / 100) * amount;
      const bankShare = amount - userDeposit;

      setCalculatedPgValues({
        pgAmount: amount,
        userDeposit,
        bankShare,
      });
    } else {
      setCalculatedPgValues(null);
    }
  };

  const handleBankShareBlur = () => {
    // Recalculate user deposit based on current PG amount and new bank share
    const amount = parseFloat(watch("pg.amount") || "0");
    const bankSharePercent = parseFloat(watch("pg.bankSharePercent") || "0");

    if (amount > 0) {
      const userSharePercent = 100 - bankSharePercent;
      const userDeposit = (userSharePercent / 100) * amount;
      const bankShare = amount - userDeposit;

      setCalculatedPgValues({
        pgAmount: amount,
        userDeposit,
        bankShare,
      });
    }
  };

  const onSubmit = (data: ProjectFormData) => {
    setPendingData(data);
    setShowConfirmation(true);
  };

  const handleConfirmUpdate = async () => {
    if (!pendingData) return;

    setLoading(true);
    setShowConfirmation(false);

    try {
      // Build payload with PG data if enabled
      const payload: any = {
        projectName: pendingData.projectName,
        startDate: pendingData.startDate || null,
        endDate: pendingData.endDate || null,
        totalProjectValue: Number(pendingData.totalProjectValue),
        clientId: Number(pendingData.clientId),
        departmentId: Number(pendingData.departmentId),
        categoryId: Number(pendingData.categoryId),
      };

      // Include PG data if enabled
      if (pgEnabled && pendingData.pg) {
        payload.pg = {
          inputType: pgInputType,
          percent: pendingData.pg.percent,
          amount: pendingData.pg.amount,
          bankSharePercent: pendingData.pg.bankSharePercent,
        };
      } else {
        // Clear PG if disabled
        payload.pg = null;
      }

      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update project");
      }

      toast.success("Project updated successfully");
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to update project");
    } finally {
      setLoading(false);
      setPendingData(null);
    }
  };

  const watchedValue = watch("totalProjectValue");

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 font-bold text-xs">
            <Pencil size={14} /> Edit Project
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase flex items-center gap-2">
              <Pencil className="text-primary" size={20} /> Edit Project
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="projectName" className="text-xs font-black uppercase text-muted-foreground">
                Project Name *
              </Label>
              <Input
                id="projectName"
                {...register("projectName", { required: "Project name is required" })}
                className="h-11 font-medium"
                placeholder="Enter project name"
              />
              {errors.projectName && (
                <p className="text-xs text-destructive font-bold">{errors.projectName.message}</p>
              )}
            </div>

            {/* Total Project Value */}
            <div className="space-y-2">
              <Label htmlFor="totalProjectValue" className="text-xs font-black uppercase text-muted-foreground">
                Total Project Value (BDT) *
              </Label>
              <Input
                id="totalProjectValue"
                type="number"
                step="1"
                min="0"
                {...register("totalProjectValue", {
                  required: "Project value is required",
                  min: { value: 0, message: "Value cannot be negative" },
                })}
                className="h-11 font-bold text-lg"
                placeholder="0"
              />
              {watchedValue && Number(watchedValue) > 0 && (
                <p className="text-xs text-muted-foreground">
                  Display: <span className="font-bold text-primary">{formatCurrency(Number(watchedValue))}</span>
                </p>
              )}
              {errors.totalProjectValue && (
                <p className="text-xs text-destructive font-bold">{errors.totalProjectValue.message}</p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-xs font-black uppercase text-muted-foreground">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register("startDate")}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-xs font-black uppercase text-muted-foreground">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register("endDate")}
                  className="h-10"
                />
              </div>
            </div>

            {/* Client */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-muted-foreground">Client</Label>
              <Select
                value={watch("clientId")}
                onValueChange={(value) => setValue("clientId", value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={String(client.id)}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-muted-foreground">Department</Label>
              <Select
                value={watch("departmentId")}
                onValueChange={(value) => setValue("departmentId", value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-muted-foreground">Category</Label>
              <Select
                value={watch("categoryId")}
                onValueChange={(value) => setValue("categoryId", value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project Guarantee (PG) Section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="pgEnabled"
                  checked={pgEnabled}
                  onCheckedChange={(checked) => {
                    setPgEnabled(!!checked);
                    if (!checked) {
                      setCalculatedPgValues(null);
                      setValue("pg.percent", "");
                      setValue("pg.amount", "");
                      setValue("pg.bankSharePercent", "0");
                    }
                  }}
                />
                <Label
                  htmlFor="pgEnabled"
                  className="text-xs font-black uppercase text-muted-foreground cursor-pointer"
                >
                  Project Guarantee (PG)
                </Label>
              </div>

              {pgEnabled && (
                <div className="space-y-4 p-4 bg-secondary/10 rounded-xl border border-primary/10">
                  {/* Input Type Toggle */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={pgInputType === 'percentage' ? 'default' : 'outline'}
                      onClick={() => setPgInputType('percentage')}
                      className="flex-1 font-bold"
                    >
                      By Percentage
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={pgInputType === 'amount' ? 'default' : 'outline'}
                      onClick={() => setPgInputType('amount')}
                      className="flex-1 font-bold"
                    >
                      By Amount
                    </Button>
                  </div>

                  {/* PG Input Field */}
                  {pgInputType === 'percentage' ? (
                    <div className="space-y-2">
                      <Label htmlFor="pgPercent" className="text-xs font-bold text-muted-foreground">
                        PG Percentage (%)
                      </Label>
                      <Input
                        id="pgPercent"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        {...register("pg.percent")}
                        onBlur={handlePgPercentBlur}
                        className="h-11 font-bold"
                        placeholder="0.00"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="pgAmount" className="text-xs font-bold text-muted-foreground">
                        PG Amount (BDT)
                      </Label>
                      <Input
                        id="pgAmount"
                        type="number"
                        step="1"
                        min="0"
                        {...register("pg.amount")}
                        onBlur={handlePgAmountBlur}
                        className="h-11 font-bold"
                        placeholder="0"
                      />
                    </div>
                  )}

                  {/* Bank Share Percentage */}
                  <div className="space-y-2">
                    <Label htmlFor="pgBankShare" className="text-xs font-bold text-muted-foreground">
                      Bank Share (%)
                    </Label>
                    <Input
                      id="pgBankShare"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...register("pg.bankSharePercent")}
                      onBlur={handleBankShareBlur}
                      className="h-11 font-bold"
                      placeholder="0.00"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Your share: {100 - Number(watch("pg.bankSharePercent") || 0)}%
                    </p>
                  </div>

                  {/* Calculated Values Display */}
                  {calculatedPgValues && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                      <p className="text-xs font-black uppercase text-muted-foreground mb-3">
                        Calculated PG Breakdown
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Total PG Amount:</span>
                        <span className="text-sm font-bold text-primary">
                          {formatCurrency(calculatedPgValues.pgAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Your Deposit:</span>
                        <span className="text-sm font-bold text-green-600">
                          {formatCurrency(calculatedPgValues.userDeposit)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Bank Share:</span>
                        <span className="text-sm font-bold text-blue-600">
                          {formatCurrency(calculatedPgValues.bankShare)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 font-black uppercase tracking-wider"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Project"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Project Update
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Please review the changes before confirming:
                </p>

                {pendingData && (
                  <div className="p-4 bg-muted/30 rounded-lg space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Project Name:</span>
                      <span className="font-bold">{pendingData.projectName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Total Value:</span>
                      <span className="font-bold text-primary">
                        {formatCurrency(Number(pendingData.totalProjectValue))}
                      </span>
                    </div>
                    {pendingData.startDate && (
                      <div className="flex justify-between">
                        <span className="font-medium">Start Date:</span>
                        <span className="font-bold">
                          {new Date(pendingData.startDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                    {pendingData.endDate && (
                      <div className="flex justify-between">
                        <span className="font-medium">End Date:</span>
                        <span className="font-bold">
                          {new Date(pendingData.endDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground italic">
                  This will update the project details in the system.
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
                "Yes, Update Project"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
