"use client"; 
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Calendar, DollarSign, Building2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { fetchProjects, fetchClients, fetchDepartments, fetchCategories, createProject } from '@/data/api';
import { Project, ProjectStatus, ProjectCategory } from '@/types';
import { Client, Department, Category } from '@/data';
import { useToast } from '@/hooks/use-toast';

const getProjectStatus = (project: Project): ProjectStatus => {
  const now = new Date();
  const start = new Date(project.signDate);
  
  if (now < start) return 'FUTURE';
  if (project.status === 'COMPLETED') return 'COMPLETED';
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useRouter();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    totalBudget: '',
    signDate: '',
    category: 'SOFTWARE_DEV' as ProjectCategory,
    status: 'ONGOING' as ProjectStatus,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [projectsData, clientsData, depsData, catsData] = await Promise.all([
      fetchProjects(),
      fetchClients(),
      fetchDepartments(),
      fetchCategories(),
    ]);
    setProjects(projectsData);
    setClients(clientsData);
    setDepartments(depsData);
    setCategories(catsData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const status = getProjectStatus(project);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
   navigate.push(path);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.clientName || !formData.totalBudget || !formData.signDate) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    const newProject = await createProject({
      name: formData.name,
      clientName: formData.clientName,
      totalBudget: parseFloat(formData.totalBudget),
      signDate: new Date(formData.signDate),
      category: formData.category,
      status: formData.status,
      types: ['DOMESTIC'],
    });

    if (newProject) {
      toast({
        title: 'Project Created',
        description: 'New project has been added successfully',
      });
      setIsDialogOpen(false);
      setFormData({ name: '', clientName: '', totalBudget: '', signDate: '', category: 'SOFTWARE_DEV', status: 'ONGOING' });
      loadData();
    }
    
    setLoading(false);
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
          <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
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
                <TableHead>Sign Date</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects?.map((project, index) => {
                const status = getProjectStatus(project);
                const received = project.bills
                  .filter(b => b.status === 'PAID')
                  .reduce((sum, b) => sum + b.amount, 0);
                const progress = (received / project.totalBudget) * 100;
                
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
                          <p className="font-medium">{project.name}</p>
                          <p className="text-xs text-muted-foreground">{project.category.replace('_', ' ')}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{project.clientName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(project.signDate).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{formatCurrency(project.totalBudget)}</span>
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

      {/* Add Project Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Project Name *</Label>
              <Input
                placeholder="Enter project name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Client *</Label>
              <Select 
                value={formData.clientName} 
                onValueChange={(value) => setFormData({ ...formData, clientName: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Total Budget (BDT) *</Label>
              <Input
                type="number"
                placeholder="Enter total budget"
                value={formData.totalBudget}
                onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Sign Date *</Label>
              <Input
                type="date"
                value={formData.signDate}
                onChange={(e) => setFormData({ ...formData, signDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value: ProjectCategory) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOFTWARE_DEV">Software Development</SelectItem>
                  <SelectItem value="PLANNING_DEV">Planning & Development</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: ProjectStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FUTURE">Future</SelectItem>
                  <SelectItem value="ONGOING">Ongoing</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
