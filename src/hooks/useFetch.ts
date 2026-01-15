"use client";

import { useState, useCallback } from 'react';
import { ApiClientError, apiFetch } from '@/lib/api-client';
import { ApiErrorCode } from '@/lib/api-error';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: ApiClientError | null;
}

interface UseFetchResult<T> extends FetchState<T> {
  refetch: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
  clearError: () => void;
}

export function useFetch<T>(
  url: string,
  options: {
    immediate?: boolean;
    initialData?: T | null;
    onSuccess?: (data: T) => void;
    onError?: (error: ApiClientError) => void;
  } = {}
): UseFetchResult<T> {
  const { immediate = false, initialData = null, onSuccess, onError } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<ApiClientError | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiFetch<T>(url);
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const apiError = err instanceof ApiClientError
        ? err
        : new ApiClientError(
            err instanceof Error ? err.message : 'An error occurred',
            'INTERNAL_ERROR',
            500
          );
      setError(apiError);
      onError?.(apiError);
    } finally {
      setLoading(false);
    }
  }, [url, onSuccess, onError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { data, loading, error, refetch, setData, clearError };
}

// Hook for multiple fetches with individual loading/error states
export function useMultiFetch<T extends Record<string, unknown>>(
  fetchers: {
    [K in keyof T]: {
      url: string;
      initialData?: T[K] | null;
    };
  }
) {
  type FetcherKey = keyof T;

  const [states, setStates] = useState<{
    [K in FetcherKey]: {
      data: T[K] | null;
      loading: boolean;
      error: ApiClientError | null;
    };
  }>(() => {
    const initial = {} as any;
    for (const key in fetchers) {
      initial[key] = {
        data: fetchers[key].initialData ?? null,
        loading: false,
        error: null,
      };
    }
    return initial;
  });

  const fetchOne = useCallback(async <K extends FetcherKey>(key: K) => {
    setStates(prev => ({
      ...prev,
      [key]: { ...prev[key], loading: true, error: null },
    }));

    try {
      const result = await apiFetch<T[K]>(fetchers[key].url);
      setStates(prev => ({
        ...prev,
        [key]: { data: result, loading: false, error: null },
      }));
      return result;
    } catch (err) {
      const apiError = err instanceof ApiClientError
        ? err
        : new ApiClientError(
            err instanceof Error ? err.message : 'An error occurred',
            'INTERNAL_ERROR',
            500
          );
      setStates(prev => ({
        ...prev,
        [key]: { ...prev[key], loading: false, error: apiError },
      }));
      throw apiError;
    }
  }, [fetchers]);

  const fetchAll = useCallback(async () => {
    const promises = Object.keys(fetchers).map(key =>
      fetchOne(key as FetcherKey).catch(() => null)
    );
    await Promise.all(promises);
  }, [fetchers, fetchOne]);

  return { states, fetchOne, fetchAll };
}

// Simple helper to check if any error is a specific type
export function isErrorCode(error: ApiClientError | null, code: ApiErrorCode): boolean {
  return error?.code === code;
}
