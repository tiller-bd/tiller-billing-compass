// src/app/__tests__/page.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '../page';
import { AuthProvider } from '@/contexts/AuthContext';
import { SharedFilterProvider } from '@/contexts/FilterContext';

// Mock the useAuth hook
jest.mock('@/contexts/AuthContext', () => ({
    ...jest.requireActual('@/contexts/AuthContext'),
    useAuth: () => ({
      user: { full_name: 'Test User' },
      isAuthenticated: true,
      logout: jest.fn(),
    }),
  }));

// Mock the fetch API
global.fetch = jest.fn((url) => {
  if (url.includes('/api/bills')) {
    return Promise.resolve({
      json: () => Promise.resolve([]), // Returning empty array for bills as this mock is for Dashboard, not Billing
      ok: true,
    });
  }
  if (url.includes('/api/departments')) {
    return Promise.resolve({
      json: () => Promise.resolve([{ id: '1', name: 'Test Department' }]),
      ok: true,
    });
  }
  if (url.includes('/api/clients')) {
    return Promise.resolve({
      json: () => Promise.resolve([{ id: '1', name: 'Test Client' }]),
      ok: true,
    });
  }
  if (url.includes('/api/projects') && !url.includes('/api/dashboard/projects')) { // for DashboardFilter
    return Promise.resolve({
      json: () => Promise.resolve([{ id: '1', projectName: 'Test Project' }]),
      ok: true,
    });
  }
  if (url.includes('/api/dashboard')) {
    if (url.includes('budget-comparison')) {
      return Promise.resolve({
        json: () => Promise.resolve({ comparisonData: [], totalRevenue: 1000, totalExpenses: 500 }),
        ok: true,
      });
    }
    if (url.includes('deadlines')) {
      return Promise.resolve({
        json: () => Promise.resolve([]),
        ok: true,
      });
    }
    if (url.includes('distribution')) {
      return Promise.resolve({
        json: () => Promise.resolve([]),
        ok: true,
      });
    }
    if (url.includes('last-received')) {
      return Promise.resolve({
        json: () => Promise.resolve([]),
        ok: true,
      });
    }
    if (url.includes('metrics')) {
      return Promise.resolve({
        json: () => Promise.resolve({ totalProjects: 10, activeProjects: 5, totalClients: 20, totalRevenue: 100000, totalBudget: 500000, totalReceived: 250000, totalRemaining: 250000 }),
        ok: true,
      });
    }
    if (url.includes('/api/dashboard/projects')) { // Specific for DashboardPage's project fetch
      return Promise.resolve({
        json: () => Promise.resolve([{ id: '1', projectName: 'Test Project', totalProjectValue: 1000, totalExpenses: 500, isCompleted: false, isArchived: false, billable: true, client: { id: '1', name: 'Test Client' }, department: { id: '1', name: 'Test Department' } }]),
        ok: true,
      });
    }
    if (url.includes('revenue')) {
      return Promise.resolve({
        json: () => Promise.resolve({ revenueData: [] }),
        ok: true,
      });
    }
  }
  return Promise.reject(new Error(`Unhandled request for ${url}`));
});


describe('DashboardPage', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });


  it('renders the dashboard page with metric cards and tabs', async () => {
    render(
      <SharedFilterProvider>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </SharedFilterProvider>
    );

    jest.runAllTimers();
    await Promise.resolve();
    await Promise.resolve();

    await waitFor(async () => {
        // Wait for the metric cards to render with data
        expect(screen.getByText('Total Budget')).toBeInTheDocument();
        expect(screen.getByText('Total Received')).toBeInTheDocument();
        expect(screen.getByText('Total Remaining')).toBeInTheDocument();
        expect(screen.getByText('Active Projects')).toBeInTheDocument();

        // Check for tabs, more specific query for "All Projects"
        expect(screen.getByText('Charts Overview')).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'All Projects' })).toBeInTheDocument();
    });
  });
});
