import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { useKeycast } from '@/contexts/KeycastContext';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Callback() {
  const navigate = useNavigate();
  const { handleCallback, isAuthenticated } = useKeycast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useSeoMeta({
    title: 'Signing in... - DiVine Space',
    description: 'Processing your login...',
  });

  useEffect(() => {
    const processCallback = async () => {
      try {
        const success = await handleCallback();
        if (success) {
          setStatus('success');
          // Redirect after a brief delay
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1500);
        } else {
          setStatus('error');
          setError('Failed to complete sign-in. Please try again.');
        }
      } catch (e) {
        setStatus('error');
        setError(e instanceof Error ? e.message : 'An unexpected error occurred');
      }
    };

    processCallback();
  }, [handleCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full myspace-card">
        <CardContent className="py-12 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 mx-auto mb-4 text-primary animate-spin" />
              <h1 className="text-2xl font-bold mb-2">Signing you in...</h1>
              <p className="text-muted-foreground">
                Please wait while we complete your sign-in with DiVine.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
              <p className="text-muted-foreground">
                You've been signed in successfully. Redirecting...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
              <h1 className="text-2xl font-bold mb-2">Sign-in Failed</h1>
              <p className="text-muted-foreground mb-6">
                {error || 'Something went wrong during sign-in.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/">
                  <Button variant="outline">Go Home</Button>
                </Link>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
