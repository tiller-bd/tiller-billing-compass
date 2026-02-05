"use client"

import { useEffect, useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useSharedFilters, ProjectStatusFilter } from '@/contexts/FilterContext';
import { Label } from '@/components/ui/label';
import { RefreshCw, Clock, CheckCircle2, CircleDollarSign } from 'lucide-react';
import { getCalendarYearOptions, getFiscalYearOptions, getCurrentFiscalYear, YearType } from '@/lib/date-utils';

interface Option {
  id: string;
  name: string;
}

const STATUS_OPTIONS: { value: ProjectStatusFilter; label: string; icon: typeof Clock }[] = [
  { value: 'all', label: 'All Statuses', icon: Clock },
  { value: 'ONGOING', label: 'Ongoing', icon: Clock },
  { value: 'COMPLETED', label: 'Completed', icon: CheckCircle2 },
  { value: 'OUTSTANDING', label: 'Outstanding', icon: CircleDollarSign },
];

export function DashboardFilter() {
  const {
    departmentId, setDepartmentId,
    clientId, setClientId,
    status, setStatus,
    yearType, setYearType,
    selectedYear, setSelectedYear,
    resetFilters,
    selectedFilter,
    setSelectedFilter,
  } = useSharedFilters();

  const [departments, setDepartments] = useState<Option[]>([]);
  const [clients, setClients] = useState<Option[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate year options
  const calendarYearOptions = useMemo(() => getCalendarYearOptions(), []);
  const fiscalYearOptions = useMemo(() => getFiscalYearOptions(), []);

  // Get current year options based on selected type
  const yearOptions = yearType === 'fiscal' ? fiscalYearOptions : calendarYearOptions;

  // Construct year parameter for API calls
  const getYearParam = (): string => {
    if (selectedYear === 'all') return 'all';
    return yearType === 'fiscal' ? `fy-${selectedYear}` : `cal-${selectedYear}`;
  };

  // Handle year type change - also update selected year to a valid value for the new type
  const handleYearTypeChange = (newType: YearType) => {
    setYearType(newType);
    // Set default year for the new type
    if (newType === 'all') {
      setSelectedYear('all');
    } else if (newType === 'fiscal') {
      setSelectedYear(getCurrentFiscalYear());
    } else {
      setSelectedYear(new Date().getFullYear().toString());
    }
  };

  // Fetch filter options when year changes
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const yearParam = getYearParam();
        const yearQuery = yearParam !== 'all' ? `?year=${yearParam}` : '';

        const [departmentsRes, clientsRes] = await Promise.all([
          fetch(`/api/departments${yearQuery}`),
          fetch(`/api/clients${yearQuery}`)
        ]);

        if (!departmentsRes.ok) throw new Error('Failed to fetch departments');
        if (!clientsRes.ok) throw new Error('Failed to fetch clients');

        const departmentsData = await departmentsRes.json();
        const clientsData = await clientsRes.json();

        const newDepartments = departmentsData.map((d: any) => ({ id: d.id.toString(), name: d.name }));
        const newClients = clientsData.map((c: any) => ({ id: c.id.toString(), name: c.name }));

        setDepartments(newDepartments);
        setClients(newClients);

        // Reset selections if current value is no longer available
        if (departmentId !== 'all' && !newDepartments.some((d: Option) => d.id === departmentId)) {
          setDepartmentId('all');
        }
        if (clientId !== 'all' && !newClients.some((c: Option) => c.id === clientId)) {
          setClientId('all');
        }

      } catch (err: any) {
        setError(err.message);
        console.error("Failed to fetch filter options:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [yearType, selectedYear]);

  const handleDepartmentChange = (value: string) => {
    setDepartmentId(value);
    setSelectedFilter(null); // Clear selected filter if dropdown is used
  }

  const handleClientChange = (value: string) => {
    setClientId(value);
    setSelectedFilter(null); // Clear selected filter if dropdown is used
  }

  const handleStatusChange = (value: string) => {
    setStatus(value as ProjectStatusFilter);
    setSelectedFilter(null); // Clear selected filter if dropdown is used
  }

  const getSelectValue = (type: 'department' | 'client' | 'status', currentId: string) => {
    if (selectedFilter && selectedFilter.type === type) {
      return selectedFilter.id;
    }
    return currentId;
  };

  const isSelectDisabled = (type: 'department' | 'client' | 'status') => {
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
          <Label htmlFor="status-filter" className="sr-only">Filter by Status</Label>
          <Select
            value={getSelectValue('status', status)}
            onValueChange={handleStatusChange}
            disabled={isSelectDisabled('status')}
          >
            <SelectTrigger className="w-[140px] md:w-[180px] h-9 md:h-10 text-xs md:text-sm">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center gap-2">
                    <opt.icon className="w-3.5 h-3.5" />
                    <span>{opt.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year Type Selector - All Years is default */}
        <div>
          <Label htmlFor="year-type-filter" className="sr-only">Year Type</Label>
          <Select
            value={yearType}
            onValueChange={(value) => handleYearTypeChange(value as YearType)}
          >
            <SelectTrigger className="w-[100px] md:w-[120px] h-9 md:h-10 text-xs md:text-sm">
              <SelectValue placeholder="Year Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="fiscal">Fiscal</SelectItem>
              <SelectItem value="calendar">Calendar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Year Value Selector - Only show when fiscal or calendar is selected */}
        {yearType !== 'all' && (
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
                  <SelectItem key={year} value={year}>
                    {yearType === 'fiscal' ? `FY ${year}` : year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button variant="outline" onClick={resetFilters} className="h-9 md:h-10 text-xs md:text-sm px-3 md:px-4 shrink-0">
          Reset
        </Button>
      </div>
    </div>
  );
}
