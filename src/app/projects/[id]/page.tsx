"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Receipt, TrendingUp, Sparkles, Target, CheckCircle2, ChevronDown, ChevronUp, Settings2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line
} from 'recharts';
import { cn } from '@/lib/utils';
import { RecordPaymentDialog } from '@/components/billing/RecordPaymentDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(amount);

  const formatNumber = (num: number) => 
    new Intl.NumberFormat('en-BD').format(num);

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
      <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
        <p className="text-xl md:text-2xl">
          The project <span className="font-bold text-primary underline decoration-primary/30 underline-offset-4">"{project.projectName}"</span> represents a strategic
          engagement valued at <span className="text-2xl md:text-3xl font-black text-primary tracking-tighter mx-1">{formatCurrency(total)}</span>.
        </p>

        <p className="text-xl md:text-2xl">
          To date, the financial received stands at a healthy <span className="text-3xl font-black text-success mx-1">{receivedPct.toFixed(1)}%</span>,
          with a total of <span className="font-bold text-success underline decoration-success/30">{formatCurrency(received)}</span> successfully collected.
          {partialCount > 0 && (
            <> This includes <span className="font-bold text-amber-500">{partialCount} milestone(s)</span> currently in <span className="italic text-amber-600">partial received</span>, highlighting active cash flow cycles.</>
          )}
        </p>

        {nextBill && (
          <p className="text-xl md:text-2xl">
            The immediate collection target is focused on the <span className="font-bold text-slate-900 dark:text-white">"{nextBill.billName}"</span> phase.
            This milestone accounts for <span className="font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">{nextBill.billPercent}%</span> of the
            contract, with <span className="font-bold text-primary">{formatCurrency(nextBill.billAmount)}</span> scheduled for received.
          </p>
        )}

        <p className="text-xl md:text-2xl pt-2 border-t border-slate-200 dark:border-slate-800">
          The current outstanding exposure remains at <span className="text-3xl font-black text-destructive/80 mx-1">{formatCurrency(remaining)}</span>.
        </p>
      </div>
    );
  }, [project, metrics]);

  if (loading) return <div className="p-10 space-y-6"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (!project || !metrics) return null;

  return (
    <DashboardLayout title="Project Analytics">
      <div className="space-y-10 pb-20">

        {/* 1. Header Row */}
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={() => router.push('/projects')} className="gap-2 -ml-2 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </Button>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 font-bold">
              {project.category?.name}
            </Badge>
          </div>
        </div>

        {/* 2. Top Level Metrics - Enhanced with Received & Remaining */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-8 rounded-3xl border-border/50 flex flex-col justify-between relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-2">{project.client?.name}</p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-6">{project.projectName}</h1>
              <div className="flex flex-wrap gap-8">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Contract Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.total)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Department</p>
                  <p className="text-2xl font-bold text-slate-500">{project.department?.name}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Received Card */}
            <div className="glass-card p-6 rounded-3xl border-t-8 border-success flex flex-col items-center justify-center text-center shadow-xl shadow-success/5">
              <Target className="w-6 h-6 text-success mb-2" />
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Received</p>
              <p className="text-4xl font-black text-success my-2">
                {Math.round(metrics.receivedPct)}%
              </p>
              <p className="text-xs font-bold text-muted-foreground">
                {formatCurrency(metrics.received)}
              </p>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3">
                <div
                  className="bg-success h-full transition-all duration-1000 rounded-full"
                  style={{ width: `${metrics.receivedPct}%` }}
                />
              </div>
            </div>

            {/* Remaining Card */}
            <div className="glass-card p-6 rounded-3xl border-t-8 border-destructive/60 flex flex-col items-center justify-center text-center shadow-xl shadow-destructive/5">
              <Target className="w-6 h-6 text-destructive/80 mb-2" />
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Remaining</p>
              <p className="text-4xl font-black text-destructive/80 my-2">
                {Math.round(metrics.remainingPct)}%
              </p>
              <p className="text-xs font-bold text-muted-foreground">
                {formatCurrency(metrics.remaining)}
              </p>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3">
                <div
                  className="bg-destructive/60 h-full transition-all duration-1000 rounded-full"
                  style={{ width: `${metrics.remainingPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Milestone Itemization - Collapsible with Column Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              <h3 className="font-black uppercase tracking-wider text-sm">Milestone Itemization</h3>
              <Badge variant="outline" className="text-xs">
                {project.bills?.length || 0} Milestones
              </Badge>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
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
                className="gap-2"
              >
                {milestonesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {milestonesExpanded ? 'Collapse' : 'Expand'}
              </Button>
            </div>
          </div>

          {milestonesExpanded && (
            <div className="glass-card rounded-3xl overflow-hidden border-border/50 shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-b-border/50">
                      {columnVisibility.phase && <TableHead className="font-black text-[10px] uppercase p-6">Phase Description</TableHead>}
                      {columnVisibility.allocation && <TableHead className="text-center font-black text-[10px] uppercase">Allocation</TableHead>}
                      {columnVisibility.expected && <TableHead className="font-black text-[10px] uppercase">Expected</TableHead>}
                      {columnVisibility.received && <TableHead className="font-black text-[10px] uppercase">Received</TableHead>}
                      {columnVisibility.remaining && <TableHead className="font-black text-[10px] uppercase">Remaining</TableHead>}
                      {columnVisibility.tentativeDate && <TableHead className="font-black text-[10px] uppercase">Tentative Date</TableHead>}
                      {columnVisibility.receivedDate && <TableHead className="font-black text-[10px] uppercase">Received Date</TableHead>}
                      {columnVisibility.status && <TableHead className="font-black text-[10px] uppercase text-center">Status</TableHead>}
                      {columnVisibility.actions && <TableHead className="font-black text-[10px] uppercase text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.bills?.map((bill: any) => {
                      const remaining = Number(bill.billAmount) - Number(bill.receivedAmount || 0);
                      // All percentages are now relative to TOTAL PROJECT VALUE (100%)
                      const receivedPctOfProject = metrics.total > 0
                        ? ((Number(bill.receivedAmount || 0) / metrics.total) * 100).toFixed(2)
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
                                <span className="text-xs font-black text-success flex items-center justify-end gap-1">
                                  <CheckCircle2 size={14} /> SETTLED
                                </span>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        {/* 4. Sliding Chart Carousel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-black uppercase tracking-wider text-sm">Financial Visualizations</h3>
            </div>
            <div className="flex gap-2">
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

          <div className="relative overflow-hidden rounded-[2rem]">
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
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-success/20 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative glass-card rounded-[2rem] border-border/50 shadow-2xl overflow-hidden">
            <div 
              className="flex items-center justify-between p-6 cursor-pointer hover:bg-muted/5 transition-colors"
              onClick={() => setNarrativeExpanded(!narrativeExpanded)}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary">Project Intelligence Narrative</h3>
              </div>
              <Button variant="ghost" size="sm">
                {narrativeExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
            </div>
            
            {narrativeExpanded && (
              <div className="p-10 md:p-14 pt-0 animate-in slide-in-from-top-2">
                {renderIntelligenceNarrative}
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}