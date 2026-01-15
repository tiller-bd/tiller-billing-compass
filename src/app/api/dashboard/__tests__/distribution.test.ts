// src/app/api/dashboard/__tests__/distribution.test.ts
import { GET } from '../distribution/route';
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

describe('Dashboard API - Distribution', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return distribution data on successful request', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 1 } });
    (prisma.project.findMany as jest.Mock).mockResolvedValue([
      { 
        category: { name: 'Software' },
      },
      { 
        category: { name: 'Hardware' },
      },
      { 
        category: { name: 'Software' },
      }
    ]);

    const request = new NextRequest('http://localhost/api/dashboard/distribution');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([
      { name: 'Software', value: 2, color: 'hsl(173, 80%, 36%)' },
      { name: 'Hardware', value: 1, color: 'hsl(190, 70%, 40%)' },
    ]);
    expect(prisma.project.findMany).toHaveBeenCalled();
  });

  it('should return 401 if user is not authenticated', async () => {
    const { NextResponse } = require('next/server');
    (verifyAuth as jest.Mock).mockResolvedValue(new NextResponse(null, { status: 401 }));

    const request = new NextRequest('http://localhost/api/dashboard/distribution');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});
