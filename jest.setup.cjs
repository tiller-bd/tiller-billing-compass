// jest.setup.cjs
// Optional: configure or setup a testing framework before each test.
// For example, if you're using React, you might want to import
// render from '@testing-library/react' and add some custom matchers.
//
// The following line is a workaround for 'Next image stub' in tests
// For more information: https://nextjs.org/docs/messages/next-image-unoptimized
jest.mock('next/image', () => ({
  __esModule: true,
  default: () => {
    return 'Next image stub';
  },
}));

// Mock ResizeObserver
const ResizeObserverMock = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Assign the mock to the global object
global.ResizeObserver = ResizeObserverMock;

// Centralize global fetch mock and fake timers setup
jest.useFakeTimers();
jest.setSystemTime(new Date('2025-01-14T10:00:00Z')); // Consistent date for tests

global.fetch = jest.fn((url) => {
  if (url.includes('/api/bills')) {
    return Promise.resolve({
      json: () => Promise.resolve([]),
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