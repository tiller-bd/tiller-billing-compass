# Tiller Consultancy - Project Tracking System

A comprehensive project tracking and billing management system for Tiller Consultancy.

## Features

### Authentication & Security
- **Email/Password Login**: Secure authentication with email and password validation
- **Role-Based Access Control**: Super Admin (CEO) and User roles
- **Idle Timeout Lock**: Automatic session lock after 2 minutes of inactivity with animated blob screensaver
- **User Management**: Super Admin can create, suspend, and delete users

### Dashboard
- **Metrics Overview**: Total budget, received payments, remaining amounts, active projects
- **Revenue Charts**: Monthly revenue visualization
- **Budget Comparison**: Project-wise budget vs received analysis
- **Project Distribution**: Category-based project distribution pie chart
- **Upcoming Deadlines**: Quick view of pending bill deadlines
- **Tabbed View**: Switch between Charts Overview and All Projects table

### Projects Management
- **Project Listing**: View all projects with filtering and search
- **Status Tracking**: ONGOING, COMPLETED, FUTURE project statuses
- **Department & Category Filtering**: Filter by department and project category
- **Progress Tracking**: Visual progress bars based on bill payments

### Billing Management
- **Bill Tracking**: Comprehensive bill management with status tracking
- **Payment Status**: PAID, PARTIAL, PENDING status indicators
- **Summary Cards**: Quick overview of total billed, received, and pending amounts
- **VAT & IT Tracking**: Tax calculation fields included

### User Management (Admin Only)
- **User List**: View all system users
- **Suspend/Activate**: Toggle user account status
- **Delete Users**: Remove users from the system

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context API
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Routing**: React Router DOM v6

## Project Structure

```
src/
├── components/
│   ├── dashboard/          # Dashboard-specific components
│   │   ├── BudgetComparisonChart.tsx
│   │   ├── LastReceived.tsx
│   │   ├── MetricCard.tsx
│   │   ├── ProjectDistributionChart.tsx
│   │   ├── RevenueChart.tsx
│   │   └── UpcomingDeadlines.tsx
│   ├── layout/             # Layout components
│   │   ├── DashboardLayout.tsx
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── projects/           # Project components
│   │   └── ProjectTable.tsx
│   ├── ui/                 # shadcn/ui components
│   └── LockScreen.tsx      # Idle timeout lock screen
├── contexts/
│   └── AuthContext.tsx     # Authentication context
├── data/
│   └── mockData.ts         # Mock data for development
├── pages/
│   ├── Index.tsx           # Dashboard page
│   ├── Login.tsx           # Login page
│   ├── Projects.tsx        # Projects listing page
│   ├── Billing.tsx         # Billing management page
│   ├── Users.tsx           # User management page
│   └── NotFound.tsx        # 404 page
├── types/
│   └── index.ts            # TypeScript type definitions
├── App.tsx                 # Main app with routing
└── main.tsx                # Entry point
```

## Database Schema

The application is designed to work with the following PostgreSQL schema:

### Tables

```sql
-- Clients table
CREATE TABLE public.clients (
    id serial4 NOT NULL PRIMARY KEY,
    name varchar(150) NOT NULL UNIQUE,
    contact_person varchar(150) NULL,
    contact_email varchar(150) NULL,
    contact_phone varchar(50) NULL
);

-- Departments table
CREATE TABLE public.departments (
    id serial4 NOT NULL PRIMARY KEY,
    name varchar(100) NOT NULL UNIQUE,
    description text NULL
);

-- Project categories table
CREATE TABLE public.project_categories (
    id serial4 NOT NULL PRIMARY KEY,
    name varchar(100) NOT NULL UNIQUE,
    description text NULL
);

-- Projects table
CREATE TABLE public.projects (
    id serial4 NOT NULL PRIMARY KEY,
    project_name varchar(200) NOT NULL,
    client_id int4 NOT NULL REFERENCES clients(id),
    department_id int4 NOT NULL REFERENCES departments(id),
    category_id int4 NOT NULL REFERENCES project_categories(id),
    start_date date NULL,
    end_date date NULL,
    total_project_value numeric(15, 2) NULL
);

-- Project bills table
CREATE TABLE public.project_bills (
    id serial4 NOT NULL PRIMARY KEY,
    project_id int4 NOT NULL REFERENCES projects(id),
    sl_no varchar(20) NULL,
    bill_name varchar(200) NULL,
    bill_percent numeric(5, 2) NULL,
    bill_amount numeric(15, 2) NOT NULL,
    tentative_billing_date date NULL,
    received_percent numeric(5, 2) NULL,
    received_amount numeric(15, 2) DEFAULT 0,
    received_date date NULL,
    remaining_amount numeric(15, 2) NULL,
    vat numeric(15, 2) NULL,
    it numeric(15, 2) NULL,
    status varchar(50) NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);
```

### Triggers & Functions

```sql
-- Function to calculate bill amounts based on project value
CREATE OR REPLACE FUNCTION public.calculate_project_bill_amounts()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    project_value NUMERIC(15,2);
BEGIN
    SELECT total_project_value INTO project_value
    FROM projects WHERE id = NEW.project_id;

    IF NEW.bill_percent IS NOT NULL THEN
        NEW.bill_amount := (NEW.bill_percent / 100) * project_value;
    END IF;

    IF NEW.received_percent IS NOT NULL THEN
        NEW.received_amount := (NEW.received_percent / 100) * project_value;
    ELSE
        NEW.received_amount := 0;
    END IF;

    NEW.remaining_amount := COALESCE(NEW.bill_amount, 0) - COALESCE(NEW.received_amount, 0);

    IF NEW.remaining_amount = 0 THEN
        NEW.status := 'PAID';
    ELSIF NEW.received_amount > 0 THEN
        NEW.status := 'PARTIAL';
    ELSE
        NEW.status := 'PENDING';
    END IF;

    RETURN NEW;
END;
$$;

-- Trigger for bill calculations
CREATE TRIGGER trg_calculate_project_bill
BEFORE INSERT OR UPDATE ON public.project_bills
FOR EACH ROW EXECUTE FUNCTION calculate_project_bill_amounts();

-- Function to recalculate bills when project value changes
CREATE OR REPLACE FUNCTION public.recalc_bills_on_project_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE project_bills SET bill_percent = bill_percent WHERE project_id = NEW.id;
    RETURN NEW;
END;
$$;

-- Trigger for project value updates
CREATE TRIGGER trg_project_value_update
AFTER UPDATE OF total_project_value ON public.projects
FOR EACH ROW EXECUTE FUNCTION recalc_bills_on_project_update();
```

## Environment Setup

### Development

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd tiller-project-tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory (for future Supabase integration):

```env
# Supabase Configuration (when integrated)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Build for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## Demo Credentials

For testing purposes, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | ceo@tiller.com.bd | admin123 |
| User | pm@tiller.com.bd | user123 |

## Configuration

### Idle Timeout
The idle timeout is set to 2 minutes by default. To modify, update the `IDLE_TIMEOUT` constant in `src/contexts/AuthContext.tsx`:

```typescript
const IDLE_TIMEOUT = 2 * 60 * 1000; // 2 minutes in milliseconds
```

## License

Private - Tiller Consultancy
