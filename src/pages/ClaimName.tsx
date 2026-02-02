// ABOUTME: Page shown when visiting an unclaimed subdomain
// ABOUTME: Allows users to claim the subdomain name for their profile

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRegisterName } from '@/hooks/useDivineSpaceName';
import { Sparkles, ExternalLink, CheckCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/useToast';

interface ClaimNameProps {
  subdomain: string;
}

export function ClaimName({ subdomain }: ClaimNameProps) {
  const { pubkey, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const registerName = useRegisterName();
  const [claimed, setClaimed] = useState(false);

  const isLoggedIn = isAuthenticated && !!pubkey;

  const handleClaim = async () => {
    if (!pubkey) {
      toast({
        title: 'Login required',
        description: 'Please log in with Nostr to claim this name.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await registerName.mutateAsync({
        name: subdomain,
        pubkey: pubkey,
      });

      setClaimed(true);
      toast({
        title: 'Name claimed!',
        description: `You now own ${subdomain}.divine.space`,
      });

      // Redirect to the subdomain after a short delay
      setTimeout(() => {
        window.location.href = `https://${subdomain}.divine.space`;
      }, 2000);
    } catch (error) {
      toast({
        title: 'Failed to claim name',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  if (claimed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Congratulations!</CardTitle>
            <CardDescription>
              You've claimed <span className="font-bold text-foreground">{subdomain}.divine.space</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your NIP-05 identifier is now <span className="font-mono text-foreground">{subdomain}@divine.space</span>
            </p>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirecting to your profile...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {subdomain}.divine.space
          </CardTitle>
          <CardDescription>
            This name is available! Claim it for your Nostr profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>By claiming this name, you'll get:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Your own MySpace-style profile at <span className="font-mono">{subdomain}.divine.space</span></li>
              <li>A NIP-05 identifier: <span className="font-mono">{subdomain}@divine.space</span></li>
              <li>Easy sharing with friends</li>
            </ul>
          </div>

          {isLoggedIn ? (
            <Button
              onClick={handleClaim}
              className="w-full"
              size="lg"
              disabled={registerName.isPending}
            >
              {registerName.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Claim This Name
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-center text-sm text-muted-foreground">
                Log in with Nostr to claim this name
              </p>
              <Button
                onClick={() => window.location.href = 'https://divine.space'}
                variant="outline"
                className="w-full"
              >
                Go to Divine Space
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {registerName.isError && (
            <p className="text-sm text-destructive text-center">
              {registerName.error instanceof Error ? registerName.error.message : 'Failed to claim name'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ClaimName;
