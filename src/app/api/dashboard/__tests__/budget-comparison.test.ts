// src/app/api/dashboard/__tests__/budget-comparison.test.ts
import { GET } from '../budget-comparison/route';
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

describe('Dashboard API - Budget Comparison', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return budget comparison data on successful request', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 1 } });
    (prisma.project.findMany as jest.Mock).mockResolvedValue([
      { 
        projectName: 'Test Project', 
        totalProjectValue: 1000,
        bills: [{ receivedAmount: 500 }],
      }
    ]);

    const request = new NextRequest('http://localhost/api/dashboard/budget-comparison');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([
      {
        name: 'Test Project',
        received: 0.0005,
        remaining: 0.0005,
      }
    ]);
    expect(prisma.project.findMany).toHaveBeenCalled();
  });

  it('should return 401 if user is not authenticated', async () => {
    const { NextResponse } = require('next/server');
    (verifyAuth as jest.Mock).mockResolvedValue(new NextResponse(null, { status: 401 }));

    const request = new NextRequest('http://localhost/api/dashboard/budget-comparison');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});
