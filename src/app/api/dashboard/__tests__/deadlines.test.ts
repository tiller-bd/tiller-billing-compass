// src/app/api/dashboard/__tests__/deadlines.test.ts
import { GET } from '../deadlines/route';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock the dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    projectBill: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  verifyAuth: jest.fn(),
}));

describe('Dashboard API - Deadlines', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return upcoming deadlines on successful request', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 1 } });
    (prisma.projectBill.findMany as jest.Mock).mockResolvedValue([
      { 
        project: { projectName: 'Test Project' },
        billAmount: 1000,
        tentativeBillingDate: new Date(),
      }
    ]);

    const request = new NextRequest('http://localhost/api/dashboard/deadlines');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.length).toBe(1);
    expect(body[0].projectName).toBe('Test Project');
    expect(prisma.projectBill.findMany).toHaveBeenCalled();
  });

  it('should return 401 if user is not authenticated', async () => {
    const { NextResponse } = require('next/server');
    (verifyAuth as jest.Mock).mockResolvedValue(new NextResponse(null, { status: 401 }));

    const request = new NextRequest('http://localhost/api/dashboard/deadlines');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});
