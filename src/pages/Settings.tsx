import { useSeoMeta } from '@unhead/react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { EditProfileForm } from '@/components/EditProfileForm';
import { useKeycast } from '@/contexts/KeycastContext';
import { useLoggedInAccounts } from '@/hooks/useLoggedInAccounts';
import { useAuth } from '@/hooks/useAuth';
import { useLookupPubkey, useRegisterName, useCheckNameAvailability, validateName } from '@/hooks/useDivineSpaceName';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Settings as SettingsIcon, Bell, Globe, Check, X, Loader2, ExternalLink } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { useToast } from '@/hooks/useToast';

function ClaimUsernameCard() {
  const { pubkey } = useAuth();
  const { toast } = useToast();
  const [desiredName, setDesiredName] = useState('');
  const { data: existingName, isLoading: lookupLoading, refetch } = useLookupPubkey(pubkey);
  const { data: availability, isLoading: checkingAvailability } = useCheckNameAvailability(desiredName);
  const registerName = useRegisterName();

  const validation = validateName(desiredName);
  const canClaim = desiredName.length >= 3 && validation.valid && availability?.available && !registerName.isPending;

  const handleClaim = async () => {
    if (!pubkey || !canClaim) return;

    try {
      await registerName.mutateAsync({ name: desiredName, pubkey });
      toast({
        title: 'Username claimed!',
        description: `You now own ${desiredName}.divine.space`,
      });
      setDesiredName('');
      refetch();
    } catch (error) {
      toast({
        title: 'Failed to claim username',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  if (lookupLoading) {
    return (
      <Card className="myspace-card">
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Already has a username
  if (existingName?.found && existingName.name) {
    return (
      <Card className="myspace-card border-green-500/30 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-500" />
            Your Divine Space
          </CardTitle>
          <CardDescription>
            You've claimed your personalized subdomain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground mb-1">Your URL</div>
            <a
              href={`https://${existingName.name}.divine.space`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-bold text-primary hover:underline flex items-center gap-2"
            >
              {existingName.name}.divine.space
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground mb-1">NIP-05 Identifier</div>
            <div className="font-mono text-sm">{existingName.nip05}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Claim form
  return (
    <Card className="myspace-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Claim Your Username
        </CardTitle>
        <CardDescription>
          Get your own divine.space subdomain and NIP-05 identifier
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Choose your username</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="username"
                placeholder="yourname"
                value={desiredName}
                onChange={(e) => setDesiredName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                className="pr-10"
              />
              {desiredName.length >= 3 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingAvailability ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : availability?.available ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
            <Button
              onClick={handleClaim}
              disabled={!canClaim}
            >
              {registerName.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Claim'
              )}
            </Button>
          </div>
          {desiredName && !validation.valid && (
            <p className="text-sm text-destructive">{validation.error}</p>
          )}
          {desiredName.length >= 3 && validation.valid && !checkingAvailability && !availability?.available && (
            <p className="text-sm text-destructive">This username is already taken</p>
          )}
        </div>

        {desiredName.length >= 3 && validation.valid && availability?.available && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="text-sm text-muted-foreground mb-2">You'll get:</div>
            <ul className="text-sm space-y-1">
              <li>• <span className="font-mono">{desiredName}.divine.space</span> - your profile URL</li>
              <li>• <span className="font-mono">{desiredName}@divine.space</span> - NIP-05 identifier</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { isAuthenticated: keycastAuth } = useKeycast();
  const { currentUser } = useLoggedInAccounts();

  // Support both Keycast and standard Nostr login
  const isAuthenticated = keycastAuth || !!currentUser;

  useSeoMeta({
    title: 'Settings - DiVine Space',
    description: 'Manage your DiVine Space profile and settings.',
  });

  if (isAuthenticated) {
    return <Navigate to="/studio/page" replace />;
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto text-center myspace-card">
            <CardContent className="py-12">
              <SettingsIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Settings</h2>
              <p className="text-muted-foreground mb-6">
                Log in to access your settings and customize your profile.
              </p>
              <LoginArea className="justify-center" />
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold gradient-text mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Manage your profile and preferences
            </p>
          </div>

          <Tabs defaultValue="profile">
            <TabsList className="bg-muted/50 mb-6">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-2" disabled>
                <SettingsIcon className="h-4 w-4" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2" disabled>
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <ClaimUsernameCard />

              <Card className="myspace-card">
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                  <CardDescription>
                    Update your profile information. This will be published to the Nostr network.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EditProfileForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <SettingsIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Preferences coming soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Notifications coming soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
