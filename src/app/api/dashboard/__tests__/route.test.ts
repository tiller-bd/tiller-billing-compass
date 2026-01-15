// src/app/api/dashboard/__tests__/route.test.ts
import { GET } from '../route';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock the dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  verifyAuth: jest.fn(),
}));

describe('Dashboard API - GET', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return dashboard data on successful request', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 1 } });
    (prisma.project.findMany as jest.Mock).mockResolvedValue([
      { 
        id: 1, 
        projectName: 'Test Project', 
        totalProjectValue: 1000,
        bills: [{ receivedAmount: 500, status: 'PARTIAL', tentativeBillingDate: new Date() }],
        client: { name: 'Test Client' },
        category: { name: 'Test Category' }
      }
    ]);

    const request = new NextRequest('http://localhost/api/dashboard');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty('metrics');
    expect(body).toHaveProperty('monthlyRevenue');
    expect(body).toHaveProperty('distribution');
    expect(body).toHaveProperty('budgetComparison');
    expect(body).toHaveProperty('projects');
    expect(prisma.project.findMany).toHaveBeenCalled();
  });

  it('should return 401 if user is not authenticated', async () => {
    const { NextResponse } = require('next/server');
    (verifyAuth as jest.Mock).mockResolvedValue(new NextResponse(null, { status: 401 }));

    const response = await GET();

    expect(response.status).toBe(401);
  });
});
