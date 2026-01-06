import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Calendar, DollarSign, Building2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

// Mock data matching the schema structure
const mockProjectsData = [
  {
    id: 1,
    project_name: 'E-Government Portal',
    client: { id: 1, name: 'Ministry of ICT' },
    department: { id: 1, name: 'Software Development' },
    category: { id: 1, name: 'Web Application' },
    start_date: '2024-06-15',
    end_date: '2025-02-01',
    total_project_value: 15000000,
    bills_summary: { received: 5250000, pending: 9750000 },
  },
  {
    id: 2,
    project_name: 'Smart City Infrastructure',
    client: { id: 2, name: 'Dhaka North City Corp' },
    department: { id: 2, name: 'Planning & Development' },
    category: { id: 2, name: 'Infrastructure' },
    start_date: '2024-03-20',
    end_date: '2025-04-01',
    total_project_value: 25000000,
    bills_summary: { received: 11250000, pending: 13750000 },
  },
  {
    id: 3,
    project_name: 'Export Management System',
    client: { id: 3, name: 'Bangladesh Trade Corp' },
    department: { id: 1, name: 'Software Development' },
    category: { id: 1, name: 'Web Application' },
    start_date: '2023-09-01',
    end_date: '2024-05-01',
    total_project_value: 8500000,
    bills_summary: { received: 8500000, pending: 0 },
  },
  {
    id: 4,
    project_name: 'Digital Banking Platform',
    client: { id: 4, name: 'First National Bank' },
    department: { id: 1, name: 'Software Development' },
    category: { id: 3, name: 'Mobile Application' },
    start_date: '2025-02-01',
    end_date: '2026-03-01',
    total_project_value: 35000000,
    bills_summary: { received: 0, pending: 35000000 },
  },
  {
    id: 5,
    project_name: 'Agricultural Data System',
    client: { id: 5, name: 'FAO Bangladesh' },
    department: { id: 1, name: 'Software Development' },
    category: { id: 1, name: 'Web Application' },
    start_date: '2024-08-10',
    end_date: '2025-06-01',
    total_project_value: 12000000,
    bills_summary: { received: 1800000, pending: 10200000 },
  },
];

const getProjectStatus = (project: typeof mockProjectsData[0]) => {
  const now = new Date();
  const start = new Date(project.start_date);
  const end = new Date(project.end_date);
  
  if (now < start) return 'FUTURE';
  if (now > end || project.bills_summary.pending === 0) return 'COMPLETED';
  return 'ONGOING';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ONGOING': return 'bg-primary/10 text-primary';
    case 'COMPLETED': return 'bg-success/10 text-success';
    case 'FUTURE': return 'bg-muted text-muted-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

export default function Projects() {
  const [currentPath, setCurrentPath] = useState('/projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const filteredProjects = mockProjectsData.filter(project => {
    const matchesSearch = project.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client.name.toLowerCase().includes(searchQuery.toLowerCase());
    const status = getProjectStatus(project);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || project.department.id.toString() === departmentFilter;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    navigate(path);
  };

  return (
    <DashboardLayout
      title="Projects"
      currentPath={currentPath}
      onNavigate={handleNavigate}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground">Manage and track all projects</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Project
          </Button>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search projects or clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ONGOING">Ongoing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FUTURE">Future</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="1">Software Development</SelectItem>
                <SelectItem value="2">Planning & Development</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Projects Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project, index) => {
                const status = getProjectStatus(project);
                const progress = (project.bills_summary.received / project.total_project_value) * 100;
                
                return (
                  <motion.tr
                    key={project.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-muted/50 cursor-pointer"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{project.project_name}</p>
                          <p className="text-xs text-muted-foreground">{project.category.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{project.client.name}</TableCell>
                    <TableCell>{project.department.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(project.start_date).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{formatCurrency(project.total_project_value)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <Progress value={progress} className="h-2" />
                        <span className="text-xs text-muted-foreground">{progress.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(status)}>{status}</Badge>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>

          {filteredProjects.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No projects found matching your criteria.
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
