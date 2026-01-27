# Dashboard Data Flow Documentation

This document explains how data flows from the UI filters through API endpoints to the dashboard components in `src/app/page.tsx`.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Filter System](#filter-system)
3. [API Endpoints](#api-endpoints)
4. [Component Data Mapping](#component-data-mapping)
5. [Year Filtering (Calendar vs Fiscal)](#year-filtering-calendar-vs-fiscal)
6. [Detailed API Flow Diagrams](#detailed-api-flow-diagrams)
7. [How Filters Work (In-Depth)](#how-filters-work-in-depth)
   - [FilterContext State Management](#filtercontext-state-management)
   - [Filter Component Hierarchy](#filter-component-hierarchy)
   - [Entity Filters (Department, Client, Project)](#entity-filters-department-client-project)
   - [Year Filter Flow (Fiscal vs Calendar)](#year-filter-flow-fiscal-vs-calendar)
   - [Reset Filters Functionality](#reset-filters-functionality)
   - [Filter → API Parameter Mapping](#filter--api-parameter-mapping)
   - [Complete Filter Application Example](#complete-filter-application-example)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DASHBOARD PAGE                                  │
│                           (src/app/page.tsx)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     FILTER CONTEXT (SharedFilterProvider)            │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │   │
│  │  │Department│ │  Client  │ │ Project  │ │Year Type │ │   Year    │  │   │
│  │  │    Id    │ │    Id    │ │    Id    │ │ (fiscal/ │ │ (2024-25  │  │   │
│  │  │          │ │          │ │          │ │ calendar)│ │  or 2025) │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └───────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      yearParam Construction                          │   │
│  │         yearParam = yearType === 'fiscal'                           │   │
│  │                    ? `fy-${selectedYear}`   (e.g., "fy-2024-25")    │   │
│  │                    : `cal-${selectedYear}` (e.g., "cal-2025")       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         API FETCH LAYER                              │   │
│  │                                                                      │   │
│  │   fetchMetrics()      fetchRevenue()       fetchDistribution()      │   │
│  │   fetchBudgetComparison()   fetchLastReceived()   fetchDeadlines()  │   │
│  │   fetchCalendar()     fetchProjects()                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API ENDPOINTS                                  │
│                      (src/app/api/dashboard/*)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  /api/dashboard/metrics          /api/dashboard/revenue                     │
│  /api/dashboard/distribution     /api/dashboard/budget-comparison           │
│  /api/dashboard/last-received    /api/dashboard/deadlines                   │
│  /api/dashboard/calendar         /api/dashboard/projects                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE (Prisma)                              │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   Project   │  │ ProjectBill │  │   Client    │  │ Department  │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Filter System

### Filter Components and Context

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        DashboardFilter Component                           │
│                 (src/components/dashboard/DashboardFilter.tsx)             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                         │
│  │ Department  │  │   Client    │  │   Project   │                         │
│  │  Dropdown   │  │  Dropdown   │  │  Dropdown   │                         │
│  │             │  │             │  │             │                         │
│  │ • All Depts │  │ • All       │  │ • All       │                         │
│  │ • Dept 1    │  │ • Client 1  │  │ • Project 1 │                         │
│  │ • Dept 2    │  │ • Client 2  │  │ • Project 2 │                         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                         │
│         │                │                │                                │
│         ▼                ▼                ▼                                │
│  ┌─────────────────────────────────────────────┐                           │
│  │          FilterContext State                │                           │
│  │  departmentId: "all" | "1" | "2" | ...     │                            │
│  │  clientId: "all" | "1" | "2" | ...         │                            │
│  │  projectId: "all" | "1" | "2" | ...        │                            │
│  └─────────────────────────────────────────────┘                           │
│                                                                            │
│  ┌─────────────┐  ┌─────────────┐                                          │
│  │  Year Type  │  │    Year     │     ┌─────────────┐                      │
│  │  Dropdown   │  │  Dropdown   │     │   Reset     │                      │
│  │             │  │             │     │   Button    │                      │
│  │ • Fiscal    │  │ • FY 2024-25│     └─────────────┘                      │
│  │ • Calendar  │  │ • FY 2025-26│                                          │
│  └──────┬──────┘  └──────┬──────┘                                          │
│         │                │                                                 │
│         ▼                ▼                                                 │
│  ┌─────────────────────────────────────────────┐                           │
│  │          FilterContext State                │                           │
│  │  yearType: "fiscal" | "calendar"           │                            │
│  │  selectedYear: "2024-25" | "2025" | ...    │                            │
│  └─────────────────────────────────────────────┘                           │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Query Parameter Construction

```typescript
// In page.tsx

// Step 1: Get filter values from context
const { departmentId, clientId, projectId, yearType, selectedYear } = useSharedFilters();

// Step 2: Construct year parameter with prefix
const yearParam = yearType === 'fiscal'
  ? `fy-${selectedYear}`    // e.g., "fy-2024-25"
  : `cal-${selectedYear}`;  // e.g., "cal-2025"

// Step 3: Build query string for entity filters
const getFilterQueryParams = () => {
  const params = new URLSearchParams();
  if (departmentId !== 'all') params.append('departmentId', departmentId);
  if (clientId !== 'all') params.append('clientId', clientId);
  if (projectId !== 'all') params.append('projectId', projectId);
  return params.toString();
};

// Step 4: API call example
const data = await apiFetch(`/api/dashboard/metrics?year=${yearParam}&${params}`);
// Final URL: /api/dashboard/metrics?year=fy-2024-25&departmentId=1&clientId=2
```

---

## API Endpoints

### Endpoint Summary Table

| Endpoint | Purpose | Year Filter Field | Response Type |
|----------|---------|-------------------|---------------|
| `/api/dashboard/metrics` | Summary metrics (budget, received, etc.) | `bill.receivedDate` | `{ totalBudget, totalReceived, totalRemaining, activeCount, pgDeposited, pgCleared, pgPending }` |
| `/api/dashboard/revenue` | Monthly revenue chart data | `bill.receivedDate` | `[{ month, received }]` |
| `/api/dashboard/distribution` | Project distribution by department | `project.startDate` | Sunburst chart data (nested) |
| `/api/dashboard/budget-comparison` | Budget vs received per project | `project.startDate` | `[{ name, received, remaining }]` |
| `/api/dashboard/last-received` | Recent payments received | `bill.receivedDate` | `[{ projectName, amount, date }]` |
| `/api/dashboard/deadlines` | Upcoming payment deadlines | `bill.tentativeBillingDate` | `[{ projectName, amount, dueDate }]` |
| `/api/dashboard/calendar` | Calendar events | All dates in range | `[{ date, type, title, projectName, amount? }]` |
| `/api/dashboard/projects` | Projects list | `project.startDate` | Full project objects with relations |

---

## Component Data Mapping

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DASHBOARD UI LAYOUT                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        DashboardFilter                               │   │
│  │   [Department ▼] [Client ▼] [Project ▼] [Fiscal ▼] [FY 2024-25 ▼]  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     METRIC CARDS (from /metrics)                     │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│   │
│  │  │ Total Budget │ │Total Received│ │  Remaining   │ │Active Projects││   │
│  │  │  ৳1,50,000   │ │   ৳75,000   │ │   ৳75,000   │ │      12      ││   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   PG METRICS (from /metrics, conditional)            │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                 │   │
│  │  │ PG Deposited │ │  PG Cleared  │ │  PG Pending  │                 │   │
│  │  │   ৳25,000    │ │   ৳15,000   │ │   ৳10,000   │                 │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌────────────────────────────────┐ ┌────────────────────────────────┐    │
│  │      REVENUE CHART             │ │    BUDGET COMPARISON           │    │
│  │      (from /revenue)           │ │    (from /budget-comparison)   │    │
│  │                                │ │                                │    │
│  │  ┌─────────────────────────┐  │ │  ┌─────────────────────────┐  │    │
│  │  │ Monthly Bar Chart       │  │ │  │ Horizontal Bar Chart    │  │    │
│  │  │                         │  │ │  │                         │  │    │
│  │  │ Jul|Aug|Sep|...|Jun     │  │ │  │ Project A: ████░░ 60%   │  │    │
│  │  │  ▓  ▓  ▓      ▓        │  │ │  │ Project B: ██████ 100%  │  │    │
│  │  └─────────────────────────┘  │ │  └─────────────────────────┘  │    │
│  └────────────────────────────────┘ └────────────────────────────────┘    │
│                                                                             │
│  ┌───────────────────────────────────────┐ ┌──────────────────────────┐   │
│  │        DISTRIBUTION CHART             │ │    LAST RECEIVED         │   │
│  │        (from /distribution)           │ │    (from /last-received) │   │
│  │                                       │ │                          │   │
│  │  ┌─────────────────────────────────┐ │ │  • Project A - ৳10,000  │   │
│  │  │       Sunburst Chart            │ │ │    Jan 15, 2025          │   │
│  │  │    (Dept → Project → Bill)      │ │ │  • Project B - ৳25,000  │   │
│  │  │                                 │ │ │    Jan 10, 2025          │   │
│  │  └─────────────────────────────────┘ │ │  • Project C - ৳5,000   │   │
│  └───────────────────────────────────────┘ │    Jan 5, 2025           │   │
│                                            └──────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────┐ ┌────────────────────────────────────────┐  │
│  │    UPCOMING DEADLINES    │ │           CALENDAR                      │  │
│  │    (from /deadlines)     │ │           (from /calendar)              │  │
│  │                          │ │                                         │  │
│  │  • Project A - ৳15,000  │ │  ┌─────────────────────────────────┐     │  │
│  │    Due: Feb 1, 2025      │ │  │  Calendar with event markers   │     │  │
│  │  • Project B - ৳20,000  │ │  │  • Project Signed (green)       │    │  │
│  │    Due: Feb 15, 2025     │ │  │  • Payment Due (orange)        │    │  │
│  └──────────────────────────┘ │  │  • Payment Received (blue)     │    │  │
│                               │  │  • PG Cleared (purple)          │    │  │
│                               │  └─────────────────────────────────┘    │  │
│                               └────────────────────────────────────────┘   │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    PROJECTS TABLE (from /projects)                  │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │ Project Name │ Client │ Sign Date │ Budget │ Received │ Status │ │   │
│  │  ├────────────────────────────────────────────────────────────────┤ │   │
│  │  │ Project A    │ ABC Co │ Jul 2024  │ ৳50K   │ ৳30K     │ Active │ │   │
│  │  │ Project B    │ XYZ Co │ Aug 2024  │ ৳75K   │ ৳75K     │ Done   │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Year Filtering (Calendar vs Fiscal)

### Fiscal Year Definition

```
Fiscal Year 2024-25:
├── Start: July 1, 2024
└── End:   June 30, 2025

Fiscal Year 2025-26:
├── Start: July 1, 2025
└── End:   June 30, 2026
```

### Date Range Calculation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Year Parameter Parsing                               │
│                      (src/lib/date-utils.ts)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Input: "fy-2024-25" or "cal-2025"                                         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  parseYearValue(value: string): ParsedYearValue                     │   │
│  │                                                                      │   │
│  │  "fy-2024-25" → { type: 'fiscal', year: '2024-25' }                │   │
│  │  "cal-2025"   → { type: 'calendar', year: '2025' }                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                                                  │
│                          ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  getYearDateRange(year: string, isFiscal: boolean): DateRange       │   │
│  │                                                                      │   │
│  │  Fiscal "2024-25":                                                  │   │
│  │    start: 2024-07-01T00:00:00.000Z                                  │   │
│  │    end:   2025-06-30T23:59:59.999Z                                  │   │
│  │                                                                      │   │
│  │  Calendar "2025":                                                   │   │
│  │    start: 2025-01-01T00:00:00.000Z                                  │   │
│  │    end:   2025-12-31T23:59:59.999Z                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Month Ordering for Revenue Chart

```
Calendar Year (Jan-Dec):
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Jan │ Feb │ Mar │ Apr │ May │ Jun │ Jul │ Aug │ Sep │ Oct │ Nov │ Dec │
│  0  │  1  │  2  │  3  │  4  │  5  │  6  │  7  │  8  │  9  │ 10  │ 11  │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘

Fiscal Year (Jul-Jun):
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Jul │ Aug │ Sep │ Oct │ Nov │ Dec │ Jan │ Feb │ Mar │ Apr │ May │ Jun │
│  0  │  1  │  2  │  3  │  4  │  5  │  6  │  7  │  8  │  9  │ 10  │ 11  │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘

getFiscalMonthIndex(date):
  JavaScript Month  →  Fiscal Index
  ──────────────────────────────────
  July (6)          →  0
  August (7)        →  1
  September (8)     →  2
  ...
  May (4)           →  10
  June (5)          →  11

  Formula: (month + 6) % 12
```

---

## Detailed API Flow Diagrams

### 1. Metrics API Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    /api/dashboard/metrics                                   │
│                  (src/app/api/dashboard/metrics/route.ts)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  REQUEST                                                                    │
│  ─────────                                                                  │
│  GET /api/dashboard/metrics?year=fy-2024-25&departmentId=1                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Parameter Extraction                              │   │
│  │                                                                      │   │
│  │  yearParam = "fy-2024-25"                                           │   │
│  │  departmentId = "1"                                                 │   │
│  │  clientId = null                                                    │   │
│  │  projectId = null                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                                                  │
│                          ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Year Parsing                                      │   │
│  │                                                                      │   │
│  │  parseYearValue("fy-2024-25")                                       │   │
│  │  → { type: 'fiscal', year: '2024-25' }                              │   │
│  │                                                                      │   │
│  │  getYearDateRange('2024-25', true)                                  │   │
│  │  → { start: 2024-07-01, end: 2025-06-30 }                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                                                  │
│                          ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Database Query                                    │   │
│  │                                                                      │   │
│  │  prisma.project.findMany({                                          │   │
│  │    where: {                                                         │   │
│  │      departmentId: 1                                                │   │
│  │    },                                                               │   │
│  │    include: { bills: true }                                         │   │
│  │  })                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                                                  │
│                          ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Bill Filtering by Date                            │   │
│  │                                                                      │   │
│  │  For each project:                                                  │   │
│  │    Filter bills where:                                              │   │
│  │      receivedDate >= 2024-07-01 AND                                │   │
│  │      receivedDate <= 2025-06-30                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                                                  │
│                          ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Metrics Calculation                               │   │
│  │                                                                      │   │
│  │  totalBudget = sum(project.totalProjectValue)                       │   │
│  │  totalReceived = sum(filteredBills.receivedAmount) where PAID       │   │
│  │  totalRemaining = totalBudget - totalReceived                       │   │
│  │  activeCount = projects.length                                      │   │
│  │  pgDeposited = sum(project.pgUserDeposit)                          │   │
│  │  pgCleared = sum where pgStatus === 'CLEARED'                      │   │
│  │  pgPending = pgDeposited - pgCleared                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                                                  │
│                          ▼                                                  │
│  RESPONSE                                                                   │
│  ─────────                                                                  │
│  {                                                                          │
│    "totalBudget": 1500000,                                                 │
│    "totalReceived": 750000,                                                │
│    "totalRemaining": 750000,                                               │
│    "activeCount": 12,                                                      │
│    "pgDeposited": 25000,                                                   │
│    "pgCleared": 15000,                                                     │
│    "pgPending": 10000                                                      │
│  }                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Revenue API Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    /api/dashboard/revenue                                   │
│                  (src/app/api/dashboard/revenue/route.ts)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  REQUEST                                                                    │
│  ─────────                                                                  │
│  GET /api/dashboard/revenue?year=fy-2024-25                                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Date Range Calculation                            │   │
│  │                                                                      │   │
│  │  Fiscal Year 2024-25:                                               │   │
│  │  start = 2024-07-01, end = 2025-06-30                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                                                  │
│                          ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Database Query                                    │   │
│  │                                                                      │   │
│  │  prisma.projectBill.findMany({                                      │   │
│  │    where: {                                                         │   │
│  │      receivedDate: { gte: start, lte: end },                       │   │
│  │      status: "PAID"                                                 │   │
│  │    }                                                                │   │
│  │  })                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                                                  │
│                          ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Monthly Aggregation                               │   │
│  │                                                                      │   │
│  │  For Fiscal Year, months ordered: Jul, Aug, Sep, ..., Jun           │   │
│  │                                                                      │   │
│  │  For each month (0-11 fiscal index):                                │   │
│  │    Filter bills where getFiscalMonthIndex(receivedDate) === index   │   │
│  │    Sum receivedAmount                                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                                                  │
│                          ▼                                                  │
│  RESPONSE                                                                   │
│  ─────────                                                                  │
│  [                                                                          │
│    { "month": "Jul", "received": 125000 },                                 │
│    { "month": "Aug", "received": 85000 },                                  │
│    { "month": "Sep", "received": 95000 },                                  │
│    { "month": "Oct", "received": 110000 },                                 │
│    { "month": "Nov", "received": 75000 },                                  │
│    { "month": "Dec", "received": 65000 },                                  │
│    { "month": "Jan", "received": 45000 },                                  │
│    { "month": "Feb", "received": 55000 },                                  │
│    { "month": "Mar", "received": 40000 },                                  │
│    { "month": "Apr", "received": 30000 },                                  │
│    { "month": "May", "received": 15000 },                                  │
│    { "month": "Jun", "received": 10000 }                                   │
│  ]                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Distribution API Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    /api/dashboard/distribution                              │
│               (src/app/api/dashboard/distribution/route.ts)                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  REQUEST                                                                    │
│  ─────────                                                                  │
│  GET /api/dashboard/distribution?year=fy-2024-25                           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Filter Projects by Start Date                     │   │
│  │                                                                      │   │
│  │  where: {                                                           │   │
│  │    startDate: { gte: 2024-07-01, lte: 2025-06-30 }                 │   │
│  │  }                                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                                                  │
│                          ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              Group Projects by Department                            │   │
│  │                                                                      │   │
│  │  Department A: [Project 1, Project 2]                               │   │
│  │  Department B: [Project 3, Project 4, Project 5]                    │   │
│  │  Unassigned:   [Project 6]                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                                                  │
│                          ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              Build 3-Level Sunburst Structure                        │   │
│  │                                                                      │   │
│  │  Level 1 (Center): Departments                                      │   │
│  │  Level 2 (Middle): Projects                                         │   │
│  │  Level 3 (Outer):  Bills                                            │   │
│  │                                                                      │   │
│  │  Each level has:                                                    │   │
│  │    - name: display name                                             │   │
│  │    - value: monetary amount                                         │   │
│  │    - fill: HSL color (hue based on department)                     │   │
│  │    - children: nested array                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                                                  │
│                          ▼                                                  │
│  RESPONSE (Sunburst Data)                                                  │
│  ─────────────────────────                                                  │
│  [                                                                          │
│    {                                                                        │
│      "name": "Engineering",                                                │
│      "value": 500000,                                                      │
│      "fill": "hsl(0, 70%, 45%)",                                          │
│      "children": [                                                         │
│        {                                                                   │
│          "name": "Project Alpha",                                         │
│          "value": 300000,                                                 │
│          "fill": "hsl(0, 70%, 55%)",                                     │
│          "children": [                                                    │
│            {                                                              │
│              "name": "Bill 1",                                           │
│              "value": 100000,                                            │
│              "fill": "hsl(0, 75%, 75%)",                                 │
│              "received": 100000,                                         │
│              "remaining": 0,                                             │
│              "percentReceived": 100                                      │
│            },                                                             │
│            ...                                                            │
│          ]                                                                │
│        },                                                                  │
│        ...                                                                 │
│      ]                                                                     │
│    },                                                                       │
│    ...                                                                      │
│  ]                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4. Last Received API Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    /api/dashboard/last-received                             │
│              (src/app/api/dashboard/last-received/route.ts)                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  REQUEST                                                                    │
│  ─────────                                                                  │
│  GET /api/dashboard/last-received?year=fy-2024-25                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Query Conditions                                  │   │
│  │                                                                      │   │
│  │  where: {                                                           │   │
│  │    status: 'PAID',                                                  │   │
│  │    receivedAmount: { gt: 0 },                                       │   │
│  │    receivedDate: { gte: 2024-07-01, lte: 2025-06-30 }             │   │
│  │  }                                                                  │   │
│  │  orderBy: { receivedDate: 'desc' }                                 │   │
│  │  take: 5                                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                                                  │
│                          ▼                                                  │
│  RESPONSE                                                                   │
│  ─────────                                                                  │
│  [                                                                          │
│    { "projectName": "Project Alpha", "amount": 50000,                      │
│      "date": "2025-01-15T00:00:00.000Z" },                                 │
│    { "projectName": "Project Beta", "amount": 25000,                       │
│      "date": "2025-01-10T00:00:00.000Z" },                                 │
│    { "projectName": "Project Gamma", "amount": 15000,                      │
│      "date": "2025-01-05T00:00:00.000Z" },                                 │
│    { "projectName": "Project Delta", "amount": 35000,                      │
│      "date": "2024-12-28T00:00:00.000Z" },                                 │
│    { "projectName": "Project Epsilon", "amount": 20000,                    │
│      "date": "2024-12-20T00:00:00.000Z" }                                  │
│  ]                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5. Deadlines API Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    /api/dashboard/deadlines                                 │
│                (src/app/api/dashboard/deadlines/route.ts)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  REQUEST                                                                    │
│  ─────────                                                                  │
│  GET /api/dashboard/deadlines?year=fy-2024-25                              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Query Conditions                                  │   │
│  │                                                                      │   │
│  │  where: {                                                           │   │
│  │    status: { not: 'PAID' },                                        │   │
│  │    tentativeBillingDate: {                                         │   │
│  │      gte: max(today, 2024-07-01),  // Whichever is later           │   │
│  │      lte: 2025-06-30                                               │   │
│  │    }                                                                │   │
│  │  }                                                                  │   │
│  │  orderBy: { tentativeBillingDate: 'asc' }                          │   │
│  │  take: 5                                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                                                  │
│                          ▼                                                  │
│  RESPONSE                                                                   │
│  ─────────                                                                  │
│  [                                                                          │
│    { "projectName": "Project Alpha", "amount": 75000,                      │
│      "dueDate": "2025-02-01T00:00:00.000Z" },                              │
│    { "projectName": "Project Beta", "amount": 50000,                       │
│      "dueDate": "2025-02-15T00:00:00.000Z" },                              │
│    { "projectName": "Project Gamma", "amount": 25000,                      │
│      "dueDate": "2025-03-01T00:00:00.000Z" },                              │
│    { "projectName": "Project Delta", "amount": 100000,                     │
│      "dueDate": "2025-03-15T00:00:00.000Z" },                              │
│    { "projectName": "Project Epsilon", "amount": 40000,                    │
│      "dueDate": "2025-04-01T00:00:00.000Z" }                               │
│  ]                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6. Calendar API Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    /api/dashboard/calendar                                  │
│                (src/app/api/dashboard/calendar/route.ts)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  REQUEST                                                                    │
│  ─────────                                                                  │
│  GET /api/dashboard/calendar?year=fy-2024-25                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Event Types Generated                             │   │
│  │                                                                      │   │
│  │  For each project and its bills, generate events:                   │   │
│  │                                                                      │   │
│  │  1. project_signed   - When project started                         │   │
│  │  2. pg_cleared       - When PG was cleared                          │   │
│  │  3. tentative_payment - Upcoming bill due dates                     │   │
│  │  4. received_payment  - Actual payment received dates               │   │
│  │                                                                      │   │
│  │  All events filtered by date range:                                 │   │
│  │    event.date >= 2024-07-01 AND event.date <= 2025-06-30           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                                                  │
│                          ▼                                                  │
│  RESPONSE                                                                   │
│  ─────────                                                                  │
│  [                                                                          │
│    { "date": "2024-07-15", "type": "project_signed",                       │
│      "title": "Project Signed", "projectName": "Project Alpha" },          │
│    { "date": "2024-08-01", "type": "received_payment",                     │
│      "title": "Milestone 1", "projectName": "Project Alpha",               │
│      "amount": 50000 },                                                    │
│    { "date": "2024-09-01", "type": "pg_cleared",                           │
│      "title": "PG Cleared", "projectName": "Project Beta",                 │
│      "amount": 10000 },                                                    │
│    { "date": "2025-02-01", "type": "tentative_payment",                    │
│      "title": "Milestone 2", "projectName": "Project Alpha",               │
│      "amount": 75000 },                                                    │
│    ...                                                                      │
│  ]                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Complete Data Flow Sequence

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE REQUEST → RESPONSE FLOW                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. USER ACTION                                                              │
│     ────────────                                                             │
│     User selects "Fiscal" and "FY 2024-25" in filters                       │
│                                                                              │
│  2. STATE UPDATE                                                             │
│     ────────────                                                             │
│     FilterContext updates:                                                   │
│       yearType = 'fiscal'                                                    │
│       selectedYear = '2024-25'                                              │
│                                                                              │
│  3. EFFECT TRIGGERED                                                         │
│     ────────────────                                                         │
│     useEffect detects yearParam change                                       │
│     yearParam = 'fy-2024-25'                                                │
│                                                                              │
│  4. PARALLEL API CALLS                                                       │
│     ──────────────────                                                       │
│     ┌────────────────┐  ┌────────────────┐  ┌────────────────┐              │
│     │ fetchMetrics() │  │ fetchRevenue() │  │fetchDistribution│             │
│     └───────┬────────┘  └───────┬────────┘  └───────┬────────┘              │
│             │                   │                   │                        │
│     ┌───────┴────────┐  ┌───────┴────────┐  ┌───────┴────────┐              │
│     │fetchBudget     │  │fetchLast       │  │fetchDeadlines()│              │
│     │Comparison()    │  │Received()      │  │                │              │
│     └───────┬────────┘  └───────┬────────┘  └───────┬────────┘              │
│             │                   │                   │                        │
│     ┌───────┴────────┐  ┌───────┴────────┐                                  │
│     │fetchCalendar() │  │fetchProjects() │                                  │
│     └───────┬────────┘  └───────┬────────┘                                  │
│             │                   │                                            │
│             ▼                   ▼                                            │
│  5. API PROCESSING                                                           │
│     ──────────────                                                           │
│     Each API:                                                                │
│       a. Parses yearParam → gets date range                                 │
│       b. Queries database with date filter                                  │
│       c. Processes and aggregates data                                      │
│       d. Returns JSON response                                              │
│                                                                              │
│  6. STATE UPDATES                                                            │
│     ─────────────                                                            │
│     setMetrics(data)      setRevenue(data)      setDistribution(data)       │
│     setBudgetComparison() setLastReceived()     setDeadlines()              │
│     setCalendarEvents()   setProjects()                                     │
│                                                                              │
│  7. UI RE-RENDER                                                             │
│     ─────────────                                                            │
│     All dashboard components re-render with filtered data:                  │
│       - MetricCards show FY 2024-25 totals                                  │
│       - RevenueChart shows Jul-Jun months                                   │
│       - All other components show filtered data                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## How Filters Work (In-Depth)

This section provides a detailed explanation of the filter mechanism from UI interaction to database query.

### FilterContext State Management

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

### Filter Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      COMPONENT HIERARCHY                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                        ┌─────────────────────┐                              │
│                        │ SharedFilterProvider │ ← Wraps entire app          │
│                        │  (FilterContext)     │                             │
│                        └──────────┬──────────┘                              │
│                                   │                                          │
│                    ┌──────────────┼──────────────┐                          │
│                    │              │              │                           │
│                    ▼              ▼              ▼                           │
│            ┌──────────────┐ ┌──────────┐ ┌────────────┐                     │
│            │  Dashboard   │ │ Billing  │ │  Projects  │                     │
│            │   Page       │ │   Page   │ │    Page    │                     │
│            └──────┬───────┘ └────┬─────┘ └─────┬──────┘                     │
│                   │              │             │                             │
│                   ▼              │             │                             │
│            ┌──────────────┐     │             │                             │
│            │ DashboardFilter │   │             │                             │
│            │  Component    │←────┼─────────────┘                             │
│            └──────┬───────┘     │         (Reused across pages)             │
│                   │              │                                           │
│                   ▼              ▼                                           │
│         ┌─────────────────────────────────────────┐                         │
│         │        useSharedFilters() Hook          │                         │
│         │                                          │                         │
│         │  // Any component can access:           │                         │
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

### Entity Filters (Department, Client, Project)

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
│    // Example output:                                                      │
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
│    // Examples:                                                            │
│    // No filters: /api/dashboard/metrics?year=fy-2024-25&                 │
│    // With dept:  /api/dashboard/metrics?year=fy-2024-25&departmentId=1   │
│    // With all:   /api/dashboard/metrics?year=fy-2024-25&departmentId=1   │
│    //             &clientId=2&projectId=3                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Year Filter Flow (Fiscal vs Calendar)

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
│        setSelectedYear(new Date().getFullYear().toString()); // e.g., "2025"│
│      }                                                                     │
│    };                                                                      │
│                                                                             │
│  STEP 3: Year Parameter Construction                                       │
│  ───────────────────────────────────                                        │
│                                                                             │
│    // In page.tsx                                                          │
│    const yearParam = yearType === 'fiscal'                                │
│      ? `fy-${selectedYear}`     // "fy-2024-25"                           │
│      : `cal-${selectedYear}`;   // "cal-2025"                             │
│                                                                             │
│  STEP 4: API Parameter Parsing                                             │
│  ─────────────────────────────                                              │
│                                                                             │
│    // In API routes (e.g., metrics/route.ts)                              │
│    const yearParam = searchParams.get("year");  // "fy-2024-25"           │
│                                                                             │
│    if (yearParam) {                                                        │
│      const { type: yearType, year } = parseYearValue(yearParam);          │
│      // yearType = "fiscal", year = "2024-25"                             │
│                                                                             │
│      const isFiscal = yearType === "fiscal";                              │
│      const { start, end } = getYearDateRange(year, isFiscal);            │
│      // start = 2024-07-01, end = 2025-06-30                             │
│    }                                                                       │
│                                                                             │
│  STEP 5: Database Query with Date Range                                    │
│  ──────────────────────────────────────                                     │
│                                                                             │
│    // Different APIs filter on different date fields:                      │
│                                                                             │
│    // Metrics API - filters bills.receivedDate                            │
│    const filteredBills = bills.filter(bill =>                             │
│      bill.receivedDate >= start && bill.receivedDate <= end              │
│    );                                                                      │
│                                                                             │
│    // Distribution API - filters project.startDate                        │
│    where: {                                                                │
│      startDate: { gte: start, lte: end }                                  │
│    }                                                                       │
│                                                                             │
│    // Deadlines API - filters bill.tentativeBillingDate                   │
│    where: {                                                                │
│      tentativeBillingDate: {                                              │
│        gte: max(today, start),  // Future dates only                     │
│        lte: end                                                           │
│      }                                                                     │
│    }                                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Reset Filters Functionality

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
└─────────────────────────────────────────────────────────────────────────────┘
```

### Filter → API Parameter Mapping

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              FILTER VALUE → API PARAMETER → DATABASE QUERY                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ENTITY FILTERS                                                            │
│  ──────────────                                                             │
│                                                                             │
│  ┌──────────────────┬─────────────────────┬──────────────────────────────┐ │
│  │ UI State         │ Query Param         │ Prisma Where Clause          │ │
│  ├──────────────────┼─────────────────────┼──────────────────────────────┤ │
│  │ departmentId="all"│ (not sent)         │ (no filter applied)          │ │
│  │ departmentId="1" │ departmentId=1      │ where: { departmentId: 1 }   │ │
│  │ clientId="all"   │ (not sent)          │ (no filter applied)          │ │
│  │ clientId="2"     │ clientId=2          │ where: { clientId: 2 }       │ │
│  │ projectId="all"  │ (not sent)          │ (no filter applied)          │ │
│  │ projectId="3"    │ projectId=3         │ where: { id: 3 }             │ │
│  └──────────────────┴─────────────────────┴──────────────────────────────┘ │
│                                                                             │
│  YEAR FILTERS                                                              │
│  ────────────                                                               │
│                                                                             │
│  ┌──────────────────┬─────────────────────┬──────────────────────────────┐ │
│  │ UI State         │ Query Param         │ Date Range Applied           │ │
│  ├──────────────────┼─────────────────────┼──────────────────────────────┤ │
│  │ yearType="fiscal"│                     │                              │ │
│  │ selectedYear=    │ year=fy-2024-25     │ gte: 2024-07-01             │ │
│  │   "2024-25"      │                     │ lte: 2025-06-30             │ │
│  ├──────────────────┼─────────────────────┼──────────────────────────────┤ │
│  │ yearType=        │                     │                              │ │
│  │   "calendar"     │ year=cal-2025       │ gte: 2025-01-01             │ │
│  │ selectedYear=    │                     │ lte: 2025-12-31             │ │
│  │   "2025"         │                     │                              │ │
│  └──────────────────┴─────────────────────┴──────────────────────────────┘ │
│                                                                             │
│  DATE FIELD BY API                                                         │
│  ─────────────────                                                          │
│                                                                             │
│  ┌──────────────────────────────┬────────────────────────────────────────┐ │
│  │ API Endpoint                 │ Date Field Filtered                    │ │
│  ├──────────────────────────────┼────────────────────────────────────────┤ │
│  │ /api/dashboard/metrics       │ bill.receivedDate (in-memory filter)   │ │
│  │ /api/dashboard/revenue       │ bill.receivedDate (DB query)           │ │
│  │ /api/dashboard/distribution  │ project.startDate (DB query)           │ │
│  │ /api/dashboard/budget-comp.  │ project.startDate (DB query)           │ │
│  │ /api/dashboard/last-received │ bill.receivedDate (DB query)           │ │
│  │ /api/dashboard/deadlines     │ bill.tentativeBillingDate (DB query)   │ │
│  │ /api/dashboard/calendar      │ All dates (in-memory filter)           │ │
│  │ /api/dashboard/projects      │ project.startDate (DB query)           │ │
│  └──────────────────────────────┴────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Complete Filter Application Example

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
│  CONTEXT STATE:                                                            │
│    {                                                                       │
│      departmentId: "1",                                                    │
│      clientId: "all",                                                      │
│      projectId: "all",                                                     │
│      yearType: "fiscal",                                                   │
│      selectedYear: "2024-25"                                               │
│    }                                                                       │
│                                                                             │
│  yearParam CONSTRUCTED:                                                    │
│    yearParam = "fy-2024-25"                                               │
│                                                                             │
│  QUERY PARAMS CONSTRUCTED:                                                 │
│    getFilterQueryParams() → "departmentId=1"                              │
│                                                                             │
│  API URL GENERATED:                                                        │
│    /api/dashboard/metrics?year=fy-2024-25&departmentId=1                  │
│                                                                             │
│  API RECEIVES & PARSES:                                                    │
│    yearParam = "fy-2024-25"                                               │
│    parseYearValue("fy-2024-25") → { type: "fiscal", year: "2024-25" }    │
│    getYearDateRange("2024-25", true) → {                                  │
│      start: 2024-07-01T00:00:00.000Z,                                     │
│      end: 2025-06-30T23:59:59.999Z                                        │
│    }                                                                       │
│    departmentId = parseInt("1") → 1                                       │
│                                                                             │
│  PRISMA QUERY BUILT:                                                       │
│    prisma.project.findMany({                                              │
│      where: {                                                             │
│        departmentId: 1                                                    │
│      },                                                                   │
│      include: { bills: true }                                             │
│    })                                                                      │
│                                                                             │
│  POST-QUERY FILTERING (for metrics):                                       │
│    for each project's bills:                                              │
│      keep bill if:                                                        │
│        bill.receivedDate >= 2024-07-01 AND                               │
│        bill.receivedDate <= 2025-06-30                                   │
│                                                                             │
│  RESULT:                                                                   │
│    Only Engineering department projects with bills received               │
│    between July 2024 and June 2025                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## File References

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Main dashboard page, orchestrates all data fetching |
| `src/contexts/FilterContext.tsx` | Global filter state management |
| `src/components/dashboard/DashboardFilter.tsx` | Filter UI component |
| `src/lib/date-utils.ts` | Year parsing and date range utilities |
| `src/app/api/dashboard/metrics/route.ts` | Summary metrics API |
| `src/app/api/dashboard/revenue/route.ts` | Monthly revenue data API |
| `src/app/api/dashboard/distribution/route.ts` | Sunburst chart data API |
| `src/app/api/dashboard/budget-comparison/route.ts` | Budget vs received API |
| `src/app/api/dashboard/last-received/route.ts` | Recent payments API |
| `src/app/api/dashboard/deadlines/route.ts` | Upcoming deadlines API |
| `src/app/api/dashboard/calendar/route.ts` | Calendar events API |
| `src/app/api/dashboard/projects/route.ts` | Projects list API |
