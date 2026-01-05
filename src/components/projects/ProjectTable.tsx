import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronDown,
  ExternalLink,
  MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { Project } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ProjectTableProps {
  projects: Project[];
  onProjectClick?: (project: Project) => void;
}

type SortField = 'name' | 'clientName' | 'totalBudget' | 'signDate' | 'status';
type SortOrder = 'asc' | 'desc';

export function ProjectTable({ projects, onProjectClick }: ProjectTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('signDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONGOING':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'COMPLETED':
        return 'bg-success/20 text-success border-success/30';
      case 'FUTURE':
        return 'bg-warning/20 text-warning border-warning/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.clientName.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'clientName':
          comparison = a.clientName.localeCompare(b.clientName);
          break;
        case 'totalBudget':
          comparison = a.totalBudget - b.totalBudget;
          break;
        case 'signDate':
          comparison = new Date(a.signDate).getTime() - new Date(b.signDate).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [projects, searchQuery, statusFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const calculateProgress = (project: Project) => {
    const received = project.bills
      .filter(b => b.status === 'PAID')
      .reduce((sum, b) => sum + b.amount, 0);
    return Math.round((received / project.totalBudget) * 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      {/* Table Header */}
      <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 bg-secondary border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ONGOING">Ongoing</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="FUTURE">Future</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          More Filters
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-4 font-medium text-muted-foreground">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Project
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left p-4 font-medium text-muted-foreground">
                <button
                  onClick={() => handleSort('clientName')}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Client
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left p-4 font-medium text-muted-foreground">
                <button
                  onClick={() => handleSort('signDate')}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Sign Date
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left p-4 font-medium text-muted-foreground">
                <button
                  onClick={() => handleSort('totalBudget')}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Budget
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left p-4 font-medium text-muted-foreground">Progress</th>
              <th className="text-left p-4 font-medium text-muted-foreground">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Status
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedProjects.map((project, index) => {
              const progress = calculateProgress(project);
              const received = project.bills
                .filter(b => b.status === 'PAID')
                .reduce((sum, b) => sum + b.amount, 0);

              return (
                <motion.tr
                  key={project.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => onProjectClick?.(project)}
                >
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-foreground">{project.name}</p>
                      <div className="flex gap-1 mt-1">
                        {project.types.map((type) => (
                          <span
                            key={type}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{project.clientName}</td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {format(new Date(project.signDate), 'MMM dd, yyyy')}
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-foreground">{formatCurrency(project.totalBudget)}</p>
                      <p className="text-xs text-muted-foreground">
                        Received: {formatCurrency(received)}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="w-24">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground">{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge
                      variant="outline"
                      className={cn("text-xs", getStatusColor(project.status))}
                    >
                      {project.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>Edit Project</DropdownMenuItem>
                        <DropdownMenuItem>Manage Phases</DropdownMenuItem>
                        <DropdownMenuItem>Add Bill</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredAndSortedProjects.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">No projects found</p>
        </div>
      )}
    </motion.div>
  );
}
