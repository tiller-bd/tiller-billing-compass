// src/app/api/bills/__tests__/route.test.ts
import { GET } from '../route';
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

describe('Bills API - GET', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a list of bills on successful request', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 1 } });
    (prisma.projectBill.findMany as jest.Mock).mockResolvedValue([{ id: 1, billName: 'Test Bill' }]);

    const request = new NextRequest('http://localhost/api/bills');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([{ id: 1, billName: 'Test Bill' }]);
    expect(prisma.projectBill.findMany).toHaveBeenCalled();
  });

  it('should correctly filter bills by status', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 1 } });
    (prisma.projectBill.findMany as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/bills?status=PAID');
    await GET(request);

    expect(prisma.projectBill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'PAID',
        }),
      })
    );
  });

  it('should correctly filter bills by departmentId', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 1 } });
    (prisma.projectBill.findMany as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/bills?departmentId=1');
    await GET(request);

    expect(prisma.projectBill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          project: expect.objectContaining({
            departmentId: 1,
          }),
        }),
      })
    );
  });

  it('should correctly filter bills by year', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 1 } });
    (prisma.projectBill.findMany as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/bills?year=2024');
    await GET(request);

    expect(prisma.projectBill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tentativeBillingDate: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-12-31'),
          },
        }),
      })
    );
  });

  it('should correctly filter bills by search term', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 1 } });
    (prisma.projectBill.findMany as jest.Mock).mockResolvedValue([]);
    
    const request = new NextRequest('http://localhost/api/bills?search=test');
    await GET(request);
    
    expect(prisma.projectBill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.any(Array),
        }),
      })
    );
  });

  it('should return 401 if user is not authenticated', async () => {
    const { NextResponse } = require('next/server');
    (verifyAuth as jest.Mock).mockResolvedValue(new NextResponse(null, { status: 401 }));

    const request = new NextRequest('http://localhost/api/bills');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});
