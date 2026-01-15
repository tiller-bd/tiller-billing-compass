// src/app/api/clients/__tests__/route.test.ts
import { GET, POST } from '../route';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock the dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    client: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  verifyAuth: jest.fn(),
}));

describe('Clients API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a list of clients on successful request', async () => {
      (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 1 } });
      (prisma.client.findMany as jest.Mock).mockResolvedValue([{ id: 1, name: 'Test Client', projects: [] }]);

      const request = new NextRequest('http://localhost/api/clients');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual([{ id: 1, name: 'Test Client', projects: [], projectCount: 0, totalBudget: 0, totalDue: 0, totalReceived: 0, realizationRate: 0 }]);
      expect(prisma.client.findMany).toHaveBeenCalled();
    });

    it('should correctly filter clients by search term', async () => {
      (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 1 } });
      (prisma.client.findMany as jest.Mock).mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/clients?search=test');
      await GET(request);

      expect(prisma.client.findMany).toHaveBeenCalledWith(
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
      
      const request = new NextRequest('http://localhost/api/clients');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe('POST', () => {
    it('should create a new client and return it', async () => {
      (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 1 } });
      const newClient = { name: 'New Client', contactPerson: 'John Doe' };
      (prisma.client.create as jest.Mock).mockResolvedValue({ id: 1, ...newClient });

      const request = new NextRequest('http://localhost/api/clients', {
        method: 'POST',
        body: JSON.stringify(newClient),
      });
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body).toEqual({ id: 1, ...newClient });
      expect(prisma.client.create).toHaveBeenCalledWith({ data: newClient });
    });

    it('should return 400 if name is missing', async () => {
      (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 1 } });

      const request = new NextRequest('http://localhost/api/clients', {
        method: 'POST',
        body: JSON.stringify({ contactPerson: 'John Doe' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 if client with the same name already exists', async () => {
        (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 1 } });
        (prisma.client.create as jest.Mock).mockRejectedValue({ code: 'P2002' });
  
        const request = new NextRequest('http://localhost/api/clients', {
          method: 'POST',
          body: JSON.stringify({ name: 'Existing Client' }),
        });
        const response = await POST(request);
  
        expect(response.status).toBe(400);
      });

    it('should return 401 if user is not authenticated', async () => {
      const { NextResponse } = require('next/server');
      (verifyAuth as jest.Mock).mockResolvedValue(new NextResponse(null, { status: 401 }));
      
      const request = new NextRequest('http://localhost/api/clients', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Client' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });
});
