'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Error page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>

        <h1 className="text-[22px] font-bold text-slate-900 tracking-[-0.02em] mb-2">Something went wrong</h1>
        <p className="text-[14px] text-slate-500 mb-6 max-w-sm mx-auto">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>

        {error.digest && (
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-3 mb-6">
            <p className="text-[11px] font-mono text-slate-400">Error ID: {error.digest}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-[13px] rounded-xl shadow-sm shadow-indigo-500/25 h-10 px-5"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>

          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-[13px] rounded-xl h-10 px-5"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}