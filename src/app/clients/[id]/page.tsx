"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, TrendingUp, Sparkles, Award, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, differenceInMonths } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell, PieChart, Pie } from 'recharts';

export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetch(`/api/clients/${id}`).then(res => res.json()).then(data => {
            setClient(data);
            setLoading(false);
        });
    }, [id]);

    const formatCurrency = (v: number) =>
        new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(v);

    // --- Intelligence Narrative ---
    const narrative = useMemo(() => {
        if (!client) return null;
        const projects = client.projects || [];
        const totalVal = projects.reduce((s, p) => s + Number(p.totalProjectValue), 0);
        const totalRec = projects.flatMap(p => p.bills).reduce((s, b) => s + Number(b.receivedAmount || 0), 0);
        const duration = projects.length > 0
            ? differenceInMonths(new Date(), new Date(projects[projects.length - 1].startDate))
            : 0;

        return (
            <div className="space-y-4 font-sans leading-relaxed text-slate-700 dark:text-slate-300">
                <p className="text-xl md:text-2xl">
                    The partnership with <span className="font-black text-primary underline decoration-primary/20 underline-offset-8 uppercase tracking-tight">{client.name}</span> spans a period of
                    <span className="text-3xl font-black text-primary mx-2">{duration} months</span>, during which we have initialized
                    <span className="font-bold text-foreground"> {projects.length} significant engagements</span>.
                </p>
                <p className="text-xl md:text-2xl">
                    This client currently holds a <span className="text-3xl font-black text-success mx-1">Rank #{client.rank}</span> within our financial ecosystem, contributing a lifetime contract value of
                    <span className="text-3xl font-black text-primary mx-2">{formatCurrency(totalVal)}</span>.
                </p>
                <p className="text-xl md:text-2xl">
                    We have achieved a collection realization of <span className="text-success font-black">{((totalRec / totalVal) * 100).toFixed(1)}%</span>,
                    translating to <span className="font-bold text-success">{formatCurrency(totalRec)}</span> in realized revenue. The remaining dues of
                    <span className="text-destructive font-black mx-1">{formatCurrency(totalVal - totalRec)}</span> are strategically distributed across active milestones.
                </p>
            </div>
        );
    }, [client]);

    // Dept Comparison Chart Data
    const deptData = useMemo(() => {
        if (!client) return [];
        const map: any = {};
        client.projects.forEach(p => {
            const name = p.department.name;
            map[name] = (map[name] || 0) + Number(p.totalProjectValue);
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [client]);

    if (loading) return <div className="p-10 space-y-6"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;

    return (
        <DashboardLayout title="Client Intelligence" >
            <div className="space-y-10 pb-20">
                <Button variant="ghost" onClick={() => router.push('/clients')} className="gap-2 -ml-2 text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> All Clients</Button>

                {/* Narrative Card */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-success/20 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative glass-card p-10 md:p-14 rounded-[2rem] border-border/50 shadow-2xl">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-primary/10 rounded-2xl"><Sparkles className="w-6 h-6 text-primary" /></div>
                            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary">Strategic Client Relationship Narrative</h3>
                        </div>
                        {narrative}
                    </div>
                </div>

                {/* Dept Comparison & Projects */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass-card p-6 rounded-3xl border-border/50">
                        <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2"><Award size={16} /> Departmental Engagement Share</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={deptData} innerRadius={60} outerRadius={80} dataKey="value">
                                        {deptData.map((_, i) => <Cell key={i} fill={['#0ea5e9', '#22c55e', '#f59e0b'][i % 3]} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-3xl border-border/50 overflow-hidden">
                        <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2"><Building2 size={16} /> Associated Projects</h3>
                        <Table>
                            <TableHeader><TableRow><TableHead>Project</TableHead><TableHead>Value</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {client.projects.map(p => (
                                    <TableRow key={p.id} className="cursor-pointer" onClick={() => router.push(`/projects/${p.id}`)}>
                                        <TableCell className="font-bold">{p.projectName}</TableCell>
                                        <TableCell className="text-xs font-medium">{formatCurrency(Number(p.totalProjectValue))}</TableCell>
                                        <TableCell><Badge variant="outline" className="text-[10px] font-black">{p.startDate ? 'ACTIVE' : 'INACTIVE'}</Badge></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Master Billing for Client */}
                <div className="glass-card p-8 rounded-[2rem] border-border/50">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-2"><Wallet size={16} /> Revenue & Collections Waterfall</h3>
                    <div className="h-80 mb-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={client.projects.flatMap(p => p.bills).slice(0, 10)}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="billName" fontSize={10} />
                                <YAxis fontSize={10} />
                                <Tooltip />
                                <Bar name="Received" dataKey="receivedAmount" stackId="a" fill="#22c55e" />
                                <Bar name="Due" dataKey="billAmount" stackId="a" fill="#ef4444" opacity={0.15} radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <Table>
                        <TableHeader className="bg-muted/30"><TableRow><TableHead>Milestone</TableHead><TableHead>Expected Date</TableHead><TableHead>Value</TableHead><TableHead>Received</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {client.projects.flatMap(p => p.bills).map(bill => (
                                <TableRow key={bill.id}>
                                    <TableCell className="font-bold">{bill.billName}</TableCell>
                                    <TableCell className="text-xs">{bill.tentativeBillingDate ? format(new Date(bill.tentativeBillingDate), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                                    <TableCell className="font-bold">{formatCurrency(Number(bill.billAmount))}</TableCell>
                                    <TableCell className="text-success font-black">{formatCurrency(Number(bill.receivedAmount))}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </DashboardLayout>
    );
}