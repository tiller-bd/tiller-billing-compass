// src/app/api/clients/[id]/__tests__/route.test.ts
import { GET } from '../route';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock the dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    client: {
      findUnique: jest.fn(),
    },
    project: {
      groupBy: jest.fn(),
    }
  },
}));

jest.mock('@/lib/auth', () => ({
  verifyAuth: jest.fn(),
}));

describe('Clients API - GET by id', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a client on successful request', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 1 } });
    const mockClient = { id: 1, name: 'Test Client', projects: [] };
    (prisma.client.findUnique as jest.Mock).mockResolvedValue(mockClient);
    (prisma.project.groupBy as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/clients/1');
    const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.name).toBe('Test Client');
    expect(prisma.client.findUnique).toHaveBeenCalled();
  });

  it('should return 404 if the client is not found', async () => {
    (verifyAuth as jest.Mock).mockResolvedValue({ user: { id: 1 } });
    (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/clients/999');
    const response = await GET(request, { params: Promise.resolve({ id: '999' }) });

    expect(response.status).toBe(404);
  });

  it('should return 401 if user is not authenticated', async () => {
    const { NextResponse } = require('next/server');
    (verifyAuth as jest.Mock).mockResolvedValue(new NextResponse(null, { status: 401 }));

    const request = new NextRequest('http://localhost/api/clients/1');
    const response = await GET(request, { params: Promise.resolve({ id: '1' }) });

    expect(response.status).toBe(401);
  });
});
