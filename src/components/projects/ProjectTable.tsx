"use client";

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings2, 
  MoreHorizontal, 
  ArrowUpDown, 
  ExternalLink 
} from 'lucide-react';
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

interface ProjectTableProps {
  projects: any[];
  onProjectClick?: (project: any) => void;
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
              <th className="p-4 text-center">Budget Realization</th>
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

// --- Main Table Component ---
export function ProjectTable({ projects, onProjectClick }: ProjectTableProps) {
  const [visibleColumns, setVisibleColumns] = useState({
    client: true,
    date: true,
    status: true,
    progress: true,
  });

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

  const formatFullCurrency = (val: number) => 
    new Intl.NumberFormat('en-BD', { 
      style: 'currency', 
      currency: 'BDT', 
      maximumFractionDigits: 0 
    }).format(val);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl overflow-hidden border border-border/50"
    >
      {/* Column Settings Bar */}
      <div className="flex justify-end p-2 border-b border-border bg-muted/10">
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

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-muted/30 text-[10px] uppercase font-bold text-muted-foreground">
            <tr>
              <th className="p-4">Project Info</th>
              {visibleColumns.client && <th className="p-4">Client</th>}
              {visibleColumns.date && <th className="p-4">Sign Date</th>}
              <th className="p-4 text-center">Budget Realization</th>
              {visibleColumns.progress && <th className="p-4">Recovery</th>}
              {visibleColumns.status && <th className="p-4">Status</th>}
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {projects.map((p: any) => {
              const total = Number(p.totalProjectValue || 0);
              const rec = p.bills?.filter((b: any) => b.status === 'PAID')
                .reduce((s: number, b: any) => s + Number(b.receivedAmount || 0), 0);
              const recPct = total > 0 ? Math.round((rec / total) * 100) : 0;
              const duePct = 100 - recPct;
              const dept = getDeptBadge(p.department?.name);

              return (
                <tr 
                  key={p.id} 
                  className="border-b border-border/50 hover:bg-muted/10 transition-colors cursor-pointer group"
                  onClick={() => onProjectClick?.(p)}
                >
                  <td className="p-4">
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
                      <Badge variant="secondary" className="text-[10px] font-semibold py-0 h-5">
                        {p.status}
                      </Badge>
                    </td>
                  )}
                  <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={16} /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onProjectClick?.(p)}>
                          <ExternalLink className="w-3.5 h-3.5 mr-2" /> View Details
                        </DropdownMenuItem>
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