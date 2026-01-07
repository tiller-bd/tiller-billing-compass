"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Receipt, Building, TrendingUp, Sparkles, Target, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { cn } from '@/lib/utils';
import { RecordPaymentDialog } from '@/components/billing/RecordPaymentDialog';

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  // --- Styled Narrative Generator ---
  const renderIntelligenceNarrative = useMemo(() => {
    if (!project) return null;

    const total = Number(project.totalProjectValue || 0);
    const bills = project.bills || [];
    const received = bills.reduce((sum: number, b: any) => sum + Number(b.receivedAmount || 0), 0);
    const partialCount = bills.filter((b: any) => b.status === 'PARTIAL').length;
    const recPct = ((received / total) * 100).toFixed(1);
    const nextBill = bills.find((b: any) => b.status !== 'PAID');
    const remaining = total - received;

    return (
      <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
        <p className="text-xl md:text-2xl">
          The project <span className="font-bold text-primary underline decoration-primary/30 underline-offset-4">"{project.projectName}"</span> represents a strategic
          engagement valued at <span className="text-2xl md:text-3xl font-black text-primary tracking-tighter mx-1">{formatCurrency(total)}</span>.
        </p>

        <p className="text-xl md:text-2xl">
          To date, the financial realization stands at a healthy <span className="text-3xl font-black text-success mx-1">{recPct}%</span>,
          with a total of <span className="font-bold text-success underline decoration-success/30">{formatCurrency(received)}</span> successfully collected.
          {partialCount > 0 && (
            <> This includes <span className="font-bold text-amber-500">{partialCount} milestone(s)</span> currently in <span className="italic text-amber-600">partial realization</span>, highlighting active cash flow cycles.</>
          )}
        </p>

        {nextBill && (
          <p className="text-xl md:text-2xl">
            The immediate collection target is focused on the <span className="font-bold text-slate-900 dark:text-white">"{nextBill.billName}"</span> phase.
            This milestone accounts for <span className="font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">{nextBill.billPercent}%</span> of the
            contract, with <span className="font-bold text-primary">{formatCurrency(nextBill.billAmount)}</span> scheduled for realization.
          </p>
        )}

        <p className="text-xl md:text-2xl pt-2 border-t border-slate-200 dark:border-slate-800">
          The current outstanding exposure remains at <span className="text-3xl font-black text-destructive/80 mx-1">{formatCurrency(remaining)}</span>.
        </p>
      </div>
    );
  }, [project]);

  if (loading) return <div className="p-10 space-y-6"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <DashboardLayout title="Project Analytics" currentPath="/projects" onNavigate={(path) => router.push(path)}>
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

        {/* 2. Top Level Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-8 rounded-3xl border-border/50 flex flex-col justify-between relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-2">{project.client?.name}</p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-6">{project.projectName}</h1>
              <div className="flex flex-wrap gap-8">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Contract Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(Number(project.totalProjectValue))}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Department</p>
                  <p className="text-2xl font-bold text-slate-500">{project.department?.name}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl border-t-8 border-primary flex flex-col items-center justify-center text-center shadow-xl shadow-primary/5">
            <Target className="w-8 h-8 text-primary mb-2" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Realization</p>
            <p className="text-6xl font-black text-primary my-2">
              {Math.round((project.bills?.reduce((s: number, b: any) => s + Number(b.receivedAmount || 0), 0) / Number(project.totalProjectValue)) * 100)}%
            </p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2">
              <div
                className="bg-primary h-full transition-all duration-1000"
                style={{ width: `${(project.bills?.reduce((s: number, b: any) => s + Number(b.receivedAmount || 0), 0) / Number(project.totalProjectValue)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. Detailed Milestone Table */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Receipt className="w-5 h-5 text-primary" />
            <h3 className="font-black uppercase tracking-wider text-sm">Milestone Itemization</h3>
          </div>
          <div className="glass-card rounded-3xl overflow-hidden border-border/50 shadow-sm">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-b-border/50">
                  <TableHead className="font-black text-[10px] uppercase p-6">Phase Description</TableHead>
                  <TableHead className="text-center font-black text-[10px] uppercase">Allocation</TableHead>
                  <TableHead className="font-black text-[10px] uppercase">Expected</TableHead>
                  <TableHead className="font-black text-[10px] uppercase">Realized</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.bills?.map((bill: any) => (
                  <TableRow key={bill.id} className="hover:bg-muted/5 transition-colors border-b-border/50">
                    <TableCell className="font-bold p-6 text-base">{bill.billName}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{bill.billPercent}%</span>
                    </TableCell>
                    <TableCell className="font-bold text-slate-600 dark:text-slate-400">{formatCurrency(Number(bill.billAmount))}</TableCell>
                    <TableCell className="text-success font-black text-base">{formatCurrency(Number(bill.receivedAmount))}</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "font-black text-[10px] px-2.5",
                        bill.status === 'PAID' ? "bg-success/10 text-success border-success/30" :
                          bill.status === 'PARTIAL' ? "bg-amber-500/10 text-amber-600 border-amber-500/30" :
                            "bg-slate-100 text-slate-500 border-slate-200"
                      )} variant="outline">
                        {bill.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {/* Only show Record Payment if the bill is not fully paid */}
                      {bill.status !== 'PAID' ? (
                        <RecordPaymentDialog
                          bill={bill}
                          onSuccess={() => {
                            // Trigger a fresh fetch of the project data
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 4. Intelligence Narrative */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-success/20 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative glass-card p-10 md:p-14 rounded-[2rem] border-border/50 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary">Project Intelligence Narrative</h3>
            </div>
            {renderIntelligenceNarrative}
          </div>
        </div>

        {/* 5. Visualization Charts (Reddish "Due" stacking) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-black uppercase tracking-wider text-sm">Realization Visuals</h3>
          </div>
          <div className="glass-card p-8 rounded-[2rem] border-border/50 h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={project.bills?.map((b: any) => ({
                  name: b.billName.length > 15 ? b.billName.substring(0, 12) + '..' : b.billName,
                  received: Number(b.receivedAmount || 0),
                  due: Math.max(0, Number(b.billAmount) - Number(b.receivedAmount || 0))
                }))}
                margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--primary)/0.03)' }}
                  contentStyle={{ borderRadius: '16px', border: '1px solid hsl(var(--border))', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number) => formatCurrency(val)}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />

                {/* STACKED BARS */}
                <Bar name="Received" dataKey="received" stackId="a" fill="hsl(173, 80%, 36%)" barSize={45} />
                <Bar
                  name="Due"
                  dataKey="due"
                  stackId="a"
                  fill="hsl(0, 84%, 60%, 0.15)" // Slight reddish/destructive tint
                  stroke="hsl(0, 84%, 60%, 0.3)" // Border for definition
                  radius={[8, 8, 0, 0]}
                  barSize={45}
                />

              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}