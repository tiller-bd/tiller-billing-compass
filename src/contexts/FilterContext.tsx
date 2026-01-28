"use client"
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { YearType } from '@/lib/date-utils';

export interface Suggestion {
  id: string;
  name: string;
  type: 'department' | 'client' | 'status';
}

export type ProjectStatusFilter = 'all' | 'ONGOING' | 'COMPLETED' | 'PENDING_PAYMENT';

interface FilterContextType {
  search: string;
  setSearch: (search: string) => void;
  debouncedSearch: string;
  departmentId: string;
  setDepartmentId: (id: string) => void;
  clientId: string;
  setClientId: (id: string) => void;
  status: ProjectStatusFilter;
  setStatus: (status: ProjectStatusFilter) => void;
  yearType: YearType;
  setYearType: (type: YearType) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedFilter: Suggestion | null;
  setSelectedFilter: (filter: Suggestion | null) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const SharedFilterProvider = ({ children }: { children: ReactNode }) => {
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('all');
  const [clientId, setClientId] = useState('all');
  const [status, setStatus] = useState<ProjectStatusFilter>('all');
  // Default to all years (no filter)
  const [yearType, setYearType] = useState<YearType>('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState<Suggestion | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const resetFilters = () => {
    setSearch('');
    setDepartmentId('all');
    setClientId('all');
    setStatus('all');
    setYearType('all');
    setSelectedYear('all');
    setSelectedFilter(null);
  };

  return (
    <FilterContext.Provider value={{
      search,
      setSearch,
      debouncedSearch,
      departmentId,
      setDepartmentId,
      clientId,
      setClientId,
      status,
      setStatus,
      yearType,
      setYearType,
      selectedYear,
      setSelectedYear,
      selectedFilter,
      setSelectedFilter,
      resetFilters
    }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useSharedFilters = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useSharedFilters must be used within a SharedFilterProvider');
  }
  return context;
};
