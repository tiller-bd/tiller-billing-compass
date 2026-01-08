"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, PieChart as PieIcon, TrendingUp, Settings2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visibleColumns, setVisibleColumns] = useState({ contact: true, projects: true, realization: true });

  const fetchClients = async () => {
    setLoading(true);
    const res = await fetch(`/api/clients?search=${search}`);
    setClients(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchClients, 400);
    return () => clearTimeout(timer);
  }, [search]);

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

        {/* Registry Table */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
             <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search client registry..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/30 border-none" />
             </div>
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
                      {visibleColumns.realization && <th className="p-4">Realization</th>}
                   </tr>
                </thead>
                <tbody className="text-sm">
                   {loading ? (
                     [...Array(5)].map((_, i) => <tr key={i}><td className="p-4"><Skeleton className="h-10 w-full" /></td></tr>)
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
                          {visibleColumns.realization && (
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