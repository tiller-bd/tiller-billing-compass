// src/app/billing/__tests__/page.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import BillingPage from '../page';
import { AuthProvider } from '@/contexts/AuthContext';
import { SharedFilterProvider } from '@/contexts/FilterContext';

// Enable fake timers
jest.useFakeTimers();

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
const mockBills = [
    {
        id: '1',
        billName: 'Mock Bill 1',
        billAmount: 100,
        receivedAmount: 50,
        status: 'PENDING',
        department: { id: 'dept1', name: 'Sales' },
        project: { id: 'proj1', name: 'Project Alpha', totalProjectValue: 200 },
        dueDate: '2025-12-31T00:00:00.000Z',
    },
];

global.fetch = jest.fn((url) => {
  if (url.includes('/api/bills')) {
    return Promise.resolve({
      json: () => Promise.resolve(mockBills),
      ok: true,
    });
  }
  if (url.includes('/api/departments')) {
    return Promise.resolve({
      json: () => Promise.resolve([{ id: '1', name: 'Test Department' }]),
      ok: true,
    });
  }
  return Promise.reject(new Error(`Unhandled request for ${url}`));
});


describe('BillingPage', () => {
  it('renders the billing page with the billing table', async () => {
    render(
      <SharedFilterProvider>
        <AuthProvider>
          <BillingPage />
        </AuthProvider>
      </SharedFilterProvider>
    );

    // Advance all timers (including the setTimeout for fetchBills)
    jest.runAllTimers();

    // Now, explicitly allow all pending microtasks (promises) to resolve
    // This is crucial for effects that return promises, like our mocked fetch calls
    await Promise.resolve(); // Resolves immediate promises
    await Promise.resolve(); // Ensures any subsequent microtasks from React updates are also processed


    // Check for the title
    expect(screen.getByRole('heading', { name: /^Billing$/i })).toBeInTheDocument();

    // Check if the billing table is rendered (we can check for a column header)
    expect(await screen.findByText('Bill Name')).toBeInTheDocument();
    // Also check for a mock bill name to ensure data is rendered
    expect(await screen.findByText('Mock Bill 1')).toBeInTheDocument();

  });
});
