"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  CalendarDays, 
  CheckCircle2, 
  Settings2, 
  ExternalLink 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import { cn } from '@/lib/utils';

// Fixed Interface for Page synchronization
interface BillingTableProps {
  bills: any[];
  onProjectNavigate: (id: string) => void;
  onRefresh: () => void;
}

export function BillingTableSkeleton() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-border/50">
      <div className="p-4 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BillingTable({ bills, onProjectNavigate, onRefresh }: BillingTableProps) {
  const [visibleColumns, setVisibleColumns] = useState({ 
    client: true, 
    department: true, 
    received: true 
  });

  useEffect(() => {
    const saved = localStorage.getItem('billing_col_visibility_v5');
    if (saved) setVisibleColumns(JSON.parse(saved));
  }, []);

  const toggleCol = (col: keyof typeof visibleColumns) => {
    const next = { ...visibleColumns, [col]: !visibleColumns[col] };
    setVisibleColumns(next);
    localStorage.setItem('billing_col_visibility_v5', JSON.stringify(next));
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', notation: 'compact' }).format(val);

  const getDeptBadge = (name: string) => {
    const n = name?.toLowerCase() || "";
    if (n.includes("software")) return { label: "SD", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
    if (n.includes("survey")) return { label: "SV", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" };
    if (n.includes("planning")) return { label: "PL", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" };
    return { label: "??", color: "bg-muted text-muted-foreground border-border" };
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-border/50 shadow-sm">
      <div className="flex justify-end p-2 border-b bg-muted/10">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs font-black uppercase tracking-tight">
              <Settings2 size={14} /> Column Configuration
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-4" align="end">
            <p className="text-[10px] font-black uppercase text-muted-foreground mb-4">Display Options</p>
            {Object.keys(visibleColumns).map(col => (
              <div key={col} className="flex items-center space-x-3 mb-3">
                <Checkbox 
                  id={`bill-col-${col}`} 
                  checked={visibleColumns[col as keyof typeof visibleColumns]} 
                  onCheckedChange={() => toggleCol(col as keyof typeof visibleColumns)} 
                />
                <label htmlFor={`bill-col-${col}`} className="text-sm font-bold capitalize cursor-pointer select-none">
                  {col}
                </label>
              </div>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground border-b border-border/50">
            <tr>
              <th className="p-5">Milestone & Project</th>
              <th className="p-5">Schedule Lifecycle</th>
              <th className="p-5 text-center">Alloc %</th>
              <th className="p-5">Financial Realization</th>
              <th className="p-5">Status</th>
              <th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {bills.map((bill) => {
              const totalVal = Number(bill.project?.totalProjectValue || 0);
              const recAmt = Number(bill.receivedAmount || 0);
              const billAmt = Number(bill.billAmount || 0);
              const recPct = totalVal > 0 ? ((recAmt / totalVal) * 100).toFixed(1) : "0";
              const dept = getDeptBadge(bill.project?.department?.name);

              return (
                <tr key={bill.id} className="border-b border-border/40 hover:bg-primary/[0.01] transition-all group">
                  <td className="p-5">
                    <p className="font-black text-foreground text-base leading-tight mb-1">{bill.billName}</p>
                    <div className="flex items-center gap-2">
                       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tight">
                         {bill.project?.projectName}
                       </p>
                       {visibleColumns.department && (
                         <Badge variant="outline" className={cn("text-[9px] h-3.5 px-1 border font-black", dept.color)}>
                           {dept.label}
                         </Badge>
                       )}
                    </div>
                  </td>
                  
                  <td className="p-5">
                    <div className="flex flex-col gap-1.5 text-[11px] font-bold">
                      <div className="flex items-center gap-2 text-slate-500">
                        <CalendarDays size={12} /> TGT: {bill.tentativeBillingDate ? format(new Date(bill.tentativeBillingDate), 'MMM dd, yyyy') : 'N/A'}
                      </div>
                      {bill.receivedDate && (
                        <div className="flex items-center gap-2 text-success">
                          <CheckCircle2 size={12} /> REC: {format(new Date(bill.receivedDate), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="p-5 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-black text-slate-400 text-[10px]">TOTAL: {bill.billPercent}%</span>
                      {recAmt > 0 && <span className="font-black text-success text-[10px]">REAL: {recPct}%</span>}
                    </div>
                  </td>

                  <td className="p-5">
                    <div className="space-y-0.5">
                      <p className="font-black text-foreground">DUE: {formatCurrency(billAmt)}</p>
                      <p className={cn("text-[10px] font-black", recAmt > 0 ? "text-success" : "text-slate-300")}>
                        REC: {formatCurrency(recAmt)}
                      </p>
                    </div>
                  </td>

                  <td className="p-5">
                    <Badge className={cn(
                      "font-black text-[9px] px-2.5 shadow-none",
                      bill.status === 'PAID' ? "bg-success/10 text-success border-success/30" : 
                      bill.status === 'PARTIAL' ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : "bg-muted text-slate-400"
                    )} variant="outline">
                      {bill.status}
                    </Badge>
                  </td>

                  <td className="p-5">
                    <div className="flex justify-end items-center gap-2">
                      {/* Record payment only if not fully paid */}
                      {bill.status !== 'PAID' ? (
                        <RecordPaymentDialog bill={bill} onSuccess={onRefresh} />
                      ) : (
                        <div className="h-8 px-3 rounded-md bg-success/5 text-success text-[10px] font-black flex items-center gap-1 border border-success/20">
                          <CheckCircle2 size={12} /> SETTLED
                        </div>
                      )}
                      
                      {/* Explicit Project Link - No Propagation */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 opacity-40 group-hover:opacity-100 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          onProjectNavigate(bill.projectId);
                        }}
                      >
                        <ExternalLink size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {bills.length === 0 && (
        <div className="p-16 text-center">
          <p className="text-sm font-bold text-muted-foreground italic uppercase tracking-widest">
            No active milestones found matching the criteria.
          </p>
        </div>
      )}
    </div>
  );
}