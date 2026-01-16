# TILLER PROJECT COMPASS - Process Flow Documentation

> **Complete guide to all operations in the application**
>
> This document explains how every feature works - from user input to database storage.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Database Structure](#2-database-structure)
3. [Client Operations](#3-client-operations)
4. [Project Operations](#4-project-operations)
5. [Bill/Milestone Operations](#5-billmilestone-operations)
6. [Payment Operations](#6-payment-operations)
7. [Financial Precision Handling](#7-financial-precision-handling)
8. [Validation Rules Summary](#8-validation-rules-summary)
9. [Common Flows](#9-common-flows)

---

## 1. Overview

### What This App Does

Tiller Project Compass is a **project billing management system** that helps track:

- **Clients** - Companies or individuals you work with
- **Projects** - Work contracts with total value
- **Bills/Milestones** - Payment stages within a project (e.g., "Inception 20%", "Final 80%")
- **Payments** - Money received against each milestone

### Core Principle

```
┌─────────────────────────────────────────────────────────────────┐
│                    AMOUNT IS SOURCE OF TRUTH                     │
├─────────────────────────────────────────────────────────────────┤
│  • All money values are stored as INTEGERS (no decimals)        │
│  • Percentages are ALWAYS calculated from amounts               │
│  • Never store user-entered percentages directly                │
│  • This prevents floating-point precision errors                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Structure

### Tables Overview

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│     CLIENTS      │     │   DEPARTMENTS    │     │   CATEGORIES     │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │     │ id (PK)          │
│ name (unique)    │     │ name (unique)    │     │ name (unique)    │
│ contactPerson    │     │ description      │     │ description      │
│ contactEmail     │     └────────┬─────────┘     └────────┬─────────┘
│ contactPhone     │              │                        │
└────────┬─────────┘              │                        │
         │                        │                        │
         │         ┌──────────────┴────────────────────────┘
         │         │
         ▼         ▼
┌─────────────────────────────────────────────────────────────────┐
│                           PROJECTS                               │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)              │ Primary key, auto-increment              │
│ projectName          │ Name of the project                      │
│ clientId (FK)        │ Links to clients table                   │
│ departmentId (FK)    │ Links to departments table               │
│ categoryId (FK)      │ Links to categories table                │
│ totalProjectValue    │ Total contract value in BDT              │
│ startDate            │ Project start date                       │
│ endDate              │ Project end date (optional)              │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 │ One project has many bills
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        PROJECT_BILLS                             │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)              │ Primary key                              │
│ projectId (FK)       │ Links to projects table                  │
│ billName             │ e.g., "Inception", "Deliverable-1"       │
│ billPercent          │ % of total project (e.g., 20.00)         │
│ billAmount           │ Actual amount in BDT (e.g., 20000)       │
│ tentativeBillingDate │ Expected payment date                    │
│ receivedAmount       │ Money received so far (default: 0)       │
│ receivedPercent      │ % of project received                    │
│ receivedDate         │ Date payment was received                │
│ remainingAmount      │ billAmount - receivedAmount              │
│ status               │ "PENDING" / "PARTIAL" / "PAID"           │
│ vat                  │ VAT deduction (optional)                 │
│ it                   │ Income Tax deduction (optional)          │
└─────────────────────────────────────────────────────────────────┘
```

### Field Types


| Field Type    | Storage              | Example    |
| ------------- | -------------------- | ---------- |
| Money amounts | Decimal(15,2)        | 100000.00  |
| Percentages   | Decimal(5,2)         | 20.00      |
| Dates         | DateTime (Date only) | 2024-01-15 |
| Status        | String (max 50)      | "PENDING"  |

---

## 3. Client Operations

### 3.1 View All Clients

```
┌─────────────────────────────────────────────────────────────────┐
│                        VIEW CLIENTS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Action:  Navigate to Clients page                         │
│                                                                  │
│  API Call:     GET /api/clients                                 │
│                                                                  │
│  Query Params: ?search=acme (optional - search by name)         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE QUERY                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Reads from:   clients table                                    │
│                + projects table (joined)                        │
│                + project_bills table (joined)                   │
│                                                                  │
│  Calculates:                                                    │
│    • projectCount = number of projects                          │
│    • totalBudget = SUM of all project values                    │
│    • totalReceived = SUM of all bill receivedAmounts            │
│    • totalDue = totalBudget - totalReceived                     │
│    • realizationRate = (totalReceived / totalBudget) × 100      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        RESPONSE                                  │
├─────────────────────────────────────────────────────────────────┤
│  [                                                               │
│    {                                                             │
│      "id": 1,                                                    │
│      "name": "Acme Corp",                                        │
│      "contactPerson": "John Doe",                                │
│      "projectCount": 3,                                          │
│      "totalBudget": 500000,                                      │
│      "totalReceived": 250000,                                    │
│      "totalDue": 250000,                                         │
│      "realizationRate": 50.0                                     │
│    }                                                             │
│  ]                                                               │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Create New Client

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADD CLIENT DIALOG                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Component: AddClientDialog.tsx                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    INPUT FIELDS                          │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │                                                          │    │
│  │  Client Name *          [________________________]       │    │
│  │  (required, must be unique)                              │    │
│  │                                                          │    │
│  │  Contact Person         [________________________]       │    │
│  │  (optional)                                              │    │
│  │                                                          │    │
│  │  Email                  [________________________]       │    │
│  │  (optional, validated as email format)                   │    │
│  │                                                          │    │
│  │  Phone                  [________________________]       │    │
│  │  (optional)                                              │    │
│  │                                                          │    │
│  │                              [Cancel]  [Create Client]   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VALIDATION                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Client-side (React Hook Form):                                 │
│    ✓ name is required (cannot be empty)                         │
│    ✓ email must be valid format if provided                     │
│                                                                  │
│  Server-side (API):                                             │
│    ✓ name must not be empty after trim                          │
│    ✓ name must be unique (database constraint)                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API CALL                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Endpoint:  POST /api/clients                                   │
│                                                                  │
│  Request Body:                                                  │
│  {                                                               │
│    "name": "New Company Ltd",                                    │
│    "contactPerson": "Jane Smith",                                │
│    "contactEmail": "jane@company.com",                           │
│    "contactPhone": "+880 1234-567890"                            │
│  }                                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE UPDATE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Table: clients                                                  │
│                                                                  │
│  INSERT INTO clients (name, contact_person, contact_email,      │
│                       contact_phone)                             │
│  VALUES ('New Company Ltd', 'Jane Smith', 'jane@company.com',   │
│          '+880 1234-567890')                                     │
│                                                                  │
│  Returns: New client with auto-generated ID                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUCCESS RESPONSE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Status: 201 Created                                             │
│                                                                  │
│  Toast Message: "Client created successfully"                    │
│                                                                  │
│  Actions:                                                        │
│    • Dialog closes automatically                                 │
│    • Form resets to empty                                        │
│    • Client list refreshes                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Project Operations

### 4.1 View All Projects

```
┌─────────────────────────────────────────────────────────────────┐
│                       VIEW PROJECTS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  API Call:     GET /api/projects                                │
│                                                                  │
│  Filter Options:                                                │
│    • search      - Search by project or client name             │
│    • departmentId - Filter by department                        │
│    • categoryId   - Filter by category                          │
│    • clientId     - Filter by client                            │
│    • year         - Filter by start year                        │
│    • status       - "COMPLETED" or "ONGOING"                    │
│                                                                  │
│  Status Logic:                                                  │
│    COMPLETED = All bills have status "PAID"                     │
│    ONGOING = At least one bill is not "PAID"                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE QUERY                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Reads from:                                                    │
│    • projects (main data)                                       │
│    • clients (joined - client name)                             │
│    • departments (joined - department name)                     │
│    • project_categories (joined - category name)                │
│    • project_bills (joined - all milestones)                    │
│                                                                  │
│  Ordering: By start date descending (newest first)              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Create New Project

This is the most complex operation. It creates a project AND its billing milestones in one go.

```
┌─────────────────────────────────────────────────────────────────┐
│                  ADD PROJECT DIALOG                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Component: AddProjectDialog.tsx                                 │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 PROJECT DETAILS                          │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │                                                          │    │
│  │  Project Name *         [________________________]       │    │
│  │  (required)                                              │    │
│  │                                                          │    │
│  │  Total Value (BDT) *    [________100000_________]       │    │
│  │  (required, this drives all calculations)                │    │
│  │                                                          │    │
│  │  Client *               [▼ Select or Create New ]       │    │
│  │  (select existing OR enter new client details)           │    │
│  │                                                          │    │
│  │  Department *           [▼ Software Development ]       │    │
│  │  (required)                                              │    │
│  │                                                          │    │
│  │  Category *             [▼ Web Application      ]       │    │
│  │  (required)                                              │    │
│  │                                                          │    │
│  │  Start Date *           [____2024-01-15________]        │    │
│  │  (required, defaults to today)                           │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BILLING MILESTONES                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Default milestones (user can modify):                          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Milestone    │ Percent │ Amount    │ Target Date       │    │
│  ├───────────────┼─────────┼───────────┼───────────────────┤    │
│  │  Inception    │  20%    │  20,000   │  2024-02-01       │    │
│  │  Final        │  80%    │  80,000   │  2024-12-31       │    │
│  └───────────────┴─────────┴───────────┴───────────────────┘    │
│                                                                  │
│  [+ Add Deliverable] button adds new milestone before "Final"   │
│                                                                  │
│  [ ] Bypass 100% Guardrail (checkbox)                           │
│      Allows saving even if percentages don't add to 100%        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Allocation Status:  ✓ Perfect Allocation (100.00%)     │    │
│  │  Shows: Under/Over allocated warnings                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### How Percentage ↔ Amount Sync Works

```
┌─────────────────────────────────────────────────────────────────┐
│              PERCENTAGE & AMOUNT SYNCHRONIZATION                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  When User Enters PERCENTAGE:                                   │
│  ────────────────────────────                                   │
│                                                                  │
│    1. User types: 20%                                           │
│    2. System calculates amount:                                 │
│       amount = (20 / 100) × 100000 = 20000                      │
│    3. Amount is ROUNDED to integer: 20000                       │
│    4. Percentage is RECALCULATED from rounded amount:           │
│       percent = (20000 / 100000) × 100 = 20.00%                 │
│    5. Both fields update: Amount=20000, Percent=20.00%          │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  When User Enters AMOUNT:                                       │
│  ────────────────────────                                       │
│                                                                  │
│    1. User types: 25000                                         │
│    2. Amount is ROUNDED to integer: 25000                       │
│    3. Percentage is calculated:                                 │
│       percent = (25000 / 100000) × 100 = 25.00%                 │
│    4. Both fields update: Amount=25000, Percent=25.00%          │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  KEY RULE: Amount is ALWAYS the source of truth!                │
│            Percentage is ALWAYS derived from amount.            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Validation Rules for Project Creation

```
┌─────────────────────────────────────────────────────────────────┐
│                    VALIDATION RULES                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✓ Project name cannot be empty                                 │
│  ✓ Total project value must be > 0                              │
│  ✓ Must select a client OR create a new one                     │
│  ✓ Department is required                                       │
│  ✓ Category is required                                         │
│  ✓ Start date is required                                       │
│                                                                  │
│  For each milestone:                                            │
│  ✓ Milestone name cannot be empty                               │
│  ✓ Target date is required                                      │
│  ✓ Amount must be >= 0                                          │
│  ✓ Amount cannot exceed total project value                     │
│                                                                  │
│  Total allocation check:                                        │
│  ✓ All percentages must add up to 100%                          │
│  ✓ Uses epsilon tolerance: |total - 100| <= 0.01                │
│  ✓ Can bypass with checkbox if needed                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### API Call and Database Transaction

```
┌─────────────────────────────────────────────────────────────────┐
│                       API CALL                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Endpoint: POST /api/projects                                   │
│                                                                  │
│  Request Body:                                                  │
│  {                                                               │
│    "projectName": "Website Redesign",                            │
│    "totalProjectValue": "100000",                                │
│    "clientId": "5",           // OR newClient object            │
│    "departmentId": "2",                                          │
│    "categoryId": "3",                                            │
│    "startDate": "2024-01-15",                                    │
│    "bills": [                                                    │
│      {                                                           │
│        "billName": "Inception",                                  │
│        "billPercent": "20",                                      │
│        "billAmount": "20000",                                    │
│        "tentativeBillingDate": "2024-02-01"                      │
│      },                                                          │
│      {                                                           │
│        "billName": "Final",                                      │
│        "billPercent": "80",                                      │
│        "billAmount": "80000",                                    │
│        "tentativeBillingDate": "2024-12-31"                      │
│      }                                                           │
│    ]                                                             │
│  }                                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DATABASE TRANSACTION                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Uses ATOMIC TRANSACTION (all succeed or all fail):             │
│                                                                  │
│  Step 1: Create Client (if newClient provided)                  │
│  ─────────────────────────────────────────────                  │
│    INSERT INTO clients (name, contact_person, ...)              │
│    → Returns client_id                                          │
│                                                                  │
│  Step 2: Create Project                                         │
│  ────────────────────────                                       │
│    INSERT INTO projects (                                       │
│      project_name,                                               │
│      client_id,                                                  │
│      department_id,                                              │
│      category_id,                                                │
│      start_date,                                                 │
│      total_project_value                                         │
│    )                                                             │
│    → Returns project_id                                          │
│                                                                  │
│  Step 3: Create All Bills                                       │
│  ────────────────────────                                       │
│    INSERT INTO project_bills (                                  │
│      project_id,                                                 │
│      bill_name,                                                  │
│      bill_percent,                                               │
│      bill_amount,                                                │
│      tentative_billing_date,                                     │
│      status,              -- Always "PENDING" initially         │
│      received_amount      -- Always 0 initially                 │
│    )                                                             │
│    → Creates one row per milestone                               │
│                                                                  │
│  If ANY step fails → ROLLBACK everything                        │
│  If ALL succeed → COMMIT                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Draft Auto-Save Feature

```
┌─────────────────────────────────────────────────────────────────┐
│                    DRAFT PERSISTENCE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  The form automatically saves to browser localStorage:          │
│                                                                  │
│  When:                                                          │
│    • Every 1 second while form is open (debounced)              │
│    • When dialog closes                                         │
│                                                                  │
│  What's saved:                                                  │
│    • All form fields                                            │
│    • Bypass checkbox state                                      │
│    • New client toggle state                                    │
│                                                                  │
│  Storage key: "addProjectDraft"                                 │
│                                                                  │
│  Draft is restored:                                             │
│    • When dialog opens next time                                │
│    • Shows toast: "Draft restored from previous session"        │
│                                                                  │
│  Draft is cleared:                                              │
│    • After successful project creation                          │
│    • When user clicks "Clear Draft" button                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Bill/Milestone Operations

### 5.1 View All Bills

```
┌─────────────────────────────────────────────────────────────────┐
│                      VIEW BILLS                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  API Call: GET /api/bills                                       │
│                                                                  │
│  Filter Options:                                                │
│    • search       - Search bill name, project, client           │
│    • status       - "PENDING", "PARTIAL", or "PAID"             │
│    • departmentId - Filter by department                        │
│    • clientId     - Filter by client                            │
│    • projectId    - Filter by project                           │
│    • year         - Filter by tentative billing year            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RESPONSE DATA                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Each bill includes:                                            │
│    • Bill details (name, amounts, dates, status)                │
│    • Project info (name, total value)                           │
│    • Client info (name)                                         │
│    • Department info (name)                                     │
│                                                                  │
│  Displayed columns:                                             │
│    • Milestone & Project name                                   │
│    • Schedule (target date, received date)                      │
│    • Allocation % (of total project)                            │
│    • Amount (due and received)                                  │
│    • Status badge (PENDING/PARTIAL/PAID)                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Bill Status Meanings

```
┌─────────────────────────────────────────────────────────────────┐
│                    BILL STATUS                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PENDING                                                        │
│  ───────                                                        │
│    • No payment received yet                                    │
│    • receivedAmount = 0                                         │
│    • Color: Gray                                                │
│                                                                  │
│  PARTIAL                                                        │
│  ───────                                                        │
│    • Some payment received, but not complete                    │
│    • 0 < receivedAmount < billAmount                            │
│    • Color: Amber/Yellow                                        │
│                                                                  │
│  PAID                                                           │
│  ────                                                           │
│    • Full payment received                                      │
│    • receivedAmount >= billAmount                               │
│    • Color: Green                                               │
│    • Shows "SETTLED" badge instead of payment button            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Payment Operations

### 6.1 Record Payment

This is triggered from the Billing page by clicking "Record Payment" on a bill.

```
┌─────────────────────────────────────────────────────────────────┐
│                  PAYMENT FORM                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Component: PaymentForm.tsx (inside RecordPaymentDialog.tsx)    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  BILL SUMMARY                            │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │                                                          │    │
│  │  Milestone:           Inception                          │    │
│  │  Total Project Value: 100,000 BDT (100%)                 │    │
│  │  Bill Allocation:     20,000 BDT (20.0%)                 │    │
│  │  Already Received:    0 BDT (0%)                         │    │
│  │  Remaining:           20,000 BDT (20.0%)                 │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  PAYMENT INPUT                           │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │                                                          │    │
│  │  Amount (BDT) *     │  % of Project                      │    │
│  │  [_____15000____]   │  [_____15.00____]                  │    │
│  │                     │  Max: 20.00% (auto-corrects)       │    │
│  │                                                          │    │
│  │  Payment Date *                                          │    │
│  │  [____2024-02-10____]                                    │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  LIVE PREVIEW                            │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │                                                          │    │
│  │  This Payment:       15,000 BDT (15.00%)                 │    │
│  │  Total After:        15,000 BDT (15.00%)                 │    │
│  │  New Remaining:       5,000 BDT (5.00%)                  │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│                    [Clear Draft]  [Record Payment]              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Payment Amount ↔ Percentage Sync

```
┌─────────────────────────────────────────────────────────────────┐
│              PAYMENT AMOUNT/PERCENT HANDLING                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  When User Enters AMOUNT:                                       │
│  ────────────────────────                                       │
│                                                                  │
│    1. User types: 15000                                         │
│    2. Validate: 15000 <= remainingAmount (20000) ✓              │
│    3. Round to integer: 15000                                   │
│    4. Calculate percentage of PROJECT TOTAL:                    │
│       percent = (15000 / 100000) × 100 = 15.00%                 │
│    5. Update both fields                                        │
│                                                                  │
│    Note: If amount > remaining, show warning toast and          │
│          auto-correct to remaining amount                       │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  When User Enters PERCENTAGE:                                   │
│  ────────────────────────────                                   │
│                                                                  │
│    1. User types: 15%                                           │
│    2. Calculate amount from PROJECT TOTAL:                      │
│       amount = (15 / 100) × 100000 = 15000                      │
│    3. Validate against remaining:                               │
│       - If 15000 > remainingAmount → clamp to remaining         │
│       - Show toast: "Exceeds maximum. Corrected to X%"          │
│    4. Round amount to integer                                   │
│    5. RECALCULATE percentage from amount (source of truth)      │
│    6. Update both fields with corrected values                  │
│                                                                  │
│  KEY: Percentage is ALWAYS relative to Total Project Value,     │
│       NOT relative to bill amount!                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Confirmation Dialog

```
┌─────────────────────────────────────────────────────────────────┐
│                  CONFIRMATION DIALOG                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Before saving, user must confirm:                              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ⚠️ Confirm Payment Recording                            │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │                                                          │    │
│  │  Milestone:         Inception                            │    │
│  │  Payment Amount:    15,000 BDT (15.00%)                  │    │
│  │  Payment Date:      February 10, 2024                    │    │
│  │                                                          │    │
│  │  ──────────────────────────────────────                  │    │
│  │  Current Received:  0 BDT (0%)                           │    │
│  │  Total After:       15,000 BDT (15.00%)                  │    │
│  │  Remaining:         5,000 BDT (5.00%)                    │    │
│  │  New Status:        [PARTIAL]                            │    │
│  │                                                          │    │
│  │             [Cancel]     [Yes, Record Payment]           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### API Call and Database Update

```
┌─────────────────────────────────────────────────────────────────┐
│                       API CALL                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Endpoint: PATCH /api/bills/[id]                                │
│                                                                  │
│  Request Body:                                                  │
│  {                                                               │
│    "receivedAmount": 15000,      // Total received so far       │
│    "receivedDate": "2024-02-10",                                │
│    "receivedPercent": 15.00,     // % of project total          │
│    "remainingAmount": 5000,      // billAmount - receivedAmount │
│    "status": "PARTIAL"           // Calculated status           │
│  }                                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VALIDATION (Server)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✓ Bill must exist                                              │
│  ✓ receivedAmount cannot be negative                            │
│  ✓ receivedAmount cannot exceed billAmount                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE UPDATE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Table: project_bills                                           │
│                                                                  │
│  UPDATE project_bills                                           │
│  SET                                                             │
│    received_amount = 15000,                                      │
│    received_date = '2024-02-10',                                 │
│    received_percent = 15.00,                                     │
│    remaining_amount = 5000,                                      │
│    status = 'PARTIAL'                                            │
│  WHERE id = 101                                                  │
│                                                                  │
│  Fields updated:                                                │
│    • received_amount   (cumulative total received)              │
│    • received_date     (date of this payment)                   │
│    • received_percent  (% of project total)                     │
│    • remaining_amount  (what's still due)                       │
│    • status            (PENDING → PARTIAL → PAID)               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Status Calculation Logic

```
┌─────────────────────────────────────────────────────────────────┐
│                 STATUS DETERMINATION                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  After payment is recorded:                                     │
│                                                                  │
│  totalReceived = currentReceived + newPayment                   │
│                                                                  │
│  IF totalReceived >= billAmount:                                │
│      status = "PAID"                                            │
│      Toast: "Payment recorded - Milestone fully settled!"       │
│                                                                  │
│  ELSE IF totalReceived > 0:                                     │
│      status = "PARTIAL"                                         │
│      Toast: "Partial payment recorded successfully"             │
│                                                                  │
│  ELSE:                                                          │
│      status = "PENDING"                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Financial Precision Handling

### The Problem

```
┌─────────────────────────────────────────────────────────────────┐
│              THE FLOATING-POINT PRECISION PROBLEM                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Scenario:                                                      │
│  ─────────                                                      │
│  • Total Project Value: 500,000 BDT                             │
│  • Remaining to collect: 550 BDT                                │
│  • User sees: "Remaining: 550 BDT (0.11%)"                      │
│                                                                  │
│  Problem:                                                       │
│  ────────                                                       │
│  • User enters 0.11% in percentage field                        │
│  • System calculates: (0.11 / 100) × 500000 = 550               │
│  • But internally: 550 / 500000 = 0.0011 = 0.10999978...%      │
│  • Validation fails because 0.11 ≠ 0.10999978                   │
│  • User is confused: "It says 0.11%, why won't it accept?"      │
│                                                                  │
│  Root Cause:                                                    │
│  ───────────                                                    │
│  Floating-point numbers cannot represent all decimals exactly.  │
│  0.11 in binary is a repeating fraction, causing tiny errors.   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### The Solution

```
┌─────────────────────────────────────────────────────────────────┐
│                     THE SOLUTION                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PRINCIPLE: Amount is ALWAYS the source of truth                │
│  ──────────────────────────────────────────────                 │
│                                                                  │
│  1. Store amounts as INTEGERS (no decimals for BDT)             │
│  2. NEVER store user-entered percentages directly               │
│  3. ALWAYS derive percentages from amounts                      │
│  4. Use epsilon tolerance for comparisons                       │
│                                                                  │
│  Flow when user enters percentage:                              │
│  ─────────────────────────────────                              │
│                                                                  │
│    User Input: 0.11%                                            │
│         │                                                        │
│         ▼                                                        │
│    Convert to amount:                                           │
│    amount = round((0.11 / 100) × 500000) = 550                  │
│         │                                                        │
│         ▼                                                        │
│    Recalculate percentage from amount:                          │
│    percent = (550 / 500000) × 100 = 0.11%                       │
│         │                                                        │
│         ▼                                                        │
│    Store: amount = 550 (integer, source of truth)               │
│    Display: 0.11% (calculated for display only)                 │
│                                                                  │
│  Why this works:                                                │
│  ───────────────                                                │
│  • Integer 550 is stored exactly (no floating-point error)      │
│  • Display percentage is always calculated fresh                │
│  • Small rounding differences are absorbed by integer storage   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Financial Utility Functions

```
┌─────────────────────────────────────────────────────────────────┐
│              FINANCIAL UTILITIES (/src/lib/financial-utils.ts)   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  roundAmount(amount)                                            │
│  ───────────────────                                            │
│    Rounds to nearest integer (for BDT currency)                 │
│    Example: roundAmount(15000.7) → 15001                        │
│                                                                  │
│  calculatePercentage(amount, total, decimals = 2)               │
│  ────────────────────────────────────────────────               │
│    Calculates percentage with specified precision               │
│    Example: calculatePercentage(20000, 100000) → 20.00          │
│                                                                  │
│  calculateAmountFromPercentage(percent, total)                  │
│  ─────────────────────────────────────────────                  │
│    Converts percentage to rounded integer amount                │
│    Example: calculateAmountFromPercentage(20, 100000) → 20000   │
│                                                                  │
│  isApproximatelyEqual(a, b, epsilon = 0.0001)                   │
│  ────────────────────────────────────────────                   │
│    Checks if two numbers are "close enough"                     │
│    Used for 100% validation: isApproximatelyEqual(sum, 100, 0.01)│
│    Example: isApproximatelyEqual(99.99, 100, 0.01) → true       │
│                                                                  │
│  validatePercentageInput(percent, total, maxAmount)             │
│  ──────────────────────────────────────────────────             │
│    Validates user percentage input and returns corrected values │
│    Returns: { valid, amount, percentage, message }              │
│    Auto-corrects if exceeds max                                 │
│                                                                  │
│  formatBDT(amount, options)                                     │
│  ──────────────────────────                                     │
│    Formats currency for display                                 │
│    Example: formatBDT(100000) → "১,00,000 Tk"                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Epsilon Tolerance Explained

```
┌─────────────────────────────────────────────────────────────────┐
│                   EPSILON TOLERANCE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  What is epsilon?                                               │
│  ────────────────                                               │
│  A small tolerance value to account for floating-point errors.  │
│                                                                  │
│  Why we need it:                                                │
│  ───────────────                                                │
│  Without epsilon:                                               │
│    99.9999999 === 100  →  FALSE (fails validation)              │
│                                                                  │
│  With epsilon (0.01):                                           │
│    |99.9999999 - 100| = 0.0000001                               │
│    0.0000001 <= 0.01  →  TRUE (passes validation)               │
│                                                                  │
│  Where we use it:                                               │
│  ────────────────                                               │
│  • 100% allocation check: tolerates 99.99% to 100.01%           │
│  • Over/under allocation detection                              │
│  • Payment percentage validation                                │
│                                                                  │
│  Default tolerances:                                            │
│  ───────────────────                                            │
│  • General comparisons: 0.0001 (0.0001%)                        │
│  • 100% check: 0.01 (0.01%)                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Validation Rules Summary

### Client Validation


| Field         | Required | Rules                             |
| ------------- | -------- | --------------------------------- |
| name          | Yes      | Must not be empty, must be unique |
| contactPerson | No       | Any text                          |
| contactEmail  | No       | Valid email format                |
| contactPhone  | No       | Any text                          |

### Project Validation


| Field             | Required | Rules                                   |
| ----------------- | -------- | --------------------------------------- |
| projectName       | Yes      | Must not be empty                       |
| totalProjectValue | Yes      | Must be > 0, numeric                    |
| clientId          | Yes*     | Required unless creating new client     |
| newClient         | Yes*     | Required if no existing client selected |
| departmentId      | Yes      | Must exist in database                  |
| categoryId        | Yes      | Must exist in database                  |
| startDate         | Yes      | Valid date                              |

### Milestone/Bill Validation (during project creation)


| Field                    | Required | Rules                                   |
| ------------------------ | -------- | --------------------------------------- |
| billName                 | Yes      | Must not be empty                       |
| billPercent              | Yes      | 0-100, auto-capped at 100               |
| billAmount               | Yes      | >= 0, cannot exceed total project value |
| tentativeBillingDate     | Yes      | Valid date                              |
| Total of all percentages | -        | Must equal 100% (unless bypass checked) |

### Payment Validation


| Field           | Required   | Rules                                |
| --------------- | ---------- | ------------------------------------ |
| receivedAmount  | Yes        | Must be > 0, cannot exceed remaining |
| receivedDate    | Yes        | Valid date                           |
| receivedPercent | Calculated | Auto-derived from amount             |

---

## 9. Common Flows

### Flow 1: New Client → New Project → Record Payments

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE WORKFLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Create Client                                          │
│  ─────────────────────                                          │
│    → Go to Clients page                                         │
│    → Click "Add Client"                                         │
│    → Enter: Name (required), Contact info (optional)            │
│    → Submit → Client created                                    │
│                                                                  │
│  Step 2: Create Project with Milestones                         │
│  ──────────────────────────────────────                         │
│    → Go to Projects page                                        │
│    → Click "Create New Project"                                 │
│    → Enter project details                                      │
│    → Select the client created in Step 1                        │
│    → Set total value (e.g., 100,000 BDT)                        │
│    → Configure milestones:                                      │
│        • Inception: 20% = 20,000 BDT                            │
│        • Deliverable-1: 30% = 30,000 BDT                        │
│        • Final: 50% = 50,000 BDT                                │
│    → Verify allocation = 100%                                   │
│    → Submit → Project created with 3 bills                      │
│                                                                  │
│  Step 3: Record First Payment                                   │
│  ────────────────────────────                                   │
│    → Go to Billing page                                         │
│    → Find "Inception" milestone (status: PENDING)               │
│    → Click "Record Payment"                                     │
│    → Enter: Amount = 20,000 BDT, Date = today                   │
│    → Confirm → Status changes to PAID                           │
│                                                                  │
│  Step 4: Record Partial Payment                                 │
│  ──────────────────────────────                                 │
│    → Find "Deliverable-1" milestone (status: PENDING)           │
│    → Click "Record Payment"                                     │
│    → Enter: Amount = 15,000 BDT (partial)                       │
│    → Confirm → Status changes to PARTIAL                        │
│    → Remaining: 15,000 BDT still due                            │
│                                                                  │
│  Step 5: Complete Partial Payment                               │
│  ─────────────────────────────────                              │
│    → Find "Deliverable-1" again (status: PARTIAL)               │
│    → Click "Record Payment"                                     │
│    → Enter: Amount = 15,000 BDT (remaining)                     │
│    → Confirm → Status changes to PAID                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 2: Project Status Progression

```
┌─────────────────────────────────────────────────────────────────┐
│                PROJECT STATUS PROGRESSION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Project starts as "ONGOING":                                   │
│                                                                  │
│    Bills:                                                       │
│    ┌────────────┬─────────┬──────────┬──────────┐              │
│    │ Milestone  │ Amount  │ Received │ Status   │              │
│    ├────────────┼─────────┼──────────┼──────────┤              │
│    │ Inception  │ 20,000  │ 0        │ PENDING  │              │
│    │ Final      │ 80,000  │ 0        │ PENDING  │              │
│    └────────────┴─────────┴──────────┴──────────┘              │
│                                                                  │
│                              ↓                                   │
│                     Record payment                               │
│                              ↓                                   │
│                                                                  │
│    ┌────────────┬─────────┬──────────┬──────────┐              │
│    │ Inception  │ 20,000  │ 20,000   │ PAID     │ ← Changed    │
│    │ Final      │ 80,000  │ 0        │ PENDING  │              │
│    └────────────┴─────────┴──────────┴──────────┘              │
│    Project Status: Still "ONGOING" (not all PAID)               │
│                                                                  │
│                              ↓                                   │
│                     Record payment                               │
│                              ↓                                   │
│                                                                  │
│    ┌────────────┬─────────┬──────────┬──────────┐              │
│    │ Inception  │ 20,000  │ 20,000   │ PAID     │              │
│    │ Final      │ 80,000  │ 80,000   │ PAID     │ ← Changed    │
│    └────────────┴─────────┴──────────┴──────────┘              │
│    Project Status: "COMPLETED" (all bills PAID)                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 3: Dashboard Calculations

```
┌─────────────────────────────────────────────────────────────────┐
│                  DASHBOARD AGGREGATIONS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  The dashboard shows aggregate metrics:                         │
│                                                                  │
│  Total Budget:                                                  │
│    = SUM of all project totalProjectValue                       │
│                                                                  │
│  Total Received:                                                │
│    = SUM of all bill receivedAmount                             │
│                                                                  │
│  Total Due:                                                     │
│    = Total Budget - Total Received                              │
│                                                                  │
│  Realization Rate:                                              │
│    = (Total Received / Total Budget) × 100                      │
│                                                                  │
│  These can be filtered by:                                      │
│    • Department                                                 │
│    • Year                                                       │
│    • Client                                                     │
│    • Status (Completed/Ongoing)                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

### API Endpoints


| Method | Endpoint           | Purpose                          |
| ------ | ------------------ | -------------------------------- |
| GET    | /api/clients       | List all clients with aggregates |
| POST   | /api/clients       | Create new client                |
| GET    | /api/clients/[id]  | Get client details               |
| GET    | /api/projects      | List projects with filters       |
| POST   | /api/projects      | Create project with bills        |
| GET    | /api/projects/[id] | Get project details              |
| GET    | /api/bills         | List bills with filters          |
| POST   | /api/bills         | Create new bill                  |
| PATCH  | /api/bills/[id]    | Update bill (record payment)     |
| DELETE | /api/bills/[id]    | Delete a bill                    |

### Key Files


| Purpose             | File Path                                     |
| ------------------- | --------------------------------------------- |
| Financial utilities | /src/lib/financial-utils.ts                   |
| Add Client          | /src/components/clients/AddClientDialog.tsx   |
| Add Project         | /src/components/projects/AddProjectDialog.tsx |
| Payment Form        | /src/components/billing/PaymentForm.tsx       |
| Billing Table       | /src/components/billing/BillingTable.tsx      |

---

*Document generated for Tiller Project Compass v0.1.0*
