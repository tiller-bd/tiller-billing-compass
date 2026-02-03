"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Receipt, TrendingUp, Sparkles, Target, CheckCircle2, ChevronDown, ChevronUp, Settings2, ChevronLeft, ChevronRight, Pencil, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line
} from 'recharts';
import { cn } from '@/lib/utils';
import { RecordPaymentDialog } from '@/components/billing/RecordPaymentDialog';
import { EditProjectDialog } from '@/components/projects/EditProjectDialog';
import { EditBillDialog } from '@/components/billing/EditBillDialog';
import { ChangeStatusDialog } from '@/components/projects/ChangeStatusDialog';
import { ProjectFilesDialog } from '@/components/projects/ProjectFilesDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableHeader, useSorting } from '@/components/ui/sortable-header';

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [milestonesExpanded, setMilestonesExpanded] = useState(true);
  const [narrativeExpanded, setNarrativeExpanded] = useState(false);
  const [chartPosition, setChartPosition] = useState<'left' | 'right'>('left');
  const router = useRouter();

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState({
    phase: true,
    allocation: true,
    expected: true,
    received: true,
    remaining: true,
    tentativeDate: true,
    receivedDate: true,
    status: true,
    actions: true
  });

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(res => res.json())
      .then(data => {
        setProject(data);
        setLoading(false);
      });
  }, [id]);

  const handleClearPg = async () => {
    if (!confirm('Are you sure you want to mark the Project Guarantee as cleared?')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${id}/clear-pg`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to clear PG');
      }

      toast.success('Project Guarantee marked as cleared');

      // Refresh project data
      const updatedProject = await response.json();
      setProject(updatedProject);
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear PG');
    }
  };

  const formatCurrency = (amount: number) => {
    // Use Indian numbering system (Lakh/Crore): 1,00,00,000 for 1 crore, 1,00,000 for 1 lakh
    const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(amount));
    return `৳${formatted}`;
  };

  const formatNumber = (num: number) =>
    new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(num));

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!project) return null;

    const total = Number(project.totalProjectValue || 0);
    const bills = project.bills || [];
    const received = bills.reduce((sum: number, b: any) => sum + Number(b.receivedAmount || 0), 0);
    const remaining = total - received;
    const receivedPct = total > 0 ? (received / total) * 100 : 0;
    const remainingPct = 100 - receivedPct;

    return { total, received, remaining, receivedPct, remainingPct };
  }, [project]);

  // Prepare bills with computed fields for sorting
  const billsWithComputed = useMemo(() => {
    if (!project?.bills) return [];
    return project.bills.map((bill: any) => ({
      ...bill,
      _billAmount: Number(bill.billAmount || 0),
      _receivedAmount: Number(bill.receivedAmount || 0),
      _remaining: Number(bill.billAmount || 0) - Number(bill.receivedAmount || 0),
      _billPercent: Number(bill.billPercent || 0),
      _tentativeDate: bill.tentativeBillingDate ? new Date(bill.tentativeBillingDate).getTime() : 0,
      _receivedDate: bill.receivedDate ? new Date(bill.receivedDate).getTime() : 0,
    }));
  }, [project]);

  const { sortedData: sortedBills, sortConfig, handleSort } = useSorting(billsWithComputed);

  // Time series data for line chart
  const timeSeriesData = useMemo(() => {
    if (!project?.bills) return [];

    const sorted = [...project.bills].sort((a, b) =>
      new Date(a.tentativeBillingDate || 0).getTime() - new Date(b.tentativeBillingDate || 0).getTime()
    );

    let cumulative = 0;
    return sorted.map((bill: any) => {
      cumulative += Number(bill.receivedAmount || 0);
      return {
        date: bill.tentativeBillingDate ? format(new Date(bill.tentativeBillingDate), 'MMM dd, yy') : 'N/A',
        milestone: bill.billName.length > 15 ? bill.billName.substring(0, 12) + '..' : bill.billName,
        expected: Number(bill.billAmount),
        received: Number(bill.receivedAmount || 0),
        cumulative: cumulative
      };
    });
  }, [project]);

  const renderIntelligenceNarrative = useMemo(() => {
    if (!project || !metrics) return null;

    const { total, received, receivedPct, remaining } = metrics;
    const bills = project.bills || [];
    const partialCount = bills.filter((b: any) => b.status === 'PARTIAL').length;
    const nextBill = bills.find((b: any) => b.status !== 'PAID');

    return (
      <div className="space-y-3 md:space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
        <p className="text-sm md:text-xl lg:text-2xl">
          The project <span className="font-bold text-primary underline decoration-primary/30 underline-offset-4">"{project.projectName}"</span> represents a strategic
          engagement valued at <span className="text-base md:text-2xl lg:text-3xl font-black text-primary tracking-tighter mx-1">{formatCurrency(total)}</span>.
        </p>

        <p className="text-sm md:text-xl lg:text-2xl">
          To date, the financial received stands at a healthy <span className="text-lg md:text-3xl font-black text-success mx-1">{receivedPct.toFixed(1)}%</span>,
          with a total of <span className="font-bold text-success underline decoration-success/30">{formatCurrency(received)}</span> successfully collected.
          {partialCount > 0 && (
            <> This includes <span className="font-bold text-amber-500">{partialCount} milestone(s)</span> currently in <span className="italic text-amber-600">partial received</span>.</>
          )}
        </p>

        {nextBill && (
          <p className="text-sm md:text-xl lg:text-2xl">
            The immediate collection target is focused on the <span className="font-bold text-slate-900 dark:text-white">"{nextBill.billName}"</span> phase.
            This milestone accounts for <span className="font-bold px-1 md:px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs md:text-base">{nextBill.billPercent}%</span> of the
            contract, with <span className="font-bold text-primary">{formatCurrency(nextBill.billAmount)}</span> scheduled.
          </p>
        )}

        <p className="text-sm md:text-xl lg:text-2xl pt-2 border-t border-slate-200 dark:border-slate-800">
          Outstanding exposure: <span className="text-lg md:text-3xl font-black text-destructive/80 mx-1">{formatCurrency(remaining)}</span>.
        </p>
      </div>
    );
  }, [project, metrics]);

  if (loading) return <div className="p-4 md:p-10 space-y-4 md:space-y-6"><Skeleton className="h-24 md:h-32 w-full" /><Skeleton className="h-48 md:h-64 w-full" /></div>;
  if (!project || !metrics) return null;

  return (
    <div className="space-y-6 md:space-y-10 pb-20">

      {/* 1. Header Row */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => router.push('/projects')}
          className="gap-1 md:gap-2 -ml-2 text-muted-foreground  transition-colors text-xs md:text-sm px-2 md:px-4">
          <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Back to Projects</span>
        </Button>
        <div className="flex items-center gap-2">
          <ChangeStatusDialog
            project={project}
            onSuccess={() => {
              fetch(`/api/projects/${id}`)
                .then(res => res.json())
                .then(data => setProject(data));
            }}
          />
          <EditProjectDialog
            project={project}
            onSuccess={() => {
              fetch(`/api/projects/${id}`)
                .then(res => res.json())
                .then(data => setProject(data));
            }}
          />
          <ProjectFilesDialog projectId={project.id} />
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-2 md:px-3 py-1 font-bold text-xs">
            {project.category?.name}
          </Badge>
        </div>
      </div>

      {/* 2. Top Level Metrics - Enhanced with Received & Remaining */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="glass-card p-4 md:p-8 rounded-2xl md:rounded-3xl border-border/50 flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.15em] md:tracking-[0.2em] mb-1 md:mb-2">{project.client?.name}</p>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight text-foreground mb-4 md:mb-6">{project.projectName}</h1>
            <div className="flex flex-wrap gap-4 md:gap-8">
              <div>
                <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase mb-0.5 md:mb-1">Contract Value</p>
                <p className="text-lg md:text-2xl font-bold">{formatCurrency(metrics.total)}</p>
              </div>
              <div>
                <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase mb-0.5 md:mb-1">Department</p>
                <p className="text-lg md:text-2xl font-bold text-slate-500">{project.department?.name}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {/* Received Card */}
          <div className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl border-t-4 md:border-t-8 border-success flex flex-col items-center justify-center text-center shadow-xl shadow-success/5">
            <Target className="w-5 h-5 md:w-6 md:h-6 text-success mb-1 md:mb-2" />
            <p className="text-[8px] md:text-[9px] font-black text-muted-foreground uppercase tracking-widest">Received</p>
            <p className="text-2xl md:text-4xl font-black text-success my-1 md:my-2">
              {Math.round(metrics.receivedPct)}%
            </p>
            <p className="text-[10px] md:text-xs font-bold text-muted-foreground">
              {formatCurrency(metrics.received)}
            </p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 md:h-1.5 rounded-full mt-2 md:mt-3">
              <div
                className="bg-success h-full transition-all duration-1000 rounded-full"
                style={{ width: `${metrics.receivedPct}%` }}
              />
            </div>
          </div>

          {/* Remaining Card */}
          <div className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl border-t-4 md:border-t-8 border-destructive/60 flex flex-col items-center justify-center text-center shadow-xl shadow-destructive/5">
            <Target className="w-5 h-5 md:w-6 md:h-6 text-destructive/80 mb-1 md:mb-2" />
            <p className="text-[8px] md:text-[9px] font-black text-muted-foreground uppercase tracking-widest">Remaining</p>
            <p className="text-2xl md:text-4xl font-black text-destructive/80 my-1 md:my-2">
              {Math.round(metrics.remainingPct)}%
            </p>
            <p className="text-[10px] md:text-xs font-bold text-muted-foreground">
              {formatCurrency(metrics.remaining)}
            </p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 md:h-1.5 rounded-full mt-2 md:mt-3">
              <div
                className="bg-destructive/60 h-full transition-all duration-1000 rounded-full"
                style={{ width: `${metrics.remainingPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Project Guarantee (PG) Card */}
      {project.pgAmount && Number(project.pgAmount) > 0 && (
        <div className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl border-l-4 md:border-l-8 border-blue-500 shadow-xl shadow-blue-500/5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3 md:space-y-4">
              <div className="flex items-center gap-2 md:gap-3">
                <Shield className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-muted-foreground">
                  Project Guarantee (PG)
                </h3>
                <Badge
                  className={cn(
                    "font-black text-[9px] md:text-[10px] px-2 md:px-2.5",
                    project.pgStatus === 'CLEARED'
                      ? "bg-success/10 text-success border-success/30"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                  )}
                  variant="outline"
                >
                  {project.pgStatus || 'PENDING'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div>
                  <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase mb-1">
                    Total PG Amount
                  </p>
                  <p className="text-base md:text-xl font-black text-blue-600">
                    {formatCurrency(Number(project.pgAmount))}
                  </p>
                  <p className="text-[9px] md:text-[10px] text-muted-foreground">
                    {Number(project.pgPercent || 0).toFixed(2)}% of project
                  </p>
                </div>

                <div>
                  <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase mb-1">
                    Your Deposit
                  </p>
                  <p className="text-base md:text-xl font-black text-green-600">
                    {formatCurrency(Number(project.pgUserDeposit || 0))}
                  </p>
                  <p className="text-[9px] md:text-[10px] text-muted-foreground">
                    Your share: {100 - Number(project.pgBankSharePercent || 0)}%
                  </p>
                </div>

                <div>
                  <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase mb-1">
                    Bank Share
                  </p>
                  <p className="text-base md:text-xl font-black text-slate-600 dark:text-slate-400">
                    {formatCurrency(
                      Number(project.pgAmount) - Number(project.pgUserDeposit || 0)
                    )}
                  </p>
                  <p className="text-[9px] md:text-[10px] text-muted-foreground">
                    Bank share: {Number(project.pgBankSharePercent || 0)}%
                  </p>
                </div>

                {project.pgClearanceDate && (
                  <div>
                    <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase mb-1">
                      Clearance Date
                    </p>
                    <p className="text-sm md:text-base font-bold text-success">
                      {format(new Date(project.pgClearanceDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {project.pgStatus !== 'CLEARED' && (
              <div className="shrink-0">
                <Button
                  onClick={handleClearPg}
                  variant="outline"
                  size="sm"
                  className="gap-2 font-bold border-success/30 text-success hover:bg-success/10"
                >
                  <CheckCircle2 size={14} />
                  <span className="hidden md:inline">Mark as Cleared</span>
                  <span className="md:hidden">Clear</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Milestone Itemization - Collapsible with Column Settings */}
      <div className="space-y-3 md:space-y-4">
        <div className="flex items-center justify-between px-1 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Receipt className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" />
            <h3 className="font-black uppercase tracking-wider text-xs md:text-sm truncate">Milestones</h3>
            <Badge variant="outline" className="text-[10px] md:text-xs shrink-0">
              {project.bills?.length || 0}
            </Badge>
          </div>
          <div className="flex gap-1 md:gap-2 shrink-0">
            {/* Column settings - hidden on mobile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 md:gap-2 hidden md:flex">
                  <Settings2 size={14} /> Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.phase}
                  onCheckedChange={(checked) => setColumnVisibility(prev => ({ ...prev, phase: checked }))}
                >
                  Phase Description
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.allocation}
                  onCheckedChange={(checked) => setColumnVisibility(prev => ({ ...prev, allocation: checked }))}
                >
                  Allocation
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.expected}
                  onCheckedChange={(checked) => setColumnVisibility(prev => ({ ...prev, expected: checked }))}
                >
                  Expected
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.received}
                  onCheckedChange={(checked) => setColumnVisibility(prev => ({ ...prev, received: checked }))}
                >
                  Received
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.remaining}
                  onCheckedChange={(checked) => setColumnVisibility(prev => ({ ...prev, remaining: checked }))}
                >
                  Remaining
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.tentativeDate}
                  onCheckedChange={(checked) => setColumnVisibility(prev => ({ ...prev, tentativeDate: checked }))}
                >
                  Tentative Date
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.receivedDate}
                  onCheckedChange={(checked) => setColumnVisibility(prev => ({ ...prev, receivedDate: checked }))}
                >
                  Received Date
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.status}
                  onCheckedChange={(checked) => setColumnVisibility(prev => ({ ...prev, status: checked }))}
                >
                  Status
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMilestonesExpanded(!milestonesExpanded)}
              className="gap-1 md:gap-2 text-xs md:text-sm h-8 md:h-9"
            >
              {milestonesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              <span className="hidden sm:inline">{milestonesExpanded ? 'Collapse' : 'Expand'}</span>
            </Button>
          </div>
        </div>

        {milestonesExpanded && (
          <>
            {/* Mobile Card View for Milestones */}
            <div className="md:hidden space-y-3">
              {sortedBills.map((bill: any) => {
                const remaining = bill._remaining;
                const receivedPctOfProject = metrics.total > 0
                  ? ((bill._receivedAmount / metrics.total) * 100).toFixed(1)
                  : '0';

                return (
                  <div key={bill.id} className="glass-card rounded-xl p-4 border-border/50">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm truncate">{bill.billName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {bill.tentativeBillingDate
                            ? format(new Date(bill.tentativeBillingDate), 'MMM dd, yyyy')
                            : 'No date'}
                        </p>
                      </div>
                      <Badge className={cn(
                        "font-black text-[9px] px-2 shrink-0",
                        bill.status === 'PAID' ? "bg-success/10 text-success border-success/30" :
                          bill.status === 'PARTIAL' ? "bg-amber-500/10 text-amber-600 border-amber-500/30" :
                            "bg-slate-100 text-slate-500 border-slate-200"
                      )} variant="outline">
                        {bill.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center mb-3">
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold">Alloc</p>
                        <p className="text-sm font-bold">{bill.billPercent}%</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold">Expected</p>
                        <p className="text-sm font-bold">{formatCurrency(bill._billAmount)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold">Received</p>
                        <p className="text-sm font-bold text-success">{formatCurrency(bill._receivedAmount)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        Remaining: <span className="font-bold text-destructive/80">{formatCurrency(remaining)}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <EditBillDialog
                          bill={bill}
                          totalProjectValue={metrics.total}
                          onSuccess={() => {
                            fetch(`/api/projects/${id}`)
                              .then(res => res.json())
                              .then(data => setProject(data));
                          }}
                          triggerButton={
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Pencil size={14} />
                            </Button>
                          }
                        />
                        {bill.status !== 'PAID' ? (
                          <RecordPaymentDialog
                            bill={bill}
                            totalProjectValue={metrics.total}
                            onSuccess={() => {
                              fetch(`/api/projects/${id}`)
                                .then(res => res.json())
                                .then(data => setProject(data));
                            }}
                          />
                        ) : (
                          <span className="text-xs font-black text-success flex items-center gap-1">
                            <CheckCircle2 size={12} /> SETTLED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block glass-card rounded-3xl overflow-hidden border-border/50 shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-b-border/50">
                      {columnVisibility.phase && (
                        <TableHead className="font-black text-[10px] uppercase p-6">
                          <SortableHeader label="Phase Description" sortKey="billName" currentSort={sortConfig} onSort={handleSort} />
                        </TableHead>
                      )}
                      {columnVisibility.allocation && (
                        <TableHead className="text-center font-black text-[10px] uppercase">
                          <SortableHeader label="Allocation" sortKey="_billPercent" currentSort={sortConfig} onSort={handleSort} className="justify-center" />
                        </TableHead>
                      )}
                      {columnVisibility.expected && (
                        <TableHead className="font-black text-[10px] uppercase">
                          <SortableHeader label="Expected" sortKey="_billAmount" currentSort={sortConfig} onSort={handleSort} />
                        </TableHead>
                      )}
                      {columnVisibility.received && (
                        <TableHead className="font-black text-[10px] uppercase">
                          <SortableHeader label="Received" sortKey="_receivedAmount" currentSort={sortConfig} onSort={handleSort} />
                        </TableHead>
                      )}
                      {columnVisibility.remaining && (
                        <TableHead className="font-black text-[10px] uppercase">
                          <SortableHeader label="Remaining" sortKey="_remaining" currentSort={sortConfig} onSort={handleSort} />
                        </TableHead>
                      )}
                      {columnVisibility.tentativeDate && (
                        <TableHead className="font-black text-[10px] uppercase">
                          <SortableHeader label="Tentative Date" sortKey="_tentativeDate" currentSort={sortConfig} onSort={handleSort} />
                        </TableHead>
                      )}
                      {columnVisibility.receivedDate && (
                        <TableHead className="font-black text-[10px] uppercase">
                          <SortableHeader label="Received Date" sortKey="_receivedDate" currentSort={sortConfig} onSort={handleSort} />
                        </TableHead>
                      )}
                      {columnVisibility.status && (
                        <TableHead className="font-black text-[10px] uppercase text-center">
                          <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} className="justify-center" />
                        </TableHead>
                      )}
                      {columnVisibility.actions && <TableHead className="font-black text-[10px] uppercase text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedBills.map((bill: any) => {
                      const remaining = bill._remaining;
                      // All percentages are now relative to TOTAL PROJECT VALUE (100%)
                      const receivedPctOfProject = metrics.total > 0
                        ? ((bill._receivedAmount / metrics.total) * 100).toFixed(2)
                        : '0';
                      const remainingPctOfProject = metrics.total > 0
                        ? ((remaining / metrics.total) * 100).toFixed(2)
                        : '0';

                      return (
                        <TableRow key={bill.id} className="hover:bg-muted/5 transition-colors border-b-border/50">
                          {columnVisibility.phase && <TableCell className="font-bold p-6 text-base">{bill.billName}</TableCell>}
                          {columnVisibility.allocation && (
                            <TableCell className="text-center">
                              <span className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                {bill.billPercent}%
                              </span>
                            </TableCell>
                          )}
                          {columnVisibility.expected && (
                            <TableCell className="font-bold text-slate-600 dark:text-slate-400">
                              <div className="flex flex-col gap-1">
                                <span>{formatCurrency(Number(bill.billAmount))}</span>
                                <span className="text-xs text-muted-foreground">৳{formatNumber(Number(bill.billAmount))}</span>
                              </div>
                            </TableCell>
                          )}
                          {columnVisibility.received && (
                            <TableCell className="text-success font-black">
                              <div className="flex flex-col gap-1">
                                <span>{formatCurrency(Number(bill.receivedAmount || 0))}</span>
                                <span className="text-xs text-muted-foreground">
                                  ৳{formatNumber(Number(bill.receivedAmount || 0))} ({receivedPctOfProject}%)
                                </span>
                              </div>
                            </TableCell>
                          )}
                          {columnVisibility.remaining && (
                            <TableCell className="text-destructive/80 font-bold">
                              <div className="flex flex-col gap-1">
                                <span>{formatCurrency(remaining)}</span>
                                <span className="text-xs text-muted-foreground">
                                  ৳{formatNumber(remaining)} ({remainingPctOfProject}%)
                                </span>
                              </div>
                            </TableCell>
                          )}
                          {columnVisibility.tentativeDate && (
                            <TableCell className="text-sm">
                              {bill.tentativeBillingDate
                                ? format(new Date(bill.tentativeBillingDate), 'MMM dd, yyyy')
                                : 'N/A'
                              }
                            </TableCell>
                          )}
                          {columnVisibility.receivedDate && (
                            <TableCell className="text-sm">
                              {bill.receivedDate
                                ? format(new Date(bill.receivedDate), 'MMM dd, yyyy')
                                : '-'
                              }
                            </TableCell>
                          )}
                          {columnVisibility.status && (
                            <TableCell className="text-center">
                              <Badge className={cn(
                                "font-black text-[10px] px-2.5",
                                bill.status === 'PAID' ? "bg-success/10 text-success border-success/30" :
                                  bill.status === 'PARTIAL' ? "bg-amber-500/10 text-amber-600 border-amber-500/30" :
                                    "bg-slate-100 text-slate-500 border-slate-200"
                              )} variant="outline">
                                {bill.status}
                              </Badge>
                            </TableCell>
                          )}
                          {columnVisibility.actions && (
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <EditBillDialog
                                  bill={bill}
                                  totalProjectValue={metrics.total}
                                  onSuccess={() => {
                                    fetch(`/api/projects/${id}`)
                                      .then(res => res.json())
                                      .then(data => setProject(data));
                                  }}
                                />
                                {bill.status !== 'PAID' ? (
                                  <RecordPaymentDialog
                                    bill={bill}
                                    totalProjectValue={metrics.total}
                                    onSuccess={() => {
                                      fetch(`/api/projects/${id}`)
                                        .then(res => res.json())
                                        .then(data => setProject(data));
                                    }}
                                  />
                                ) : (
                                  <span className="text-xs font-black text-success flex items-center gap-1">
                                    <CheckCircle2 size={14} /> SETTLED
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 4. Charts Section - Stacked on mobile, Carousel on desktop */}
      <div className="space-y-3 md:space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <h3 className="font-black uppercase tracking-wider text-xs md:text-sm">Charts</h3>
          </div>
          {/* Carousel controls - desktop only */}
          <div className="hidden md:flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setChartPosition('left')}
              disabled={chartPosition === 'left'}
              className="h-9 w-9"
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setChartPosition('right')}
              disabled={chartPosition === 'right'}
              className="h-9 w-9"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        {/* Mobile: Single stacked chart */}
        <div className="md:hidden glass-card p-4 rounded-xl border-border/50">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-3">Milestone Breakdown</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={project.bills?.map((b: any) => ({
                  name: b.billName.length > 10 ? b.billName.substring(0, 8) + '..' : b.billName,
                  received: Number(b.receivedAmount || 0),
                  due: Math.max(0, Number(b.billAmount) - Number(b.receivedAmount || 0))
                }))}
                margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={50}
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(val) => `৳${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val)}`}
                  width={45}
                />
                <Tooltip formatter={(val: number) => formatCurrency(val)} />
                <Bar name="Received" dataKey="received" stackId="a" fill="hsl(173, 80%, 36%)" />
                <Bar name="Due" dataKey="due" stackId="a" fill="hsl(0, 84%, 60%, 0.2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Desktop: Sliding Carousel */}
        <div className="hidden md:block relative overflow-hidden rounded-[2rem]">
          <div
            className={cn(
              "flex transition-transform duration-700 ease-in-out",
              chartPosition === 'left' ? 'translate-x-0' : '-translate-x-[50%]'
            )}
          >
            {/* Time Series Line Chart - 75% width */}
            <div className="min-w-[75%] pr-3">
              <div className="glass-card p-8 rounded-[2rem] border-border/50 h-[450px]">
                <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-4">Payment Timeline</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData} margin={{ top: 20, right: 30, left: 60, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis
                      dataKey="date"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(val) => `৳${formatNumber(val)}`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '16px', border: '1px solid hsl(var(--border))' }}
                      formatter={(val: number) => formatCurrency(val)}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line type="monotone" dataKey="cumulative" stroke="hsl(173, 80%, 36%)" strokeWidth={3} name="Cumulative Received" dot={{ r: 5 }} />
                    <Line type="monotone" dataKey="expected" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="5 5" name="Expected" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stacked Bar Chart - 75% width */}
            <div className="min-w-[75%] pl-3">
              <div className="glass-card p-8 rounded-[2rem] border-border/50 h-[450px]">
                <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-4">Milestone Breakdown</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={project.bills?.map((b: any) => ({
                      name: b.billName.length > 15 ? b.billName.substring(0, 12) + '..' : b.billName,
                      received: Number(b.receivedAmount || 0),
                      due: Math.max(0, Number(b.billAmount) - Number(b.receivedAmount || 0))
                    }))}
                    margin={{ top: 20, right: 30, left: 60, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(val) => `৳${formatNumber(val)}`}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--primary)/0.03)' }}
                      contentStyle={{ borderRadius: '16px', border: '1px solid hsl(var(--border))' }}
                      formatter={(val: number) => formatCurrency(val)}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                    <Bar name="Received" dataKey="received" stackId="a" fill="hsl(173, 80%, 36%)" barSize={45} />
                    <Bar
                      name="Due"
                      dataKey="due"
                      stackId="a"
                      fill="hsl(0, 84%, 60%, 0.15)"
                      stroke="hsl(0, 84%, 60%, 0.3)"
                      radius={[8, 8, 0, 0]}
                      barSize={45}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Intelligence Narrative - Moved to Last & Collapsible */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-success/20 rounded-xl md:rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative glass-card rounded-xl md:rounded-[2rem] border-border/50 shadow-2xl overflow-hidden">
          <div
            className="flex items-center justify-between p-4 md:p-6 cursor-pointer hover:bg-muted/5 transition-colors"
            onClick={() => setNarrativeExpanded(!narrativeExpanded)}
          >
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 md:p-3 bg-primary/10 rounded-xl md:rounded-2xl">
                <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-primary" />
              </div>
              <h3 className="text-[10px] md:text-sm font-black uppercase tracking-[0.15em] md:tracking-[0.3em] text-primary">Intelligence</h3>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 md:h-9 md:w-9 p-0">
              {narrativeExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>

          {narrativeExpanded && (
            <div className="p-4 md:p-10 lg:p-14 pt-0 animate-in slide-in-from-top-2">
              {renderIntelligenceNarrative}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}