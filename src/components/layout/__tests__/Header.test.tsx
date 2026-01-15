// src/components/layout/__tests__/Header.test.tsx
import { render, screen } from '@testing-library/react';
import { Header } from '../Header';
import { AuthProvider } from '@/contexts/AuthContext';
import { SharedFilterProvider } from '@/contexts/FilterContext';

// Mock the useAuth hook
jest.mock('@/contexts/AuthContext', () => ({
  ...jest.requireActual('@/contexts/AuthContext'),
  useAuth: () => ({
    user: { full_name: 'Test User' },
    logout: jest.fn(),
  }),
}));

describe('Header', () => {
  it('renders the title and user information', () => {
    render(
      <SharedFilterProvider>
        <AuthProvider>
          <Header title="Dashboard" />
        </AuthProvider>
      </SharedFilterProvider>
    );

    // Check if the title is rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    // Check if the user's name is displayed
    expect(screen.getByText('Test User')).toBeInTheDocument();

    // Check if the logout button is present
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });
});
