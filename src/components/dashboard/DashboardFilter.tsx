"use client"

import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useSharedFilters, Suggestion } from '@/contexts/FilterContext';
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';

interface Option {
  id: string;
  name: string;
}

export function DashboardFilter() {
  const { 
    departmentId, setDepartmentId, 
    clientId, setClientId, 
    projectId, setProjectId,
    resetFilters,
    selectedFilter,
    setSelectedFilter,
  } = useSharedFilters();

  const [departments, setDepartments] = useState<Option[]>([]);
  const [clients, setClients] = useState<Option[]>([]);
  const [projects, setProjects] = useState<Option[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [departmentsRes, clientsRes, projectsRes] = await Promise.all([
          fetch('/api/departments'),
          fetch('/api/clients'),
          fetch('/api/projects')
        ]);

        if (!departmentsRes.ok) throw new Error('Failed to fetch departments');
        if (!clientsRes.ok) throw new Error('Failed to fetch clients');
        if (!projectsRes.ok) throw new Error('Failed to fetch projects');

        const departmentsData = await departmentsRes.json();
        const clientsData = await clientsRes.json();
        const projectsData = await projectsRes.json();
        
        setDepartments(departmentsData.map((d: any) => ({ id: d.id.toString(), name: d.name })));
        setClients(clientsData.map((c: any) => ({ id: c.id.toString(), name: c.name })));
        setProjects(projectsData.map((p: any) => ({ id: p.id.toString(), name: p.projectName })));

      } catch (err: any) {
        setError(err.message);
        console.error("Failed to fetch filter options:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleDepartmentChange = (value: string) => {
    setDepartmentId(value);
    setSelectedFilter(null); // Clear selected filter if dropdown is used
  }

  const handleClientChange = (value: string) => {
    setClientId(value);
    setSelectedFilter(null); // Clear selected filter if dropdown is used
  }

  const handleProjectChange = (value: string) => {
    setProjectId(value);
    setSelectedFilter(null); // Clear selected filter if dropdown is used
  }

  const getSelectValue = (type: 'department' | 'client' | 'project', currentId: string) => {
    if (selectedFilter && selectedFilter.type === type) {
      return selectedFilter.id;
    }
    return currentId;
  };

  const isSelectDisabled = (type: 'department' | 'client' | 'project') => {
    return selectedFilter !== null && selectedFilter.type !== type;
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Loading filters...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">Error loading filters: {error}</div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4 py-4">
      <div>
        <Label htmlFor="department-filter" className="sr-only">Filter by Department</Label>
        <Select 
          value={getSelectValue('department', departmentId)} 
          onValueChange={handleDepartmentChange}
          disabled={isSelectDisabled('department')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dep) => (
              <SelectItem key={dep.id} value={dep.id}>{dep.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="client-filter" className="sr-only">Filter by Client</Label>
        <Select 
          value={getSelectValue('client', clientId)} 
          onValueChange={handleClientChange}
          disabled={isSelectDisabled('client')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((cli) => (
              <SelectItem key={cli.id} value={cli.id}>{cli.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="project-filter" className="sr-only">Filter by Project</Label>
        <Select 
          value={getSelectValue('project', projectId)} 
          onValueChange={handleProjectChange}
          disabled={isSelectDisabled('project')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((proj) => (
              <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" onClick={resetFilters}>
        Reset Filters
      </Button>
    </div>
  );
}
