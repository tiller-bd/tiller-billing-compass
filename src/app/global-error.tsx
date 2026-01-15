"use client";

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, sans-serif',
            backgroundColor: '#fafafa',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              padding: '2rem',
              maxWidth: '400px',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              <AlertTriangle
                style={{ width: '40px', height: '40px', color: '#dc2626' }}
              />
            </div>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                color: '#111',
              }}
            >
              Critical Error
            </h1>
            <p
              style={{
                color: '#666',
                marginBottom: '1.5rem',
              }}
            >
              A critical error occurred. Please refresh the page to try again.
            </p>
            <button
              onClick={reset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#111',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              <RefreshCw style={{ width: '16px', height: '16px' }} />
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && error.message && (
              <pre
                style={{
                  marginTop: '2rem',
                  padding: '1rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  textAlign: 'left',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {error.message}
                {error.digest && `\n\nDigest: ${error.digest}`}
              </pre>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
