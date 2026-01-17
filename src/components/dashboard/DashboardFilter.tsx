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
    selectedYear, setSelectedYear,
    resetFilters,
    selectedFilter,
    setSelectedFilter,
  } = useSharedFilters();

  const [departments, setDepartments] = useState<Option[]>([]);
  const [clients, setClients] = useState<Option[]>([]);
  const [projects, setProjects] = useState<Option[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate year options from 2024 to current year
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const startYear = 2024;
    const years = [];
    for (let year = currentYear; year >= startYear; year--) {
      years.push(year.toString());
    }
    return years;
  };

  const yearOptions = generateYearOptions();

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
      <div className="flex items-center space-x-2 text-muted-foreground py-3 md:py-4">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading filters...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm py-3 md:py-4">Error loading filters: {error}</div>
    );
  }

  return (
    <div className="py-3 md:py-4 overflow-x-auto">
      <div className="flex items-center gap-2 md:gap-4 min-w-max md:min-w-0 md:flex-wrap">
        <div>
          <Label htmlFor="department-filter" className="sr-only">Filter by Department</Label>
          <Select
            value={getSelectValue('department', departmentId)}
            onValueChange={handleDepartmentChange}
            disabled={isSelectDisabled('department')}
          >
            <SelectTrigger className="w-[140px] md:w-[180px] h-9 md:h-10 text-xs md:text-sm">
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
            <SelectTrigger className="w-[130px] md:w-[180px] h-9 md:h-10 text-xs md:text-sm">
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
            <SelectTrigger className="w-[130px] md:w-[180px] h-9 md:h-10 text-xs md:text-sm">
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

        <div>
          <Label htmlFor="year-filter" className="sr-only">Filter by Year</Label>
          <Select
            value={selectedYear}
            onValueChange={setSelectedYear}
          >
            <SelectTrigger className="w-[100px] md:w-[120px] h-9 md:h-10 text-xs md:text-sm">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={resetFilters} className="h-9 md:h-10 text-xs md:text-sm px-3 md:px-4 shrink-0">
          Reset
        </Button>
      </div>
    </div>
  );
}
