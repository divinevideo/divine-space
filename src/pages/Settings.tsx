import { useSeoMeta } from '@unhead/react';
import { Layout } from '@/components/Layout';
import { EditProfileForm } from '@/components/EditProfileForm';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Settings as SettingsIcon, Bell, Shield } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';

export default function Settings() {
  const { user } = useCurrentUser();

  useSeoMeta({
    title: 'Settings - DiVine Space',
    description: 'Manage your DiVine Space profile and settings.',
  });

  if (!user) {
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

            <TabsContent value="profile">
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
