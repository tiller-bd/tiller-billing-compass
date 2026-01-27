"use client";

import { ApiErrorResponse, ApiErrorCode } from './api-error';

export class ApiClientError extends Error {
  code: ApiErrorCode;
  status: number;
  details?: string;

  constructor(message: string, code: ApiErrorCode, status: number, details?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type FetchOptions = RequestInit & {
  skipAuthRedirect?: boolean;
};

async function handleResponse<T>(response: Response, skipAuthRedirect: boolean): Promise<T> {
  // Handle 401 Unauthorized - redirect to login
  if (response.status === 401 && !skipAuthRedirect) {
    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_user');
      // Clear the auth cookie
      document.cookie = 'auth_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      // Redirect to login
      window.location.href = '/login';
    }
    throw new ApiClientError('Session expired. Please log in again.', 'UNAUTHORIZED', 401);
  }

  // Try to parse JSON response
  let data: T | ApiErrorResponse;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiClientError(
        `Request failed with status ${response.status}`,
        'INTERNAL_ERROR',
        response.status
      );
    }
    return {} as T;
  }

  // Check if response is an error
  if (!response.ok) {
    const errorData = data as ApiErrorResponse;
    throw new ApiClientError(
      errorData.error || 'An error occurred',
      errorData.code || 'INTERNAL_ERROR',
      response.status,
      errorData.details
    );
  }

  return data as T;
}

export async function apiFetch<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuthRedirect = false, ...fetchOptions } = options;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      credentials: 'include', // Send cookies with requests
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    return await handleResponse<T>(response, skipAuthRedirect);
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiClientError(
        'Network error. Please check your connection.',
        'CONNECTION_ERROR',
        0
      );
    }

    throw new ApiClientError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      'INTERNAL_ERROR',
      500
    );
  }
}

// Convenience methods
export const apiGet = <T>(url: string, options?: FetchOptions) =>
  apiFetch<T>(url, { ...options, method: 'GET' });

export const apiPost = <T>(url: string, body: unknown, options?: FetchOptions) =>
  apiFetch<T>(url, { ...options, method: 'POST', body: JSON.stringify(body) });

export const apiPut = <T>(url: string, body: unknown, options?: FetchOptions) =>
  apiFetch<T>(url, { ...options, method: 'PUT', body: JSON.stringify(body) });

export const apiPatch = <T>(url: string, body: unknown, options?: FetchOptions) =>
  apiFetch<T>(url, { ...options, method: 'PATCH', body: JSON.stringify(body) });

export const apiDelete = <T>(url: string, options?: FetchOptions) =>
  apiFetch<T>(url, { ...options, method: 'DELETE' });
