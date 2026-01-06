// Re-export all data and API functions
export * from './users';
export * from './projects';
export * from './clients';
export * from './departments';
export * from './categories';
export * from './api';

// Re-export utility functions from mockData for backward compatibility
export { calculateDashboardMetrics, getMonthlyRevenue, getProjectDistribution, getBudgetByProject } from './mockData';
