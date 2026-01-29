"use client";

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProjectDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Project detail page error:', error);
  }, [error]);

  return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="rounded-full bg-destructive/10 p-6 mb-6">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Failed to load project details</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          There was a problem loading the project information. The project may not exist or there could be a connection issue.
        </p>
        <div className="flex gap-4">
          <Button onClick={reset} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button onClick={() => window.location.href = '/projects'} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
  );
}
