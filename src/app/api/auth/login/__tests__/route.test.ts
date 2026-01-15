// src/app/api/auth/login/__tests__/route.test.ts
import { POST } from '../route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

// Mock the dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

const set = jest.fn();
jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    set,
  })),
}));

import { cookies } from 'next/headers';

describe('Login API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and user data on successful login', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password_hash: 'hashed_password',
      is_active: true,
    };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.user).toEqual({ id: 1, email: 'test@example.com', is_active: true });
    expect(set).toHaveBeenCalled();
  });

  it('should return 401 for invalid credentials', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password_hash: 'hashed_password',
      is_active: true,
    };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'wrong_password' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid credentials');
  });

  it('should return 401 for a non-existent user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@example.com', password: 'password' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid or inactive account');
  });

  it('should return 401 for an inactive user', async () => {
    const mockUser = {
      id: 1,
      email: 'inactive@example.com',
      password_hash: 'hashed_password',
      is_active: false,
    };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'inactive@example.com', password: 'password' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid or inactive account');
  });

  it('should return 500 for a server error', async () => {
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Server error');
  });
});
