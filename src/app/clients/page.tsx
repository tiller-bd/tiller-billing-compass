"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PieChart as PieIcon, TrendingUp, Settings2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ErrorDisplay } from '@/components/error/ErrorDisplay';
import { ApiClientError, apiFetch } from '@/lib/api-client';
import { useSharedFilters } from '@/contexts/FilterContext';

export default function ClientsPage() {
  const router = useRouter();
  const { debouncedSearch } = useSharedFilters();

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiClientError | null>(null);
  const [visibleColumns, setVisibleColumns] = useState({ contact: true, projects: true, received: true });

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/clients?search=${debouncedSearch}`);
      setClients(data as any[]);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err);
      }
      console.error("Failed to fetch clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [debouncedSearch]);

  const chartData = useMemo(() => {
    const share = clients.map(c => ({ name: c.name, value: c.totalBudget })).slice(0, 5);
    const clearance = clients.map(c => ({ name: c.name, rec: c.totalReceived, due: c.totalDue })).slice(0, 8);
    return { share, clearance };
  }, [clients]);

  const formatCurrency = (v: number) => `৳${(v / 1000000).toFixed(2)}M`;

  return (
    <DashboardLayout title="Client Registry" >
      <div className="space-y-8">
        
        {/* Comparative Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl border-border/50 h-80">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-primary">
              <PieIcon size={16}/> Budget Share
            </h3>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie data={chartData.share} innerRadius={60} outerRadius={80} dataKey="value">
                  {chartData.share.map((_, i) => <Cell key={i} fill={['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-2 glass-card p-6 rounded-2xl border-border/50 h-80">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-primary">
              <TrendingUp size={16}/> Clearance Trend by Client
            </h3>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={chartData.clearance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="rec" name="Received" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="due" name="Due" stackId="a" fill="#ef4444" opacity={0.2} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Registry Table - Search is in header */}
        <div className="space-y-4">
          <div className="flex justify-end items-center">
             <Popover>
                <PopoverTrigger asChild><Button variant="ghost" size="sm" className="gap-2 font-bold"><Settings2 size={14}/> Column Settings</Button></PopoverTrigger>
                <PopoverContent className="w-48">
                   {Object.keys(visibleColumns).map(col => (
                     <div key={col} className="flex items-center space-x-2 mb-2">
                        <Checkbox id={col} checked={visibleColumns[col as keyof typeof visibleColumns]} onCheckedChange={() => setVisibleColumns({...visibleColumns, [col]: !visibleColumns[col as keyof typeof visibleColumns]})} />
                        <label htmlFor={col} className="text-sm capitalize">{col}</label>
                     </div>
                   ))}
                </PopoverContent>
             </Popover>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden border border-border/50">
             <table className="w-full text-left">
                <thead className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground">
                   <tr>
                      <th className="p-4">Client Entity</th>
                      {visibleColumns.contact && <th className="p-4">Primary Contact</th>}
                      {visibleColumns.projects && <th className="p-4">Active Projects</th>}
                      <th className="p-4">Financial Volume</th>
                      {visibleColumns.received && <th className="p-4">Received</th>}
                   </tr>
                </thead>
                <tbody className="text-sm">
                   {loading ? (
                     [...Array(5)].map((_, i) => <tr key={i}><td className="p-4" colSpan={5}><Skeleton className="h-10 w-full" /></td></tr>)
                   ) : error ? (
                     <tr><td colSpan={5}><ErrorDisplay error={error} code={error.code} message={error.message} onRetry={fetchClients} compact /></td></tr>
                   ) : clients.length === 0 ? (
                     <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No clients found</td></tr>
                   ) : (
                     clients.map(client => (
                       <tr key={client.id} className="border-b border-border/30 hover:bg-primary/[0.02] cursor-pointer" onClick={() => router.push(`/clients/${client.id}`)}>
                          <td className="p-4"><p className="font-black text-foreground">{client.name}</p></td>
                          {visibleColumns.contact && <td className="p-4 text-xs font-medium text-muted-foreground">{client.contactPerson}</td>}
                          {visibleColumns.projects && <td className="p-4 text-center"><Badge variant="secondary" className="font-black">{client.projectCount}</Badge></td>}
                          <td className="p-4">
                             <p className="font-bold text-xs">{formatCurrency(client.totalBudget)}</p>
                             <div className="flex gap-2 text-[10px] font-black"><span className="text-success">REC: {Math.round(client.realizationRate)}%</span></div>
                          </td>
                          {visibleColumns.received && (
                            <td className="p-4">
                               <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-success" style={{ width: `${client.realizationRate}%` }} />
                               </div>
                            </td>
                          )}
                       </tr>
                     ))
                   )}
                </tbody>
             </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}