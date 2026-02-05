"use client";

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';

import {
  Settings2,
  MoreHorizontal,
  ExternalLink,
  CheckCircle2,
  CircleDollarSign,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import IndexCounter from '@/components/dashboard/IndexCounter';
import { SortableHeader, useSorting } from '@/components/ui/sortable-header';

interface ProjectTableProps {
  projects: any[];
  onProjectClick?: (project: any) => void;
  onRefresh?: () => void;
  yearFilter?: { type: 'fiscal' | 'calendar' | 'all'; year: string };
}

// --- Exported Skeleton Component ---
export function ProjectTableSkeleton() {
  return (
    <div className="glass-card rounded-xl overflow-hidden border border-border/50">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-[10px] uppercase font-bold text-muted-foreground">
              <th className="p-4 text-left">Project Info</th>
              <th className="p-4 text-left">Client</th>
              <th className="p-4 text-left">Sign Date</th>
              <th className="p-4 text-center">Budget Received</th>
              <th className="p-4 text-left">Recovery</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="p-4"><Skeleton className="h-10 w-48" /></td>
                <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                <td className="p-4 text-center"><Skeleton className="h-10 w-32 mx-auto" /></td>
                <td className="p-4"><Skeleton className="h-6 w-24" /></td>
                <td className="p-4 text-right"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper to get date range for year filter
function getYearDateRange(year: string, isFiscal: boolean): { start: Date; end: Date } {
  const yearNum = parseInt(year);
  if (isFiscal) {
    // Fiscal year: July 1 of year to June 30 of next year
    return {
      start: new Date(yearNum, 6, 1), // July 1
      end: new Date(yearNum + 1, 5, 30, 23, 59, 59, 999), // June 30 next year
    };
  } else {
    // Calendar year: Jan 1 to Dec 31
    return {
      start: new Date(yearNum, 0, 1),
      end: new Date(yearNum, 11, 31, 23, 59, 59, 999),
    };
  }
}

// --- Main Table Component ---
export function ProjectTable({ projects, onProjectClick, onRefresh, yearFilter }: ProjectTableProps) {
  const [visibleColumns, setVisibleColumns] = useState({
    client: true,
    date: true,
    status: true,
    progress: true,
  });
  const [updatingProjectId, setUpdatingProjectId] = useState<number | null>(null);

  // Check if a specific year is selected
  const isYearSelected = yearFilter && yearFilter.type !== 'all' && yearFilter.year !== 'all';

  // Prepare data with computed fields for sorting
  const projectsWithComputed = useMemo(() => {
    // Get date range for year filter if applicable
    let dateRange: { start: Date; end: Date } | null = null;
    if (isYearSelected && yearFilter) {
      dateRange = getYearDateRange(yearFilter.year, yearFilter.type === 'fiscal');
    }

    // Helper to check if a bill's tentative date falls in the selected year
    const isBillInYear = (bill: any): boolean => {
      if (!dateRange) return true;
      const tentativeDate = bill.tentativeBillingDate ? new Date(bill.tentativeBillingDate) : null;
      if (!tentativeDate) return false;
      return tentativeDate >= dateRange.start && tentativeDate <= dateRange.end;
    };

    return projects.map((p: any) => {
      // When year selected: budget = sum of bills with tentative in that year
      // Otherwise: budget = total project value
      const bills = p.bills || [];

      let total: number;
      let yearBills: any[];

      if (isYearSelected && dateRange) {
        // Filter bills scheduled in the selected year
        yearBills = bills.filter(isBillInYear);
        total = yearBills.reduce((s: number, b: any) => s + Number(b.billAmount || 0), 0);
      } else {
        yearBills = bills;
        total = Number(p.totalProjectValue || 0);
      }

      // REC = receivedAmount from PAID/PARTIAL bills
      // When year selected: only count received from bills scheduled in that year
      const rec = yearBills
        .filter((b: any) => b.status === 'PAID' || b.status === 'PARTIAL')
        .reduce((s: number, b: any) => s + Number(b.receivedAmount || 0), 0) || 0;

      const recPct = total > 0 ? Math.round((rec / total) * 100) : 0;

      return {
        ...p,
        _totalValue: total,
        _received: rec,
        _receivedPct: recPct,
        _clientName: p.client?.name || '',
        _startDate: p.startDate ? new Date(p.startDate).getTime() : 0,
        _isYearFiltered: isYearSelected,
      };
    });
  }, [projects, yearFilter, isYearSelected]);

  const { sortedData, sortConfig, handleSort } = useSorting(projectsWithComputed);

  useEffect(() => {
    const saved = localStorage.getItem('proj_col_visibility_v3');
    if (saved) setVisibleColumns(JSON.parse(saved));
  }, []);

  const toggleCol = (col: keyof typeof visibleColumns) => {
    const next = { ...visibleColumns, [col]: !visibleColumns[col] };
    setVisibleColumns(next);
    localStorage.setItem('proj_col_visibility_v3', JSON.stringify(next));
  };

  // Helper for Department Mapping: Software -> SD, Survey -> SV, Planning -> PL
  const getDeptBadge = (deptName: string) => {
    const name = deptName?.toLowerCase() || "";
    if (name.includes("software")) return { label: "SD", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
    if (name.includes("survey")) return { label: "SV", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" };
    if (name.includes("planning")) return { label: "PL", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" };
    return { label: "??", color: "bg-muted text-muted-foreground border-border" };
  };

  // Helper for Status Badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { label: 'Completed', color: 'bg-green-500/10 text-green-600 border-green-500/20' };
      case 'PENDING_PAYMENT':
        return { label: 'Pending Payment', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
      case 'ONGOING':
      default:
        return { label: 'Ongoing', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
    }
  };

  // Use Indian numbering system (Lakh/Crore): 1,00,00,000 for 1 crore, 1,00,000 for 1 lakh
  const formatFullCurrency = (val: number) => {
    const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(val));
    return `৳${formatted}`;
  };

  // Check if "Mark as Completed" button should show
  // Shows if: budget is 100% paid OR end date has passed
  const shouldShowMarkComplete = (project: any) => {
    // Don't show if already completed
    if (project.status === 'COMPLETED') return false;

    const recPct = project._receivedPct || 0;
    const isFullyPaid = recPct >= 100;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = project.endDate ? new Date(project.endDate) : null;
    const isEndDatePassed = endDate && endDate < today;

    return isFullyPaid || isEndDatePassed;
  };

  // Determine what status to set when marking complete
  const getTargetStatus = (project: any): 'COMPLETED' | 'PENDING_PAYMENT' => {
    const recPct = project._receivedPct || 0;
    const isFullyPaid = recPct >= 100;

    // If 100% paid -> COMPLETED, otherwise -> PENDING_PAYMENT
    return isFullyPaid ? 'COMPLETED' : 'PENDING_PAYMENT';
  };

  // Handle marking project as complete
  const handleMarkComplete = async (project: any) => {
    const targetStatus = getTargetStatus(project);
    setUpdatingProjectId(project.id);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status');
      }

      toast.success(
        targetStatus === 'COMPLETED'
          ? 'Project marked as Completed'
          : 'Project marked as Pending Payment'
      );
      onRefresh?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingProjectId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl overflow-hidden border border-border/50"
    >
      {/* Column Settings Bar - Hidden on mobile */}
      <div className="hidden md:flex justify-end p-2 border-b border-border bg-muted/10">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs font-semibold">
              <Settings2 size={14} /> Column Settings
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3" align="end">
            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-3">Show Columns</p>
            <div className="space-y-2">
              {Object.keys(visibleColumns).map((col) => (
                <div key={col} className="flex items-center space-x-2">
                  <Checkbox
                    id={col}
                    checked={visibleColumns[col as keyof typeof visibleColumns]}
                    onCheckedChange={() => toggleCol(col as keyof typeof visibleColumns)}
                  />
                  <label htmlFor={col} className="text-sm capitalize cursor-pointer select-none">
                    {col}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-border">
        {sortedData.map((p: any) => {
          const total = p._totalValue;
          const recPct = p._receivedPct;
          const duePct = 100 - recPct;
          const dept = getDeptBadge(p.department?.name);

          return (
            <div
              key={p.id}
              className="p-4 space-y-3 active:bg-muted/20 transition-colors"
              onClick={() => onProjectClick?.(p)}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground truncate">{p.projectName}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.client?.name}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Badge variant="outline" className={cn("text-[9px] h-5 px-1.5 font-bold border", dept.color)}>
                    {dept.label}
                  </Badge>
                  <Badge variant="outline" className={cn("text-[9px] h-5 px-1.5 font-semibold border", getStatusBadge(p.status).color)}>
                    {getStatusBadge(p.status).label}
                  </Badge>
                </div>
              </div>

              {/* Budget & Recovery */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Budget</p>
                  ss
                  <p className="font-bold">{formatFullCurrency(total)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Category</p>
                  <p className="text-muted-foreground text-sm truncate">{p.category?.name || 'N/A'}</p>
                </div>
              </div>

              {/* Recovery Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black">
                  <span className="text-success uppercase">Received: {recPct}%</span>
                  <span className="text-destructive uppercase">Due: {duePct}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success transition-all duration-700"
                    style={{ width: `${recPct}%` }}
                  />
                </div>
              </div>

              {/* Date & Actions */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Signed: {p.startDate ? format(new Date(p.startDate), 'MMM d, yyyy') : 'N/A'}
                </span>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {shouldShowMarkComplete(p) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-7 px-2 text-[10px] font-bold",
                        getTargetStatus(p) === 'COMPLETED'
                          ? "text-green-600 hover:text-green-700"
                          : "text-amber-600 hover:text-amber-700"
                      )}
                      disabled={updatingProjectId === p.id}
                      onClick={() => handleMarkComplete(p)}
                    >
                      {updatingProjectId === p.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : getTargetStatus(p) === 'COMPLETED' ? (
                        <><CheckCircle2 size={12} className="mr-1" /> Complete</>
                      ) : (
                        <><CircleDollarSign size={12} className="mr-1" /> Pending</>
                      )}
                    </Button>
                  )}
                  <ExternalLink size={14} className="text-primary" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-muted/30 text-[10px] uppercase font-bold text-muted-foreground">
            <tr>
              <th className="p-4">
                <SortableHeader label="Project Info" sortKey="projectName" currentSort={sortConfig} onSort={handleSort} />
              </th>
              {visibleColumns.client && (
                <th className="p-4">
                  <SortableHeader label="Client" sortKey="_clientName" currentSort={sortConfig} onSort={handleSort} />
                </th>
              )}
              {visibleColumns.date && (
                <th className="p-4">
                  <SortableHeader label="Sign Date" sortKey="_startDate" currentSort={sortConfig} onSort={handleSort} />
                </th>
              )}
              <th className="p-4 text-center">
                <SortableHeader label="Budget" sortKey="_totalValue" currentSort={sortConfig} onSort={handleSort} className="justify-center" />
              </th>
              {visibleColumns.progress && (
                <th className="p-4">
                  <SortableHeader label="Recovery" sortKey="_receivedPct" currentSort={sortConfig} onSort={handleSort} />
                </th>
              )}
              {visibleColumns.status && <th className="p-4">Status</th>}
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {sortedData.map((p: any, index: number) => {
              const total = p._totalValue;
              const recPct = p._receivedPct;
              const duePct = 100 - recPct;
              const dept = getDeptBadge(p.department?.name);

              return (
                <tr
                  key={p.id}
                  className="border-b border-border/50 hover:bg-muted/10 transition-colors cursor-pointer group relative"
                  onClick={() => onProjectClick?.(p)}
                >
                  <td className="p-4 relative">
                    <IndexCounter index={index} position="start" />
                    <p className="font-bold text-foreground group-hover:text-primary transition-colors">{p.projectName}</p>
                    <div className="flex gap-1.5 mt-1.5">
                      <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 font-bold border", dept.color)}>
                        {dept.label}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-normal opacity-70">
                        {p.category?.name}
                      </Badge>
                    </div>
                  </td>
                  {visibleColumns.client && <td className="p-4 text-muted-foreground">{p.client?.name}</td>}
                  {visibleColumns.date && (
                    <td className="p-4 text-muted-foreground">
                      {p.startDate ? format(new Date(p.startDate), 'MMM d, yy') : 'N/A'}
                    </td>
                  )}
                  <td className="p-4 text-center">
                    <p className="font-bold text-xs">{formatFullCurrency(total)}</p>
                    <div className="flex justify-center gap-3 text-[10px] font-black mt-1">
                      <span className="text-success uppercase">Rec: {recPct}%</span>
                      <span className="text-destructive uppercase">Due: {duePct}%</span>
                    </div>
                  </td>
                  {visibleColumns.progress && (
                    <td className="p-4">
                      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-success transition-all duration-700" 
                          style={{ width: `${recPct}%` }}
                        />
                      </div>
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className="p-4">
                      <Badge variant="outline" className={cn("text-[10px] font-semibold py-0 h-5 border", getStatusBadge(p.status).color)}>
                        {getStatusBadge(p.status).label}
                      </Badge>
                    </td>
                  )}
                  <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {updatingProjectId === p.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <MoreHorizontal size={16} />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onProjectClick?.(p)}>
                          <ExternalLink className="w-3.5 h-3.5 mr-2" /> View Details
                        </DropdownMenuItem>
                        {shouldShowMarkComplete(p) && (
                          <DropdownMenuItem
                            onClick={() => handleMarkComplete(p)}
                            disabled={updatingProjectId === p.id}
                            className={getTargetStatus(p) === 'COMPLETED' ? 'text-green-600' : 'text-amber-600'}
                          >
                            {getTargetStatus(p) === 'COMPLETED' ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Mark as Completed
                              </>
                            ) : (
                              <>
                                <CircleDollarSign className="w-3.5 h-3.5 mr-2" /> Mark as Pending Payment
                              </>
                            )}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}