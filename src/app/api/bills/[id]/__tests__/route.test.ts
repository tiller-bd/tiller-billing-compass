// src/app/api/bills/[id]/__tests__/route.test.ts
import { PATCH } from '../route';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock the dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    projectBill: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  verifyAuth: jest.fn(),
}));

describe('Bills API - PATCH', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update a bill and return it', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 1 } });
    const mockBill = { id: 1, billAmount: 1000, status: 'PENDING' };
    (prisma.projectBill.findUnique as jest.Mock).mockResolvedValue(mockBill);
    (prisma.projectBill.update as jest.Mock).mockResolvedValue({ ...mockBill, status: 'PARTIAL', receivedAmount: 500 });

    const request = new NextRequest('http://localhost/api/bills/1', {
      method: 'PATCH',
      body: JSON.stringify({ receivedAmount: 500 }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('PARTIAL');
    expect(body.receivedAmount).toBe(500);
    expect(prisma.projectBill.update).toHaveBeenCalled();
  });

  it('should return 404 if the bill is not found', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 1 } });
    (prisma.projectBill.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/bills/999', {
      method: 'PATCH',
      body: JSON.stringify({ receivedAmount: 500 }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: '999' }) });

    expect(response.status).toBe(404);
  });

  it('should return 401 if user is not authenticated', async () => {
    const { NextResponse } = require('next/server');
    (verifyAuth as jest.Mock).mockResolvedValue(new NextResponse(null, { status: 401 }));

    const request = new NextRequest('http://localhost/api/bills/1', {
      method: 'PATCH',
      body: JSON.stringify({ receivedAmount: 500 }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });

    expect(response.status).toBe(401);
  });

  it('should update status to PAID when fully paid', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 1 } });
    const mockBill = { id: 1, billAmount: 1000, status: 'PENDING' };
    (prisma.projectBill.findUnique as jest.Mock).mockResolvedValue(mockBill);
    (prisma.projectBill.update as jest.Mock).mockResolvedValue({ ...mockBill, status: 'PAID', receivedAmount: 1000 });

    const request = new NextRequest('http://localhost/api/bills/1', {
      method: 'PATCH',
      body: JSON.stringify({ receivedAmount: 1000, receivedDate: '2024-01-01' }),
    });
    await PATCH(request, { params: Promise.resolve({ id: '1' }) });
    
    expect(prisma.projectBill.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { receivedAmount: 1000, receivedDate: new Date('2024-01-01'), status: 'PAID' },
    });
  });

  it('should update status to PARTIAL when partially paid', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 1 } });
    const mockBill = { id: 1, billAmount: 1000, status: 'PENDING' };
    (prisma.projectBill.findUnique as jest.Mock).mockResolvedValue(mockBill);
    (prisma.projectBill.update as jest.Mock).mockResolvedValue({ ...mockBill, status: 'PARTIAL', receivedAmount: 500 });
    
    const request = new NextRequest('http://localhost/api/bills/1', {
      method: 'PATCH',
      body: JSON.stringify({ receivedAmount: 500, receivedDate: '2024-01-01' }),
    });
    await PATCH(request, { params: Promise.resolve({ id: '1' }) });
    
    expect(prisma.projectBill.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { receivedAmount: 500, receivedDate: new Date('2024-01-01'), status: 'PARTIAL' },
    });
  });

  it('should update status to PENDING when payment is 0 or less', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 1 } });
    const mockBill = { id: 1, billAmount: 1000, status: 'PARTIAL' };
    (prisma.projectBill.findUnique as jest.Mock).mockResolvedValue(mockBill);
    (prisma.projectBill.update as jest.Mock).mockResolvedValue({ ...mockBill, status: 'PENDING', receivedAmount: 0 });
    
    const request = new NextRequest('http://localhost/api/bills/1', {
      method: 'PATCH',
      body: JSON.stringify({ receivedAmount: 0 }),
    });
    await PATCH(request, { params: Promise.resolve({ id: '1' }) });
    
    expect(prisma.projectBill.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { receivedAmount: 0, receivedDate: null, status: 'PENDING' },
    });
  });
});
