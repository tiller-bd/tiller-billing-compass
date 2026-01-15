// src/app/api/dashboard/__tests__/last-received.test.ts
import { GET } from '../last-received/route';
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

describe('Dashboard API - Last Received', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return last received bills on successful request', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 1 } });
    (prisma.projectBill.findMany as jest.Mock).mockResolvedValue([
      { 
        project: { projectName: 'Test Project' },
        receivedAmount: 1000,
        receivedDate: new Date(),
      }
    ]);

    const request = new NextRequest('http://localhost/api/dashboard/last-received');
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

    const request = new NextRequest('http://localhost/api/dashboard/last-received');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});
