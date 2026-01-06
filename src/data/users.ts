import { User } from '@/types';

export const usersData: User[] = [
  {
    id: '1',
    name: 'CEO Admin',
    email: 'ceo@tiller.com.bd',
    role: 'SUPERADMIN',
    suspended: false,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Project Manager',
    email: 'pm@tiller.com.bd',
    role: 'USER',
    suspended: false,
    createdAt: new Date('2024-02-15'),
  },
  {
    id: '3',
    name: 'Finance Officer',
    email: 'finance@tiller.com.bd',
    role: 'USER',
    suspended: true,
    createdAt: new Date('2024-03-10'),
  },
];

// Mock passwords for demo
export const userPasswords: Record<string, string> = {
  'ceo@tiller.com.bd': 'admin123',
  'pm@tiller.com.bd': 'user123',
  'finance@tiller.com.bd': 'user123',
};
