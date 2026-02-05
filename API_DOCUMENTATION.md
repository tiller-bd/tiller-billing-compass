# Tiller Billing Compass - API Documentation

## Overview

All API endpoints require authentication via `auth_session` cookie (except `/api/auth/login`).

**Base URL:** `http://your-domain:60/api`

**Authentication:** Cookie-based session (`auth_session`)

**Common Error Responses:**
```json
{ "error": "Unauthorized", "code": "UNAUTHORIZED" }  // 401
{ "error": "Not found", "code": "NOT_FOUND" }        // 404
{ "error": "Validation error", "code": "VALIDATION_ERROR" }  // 400
```

---

## Table of Contents

1. [Authentication](#authentication)
2. [Dashboard](#dashboard)
3. [Projects](#projects)
4. [Bills](#bills)
5. [Clients](#clients)
6. [Departments](#departments)
7. [Categories](#categories)
8. [Users](#users)
9. [Search](#search)

---

## Authentication

### POST `/api/auth/login`

Authenticates a user and creates a session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "full_name": "John Doe",
    "email": "user@example.com",
    "role": "admin",
    "is_active": true
  }
}
```

**SQL Equivalent:**
```sql
SELECT id, full_name, email, role, is_active, password_hash
FROM users
WHERE email = 'user@example.com';

-- Password verification done with bcrypt.compare()
```

---

### POST `/api/auth/logout`

Clears the session cookie and logs out the user.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Dashboard

### GET `/api/dashboard/metrics`

Returns key financial metrics.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `year` | string | `all`, `fy-2024-25`, or `cal-2024` |
| `departmentId` | string | Department ID or `all` |
| `clientId` | string | Client ID or `all` |
| `status` | string | Project status filter: `all`, `ONGOING`, or `COMPLETED` (uses effective status logic) |
| `search` | string | Search term for project/client name |

**Response:**
```json
{
  "totalBudget": 5000000,
  "totalReceived": 3000000,
  "totalRemaining": 2000000,
  "activeCount": 15,
  "pgDeposited": 500000,
  "pgCleared": 200000,
  "pgPending": 300000
}
```

**Calculation Logic:**
- **Total Budget** = Sum of bills scheduled (`tentativeBillingDate`) in the selected year
- **Total Received** = Sum of PAID + PARTIAL bills' `receivedAmount` where `receivedDate` is in the selected year
- **Total Remaining** = PENDING bills' `billAmount` + PARTIAL bills' (`billAmount` - `receivedAmount`) for bills scheduled in the year

**Important:** Budget and Remaining use `tentativeBillingDate` for filtering, while Received uses `receivedDate`. This ensures revenue is credited to the period when payment was actually received, not when it was scheduled.

**SQL Equivalent:**
```sql
-- Total Budget (bills scheduled in the date range)
SELECT SUM(pb.bill_amount) as total_budget
FROM project_bills pb
JOIN projects p ON pb.project_id = p.id
WHERE pb.tentative_billing_date BETWEEN '2024-07-01' AND '2025-06-30'
  AND (p.department_id = :departmentId OR :departmentId IS NULL)
  AND (p.client_id = :clientId OR :clientId IS NULL);

-- Total Received (PAID + PARTIAL bills where payment was RECEIVED in the date range)
SELECT SUM(pb.received_amount) as total_received
FROM project_bills pb
JOIN projects p ON pb.project_id = p.id
WHERE pb.status IN ('PAID', 'PARTIAL')
  AND pb.received_date BETWEEN '2024-07-01' AND '2025-06-30';

-- Total Remaining (PENDING + PARTIAL remaining, based on SCHEDULED date)
SELECT SUM(
  CASE
    WHEN pb.status = 'PENDING' THEN pb.bill_amount
    WHEN pb.status = 'PARTIAL' THEN pb.bill_amount - COALESCE(pb.received_amount, 0)
    ELSE 0
  END
) as total_remaining
FROM project_bills pb
WHERE pb.tentative_billing_date BETWEEN '2024-07-01' AND '2025-06-30';

-- PG Metrics
SELECT
  SUM(pg_user_deposit) as pg_deposited,
  SUM(CASE WHEN pg_status = 'CLEARED' THEN pg_user_deposit ELSE 0 END) as pg_cleared
FROM projects p
WHERE EXISTS (
  SELECT 1 FROM project_bills pb
  WHERE pb.project_id = p.id
    AND pb.tentative_billing_date BETWEEN '2024-07-01' AND '2025-06-30'
);
```

---

### GET `/api/dashboard/revenue`

Returns monthly revenue data for charts, including both received amounts and expected/scheduled amounts.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `year` | string | `all`, `fy-2024-25`, or `cal-2024` (defaults to current FY if `all`) |
| `departmentId` | string | Department ID or `all` |
| `clientId` | string | Client ID or `all` |
| `status` | string | Project status filter: `all`, `ONGOING`, or `COMPLETED` |
| `search` | string | Search term for project/client name |

**Response:**
```json
[
  { "month": "Jul", "received": 100000, "expected": 150000 },
  { "month": "Aug", "received": 150000, "expected": 200000 },
  ...
]
```

**Fields:**
- **month** - Month name (Jul-Jun for fiscal year, Jan-Dec for calendar year)
- **received** - Actual received amount based on `receivedDate` (PAID + PARTIAL bills)
- **expected** - Scheduled/expected amount based on `tentativeBillingDate` (all bills)

**Note:** When `year=all` is passed, defaults to current fiscal year for monthly breakdown (monthly data only makes sense within a single year).

**SQL Equivalent:**
```sql
-- For Fiscal Year (July-June)

-- Received amounts (based on when payment was actually received)
SELECT
  TO_CHAR(pb.received_date, 'Mon') as month,
  SUM(pb.received_amount) as received
FROM project_bills pb
JOIN projects p ON pb.project_id = p.id
WHERE pb.status IN ('PAID', 'PARTIAL')
  AND pb.received_date BETWEEN '2024-07-01' AND '2025-06-30'
  AND (p.department_id = :departmentId OR :departmentId IS NULL)
GROUP BY TO_CHAR(pb.received_date, 'Mon'), EXTRACT(MONTH FROM pb.received_date)
ORDER BY
  CASE
    WHEN EXTRACT(MONTH FROM pb.received_date) >= 7
    THEN EXTRACT(MONTH FROM pb.received_date) - 6
    ELSE EXTRACT(MONTH FROM pb.received_date) + 6
  END;

-- Expected amounts (based on scheduled billing date)
SELECT
  TO_CHAR(pb.tentative_billing_date, 'Mon') as month,
  SUM(pb.bill_amount) as expected
FROM project_bills pb
JOIN projects p ON pb.project_id = p.id
WHERE pb.tentative_billing_date BETWEEN '2024-07-01' AND '2025-06-30'
  AND (p.department_id = :departmentId OR :departmentId IS NULL)
GROUP BY TO_CHAR(pb.tentative_billing_date, 'Mon'), EXTRACT(MONTH FROM pb.tentative_billing_date)
ORDER BY
  CASE
    WHEN EXTRACT(MONTH FROM pb.tentative_billing_date) >= 7
    THEN EXTRACT(MONTH FROM pb.tentative_billing_date) - 6
    ELSE EXTRACT(MONTH FROM pb.tentative_billing_date) + 6
  END;
```

---

### GET `/api/dashboard/revenue-yearly`

Returns yearly revenue data aggregated across all years (used when "All Years" is selected).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search term for project/client name |
| `departmentId` | string | Department ID or `all` |
| `clientId` | string | Client ID or `all` |
| `status` | string | Project status filter: `all`, `ONGOING`, or `COMPLETED` |

**Note:** This endpoint does NOT accept a `year` parameter as it aggregates across all years.

**Response:**
```json
[
  { "year": "2020", "received": 500000 },
  { "year": "2021", "received": 750000 },
  { "year": "2022", "received": 1200000 },
  ...
]
```

**SQL Equivalent:**
```sql
SELECT
  EXTRACT(YEAR FROM pb.received_date) as year,
  SUM(pb.received_amount) as received
FROM project_bills pb
JOIN projects p ON pb.project_id = p.id
WHERE pb.status IN ('PAID', 'PARTIAL')
  AND pb.received_date IS NOT NULL
  AND (p.department_id = :departmentId OR :departmentId IS NULL)
  AND (p.client_id = :clientId OR :clientId IS NULL)
  AND (p.project_name ILIKE '%search%' OR :search IS NULL)
GROUP BY EXTRACT(YEAR FROM pb.received_date)
ORDER BY year;
```

---

### GET `/api/dashboard/distribution`

Returns project distribution data for sunburst chart (Client -> Project hierarchy).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `year` | string | `all`, `fy-2024-25`, or `cal-2024` |
| `departmentId` | string | Department ID or `all` |
| `clientId` | string | Client ID or `all` |
| `status` | string | Project status filter: `all`, `ONGOING`, or `COMPLETED` |
| `search` | string | Search term for project/client name |

**Response:**
```json
[
  {
    "name": "Client ABC",
    "value": 1000000,
    "fill": "hsl(210, 70%, 45%)",
    "received": 600000,
    "remaining": 400000,
    "projectCount": 3,
    "children": [
      {
        "name": "Project Alpha",
        "value": 500000,
        "fill": "hsl(210, 60%, 55%)",
        "received": 300000,
        "remaining": 200000,
        "percentReceived": 60,
        "billCount": 5,
        "clientName": "Client ABC"
      }
    ]
  }
]
```

**Structure:**
- **Inner Ring:** Clients (darker colors)
- **Outer Ring:** Projects (lighter shades of parent client color)

**SQL Equivalent:**
```sql
SELECT
  c.id as client_id,
  c.name as client_name,
  p.id as project_id,
  p.project_name,
  SUM(pb.bill_amount) as budget,
  SUM(CASE WHEN pb.status IN ('PAID', 'PARTIAL') THEN pb.received_amount ELSE 0 END) as received,
  SUM(
    CASE
      WHEN pb.status = 'PENDING' THEN pb.bill_amount
      WHEN pb.status = 'PARTIAL' THEN pb.bill_amount - COALESCE(pb.received_amount, 0)
      ELSE 0
    END
  ) as remaining,
  COUNT(pb.id) as bill_count
FROM clients c
JOIN projects p ON p.client_id = c.id
JOIN project_bills pb ON pb.project_id = p.id
WHERE pb.tentative_billing_date BETWEEN '2024-07-01' AND '2025-06-30'
GROUP BY c.id, c.name, p.id, p.project_name
ORDER BY c.name, p.project_name;
```

---

### GET `/api/dashboard/budget-comparison`

Returns budget vs received comparison per project.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `year` | string | `all`, `fy-2024-25`, or `cal-2024` |
| `departmentId` | string | Department ID or `all` |
| `clientId` | string | Client ID or `all` |
| `status` | string | Project status filter: `all`, `ONGOING`, or `COMPLETED` |
| `search` | string | Search term for project/client name |

**Response:**
```json
[
  {
    "name": "Project Alpha",
    "budget": 500000,
    "received": 300000,
    "remaining": 200000
  }
]
```

**Calculation Logic:**
- **Budget** = Sum of ALL bills' `billAmount`
- **Received** = Sum of PAID + PARTIAL bills' `receivedAmount`
- **Remaining** = PENDING bills' `billAmount` + PARTIAL bills' (`billAmount` - `receivedAmount`)

**SQL Equivalent:**
```sql
SELECT
  p.project_name as name,
  SUM(pb.bill_amount) as budget,
  SUM(CASE WHEN pb.status IN ('PAID', 'PARTIAL') THEN pb.received_amount ELSE 0 END) as received,
  SUM(
    CASE
      WHEN pb.status = 'PENDING' THEN pb.bill_amount
      WHEN pb.status = 'PARTIAL' THEN pb.bill_amount - COALESCE(pb.received_amount, 0)
      ELSE 0
    END
  ) as remaining
FROM projects p
JOIN project_bills pb ON pb.project_id = p.id
WHERE pb.tentative_billing_date BETWEEN '2024-07-01' AND '2025-06-30'
  AND (p.department_id = :departmentId OR :departmentId IS NULL)
GROUP BY p.id, p.project_name;
```

---

### GET `/api/dashboard/last-received`

Returns the 5 most recent payments received.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `year` | string | `all`, `fy-2024-25`, or `cal-2024` (filters by `receivedDate`) |
| `departmentId` | string | Department ID or `all` |
| `clientId` | string | Client ID or `all` |
| `status` | string | Project status filter: `all`, `ONGOING`, or `COMPLETED` |
| `search` | string | Search term for project/client name |

**Response:**
```json
[
  {
    "projectName": "Project Alpha",
    "amount": 100000,
    "date": "2024-12-15"
  }
]
```

**SQL Equivalent:**
```sql
SELECT
  p.project_name,
  pb.received_amount as amount,
  pb.received_date as date
FROM project_bills pb
JOIN projects p ON pb.project_id = p.id
WHERE pb.status = 'PAID'
  AND pb.received_amount > 0
  AND (pb.received_date BETWEEN '2024-07-01' AND '2025-06-30' OR :year = 'all')
  AND (p.department_id = :departmentId OR :departmentId IS NULL)
  AND (p.client_id = :clientId OR :clientId IS NULL)
ORDER BY pb.received_date DESC
LIMIT 5;
```

---

### GET `/api/dashboard/deadlines`

Returns upcoming billing deadlines (bills due in the future that are not fully paid).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `year` | string | `all`, `fy-2024-25`, or `cal-2024` |
| `departmentId` | string | Department ID or `all` |
| `clientId` | string | Client ID or `all` |
| `status` | string | Project status filter: `all`, `ONGOING`, or `COMPLETED` |
| `search` | string | Search term for project/client name |

**Response:**
```json
[
  {
    "projectName": "Project Beta",
    "amount": 50000,
    "dueDate": "2025-02-15"
  }
]
```

**SQL Equivalent:**
```sql
SELECT
  p.project_name,
  pb.bill_amount as amount,
  pb.tentative_billing_date as due_date
FROM project_bills pb
JOIN projects p ON pb.project_id = p.id
WHERE pb.status != 'PAID'
  AND pb.tentative_billing_date >= CURRENT_DATE
  AND (pb.tentative_billing_date <= '2025-06-30' OR :year = 'all')
  AND (p.department_id = :departmentId OR :departmentId IS NULL)
  AND (p.client_id = :clientId OR :clientId IS NULL)
ORDER BY pb.tentative_billing_date ASC
LIMIT 5;
```

**Note:** The endpoint returns bills due from today onwards (future dates only), capped at 5 results.

---

### GET `/api/dashboard/calendar`

Returns calendar events (project milestones, payments).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `year` | string | `all`, `fy-2024-25`, or `cal-2024` |
| `departmentId` | string | Department ID or `all` |
| `clientId` | string | Client ID or `all` |
| `status` | string | Project status filter: `all`, `ONGOING`, or `COMPLETED` |

**Note:** This endpoint does NOT support the `search` parameter.

**Response:**
```json
[
  {
    "date": "2024-07-01",
    "type": "project_signed",
    "title": "Project Signed",
    "projectName": "Project Alpha"
  },
  {
    "date": "2024-12-15",
    "type": "received_payment",
    "title": "Payment Received",
    "projectName": "Project Alpha",
    "amount": 100000
  },
  {
    "date": "2025-01-15",
    "type": "tentative_payment",
    "title": "Payment Due",
    "projectName": "Project Beta",
    "amount": 50000
  },
  {
    "date": "2024-11-01",
    "type": "pg_cleared",
    "title": "PG Cleared",
    "projectName": "Project Gamma",
    "amount": 25000
  }
]
```

**SQL Equivalent:**
```sql
-- Project Signed Events
SELECT
  p.start_date as date,
  'project_signed' as type,
  'Project Signed' as title,
  p.project_name
FROM projects p
WHERE p.start_date BETWEEN '2024-07-01' AND '2025-06-30';

-- PG Cleared Events
SELECT
  p.pg_clearance_date as date,
  'pg_cleared' as type,
  'PG Cleared' as title,
  p.project_name,
  p.pg_user_deposit as amount
FROM projects p
WHERE p.pg_status = 'CLEARED'
  AND p.pg_clearance_date BETWEEN '2024-07-01' AND '2025-06-30';

-- Tentative Payment Events
SELECT
  pb.tentative_billing_date as date,
  'tentative_payment' as type,
  COALESCE(pb.bill_name, 'Payment Due') as title,
  p.project_name,
  pb.bill_amount as amount
FROM project_bills pb
JOIN projects p ON pb.project_id = p.id
WHERE pb.status != 'PAID'
  AND pb.tentative_billing_date BETWEEN '2024-07-01' AND '2025-06-30';

-- Received Payment Events
SELECT
  pb.received_date as date,
  'received_payment' as type,
  COALESCE(pb.bill_name, 'Payment Received') as title,
  p.project_name,
  pb.received_amount as amount
FROM project_bills pb
JOIN projects p ON pb.project_id = p.id
WHERE pb.received_amount > 0
  AND pb.received_date BETWEEN '2024-07-01' AND '2025-06-30';
```

---

### GET `/api/dashboard/projects`

Returns filtered projects for dashboard table.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `year` | string | `all`, `fy-2024-25`, or `cal-2024` |
| `departmentId` | string | Department ID or `all` |
| `clientId` | string | Client ID or `all` |
| `status` | string | Project status filter: `all`, `ONGOING`, or `COMPLETED` |
| `search` | string | Search term for project/client name |

**Response:**
```json
[
  {
    "id": 1,
    "projectName": "Project Alpha",
    "clientId": 1,
    "departmentId": 1,
    "categoryId": 1,
    "startDate": "2024-07-01",
    "endDate": "2025-06-30",
    "totalProjectValue": 500000,
    "client": { "id": 1, "name": "Client A" },
    "category": { "id": 1, "name": "Software" },
    "bills": [...]
  }
]
```

**SQL Equivalent:**
```sql
-- Main query: Projects with client, category, and bills
SELECT
  p.*,
  c.id as client_id, c.name as client_name,
  pc.id as category_id, pc.name as category_name
FROM projects p
JOIN clients c ON p.client_id = c.id
JOIN project_categories pc ON p.category_id = pc.id
WHERE (p.project_name ILIKE '%search%' OR c.name ILIKE '%search%')
  AND (p.department_id = :departmentId OR :departmentId IS NULL)
  AND (p.client_id = :clientId OR :clientId IS NULL)
ORDER BY p.start_date DESC;

-- Bills for each project (filtered by year if provided)
SELECT pb.*
FROM project_bills pb
WHERE pb.project_id IN (SELECT id FROM projects_result)
  AND (pb.tentative_billing_date BETWEEN :yearStart AND :yearEnd OR :year = 'all');

-- Note: In application, bills are nested in each project object.
-- Projects with no bills in the year range are excluded when year filter is applied.
-- Effective status filter is applied after fetching based on computed bill statuses.
```

---

## Projects

### GET `/api/projects`

Returns all projects with optional filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search in project/client name |
| `departmentId` | string | Filter by department |
| `categoryId` | string | Filter by category |
| `clientId` | string | Filter by client |
| `projectId` | string | Filter by specific project |
| `year` | string | `all`, `fy-2024-25`, or `cal-2024` |
| `status` | string | `COMPLETED`, `ONGOING`, or `all` |

**Response:**
```json
[
  {
    "id": 1,
    "projectName": "Project Alpha",
    "clientId": 1,
    "departmentId": 1,
    "categoryId": 1,
    "startDate": "2024-07-01",
    "endDate": "2025-06-30",
    "totalProjectValue": 500000,
    "pgPercent": 5,
    "pgAmount": 25000,
    "pgBankSharePercent": 20,
    "pgUserDeposit": 20000,
    "pgStatus": "PENDING",
    "pgClearanceDate": null,
    "client": {...},
    "department": {...},
    "category": {...},
    "bills": [...]
  }
]
```

**SQL Equivalent:**
```sql
-- Main query: Projects with related data
SELECT
  p.*,
  c.id as client_id, c.name as client_name, c.contact_person, c.contact_email, c.contact_phone,
  d.id as department_id, d.name as department_name,
  pc.id as category_id, pc.name as category_name
FROM projects p
JOIN clients c ON p.client_id = c.id
JOIN departments d ON p.department_id = d.id
JOIN project_categories pc ON p.category_id = pc.id
WHERE (p.project_name ILIKE '%search%' OR c.name ILIKE '%search%')
  AND (p.department_id = :departmentId OR :departmentId IS NULL)
  AND (p.category_id = :categoryId OR :categoryId IS NULL)
  AND (p.client_id = :clientId OR :clientId IS NULL)
  AND (p.id = :projectId OR :projectId IS NULL)
ORDER BY p.start_date DESC;

-- Bills for each project (filtered by year if provided)
SELECT pb.*
FROM project_bills pb
WHERE pb.project_id IN (SELECT id FROM projects_result)
  AND (pb.tentative_billing_date BETWEEN :yearStart AND :yearEnd OR :year = 'all');

-- Note: In application, bills are nested in each project object.
-- Projects with no bills in the year range are excluded when year filter is applied.
-- Effective status (ONGOING/COMPLETED) is computed based on bill statuses.
```

---

### POST `/api/projects`

Creates a new project with bills.

**Request Body:**
```json
{
  "projectName": "New Project",
  "clientId": 1,
  "departmentId": 1,
  "categoryId": 1,
  "startDate": "2024-07-01",
  "endDate": "2025-06-30",
  "totalProjectValue": 500000,
  "bills": [
    {
      "billName": "First Payment",
      "billPercent": 30,
      "billAmount": 150000,
      "tentativeBillingDate": "2024-09-01"
    }
  ],
  "pg": {
    "inputType": "percentage",
    "percent": 5,
    "amount": null,
    "bankSharePercent": 20
  }
}
```

**Response:** Created project object (status 201)

**SQL Equivalent:**
```sql
BEGIN;

INSERT INTO projects (
  project_name, client_id, department_id, category_id,
  start_date, end_date, total_project_value,
  pg_percent, pg_amount, pg_bank_share_percent, pg_user_deposit, pg_status
) VALUES (
  'New Project', 1, 1, 1,
  '2024-07-01', '2025-06-30', 500000,
  5, 25000, 20, 20000, 'PENDING'
) RETURNING id;

INSERT INTO project_bills (
  project_id, bill_name, bill_percent, bill_amount,
  tentative_billing_date, status
) VALUES
  (:project_id, 'First Payment', 30, 150000, '2024-09-01', 'PENDING');

COMMIT;
```

---

### GET `/api/projects/:id`

Returns a single project with all details.

**Response:**
```json
{
  "id": 1,
  "projectName": "Project Alpha",
  "client": {...},
  "department": {...},
  "category": {...},
  "bills": [...]
}
```

**SQL Equivalent:**
```sql
SELECT p.*, c.*, d.*, pc.*
FROM projects p
JOIN clients c ON p.client_id = c.id
JOIN departments d ON p.department_id = d.id
JOIN project_categories pc ON p.category_id = pc.id
WHERE p.id = :id;

SELECT * FROM project_bills
WHERE project_id = :id
ORDER BY tentative_billing_date ASC;
```

---

### PATCH `/api/projects/:id`

Updates a project.

**Request Body:** (all fields optional)
```json
{
  "projectName": "Updated Name",
  "startDate": "2024-08-01",
  "endDate": "2025-07-30",
  "totalProjectValue": 600000,
  "clientId": 2,
  "departmentId": 2,
  "categoryId": 2,
  "pg": {
    "inputType": "amount",
    "amount": 30000,
    "bankSharePercent": 25
  }
}
```

**Response:** Updated project object

**SQL Equivalent:**
```sql
UPDATE projects
SET
  project_name = 'Updated Name',
  start_date = '2024-08-01',
  end_date = '2025-07-30',
  total_project_value = 600000,
  client_id = 2,
  department_id = 2,
  category_id = 2,
  pg_percent = 5,
  pg_amount = 30000,
  pg_bank_share_percent = 25,
  pg_user_deposit = 22500
WHERE id = :id
RETURNING *;
```

---

### PATCH `/api/projects/:id/clear-pg`

Marks the Project Guarantee (PG) as cleared.

**Response:**
```json
{
  "id": 1,
  "pgStatus": "CLEARED",
  "pgClearanceDate": "2025-01-27"
}
```

**SQL Equivalent:**
```sql
UPDATE projects
SET
  pg_status = 'CLEARED',
  pg_clearance_date = CURRENT_DATE
WHERE id = :id
  AND pg_amount > 0
  AND pg_status != 'CLEARED'
RETURNING *;
```

---

## Bills

### GET `/api/bills`

Returns all bills with filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search in bill/project/client name |
| `status` | string | `PENDING`, `PARTIAL`, `PAID`, or `all` |
| `departmentId` | string | Filter by department |
| `clientId` | string | Filter by client |
| `projectId` | string | Filter by project |
| `year` | string | `all`, `fy-2024-25`, or `cal-2024` |

**Response:**
```json
[
  {
    "id": 1,
    "projectId": 1,
    "slNo": "001",
    "billName": "First Payment",
    "billPercent": 30,
    "billAmount": 150000,
    "tentativeBillingDate": "2024-09-01",
    "receivedPercent": null,
    "receivedAmount": 0,
    "receivedDate": null,
    "remainingAmount": null,
    "vat": null,
    "it": null,
    "status": "PENDING",
    "project": {
      "id": 1,
      "projectName": "Project Alpha",
      "client": {...},
      "department": {...}
    }
  }
]
```

**SQL Equivalent:**
```sql
-- Bills with nested project, client, and department data
SELECT
  pb.*,
  p.id as project_id, p.project_name, p.client_id, p.department_id,
  c.id as client_id, c.name as client_name,
  d.id as department_id, d.name as department_name
FROM project_bills pb
JOIN projects p ON pb.project_id = p.id
JOIN clients c ON p.client_id = c.id
JOIN departments d ON p.department_id = d.id
WHERE (pb.bill_name ILIKE '%search%'
    OR p.project_name ILIKE '%search%'
    OR c.name ILIKE '%search%')
  AND (pb.status = :status OR :status = 'all')
  AND (p.department_id = :departmentId OR :departmentId = 'all')
  AND (p.client_id = :clientId OR :clientId = 'all')
  AND (p.id = :projectId OR :projectId = 'all')
  AND (pb.tentative_billing_date BETWEEN :yearStart AND :yearEnd OR :year = 'all')
ORDER BY pb.tentative_billing_date ASC;

-- Note: In response, project object is nested with client and department objects
```

---

### POST `/api/bills`

Creates a new bill for a project.

**Request Body:**
```json
{
  "projectId": 1,
  "billName": "Final Payment",
  "billPercent": 20,
  "billAmount": 100000,
  "tentativeBillingDate": "2025-03-01",
  "status": "PENDING",
  "slNo": "003"
}
```

**Response:** Created bill object with nested project (status 201)
```json
{
  "id": 10,
  "projectId": 1,
  "billName": "Final Payment",
  "billPercent": 20,
  "billAmount": 100000,
  "tentativeBillingDate": "2025-03-01",
  "status": "PENDING",
  "slNo": "003",
  "receivedAmount": 0,
  "project": {
    "id": 1,
    "projectName": "Project Alpha",
    "client": {...},
    "department": {...}
  }
}
```

**SQL Equivalent:**
```sql
-- Insert bill
INSERT INTO project_bills (
  project_id, bill_name, bill_percent, bill_amount,
  tentative_billing_date, status, sl_no, received_amount
) VALUES (
  1, 'Final Payment', 20, 100000,
  '2025-03-01', 'PENDING', '003', 0
) RETURNING *;

-- Then fetch with nested project data
SELECT pb.*, p.*, c.*, d.*
FROM project_bills pb
JOIN projects p ON pb.project_id = p.id
JOIN clients c ON p.client_id = c.id
JOIN departments d ON p.department_id = d.id
WHERE pb.id = :new_bill_id;
```

---

### GET `/api/bills/:id`

Returns a single bill with project details (including client, department, category).

**Response:**
```json
{
  "id": 1,
  "projectId": 1,
  "billName": "First Payment",
  "billAmount": 150000,
  "status": "PENDING",
  "project": {
    "id": 1,
    "projectName": "Project Alpha",
    "client": {...},
    "department": {...},
    "category": {...}
  }
}
```

**SQL Equivalent:**
```sql
SELECT
  pb.*,
  p.id as project_id, p.project_name,
  c.id as client_id, c.name as client_name,
  d.id as department_id, d.name as department_name,
  pc.id as category_id, pc.name as category_name
FROM project_bills pb
JOIN projects p ON pb.project_id = p.id
JOIN clients c ON p.client_id = c.id
JOIN departments d ON p.department_id = d.id
JOIN project_categories pc ON p.category_id = pc.id
WHERE pb.id = :id;

-- Note: In response, project object contains nested client, department, and category objects
```

---

### PATCH `/api/bills/:id`

Updates a bill (e.g., record payment received).

**Request Body:** (all fields optional)
```json
{
  "billName": "Updated Name",
  "billPercent": 25,
  "billAmount": 125000,
  "tentativeBillingDate": "2025-04-01",
  "receivedAmount": 125000,
  "receivedDate": "2025-03-28",
  "receivedPercent": 100,
  "remainingAmount": 0,
  "vat": 6250,
  "it": 3125,
  "status": "PAID"
}
```

**Response:** Updated bill object

**SQL Equivalent:**
```sql
UPDATE project_bills
SET
  bill_name = 'Updated Name',
  bill_percent = 25,
  bill_amount = 125000,
  tentative_billing_date = '2025-04-01',
  received_amount = 125000,
  received_date = '2025-03-28',
  received_percent = 100,
  remaining_amount = 0,
  vat = 6250,
  it = 3125,
  status = 'PAID'
WHERE id = :id
RETURNING *;
```

---

### DELETE `/api/bills/:id`

Deletes a bill.

**Response:**
```json
{
  "success": true,
  "message": "Bill deleted successfully"
}
```

**SQL Equivalent:**
```sql
DELETE FROM project_bills WHERE id = :id;
```

---

## Clients

### GET `/api/clients`

Returns all clients with financial aggregates.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search in client name or contact person |
| `year` | string | `all`, `fy-2024-25`, or `cal-2024` |

**Response:**
```json
[
  {
    "id": 1,
    "name": "Client A",
    "contactPerson": "John Doe",
    "contactEmail": "john@client-a.com",
    "contactPhone": "+880-1234567890",
    "projectCount": 5,
    "totalBudget": 2500000,
    "totalReceived": 1500000,
    "totalDue": 1000000,
    "realizationRate": 60
  }
]
```

**SQL Equivalent:**
```sql
-- Fetch clients with projects and bills (for year filtering)
SELECT c.*, p.id as project_id, pb.*
FROM clients c
LEFT JOIN projects p ON c.id = p.client_id
LEFT JOIN project_bills pb ON p.id = pb.project_id
WHERE (c.name ILIKE '%search%' OR c.contact_person ILIKE '%search%')
  AND (
    :year = 'all'
    OR EXISTS (
      SELECT 1 FROM projects p2
      JOIN project_bills pb2 ON p2.id = pb2.project_id
      WHERE p2.client_id = c.id
        AND pb2.tentative_billing_date BETWEEN :yearStart AND :yearEnd
    )
  )
ORDER BY c.name ASC;

-- Aggregates computed in application:
-- projectCount = COUNT of projects with bills in year range
-- totalBudget = SUM(bill_amount) for bills in year range
-- totalReceived = SUM(received_amount) for PAID/PARTIAL bills in year range
-- totalDue = totalBudget - totalReceived
-- realizationRate = (totalReceived / totalBudget) * 100
```

---

### POST `/api/clients`

Creates a new client.

**Request Body:**
```json
{
  "name": "New Client",
  "contactPerson": "Jane Doe",
  "contactEmail": "jane@newclient.com",
  "contactPhone": "+880-9876543210"
}
```

**Response:** Created client object (status 201)

**SQL Equivalent:**
```sql
INSERT INTO clients (name, contact_person, contact_email, contact_phone)
VALUES ('New Client', 'Jane Doe', 'jane@newclient.com', '+880-9876543210')
RETURNING *;
```

---

### GET `/api/clients/:id`

Returns a single client with all projects and rank.

**Response:**
```json
{
  "id": 1,
  "name": "Client A",
  "contactPerson": "John Doe",
  "contactEmail": "john@client-a.com",
  "contactPhone": "+880-1234567890",
  "rank": 3,
  "projects": [
    {
      "id": 1,
      "projectName": "Project Alpha",
      "department": {...},
      "category": {...},
      "bills": [...]
    }
  ]
}
```

**SQL Equivalent:**
```sql
-- Get client with nested projects, departments, categories, and bills
SELECT c.*
FROM clients c
WHERE c.id = :id;

-- Get projects for this client with related data
SELECT
  p.*,
  d.id as department_id, d.name as department_name,
  pc.id as category_id, pc.name as category_name
FROM projects p
JOIN departments d ON p.department_id = d.id
JOIN project_categories pc ON p.category_id = pc.id
WHERE p.client_id = :id
ORDER BY p.start_date DESC;

-- Get bills for each project
SELECT pb.*
FROM project_bills pb
WHERE pb.project_id IN (SELECT id FROM projects WHERE client_id = :id)
ORDER BY pb.tentative_billing_date ASC;

-- Calculate rank among all clients by total project value
WITH client_totals AS (
  SELECT client_id, SUM(total_project_value) as total_value
  FROM projects
  GROUP BY client_id
)
SELECT
  client_id,
  total_value,
  ROW_NUMBER() OVER (ORDER BY total_value DESC) as rank
FROM client_totals;

-- Note: In response, projects are nested with their bills, and rank is added to client object
```

---

## Departments

### GET `/api/departments`

Returns all departments (optionally filtered by year activity).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `year` | string | `all`, `fy-2024-25`, or `cal-2024` |

**Response:**
```json
[
  {
    "id": 1,
    "name": "Engineering",
    "description": "Engineering department"
  }
]
```

**SQL Equivalent:**
```sql
-- Without year filter
SELECT * FROM departments ORDER BY name ASC;

-- With year filter (only departments with activity)
SELECT DISTINCT d.*
FROM departments d
JOIN projects p ON d.id = p.department_id
JOIN project_bills pb ON p.id = pb.project_id
WHERE pb.tentative_billing_date BETWEEN '2024-07-01' AND '2025-06-30'
ORDER BY d.name ASC;
```

---

### POST `/api/departments`

Creates a new department.

**Request Body:**
```json
{
  "name": "Marketing",
  "description": "Marketing department"
}
```

**Response:** Created department object (status 201)

**SQL Equivalent:**
```sql
INSERT INTO departments (name, description)
VALUES ('Marketing', 'Marketing department')
RETURNING *;
```

---

## Categories

### GET `/api/categories`

Returns all project categories.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Software Development",
    "description": "Software projects"
  }
]
```

**SQL Equivalent:**
```sql
SELECT * FROM project_categories ORDER BY name ASC;
```

---

### POST `/api/categories`

Creates a new category.

**Request Body:**
```json
{
  "name": "Consulting",
  "description": "Consulting services"
}
```

**Response:** Created category object (status 201)

**SQL Equivalent:**
```sql
INSERT INTO project_categories (name, description)
VALUES ('Consulting', 'Consulting services')
RETURNING *;
```

---

## Users

### GET `/api/users`

Returns all users.

**Response:**
```json
[
  {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

**SQL Equivalent:**
```sql
SELECT id, full_name, email, role, is_active, created_at, updated_at
FROM users
ORDER BY created_at DESC;
```

---

### POST `/api/users`

Creates a new user.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "user",
  "password": "securePassword123"
}
```

**Response:** Created user object (status 201)

**SQL Equivalent:**
```sql
INSERT INTO users (full_name, email, role, password_hash)
VALUES ('Jane Doe', 'jane@example.com', 'user', :bcrypt_hashed_password)
RETURNING id, full_name, email, role, is_active, created_at;
```

---

### PATCH `/api/users/:id`

Updates a user (can reset password).

**Request Body:** (all fields optional)
```json
{
  "full_name": "Jane Smith",
  "email": "jane.smith@example.com",
  "role": "admin",
  "is_active": true,
  "password": "newPassword123"
}
```

**Response:** Updated user object (without password_hash)

**SQL Equivalent:**
```sql
UPDATE users
SET
  full_name = 'Jane Smith',
  email = 'jane.smith@example.com',
  role = 'admin',
  is_active = true,
  password_hash = :bcrypt_hashed_password,
  updated_at = NOW()
WHERE id = :id
RETURNING id, full_name, email, role, is_active, created_at, updated_at;
```

---

### DELETE `/api/users/:id`

Deletes a user.

**Response:**
```json
{
  "success": true
}
```

**SQL Equivalent:**
```sql
DELETE FROM users WHERE id = :id;
```

---

## Search

### GET `/api/search/suggestions`

Returns search suggestions across departments, clients, and projects.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Search term |

**Response:**
```json
[
  { "id": "1", "name": "Engineering", "type": "department" },
  { "id": "1", "name": "Client A", "type": "client" },
  { "id": "1", "name": "Project Alpha", "type": "project" }
]
```

**SQL Equivalent:**
```sql
-- Departments
SELECT id::text, name, 'department' as type
FROM departments
WHERE name ILIKE '%query%'
LIMIT 5;

-- Clients
SELECT id::text, name, 'client' as type
FROM clients
WHERE name ILIKE '%query%'
LIMIT 5;

-- Projects
SELECT id::text, project_name as name, 'project' as type
FROM projects
WHERE project_name ILIKE '%query%'
LIMIT 5;
```

---

## Database Schema Reference

### Tables

| Table | Description |
|-------|-------------|
| `users` | System users for authentication |
| `clients` | Client/customer records |
| `departments` | Company departments |
| `project_categories` | Project type categories |
| `projects` | Main project records |
| `project_bills` | Individual bills/payments for projects |

### Key Relationships

```
clients (1) ──────< projects (many)
departments (1) ───< projects (many)
project_categories (1) ─< projects (many)
projects (1) ─────────< project_bills (many)
```

### Bill Status Values

| Status | Description |
|--------|-------------|
| `PENDING` | Bill not yet paid |
| `PARTIAL` | Bill partially paid |
| `PAID` | Bill fully paid |

### PG Status Values

| Status | Description |
|--------|-------------|
| `PENDING` | Project Guarantee not yet cleared |
| `CLEARED` | Project Guarantee returned |

### Project Status Values (Effective Status)

The `status` query parameter in dashboard APIs uses "effective status" logic rather than a stored database field:

| Status | Description |
|--------|-------------|
| `all` | No status filter - returns all projects |
| `ONGOING` | Projects that have at least one bill with status `PENDING` or `PARTIAL` |
| `COMPLETED` | Projects where ALL bills have status `PAID` |

**Note:** A project is considered `COMPLETED` only when every single bill is fully paid. If even one bill is pending or partial, the project is `ONGOING`.

---

## Year Parameter Format

The `year` parameter supports three formats:

| Format | Example | Description |
|--------|---------|-------------|
| `all` | `year=all` | No year filter |
| `fy-YYYY-YY` | `year=fy-2024-25` | Fiscal year (Jul 1 - Jun 30) |
| `cal-YYYY` | `year=cal-2024` | Calendar year (Jan 1 - Dec 31) |
