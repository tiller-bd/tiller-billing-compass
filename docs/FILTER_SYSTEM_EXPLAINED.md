# Filter System Explained

This document provides a detailed explanation of how the filter system works in the dashboard application, from UI interaction to database query.

---

## Table of Contents

1. [Overview](#overview)
2. [FilterContext State Management](#filtercontext-state-management)
3. [Filter Component Hierarchy](#filter-component-hierarchy)
4. [Entity Filters (Department, Client, Project)](#entity-filters-department-client-project)
5. [Year Filter Flow (Fiscal vs Calendar)](#year-filter-flow-fiscal-vs-calendar)
6. [Reset Filters Functionality](#reset-filters-functionality)
7. [Filter → API Parameter Mapping](#filter--api-parameter-mapping)
8. [Complete Filter Application Example](#complete-filter-application-example)

---

## Overview

The filter system allows users to filter dashboard data by:
- **Department** - Filter by organizational department
- **Client** - Filter by client company
- **Project** - Filter by specific project
- **Year Type** - Choose between Fiscal Year or Calendar Year
- **Year** - Select the specific year to view

All filters are managed through a centralized React Context (`FilterContext`) and are applied to all dashboard API calls.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FILTER SYSTEM OVERVIEW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   USER INTERFACE                                                            │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│   │  Dept   │ │ Client  │ │ Project │ │  Year   │ │  Year   │              │
│   │Dropdown │ │Dropdown │ │Dropdown │ │  Type   │ │  Value  │              │
│   └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘              │
│        │           │           │           │           │                    │
│        └───────────┴───────────┴───────────┴───────────┘                    │
│                              │                                              │
│                              ▼                                              │
│                    ┌─────────────────────┐                                  │
│                    │   FilterContext     │                                  │
│                    │   (Global State)    │                                  │
│                    └──────────┬──────────┘                                  │
│                               │                                              │
│                               ▼                                              │
│                    ┌─────────────────────┐                                  │
│                    │   API Fetch Layer   │                                  │
│                    │  (Query Params)     │                                  │
│                    └──────────┬──────────┘                                  │
│                               │                                              │
│                               ▼                                              │
│                    ┌─────────────────────┐                                  │
│                    │   Dashboard APIs    │                                  │
│                    │  (Database Query)   │                                  │
│                    └─────────────────────┘                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## FilterContext State Management

The `FilterContext` (`src/contexts/FilterContext.tsx`) is the central state manager for all filters.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FilterContext (src/contexts/FilterContext.tsx)           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        STATE DEFINITION                             │   │
│  │                                                                      │   │
│  │  // Entity filters                                                  │   │
│  │  const [departmentId, setDepartmentId] = useState('all');          │   │
│  │  const [clientId, setClientId] = useState('all');                  │   │
│  │  const [projectId, setProjectId] = useState('all');                │   │
│  │                                                                      │   │
│  │  // Year filters (separate states)                                  │   │
│  │  const [yearType, setYearType] = useState<YearType>('fiscal');     │   │
│  │  const [selectedYear, setSelectedYear] = useState(                 │   │
│  │    getCurrentFiscalYear()  // e.g., "2024-25"                      │   │
│  │  );                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     CONTEXT VALUE (Exported)                        │   │
│  │                                                                      │   │
│  │  {                                                                  │   │
│  │    // State values                                                  │   │
│  │    departmentId,    // "all" | "1" | "2" | ...                     │   │
│  │    clientId,        // "all" | "1" | "2" | ...                     │   │
│  │    projectId,       // "all" | "1" | "2" | ...                     │   │
│  │    yearType,        // "fiscal" | "calendar"                       │   │
│  │    selectedYear,    // "2024-25" | "2025" | ...                    │   │
│  │                                                                      │   │
│  │    // Setter functions                                              │   │
│  │    setDepartmentId,                                                 │   │
│  │    setClientId,                                                     │   │
│  │    setProjectId,                                                    │   │
│  │    setYearType,                                                     │   │
│  │    setSelectedYear,                                                 │   │
│  │                                                                      │   │
│  │    // Utility functions                                             │   │
│  │    resetFilters     // Resets all to defaults                      │   │
│  │  }                                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Points:
- **Default Year Type**: `'fiscal'` (prioritized over calendar)
- **Default Year**: Current fiscal year (e.g., `"2024-25"`)
- **"all" value**: Used for entity filters to indicate "no filter"

---

## Filter Component Hierarchy

The filter system uses React Context to share state across all pages.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      COMPONENT HIERARCHY                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                        ┌─────────────────────┐                              │
│                        │ SharedFilterProvider │ ← Wraps entire app          │
│                        │  (FilterContext)     │   in layout.tsx             │
│                        └──────────┬──────────┘                              │
│                                   │                                          │
│                    ┌──────────────┼──────────────┐                          │
│                    │              │              │                           │
│                    ▼              ▼              ▼                           │
│            ┌──────────────┐ ┌──────────┐ ┌────────────┐                     │
│            │  Dashboard   │ │ Billing  │ │  Projects  │                     │
│            │   Page       │ │   Page   │ │    Page    │                     │
│            │  (page.tsx)  │ │          │ │            │                     │
│            └──────┬───────┘ └────┬─────┘ └─────┬──────┘                     │
│                   │              │             │                             │
│                   ▼              │             │                             │
│            ┌──────────────┐     │             │                             │
│            │DashboardFilter│    │             │                             │
│            │  Component   │←────┼─────────────┘                             │
│            └──────┬───────┘     │         (Reused across pages)             │
│                   │              │                                           │
│                   ▼              ▼                                           │
│         ┌─────────────────────────────────────────┐                         │
│         │        useSharedFilters() Hook          │                         │
│         │                                          │                         │
│         │  // Any component can access filters:   │                         │
│         │  const {                                │                         │
│         │    departmentId,                        │                         │
│         │    clientId,                            │                         │
│         │    projectId,                           │                         │
│         │    yearType,                            │                         │
│         │    selectedYear,                        │                         │
│         │    setDepartmentId,                     │                         │
│         │    ...                                  │                         │
│         │  } = useSharedFilters();               │                         │
│         └─────────────────────────────────────────┘                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Files Involved:
| File | Purpose |
|------|---------|
| `src/contexts/FilterContext.tsx` | Defines context and provider |
| `src/app/layout.tsx` | Wraps app with `SharedFilterProvider` |
| `src/components/dashboard/DashboardFilter.tsx` | Filter UI dropdowns |
| `src/app/page.tsx` | Dashboard page, uses filters for API calls |

---

## Entity Filters (Department, Client, Project)

These filters work identically - they filter data by a specific entity ID.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ENTITY FILTER FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1: User Interaction                                                  │
│  ─────────────────────────                                                  │
│                                                                             │
│    [Department Dropdown]                                                    │
│         │                                                                   │
│         ├─ "All Departments" (value: "all")                                │
│         ├─ "Engineering" (value: "1")                                      │
│         ├─ "Design" (value: "2")                                           │
│         └─ "Marketing" (value: "3")                                        │
│                                                                             │
│  STEP 2: State Update (onChange)                                           │
│  ───────────────────────────────                                            │
│                                                                             │
│    // In DashboardFilter.tsx                                               │
│    <Select                                                                 │
│      value={departmentId}                                                  │
│      onValueChange={(value) => {                                          │
│        setDepartmentId(value);  // Updates context state                  │
│      }}                                                                    │
│    >                                                                       │
│                                                                             │
│  STEP 3: Effect Triggered in page.tsx                                      │
│  ────────────────────────────────────                                       │
│                                                                             │
│    useEffect(() => {                                                       │
│      // Re-fetch all data when filters change                             │
│      fetchMetrics();                                                       │
│      fetchRevenue();                                                       │
│      fetchDistribution();                                                  │
│      // ... all other fetches                                             │
│    }, [departmentId, clientId, projectId, yearParam]);                    │
│           ↑                                                                │
│           └── Dependency array includes filter values                     │
│                                                                             │
│  STEP 4: Query Parameter Construction                                      │
│  ────────────────────────────────────                                       │
│                                                                             │
│    const getFilterQueryParams = useCallback(() => {                        │
│      const params = new URLSearchParams();                                 │
│      if (departmentId !== 'all') {                                        │
│        params.append('departmentId', departmentId);                       │
│      }                                                                     │
│      if (clientId !== 'all') {                                            │
│        params.append('clientId', clientId);                               │
│      }                                                                     │
│      if (projectId !== 'all') {                                           │
│        params.append('projectId', projectId);                             │
│      }                                                                     │
│      return params.toString();                                            │
│    }, [departmentId, clientId, projectId]);                               │
│                                                                             │
│    // Example outputs:                                                     │
│    // departmentId=1 → "departmentId=1"                                   │
│    // departmentId=1, clientId=2 → "departmentId=1&clientId=2"           │
│    // all values = "all" → "" (empty string)                              │
│                                                                             │
│  STEP 5: API URL Construction                                              │
│  ────────────────────────────                                               │
│                                                                             │
│    const params = getFilterQueryParams();                                  │
│    const url = `/api/dashboard/metrics?year=${yearParam}&${params}`;      │
│                                                                             │
│    // Final URL examples:                                                  │
│    // No filters: /api/dashboard/metrics?year=fy-2024-25&                 │
│    // With dept:  /api/dashboard/metrics?year=fy-2024-25&departmentId=1   │
│    // With all:   /api/dashboard/metrics?year=fy-2024-25&departmentId=1   │
│    //             &clientId=2&projectId=3                                  │
│                                                                             │
│  STEP 6: API Receives and Applies Filter                                   │
│  ───────────────────────────────────────                                    │
│                                                                             │
│    // In API route (e.g., metrics/route.ts)                               │
│    const departmentId = searchParams.get("departmentId");                 │
│                                                                             │
│    const where: any = {};                                                  │
│    if (departmentId && departmentId !== "all") {                          │
│      const parsed = parseInt(departmentId);                               │
│      if (!isNaN(parsed)) where.departmentId = parsed;                     │
│    }                                                                       │
│                                                                             │
│    // Prisma query uses the where clause                                  │
│    prisma.project.findMany({ where, ... });                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Year Filter Flow (Fiscal vs Calendar)

The year filter uses two separate dropdowns: Year Type and Year Value.

### Fiscal Year Definition

```
Fiscal Year 2024-25:
├── Start: July 1, 2024
└── End:   June 30, 2025

Fiscal Year 2025-26:
├── Start: July 1, 2025
└── End:   June 30, 2026

Calendar Year 2025:
├── Start: January 1, 2025
└── End:   December 31, 2025
```

### Year Filter Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    YEAR FILTER FLOW                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1: Two Separate Dropdowns                                            │
│  ──────────────────────────────                                             │
│                                                                             │
│    ┌─────────────────┐    ┌─────────────────┐                              │
│    │  Year Type      │    │    Year         │                              │
│    │  ┌───────────┐  │    │  ┌───────────┐  │                              │
│    │  │ Fiscal  ▼ │  │    │  │ 2024-25 ▼ │  │   ← Options change          │
│    │  └───────────┘  │    │  └───────────┘  │     based on type           │
│    │  • Fiscal       │    │  • 2023-24      │                              │
│    │  • Calendar     │    │  • 2024-25      │                              │
│    └─────────────────┘    │  • 2025-26      │                              │
│                           └─────────────────┘                              │
│                                                                             │
│    When "Calendar" selected:                                               │
│    ┌─────────────────┐    ┌─────────────────┐                              │
│    │  Year Type      │    │    Year         │                              │
│    │  ┌───────────┐  │    │  ┌───────────┐  │                              │
│    │  │Calendar ▼ │  │    │  │  2025   ▼ │  │   ← Shows calendar years    │
│    │  └───────────┘  │    │  └───────────┘  │                              │
│    │  • Fiscal       │    │  • 2024         │                              │
│    │  • Calendar     │    │  • 2025         │                              │
│    └─────────────────┘    │  • 2026         │                              │
│                           └─────────────────┘                              │
│                                                                             │
│  STEP 2: Year Type Change Handler                                          │
│  ────────────────────────────────                                           │
│                                                                             │
│    // In DashboardFilter.tsx                                               │
│    const handleYearTypeChange = (newType: YearType) => {                  │
│      setYearType(newType);                                                 │
│                                                                             │
│      // Auto-update year value to match type                              │
│      if (newType === 'fiscal') {                                          │
│        setSelectedYear(getCurrentFiscalYear());  // e.g., "2024-25"       │
│      } else {                                                              │
│        setSelectedYear(new Date().getFullYear().toString()); // "2025"    │
│      }                                                                     │
│    };                                                                      │
│                                                                             │
│  STEP 3: Year Parameter Construction (in page.tsx)                         │
│  ─────────────────────────────────────────────────                          │
│                                                                             │
│    const yearParam = yearType === 'fiscal'                                │
│      ? `fy-${selectedYear}`     // "fy-2024-25"                           │
│      : `cal-${selectedYear}`;   // "cal-2025"                             │
│                                                                             │
│  STEP 4: API Parameter Parsing                                             │
│  ─────────────────────────────                                              │
│                                                                             │
│    // In API routes (using src/lib/date-utils.ts)                         │
│    import { parseYearValue, getYearDateRange } from '@/lib/date-utils';   │
│                                                                             │
│    const yearParam = searchParams.get("year");  // "fy-2024-25"           │
│                                                                             │
│    if (yearParam) {                                                        │
│      const { type: yearType, year } = parseYearValue(yearParam);          │
│      // yearType = "fiscal", year = "2024-25"                             │
│                                                                             │
│      const isFiscal = yearType === "fiscal";                              │
│      const { start, end } = getYearDateRange(year, isFiscal);            │
│      // start = 2024-07-01T00:00:00.000Z                                  │
│      // end = 2025-06-30T23:59:59.999Z                                    │
│    }                                                                       │
│                                                                             │
│  STEP 5: Database Query with Date Range                                    │
│  ──────────────────────────────────────                                     │
│                                                                             │
│    // Different APIs filter on different date fields:                      │
│                                                                             │
│    // Distribution API - filters project.startDate                        │
│    prisma.project.findMany({                                              │
│      where: {                                                             │
│        startDate: { gte: start, lte: end }                               │
│      }                                                                    │
│    });                                                                     │
│                                                                             │
│    // Revenue API - filters bill.receivedDate                             │
│    prisma.projectBill.findMany({                                          │
│      where: {                                                             │
│        receivedDate: { gte: start, lte: end },                           │
│        status: "PAID"                                                     │
│      }                                                                    │
│    });                                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Date Utility Functions (`src/lib/date-utils.ts`)

```typescript
// Parse year parameter string
parseYearValue("fy-2024-25")
// Returns: { type: 'fiscal', year: '2024-25' }

parseYearValue("cal-2025")
// Returns: { type: 'calendar', year: '2025' }

// Get date range for a year
getYearDateRange('2024-25', true)  // fiscal = true
// Returns: { start: 2024-07-01, end: 2025-06-30 }

getYearDateRange('2025', false)  // fiscal = false
// Returns: { start: 2025-01-01, end: 2025-12-31 }

// Get current fiscal year
getCurrentFiscalYear()
// Returns: "2024-25" (if between Jul 2024 - Jun 2025)

// Get fiscal month index (for revenue chart ordering)
getFiscalMonthIndex(date)
// July (month 6) → returns 0
// August (month 7) → returns 1
// ...
// June (month 5) → returns 11
// Formula: (month + 6) % 12
```

---

## Reset Filters Functionality

The reset button restores all filters to their default values.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RESET FILTERS FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌──────────────┐                                                        │
│    │    Reset     │  ← User clicks                                         │
│    │   Button     │                                                        │
│    └──────┬───────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│    ┌──────────────────────────────────────────────────────────────┐        │
│    │                     resetFilters()                            │        │
│    │                                                               │        │
│    │  const resetFilters = () => {                                │        │
│    │    // Reset entity filters to "all"                          │        │
│    │    setDepartmentId('all');                                   │        │
│    │    setClientId('all');                                       │        │
│    │    setProjectId('all');                                      │        │
│    │                                                               │        │
│    │    // Reset year filters to fiscal defaults                  │        │
│    │    setYearType('fiscal');                                    │        │
│    │    setSelectedYear(getCurrentFiscalYear());                  │        │
│    │  };                                                          │        │
│    └──────────────────────────────────────────────────────────────┘        │
│           │                                                                 │
│           ▼                                                                 │
│    ┌──────────────────────────────────────────────────────────────┐        │
│    │  All state updates trigger useEffect → All APIs re-fetched   │        │
│    └──────────────────────────────────────────────────────────────┘        │
│                                                                             │
│    DEFAULT VALUES AFTER RESET:                                             │
│    ┌────────────────────┬────────────────────────────────────────┐         │
│    │ Filter             │ Default Value                          │         │
│    ├────────────────────┼────────────────────────────────────────┤         │
│    │ departmentId       │ "all"                                  │         │
│    │ clientId           │ "all"                                  │         │
│    │ projectId          │ "all"                                  │         │
│    │ yearType           │ "fiscal"                               │         │
│    │ selectedYear       │ getCurrentFiscalYear() (e.g., "2024-25")│        │
│    └────────────────────┴────────────────────────────────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Filter → API Parameter Mapping

### Entity Filters

| UI State | Query Param | Prisma Where Clause |
|----------|-------------|---------------------|
| `departmentId="all"` | (not sent) | (no filter applied) |
| `departmentId="1"` | `departmentId=1` | `where: { departmentId: 1 }` |
| `clientId="all"` | (not sent) | (no filter applied) |
| `clientId="2"` | `clientId=2` | `where: { clientId: 2 }` |
| `projectId="all"` | (not sent) | (no filter applied) |
| `projectId="3"` | `projectId=3` | `where: { id: 3 }` |

### Year Filters

| UI State | Query Param | Date Range Applied |
|----------|-------------|-------------------|
| `yearType="fiscal"`, `selectedYear="2024-25"` | `year=fy-2024-25` | `gte: 2024-07-01`, `lte: 2025-06-30` |
| `yearType="calendar"`, `selectedYear="2025"` | `year=cal-2025` | `gte: 2025-01-01`, `lte: 2025-12-31` |

### Date Field Filtered by Each API

| API Endpoint | Date Field Filtered |
|--------------|---------------------|
| `/api/dashboard/metrics` | `bill.receivedDate` (in-memory filter) |
| `/api/dashboard/revenue` | `bill.receivedDate` (DB query) |
| `/api/dashboard/distribution` | `project.startDate` (DB query) |
| `/api/dashboard/budget-comparison` | `project.startDate` (DB query) |
| `/api/dashboard/last-received` | `bill.receivedDate` (DB query) |
| `/api/dashboard/deadlines` | `bill.tentativeBillingDate` (DB query) |
| `/api/dashboard/calendar` | All dates (in-memory filter) |
| `/api/dashboard/projects` | `project.startDate` (DB query) |

---

## Complete Filter Application Example

Here's a complete walkthrough of what happens when a user applies filters:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│               COMPLETE EXAMPLE: User selects filters                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  USER SELECTIONS:                                                          │
│    • Department: "Engineering" (id: 1)                                     │
│    • Client: "All Clients"                                                 │
│    • Project: "All Projects"                                               │
│    • Year Type: "Fiscal"                                                   │
│    • Year: "2024-25"                                                       │
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  STEP 1: CONTEXT STATE                                                     │
│                                                                             │
│    {                                                                       │
│      departmentId: "1",                                                    │
│      clientId: "all",                                                      │
│      projectId: "all",                                                     │
│      yearType: "fiscal",                                                   │
│      selectedYear: "2024-25"                                               │
│    }                                                                       │
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  STEP 2: yearParam CONSTRUCTED                                             │
│                                                                             │
│    yearParam = "fy-2024-25"                                               │
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  STEP 3: QUERY PARAMS CONSTRUCTED                                          │
│                                                                             │
│    getFilterQueryParams() → "departmentId=1"                              │
│    (clientId and projectId are "all" so not included)                     │
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  STEP 4: API URL GENERATED                                                 │
│                                                                             │
│    /api/dashboard/metrics?year=fy-2024-25&departmentId=1                  │
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  STEP 5: API RECEIVES & PARSES                                             │
│                                                                             │
│    yearParam = "fy-2024-25"                                               │
│    parseYearValue("fy-2024-25") → { type: "fiscal", year: "2024-25" }    │
│    getYearDateRange("2024-25", true) → {                                  │
│      start: 2024-07-01T00:00:00.000Z,                                     │
│      end: 2025-06-30T23:59:59.999Z                                        │
│    }                                                                       │
│    departmentId = parseInt("1") → 1                                       │
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  STEP 6: PRISMA QUERY BUILT                                                │
│                                                                             │
│    prisma.project.findMany({                                              │
│      where: {                                                             │
│        departmentId: 1                                                    │
│      },                                                                   │
│      include: { bills: true }                                             │
│    })                                                                      │
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  STEP 7: POST-QUERY FILTERING (for metrics API)                            │
│                                                                             │
│    for each project's bills:                                              │
│      keep bill if:                                                        │
│        bill.receivedDate >= 2024-07-01 AND                               │
│        bill.receivedDate <= 2025-06-30                                   │
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  RESULT:                                                                   │
│                                                                             │
│    Only Engineering department projects with bills received               │
│    between July 1, 2024 and June 30, 2025 are included in metrics        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## File References

| File | Purpose |
|------|---------|
| `src/contexts/FilterContext.tsx` | Global filter state management |
| `src/components/dashboard/DashboardFilter.tsx` | Filter UI dropdowns |
| `src/lib/date-utils.ts` | Year parsing and date range utilities |
| `src/app/page.tsx` | Dashboard page, uses filters for API calls |
| `src/app/api/dashboard/*/route.ts` | API endpoints that receive filter params |

---

## Related Documentation

- [Dashboard Data Flow](./DASHBOARD_DATA_FLOW.md) - Complete API flow documentation
