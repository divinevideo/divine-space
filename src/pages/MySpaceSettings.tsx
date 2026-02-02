import { useState, useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Layout } from '@/components/Layout';
import { useKeycast } from '@/contexts/KeycastContext';
import { useLoggedInAccounts } from '@/hooks/useLoggedInAccounts';
import {
  useMySpaceProfile,
  useUpdateMySpaceProfile,
  useAddTopFriend,
  useRemoveTopFriend,
  useReorderTopFriends,
  MYSPACE_THEMES,
  type MySpaceProfileData,
  type ThemeId
} from '@/hooks/useMySpaceProfile';
import { useDivineUserFollowing } from '@/hooks/useDivineUser';
import { useAuthor } from '@/hooks/useAuthor';
import { MOOD_OPTIONS } from '@/components/ProfileWidgets';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Music,
  Palette,
  Sparkles,
  Save,
  Loader2,
  X,
  Plus,
  GripVertical,
  Crown,
  Quote,
  Smile,
  MessageSquare,
  Image,
  Upload,
  Search,
  ExternalLink,
  Play,
  Globe,
  CheckCircle,
  AlertCircle,
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useUploadFile } from '@/hooks/useUploadFile';
import { cn } from '@/lib/utils';
import { nip19 } from 'nostr-tools';
import { LoginArea } from '@/components/auth/LoginArea';
import { useRegisterName, useLookupPubkey, useCheckNameAvailability, validateName } from '@/hooks/useDivineSpaceName';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function MySpaceSettings() {
  const { pubkey: keycastPubkey, isAuthenticated: keycastAuth } = useKeycast();
  const { currentUser } = useLoggedInAccounts();
  const { toast } = useToast();

  // Support both Keycast and standard Nostr login
  const isAuthenticated = keycastAuth || !!currentUser;
  const pubkey = keycastPubkey ?? currentUser?.pubkey;

  useSeoMeta({
    title: 'Customize Profile - DiVine Space',
    description: 'Customize your MySpace-style profile on DiVine Space.',
  });

  if (!isAuthenticated || !pubkey) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto text-center myspace-card">
            <CardContent className="py-12">
              <Palette className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Customize Your Space</h2>
              <p className="text-muted-foreground mb-6">
                Log in to customize your profile with themes, music, and more!
              </p>
              <LoginArea className="justify-center" />
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return <MySpaceSettingsContent pubkey={pubkey} />;
}

function MySpaceSettingsContent({ pubkey }: { pubkey: string }) {
  const { data: profile, isLoading } = useMySpaceProfile(pubkey);
  const { mutate: updateProfile, isPending: isSaving } = useUpdateMySpaceProfile();
  const { toast } = useToast();

  // Local state for form
  const [theme, setTheme] = useState<ThemeId>('default');
  const [musicUrl, setMusicUrl] = useState('');
  const [musicTitle, setMusicTitle] = useState('');
  const [musicArtist, setMusicArtist] = useState('');
  const [autoplay, setAutoplay] = useState(false);
  const [moodText, setMoodText] = useState('');
  const [moodEmoji, setMoodEmoji] = useState('');
  const [status, setStatus] = useState('');
  const [quote, setQuote] = useState('');
  const [background, setBackground] = useState('');

  // Initialize form from profile data
  useEffect(() => {
    if (profile) {
      setTheme(profile.theme || 'default');
      setMusicUrl(profile.music?.url || '');
      setMusicTitle(profile.music?.title || '');
      setMusicArtist(profile.music?.artist || '');
      setAutoplay(profile.autoplay || false);
      setMoodText(profile.mood?.text || '');
      setMoodEmoji(profile.mood?.emoji || '');
      setStatus(profile.status || '');
      setQuote(profile.quote || '');
      setBackground(profile.background || '');
    }
  }, [profile]);

  const handleSave = () => {
    const data: Partial<MySpaceProfileData> = {
      theme,
      autoplay,
      topFriends: profile?.topFriends || [],
    };

    if (musicUrl) {
      data.music = {
        url: musicUrl,
        title: musicTitle || undefined,
        artist: musicArtist || undefined,
      };
    }

    if (moodText) {
      data.mood = {
        text: moodText,
        emoji: moodEmoji || undefined,
      };
    }

    if (status) {
      data.status = status;
    }

    if (quote) {
      data.quote = quote;
    }

    if (background) {
      data.background = background;
    }

    updateProfile(data, {
      onSuccess: () => {
        toast({ title: 'Profile customization saved!' });
      },
      onError: (error) => {
        toast({ 
          title: 'Failed to save', 
          description: error.message,
          variant: 'destructive' 
        });
      },
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">
            <Sparkles className="inline h-8 w-8 mr-2" />
            Customize Your Space
          </h1>
          <p className="text-muted-foreground">
            Make your profile uniquely yours - just like the good old MySpace days!
          </p>
        </div>

        <Tabs defaultValue="theme">
          <TabsList className="bg-muted/50 mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="theme" className="gap-2">
              <Palette className="h-4 w-4" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="music" className="gap-2">
              <Music className="h-4 w-4" />
              Music
            </TabsTrigger>
            <TabsTrigger value="friends" className="gap-2">
              <Users className="h-4 w-4" />
              Top 8
            </TabsTrigger>
            <TabsTrigger value="mood" className="gap-2">
              <Smile className="h-4 w-4" />
              Mood & Status
            </TabsTrigger>
            <TabsTrigger value="domain" className="gap-2">
              <Globe className="h-4 w-4" />
              Domain
            </TabsTrigger>
          </TabsList>

          {/* Theme Selection */}
          <TabsContent value="theme">
            <Card className="myspace-card">
              <CardHeader>
                <CardTitle>Profile Theme</CardTitle>
                <CardDescription>
                  Choose a theme to express your style
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {MYSPACE_THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={cn(
                        "p-4 rounded-lg border-2 text-left transition-all hover:scale-105",
                        theme === t.id 
                          ? "border-primary bg-primary/10" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className={cn(
                        "h-12 w-full rounded mb-2",
                        t.id === 'default' && "animated-gradient",
                        t.id === 'scene' && "bg-gradient-to-r from-pink-600 to-black",
                        t.id === 'y2k' && "bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-yellow-400",
                        t.id === 'gothic' && "bg-gradient-to-r from-purple-900 to-red-900",
                        t.id === 'kawaii' && "bg-gradient-to-r from-pink-300 via-purple-300 to-cyan-300",
                        t.id === 'neon' && "bg-gradient-to-r from-cyan-500 via-pink-500 to-yellow-500",
                        t.id === 'retro' && "bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500",
                        t.id === 'space' && "bg-gradient-to-r from-violet-600 via-blue-600 to-purple-600 stars-bg",
                      )} />
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="background">Custom Background Image URL</Label>
                    <Input
                      id="background"
                      value={background}
                      onChange={(e) => setBackground(e.target.value)}
                      placeholder="https://example.com/my-background.jpg"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Add a custom background image to your profile
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Music Settings */}
          <TabsContent value="music">
            <MusicSettingsTab
              musicUrl={musicUrl}
              setMusicUrl={setMusicUrl}
              musicTitle={musicTitle}
              setMusicTitle={setMusicTitle}
              musicArtist={musicArtist}
              setMusicArtist={setMusicArtist}
              autoplay={autoplay}
              setAutoplay={setAutoplay}
            />
          </TabsContent>

          {/* Top 8 Friends */}
          <TabsContent value="friends">
            <Top8FriendsEditor pubkey={pubkey} profile={profile} />
          </TabsContent>

          {/* Mood & Status */}
          <TabsContent value="mood">
            <Card className="myspace-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smile className="h-5 w-5 text-yellow-500" />
                  Mood & Status
                </CardTitle>
                <CardDescription>
                  Let everyone know how you're feeling
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mood */}
                <div>
                  <Label>Current Mood</Label>
                  <div className="flex flex-wrap gap-2 mt-2 mb-3">
                    {MOOD_OPTIONS.map((mood) => (
                      <button
                        key={mood.emoji}
                        onClick={() => {
                          setMoodEmoji(mood.emoji);
                          setMoodText(mood.label);
                        }}
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm transition-all",
                          moodEmoji === mood.emoji
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        {mood.emoji} {mood.label}
                      </button>
                    ))}
                  </div>
                  <Input
                    value={moodText}
                    onChange={(e) => setMoodText(e.target.value)}
                    placeholder="Or type your own mood..."
                    className="mt-2"
                  />
                </div>

                {/* Status */}
                <div>
                  <Label htmlFor="status">Status Message</Label>
                  <Input
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    placeholder="What's on your mind?"
                    className="mt-1"
                  />
                </div>

                {/* Quote */}
                <div>
                  <Label htmlFor="quote" className="flex items-center gap-2">
                    <Quote className="h-4 w-4" />
                    Profile Quote / Lyrics
                  </Label>
                  <Textarea
                    id="quote"
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    placeholder="Your favorite quote, song lyrics, or life motto..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Domain Settings */}
          <TabsContent value="domain">
            <DomainSettingsTab pubkey={pubkey} />
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            size="lg"
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}

// Top 8 Friends Editor Component
function Top8FriendsEditor({ pubkey, profile }: { pubkey: string; profile: MySpaceProfileData | null | undefined }) {
  const { data: following, isLoading: followingLoading } = useDivineUserFollowing(pubkey);
  const { mutate: addFriend, isPending: isAdding } = useAddTopFriend();
  const { mutate: removeFriend, isPending: isRemoving } = useRemoveTopFriend();
  const { toast } = useToast();

  const topFriends = profile?.topFriends || [];
  const topFriendPubkeys = new Set(topFriends.map(f => f.pubkey));

  // Get available friends (following but not in top 8)
  const availableFriends = (following?.pubkeys || []).filter(pk => !topFriendPubkeys.has(pk));

  const handleAddFriend = (friendPubkey: string) => {
    addFriend(friendPubkey, {
      onSuccess: () => {
        toast({ title: 'Friend added to Top 8!' });
      },
      onError: (error) => {
        toast({ 
          title: 'Could not add friend', 
          description: error.message,
          variant: 'destructive' 
        });
      },
    });
  };

  const handleRemoveFriend = (friendPubkey: string) => {
    removeFriend(friendPubkey, {
      onSuccess: () => {
        toast({ title: 'Friend removed from Top 8' });
      },
      onError: (error) => {
        toast({ 
          title: 'Could not remove friend', 
          description: error.message,
          variant: 'destructive' 
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Current Top 8 */}
      <Card className="myspace-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-pink-500" />
            Your Top 8
          </CardTitle>
          <CardDescription>
            Drag to reorder, click X to remove
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topFriends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No friends in your Top 8 yet!</p>
              <p className="text-sm">Add friends from the list below</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {topFriends.map((friend, index) => (
                <TopFriendSlot 
                  key={friend.pubkey}
                  pubkey={friend.pubkey}
                  position={index + 1}
                  onRemove={() => handleRemoveFriend(friend.pubkey)}
                  isRemoving={isRemoving}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Friends */}
      <Card className="myspace-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-500" />
            Add to Top 8
          </CardTitle>
          <CardDescription>
            Select from people you follow ({availableFriends.length} available)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {followingLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : availableFriends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No more friends to add</p>
              <p className="text-sm">Follow more people to add them to your Top 8!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
              {availableFriends.slice(0, 20).map((pk) => (
                <AddFriendCard 
                  key={pk}
                  pubkey={pk}
                  onAdd={() => handleAddFriend(pk)}
                  disabled={topFriends.length >= 8 || isAdding}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TopFriendSlot({ pubkey, position, onRemove, isRemoving }: { 
  pubkey: string; 
  position: number; 
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const { data: author } = useAuthor(pubkey);
  const metadata = author?.metadata;

  return (
    <div className="relative group">
      <div className="p-3 rounded-lg bg-muted/50 text-center">
        {position === 1 && (
          <Crown className="absolute -top-2 -right-2 h-5 w-5 text-yellow-500 fill-yellow-500" />
        )}
        <Avatar className="h-12 w-12 mx-auto mb-2">
          <AvatarImage src={metadata?.picture} />
          <AvatarFallback>{(metadata?.name || 'A')[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <p className="text-xs truncate">{metadata?.display_name || metadata?.name || 'Anonymous'}</p>
        <Badge variant="secondary" className="text-[10px] mt-1">#{position}</Badge>
      </div>
      <button
        onClick={onRemove}
        disabled={isRemoving}
        className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

function AddFriendCard({ pubkey, onAdd, disabled }: {
  pubkey: string;
  onAdd: () => void;
  disabled: boolean;
}) {
  const { data: author } = useAuthor(pubkey);
  const metadata = author?.metadata;

  return (
    <button
      onClick={onAdd}
      disabled={disabled}
      className={cn(
        "p-3 rounded-lg border text-center transition-all hover:border-primary",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <Avatar className="h-10 w-10 mx-auto mb-2">
        <AvatarImage src={metadata?.picture} />
        <AvatarFallback>{(metadata?.name || 'A')[0].toUpperCase()}</AvatarFallback>
      </Avatar>
      <p className="text-xs truncate">{metadata?.display_name || metadata?.name || 'Anonymous'}</p>
      <Plus className="h-4 w-4 mx-auto mt-1 text-green-500" />
    </button>
  );
}

// Music Settings Tab with Upload and Search
function MusicSettingsTab({
  musicUrl,
  setMusicUrl,
  musicTitle,
  setMusicTitle,
  musicArtist,
  setMusicArtist,
  autoplay,
  setAutoplay,
}: {
  musicUrl: string;
  setMusicUrl: (url: string) => void;
  musicTitle: string;
  setMusicTitle: (title: string) => void;
  musicArtist: string;
  setMusicArtist: (artist: string) => void;
  autoplay: boolean;
  setAutoplay: (autoplay: boolean) => void;
}) {
  const { toast } = useToast();
  const { mutate: uploadFile, isPending: isUploading } = useUploadFile();
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WavlakeTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate audio file
    if (!file.type.startsWith('audio/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an audio file (MP3, WAV, OGG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an audio file under 50MB',
        variant: 'destructive',
      });
      return;
    }

    uploadFile(file, {
      onSuccess: (tags) => {
        // Find the URL from the returned tags
        const urlTag = tags.find(t => t[0] === 'url');
        if (urlTag) {
          setMusicUrl(urlTag[1]);
          // Try to extract title from filename
          const fileName = file.name.replace(/\.[^/.]+$/, '');
          if (!musicTitle) {
            setMusicTitle(fileName);
          }
          toast({ title: 'Audio uploaded successfully!' });
        }
      },
      onError: (error) => {
        toast({
          title: 'Upload failed',
          description: error.message,
          variant: 'destructive',
        });
      },
    });

    // Reset the input
    event.target.value = '';
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Search Wavlake API
      const response = await fetch(
        `https://api.wavlake.com/v1/search?query=${encodeURIComponent(searchQuery)}&type=track&limit=10`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.tracks || data.data || []);
      }
    } catch {
      // Fallback: show example tracks
      toast({
        title: 'Search unavailable',
        description: 'Try entering a direct Wavlake or audio URL instead',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const selectTrack = (track: WavlakeTrack) => {
    setMusicUrl(track.mediaUrl || `https://wavlake.com/track/${track.id}`);
    setMusicTitle(track.title);
    setMusicArtist(track.artist?.name || track.artistName || '');
    setShowSearchDialog(false);
    toast({ title: `Selected: ${track.title}` });
  };

  return (
    <Card className="myspace-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" />
          Profile Song
        </CardTitle>
        <CardDescription>
          Add a song that plays when people visit your profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload and Search Buttons */}
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            className="gap-2 flex-1"
            disabled={isUploading}
            onClick={() => document.getElementById('audio-upload')?.click()}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isUploading ? 'Uploading...' : 'Upload Audio'}
          </Button>
          <input
            id="audio-upload"
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="outline"
            className="gap-2 flex-1"
            onClick={() => setShowSearchDialog(true)}
          >
            <Search className="h-4 w-4" />
            Browse Wavlake
          </Button>
        </div>

        <div className="relative">
          <Label htmlFor="musicUrl">Song URL</Label>
          <Input
            id="musicUrl"
            value={musicUrl}
            onChange={(e) => setMusicUrl(e.target.value)}
            placeholder="https://wavlake.com/track/... or direct audio URL"
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Upload an audio file, search Wavlake, or paste a direct audio URL
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="musicTitle">Song Title</Label>
            <Input
              id="musicTitle"
              value={musicTitle}
              onChange={(e) => setMusicTitle(e.target.value)}
              placeholder="Bohemian Rhapsody"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="musicArtist">Artist</Label>
            <Input
              id="musicArtist"
              value={musicArtist}
              onChange={(e) => setMusicArtist(e.target.value)}
              placeholder="Queen"
              className="mt-1"
            />
          </div>
        </div>

        {/* Preview player if URL is set */}
        {musicUrl && (
          <div className="p-4 rounded-lg bg-muted/50">
            <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
            <audio
              src={musicUrl}
              controls
              className="w-full h-10"
              onError={() => {
                toast({
                  title: 'Could not load audio',
                  description: 'The URL may be invalid or not a direct audio link',
                  variant: 'destructive',
                });
              }}
            />
          </div>
        )}

        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div>
            <Label htmlFor="autoplay" className="font-medium">Auto-play on visit</Label>
            <p className="text-xs text-muted-foreground">
              Play music automatically when someone visits your profile
            </p>
          </div>
          <Switch
            id="autoplay"
            checked={autoplay}
            onCheckedChange={setAutoplay}
          />
        </div>
      </CardContent>

      {/* Wavlake Search Dialog */}
      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Browse Wavlake Music
            </DialogTitle>
            <DialogDescription>
              Search for music on Wavlake - Bitcoin's music streaming platform
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search for songs or artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Popular/Featured tracks suggestion */}
            {searchResults.length === 0 && !isSearching && (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Search for songs on Wavlake</p>
                <p className="text-sm mt-1">
                  Or visit{' '}
                  <a
                    href="https://wavlake.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    wavlake.com <ExternalLink className="h-3 w-3" />
                  </a>{' '}
                  to browse and copy a track URL
                </p>
              </div>
            )}

            {/* Search results */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchResults.map((track) => (
                <button
                  key={track.id}
                  onClick={() => selectTrack(track)}
                  className="w-full p-3 rounded-lg border hover:border-primary hover:bg-muted/50 transition-all text-left flex items-center gap-3"
                >
                  {track.artworkUrl ? (
                    <img
                      src={track.artworkUrl}
                      alt={track.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                      <Music className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{track.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {track.artist?.name || track.artistName}
                    </p>
                  </div>
                  <Play className="h-5 w-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Wavlake track type
interface WavlakeTrack {
  id: string;
  title: string;
  artist?: { name: string };
  artistName?: string;
  artworkUrl?: string;
  mediaUrl?: string;
}

// Domain Settings Tab Component
function DomainSettingsTab({ pubkey }: { pubkey: string }) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Check if user already has a registered name
  const { data: existingName, isLoading: loadingExisting } = useLookupPubkey(pubkey);

  // Check name availability as user types (debounced)
  const [debouncedName, setDebouncedName] = useState('');
  const { data: availability, isLoading: checkingAvailability } = useCheckNameAvailability(debouncedName);

  // Register name mutation
  const registerName = useRegisterName();

  // Debounce name input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (name.length >= 3) {
        setDebouncedName(name.toLowerCase());
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [name]);

  // Validate name format
  const validation = validateName(name);

  // Determine availability status
  const showAvailability = name.length >= 3 && debouncedName === name.toLowerCase();
  const isAvailable = showAvailability && availability?.available;
  const isUnavailable = showAvailability && availability && !availability.available;

  const handleRegister = async () => {
    if (!validation.valid) {
      toast({
        title: 'Invalid name',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await registerName.mutateAsync({
        name: name.toLowerCase(),
        pubkey,
      });

      toast({
        title: 'Name registered!',
        description: `You now own ${result.subdomain}`,
      });

      // Clear the input
      setName('');
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  if (loadingExisting) {
    return (
      <Card className="myspace-card">
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  // If user already has a name registered
  if (existingName?.found && existingName.name) {
    return (
      <Card className="myspace-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Your Domain
          </CardTitle>
          <CardDescription>
            Your divine.space subdomain and NIP-05 identifier
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">Domain Registered</span>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Your Profile URL</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 px-3 py-2 bg-background rounded border text-sm">
                    https://{existingName.name}.divine.space
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(`https://${existingName.name}.divine.space`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(`https://${existingName.name}.divine.space`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">NIP-05 Identifier</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 px-3 py-2 bg-background rounded border text-sm">
                    {existingName.name}@divine.space
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(`${existingName.name}@divine.space`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Add this to your Nostr profile to verify your identity
                </p>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Share your profile URL with friends, or add the NIP-05 identifier to your Nostr profile settings to get a verified badge.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Registration form for users without a name
  return (
    <Card className="myspace-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Claim Your Domain
        </CardTitle>
        <CardDescription>
          Get your own subdomain and NIP-05 identifier at divine.space
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <p className="text-sm">By registering a name, you'll get:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Your own profile URL: <span className="font-mono text-foreground">yourname.divine.space</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              A NIP-05 identifier: <span className="font-mono text-foreground">yourname@divine.space</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Easy sharing with friends
            </li>
          </ul>
        </div>

        <div>
          <Label htmlFor="name">Choose Your Name</Label>
          <div className="flex gap-2 mt-1">
            <div className="relative flex-1">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="yourname"
                className={cn(
                  "pr-10",
                  isAvailable && "border-green-500 focus-visible:ring-green-500",
                  isUnavailable && "border-destructive focus-visible:ring-destructive"
                )}
              />
              {checkingAvailability && name.length >= 3 && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {isAvailable && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
              {isUnavailable && (
                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
              )}
            </div>
            <Button
              onClick={handleRegister}
              disabled={!isAvailable || registerName.isPending}
            >
              {registerName.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Claim'
              )}
            </Button>
          </div>

          <div className="mt-2 text-xs">
            {!validation.valid && name.length > 0 && (
              <p className="text-destructive">{validation.error}</p>
            )}
            {isAvailable && (
              <p className="text-green-500">
                {name}.divine.space is available!
              </p>
            )}
            {isUnavailable && (
              <p className="text-destructive">
                This name is already taken
              </p>
            )}
            {name.length === 0 && (
              <p className="text-muted-foreground">
                3-30 characters, letters, numbers, underscores, and hyphens only
              </p>
            )}
          </div>
        </div>

        {name.length >= 3 && isAvailable && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm font-medium mb-2">Preview:</p>
            <div className="space-y-1 text-sm">
              <p>Profile URL: <span className="font-mono">https://{name}.divine.space</span></p>
              <p>NIP-05: <span className="font-mono">{name}@divine.space</span></p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
