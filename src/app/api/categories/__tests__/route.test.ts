// src/app/api/categories/__tests__/route.test.ts
import { GET } from '../route';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock the dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    projectCategory: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  verifyAuth: jest.fn(),
}));

describe('Categories API - GET', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a list of categories on successful request', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 1 } });
    (prisma.projectCategory.findMany as jest.Mock).mockResolvedValue([{ id: 1, name: 'Test Category' }]);

    const request = new NextRequest('http://localhost/api/categories');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([{ id: 1, name: 'Test Category' }]);
    expect(prisma.projectCategory.findMany).toHaveBeenCalled();
  });

  it('should return 401 if user is not authenticated', async () => {
    const { NextResponse } = require('next/server');
    (verifyAuth as jest.Mock).mockResolvedValue(new NextResponse(null, { status: 401 }));

    const response = await GET();

    expect(response.status).toBe(401);
  });
});
