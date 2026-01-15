import { NextResponse } from 'next/server';
import { Prisma } from '../../generated/prisma/client';

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'DATABASE_ERROR'
  | 'CONNECTION_ERROR'
  | 'INTERNAL_ERROR';

export interface ApiErrorResponse {
  error: string;
  code: ApiErrorCode;
  details?: string;
}

export interface ApiSuccessResponse<T> {
  data: T;
  message?: string;
}

const errorStatusMap: Record<ApiErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 422,
  CONFLICT: 409,
  DATABASE_ERROR: 500,
  CONNECTION_ERROR: 503,
  INTERNAL_ERROR: 500,
};

export function apiError(
  message: string,
  code: ApiErrorCode = 'INTERNAL_ERROR',
  details?: string
): NextResponse<ApiErrorResponse> {
  const status = errorStatusMap[code];
  return NextResponse.json(
    { error: message, code, details },
    { status }
  );
}

export function apiSuccess<T>(data: T, message?: string): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ data, message });
}

export function handlePrismaError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error('Database error:', error);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return apiError(
          'A record with this value already exists',
          'CONFLICT',
          `Unique constraint failed on: ${(error.meta?.target as string[])?.join(', ')}`
        );
      case 'P2025':
        return apiError('Record not found', 'NOT_FOUND');
      case 'P2003':
        return apiError('Foreign key constraint failed', 'BAD_REQUEST');
      case 'P2014':
        return apiError('The change you are trying to make would violate a required relation', 'BAD_REQUEST');
      default:
        return apiError(`Database error: ${error.code}`, 'DATABASE_ERROR');
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return apiError(
      'Unable to connect to the database. Please try again later.',
      'CONNECTION_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return apiError(
      'Invalid data provided',
      'VALIDATION_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return apiError('A critical database error occurred', 'DATABASE_ERROR');
  }

  // Handle connection errors (pool exhaustion, timeouts, etc.)
  if (error instanceof Error) {
    if (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('Connection terminated')
    ) {
      return apiError(
        'Unable to connect to the database. Please try again later.',
        'CONNECTION_ERROR'
      );
    }
  }

  return apiError('An unexpected error occurred', 'INTERNAL_ERROR');
}

export function isApiError(response: unknown): response is ApiErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    'code' in response
  );
}
