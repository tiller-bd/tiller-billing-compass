"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PieChart as PieIcon, TrendingUp, Settings2, RefreshCw } from 'lucide-react';
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
import { AddClientDialog } from '@/components/clients/AddClientDialog';
import { SortableHeader, useSorting } from '@/components/ui/sortable-header';

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

  // Sorting
  const { sortedData, sortConfig, handleSort } = useSorting(clients);

  const chartData = useMemo(() => {
    const share = clients.map(c => ({ name: c.name, value: c.totalBudget })).slice(0, 5);
    const clearance = clients.map(c => ({ name: c.name, rec: c.totalReceived, due: c.totalDue })).slice(0, 8);
    return { share, clearance };
  }, [clients]);

  const formatCurrency = (v: number) => {
    // Use Indian numbering system (Lakh/Crore): 1,00,00,000 for 1 crore, 1,00,000 for 1 lakh
    const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(v));
    return `৳${formatted}`;
  };

  return (
    <DashboardLayout title="Client Registry" >
      <div className="space-y-8">
        
        {/* Comparative Charts - Hidden on small mobile, stacked on tablet */}
        <div className="hidden sm:grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="glass-card p-4 md:p-6 rounded-2xl border-border/50 h-64 md:h-80">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-widest mb-3 md:mb-4 flex items-center gap-2 text-primary">
              <PieIcon size={16}/> Budget Share
            </h3>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie data={chartData.share} innerRadius={50} outerRadius={70} dataKey="value">
                  {chartData.share.map((_, i) => <Cell key={i} fill={['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-2 glass-card p-4 md:p-6 rounded-2xl border-border/50 h-64 md:h-80">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-widest mb-3 md:mb-4 flex items-center gap-2 text-primary">
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
          <div className="flex justify-between items-center">
            <h2 className="text-base md:text-lg font-black uppercase tracking-tight">Client Directory</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={fetchClients} disabled={loading} className="rounded-full h-9 w-9">
                <RefreshCw className={loading ? "animate-spin" : ""} size={16} />
              </Button>
              <AddClientDialog onClientAdded={fetchClients} />
              {/* Column Settings - Hidden on mobile */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 font-bold hidden md:flex">
                    <Settings2 size={14}/> Column Settings
                  </Button>
                </PopoverTrigger>
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
          </div>

          <div className="glass-card rounded-2xl overflow-hidden border border-border/50">
             {/* Mobile Card View */}
             <div className="md:hidden divide-y divide-border">
               {loading ? (
                 [...Array(5)].map((_, i) => (
                   <div key={i} className="p-4">
                     <Skeleton className="h-16 w-full" />
                   </div>
                 ))
               ) : error ? (
                 <ErrorDisplay error={error} code={error.code} message={error.message} onRetry={fetchClients} compact />
               ) : sortedData.length === 0 ? (
                 <div className="p-8 text-center text-muted-foreground">No clients found</div>
               ) : (
                 sortedData.map(client => (
                   <div
                     key={client.id}
                     className="p-4 space-y-3 active:bg-muted/20 transition-colors"
                     onClick={() => router.push(`/clients/${client.id}`)}
                   >
                     {/* Header row */}
                     <div className="flex items-start justify-between gap-2">
                       <div className="flex-1 min-w-0">
                         <p className="font-black text-foreground truncate">{client.name}</p>
                         <p className="text-xs text-muted-foreground truncate">{client.contactPerson || 'No contact'}</p>
                       </div>
                       <Badge variant="secondary" className="font-black shrink-0">
                         {client.projectCount} projects
                       </Badge>
                     </div>

                     {/* Financial info */}
                     <div className="grid grid-cols-2 gap-3 text-sm">
                       <div>
                         <p className="text-[10px] text-muted-foreground uppercase font-bold">Volume</p>
                         <p className="font-bold">{formatCurrency(client.totalBudget)}</p>
                       </div>
                       <div>
                         <p className="text-[10px] text-muted-foreground uppercase font-bold">Received</p>
                         <p className="font-bold text-success">{Math.round(client.realizationRate)}%</p>
                       </div>
                     </div>

                     {/* Progress bar */}
                     <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                       <div
                         className="h-full bg-success transition-all duration-700"
                         style={{ width: `${client.realizationRate}%` }}
                       />
                     </div>
                   </div>
                 ))
               )}
             </div>

             {/* Desktop Table View */}
             <table className="hidden md:table w-full text-left">
                <thead className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground">
                   <tr>
                      <th className="p-4">
                        <SortableHeader label="Client Entity" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                      </th>
                      {visibleColumns.contact && <th className="p-4">Primary Contact</th>}
                      {visibleColumns.projects && (
                        <th className="p-4">
                          <SortableHeader label="Active Projects" sortKey="projectCount" currentSort={sortConfig} onSort={handleSort} />
                        </th>
                      )}
                      <th className="p-4">
                        <SortableHeader label="Financial Volume" sortKey="totalBudget" currentSort={sortConfig} onSort={handleSort} />
                      </th>
                      {visibleColumns.received && (
                        <th className="p-4">
                          <SortableHeader label="Received %" sortKey="realizationRate" currentSort={sortConfig} onSort={handleSort} />
                        </th>
                      )}
                   </tr>
                </thead>
                <tbody className="text-sm">
                   {loading ? (
                     [...Array(5)].map((_, i) => <tr key={i}><td className="p-4" colSpan={5}><Skeleton className="h-10 w-full" /></td></tr>)
                   ) : error ? (
                     <tr><td colSpan={5}><ErrorDisplay error={error} code={error.code} message={error.message} onRetry={fetchClients} compact /></td></tr>
                   ) : sortedData.length === 0 ? (
                     <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No clients found</td></tr>
                   ) : (
                     sortedData.map(client => (
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