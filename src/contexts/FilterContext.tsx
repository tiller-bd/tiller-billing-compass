"use client"
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

export interface Suggestion {
  id: string;
  name: string;
  type: 'department' | 'client' | 'project';
}

interface FilterContextType {
  search: string;
  setSearch: (search: string) => void;
  debouncedSearch: string;
  departmentId: string;
  setDepartmentId: (id: string) => void;
  clientId: string;
  setClientId: (id: string) => void;
  projectId: string;
  setProjectId: (id: string) => void;
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
  const [projectId, setProjectId] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedFilter, setSelectedFilter] = useState<Suggestion | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const resetFilters = () => {
    setSearch('');
    setDepartmentId('all');
    setClientId('all');
    setProjectId('all');
    setSelectedYear(new Date().getFullYear().toString());
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
      projectId,
      setProjectId,
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
