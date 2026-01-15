"use client";

import { AlertTriangle, RefreshCw, WifiOff, Lock, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiErrorCode } from '@/lib/api-error';

interface ErrorDisplayProps {
  error?: Error | null;
  code?: ApiErrorCode;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

const errorIcons: Record<ApiErrorCode, typeof AlertTriangle> = {
  UNAUTHORIZED: Lock,
  FORBIDDEN: Lock,
  NOT_FOUND: AlertTriangle,
  BAD_REQUEST: AlertTriangle,
  VALIDATION_ERROR: AlertTriangle,
  CONFLICT: AlertTriangle,
  DATABASE_ERROR: ServerCrash,
  CONNECTION_ERROR: WifiOff,
  INTERNAL_ERROR: ServerCrash,
};

const errorMessages: Record<ApiErrorCode, string> = {
  UNAUTHORIZED: 'Please log in to continue',
  FORBIDDEN: 'You do not have permission to access this',
  NOT_FOUND: 'The requested resource was not found',
  BAD_REQUEST: 'Invalid request',
  VALIDATION_ERROR: 'Please check your input and try again',
  CONFLICT: 'A conflict occurred with existing data',
  DATABASE_ERROR: 'Database error occurred',
  CONNECTION_ERROR: 'Unable to connect to the server',
  INTERNAL_ERROR: 'An unexpected error occurred',
};

export function ErrorDisplay({
  error,
  code = 'INTERNAL_ERROR',
  message,
  onRetry,
  compact = false,
}: ErrorDisplayProps) {
  const Icon = errorIcons[code] || AlertTriangle;
  const displayMessage = message || error?.message || errorMessages[code];

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <Icon className="h-5 w-5 text-destructive flex-shrink-0" />
        <span className="text-sm text-destructive flex-1">{displayMessage}</span>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="flex-shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <Icon className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">
        {code === 'CONNECTION_ERROR' ? 'Connection Error' : 'Error'}
      </h3>
      <p className="text-muted-foreground mb-4 max-w-md">{displayMessage}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="default" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}

// Empty state component for when there's no data
export function EmptyState({
  title = 'No data found',
  description = 'There is no data to display.',
  icon: Icon = AlertTriangle,
}: {
  title?: string;
  description?: string;
  icon?: typeof AlertTriangle;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md">{description}</p>
    </div>
  );
}
