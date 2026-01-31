import { useSeoMeta } from '@unhead/react';
import { useSearchParams, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { VideoCard, VideoCardSkeleton } from '@/components/VideoCard';
import { useDivineSearch, useDivineProfileSearch, useDivineHashtags } from '@/hooks/useDivineSearch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search as SearchIcon, Video, User, Hash, X } from 'lucide-react';
import { useState, useEffect, FormEvent } from 'react';
import { nip19 } from 'nostr-tools';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialTag = searchParams.get('tag') || '';
  
  const [query, setQuery] = useState(initialQuery || initialTag);
  const [activeTab, setActiveTab] = useState<'videos' | 'people'>('videos');

  useSeoMeta({
    title: query ? `Search: ${query} - DiVine Space` : 'Search - DiVine Space',
    description: 'Search for videos and creators on DiVine Space.',
  });

  const { data: videos, isLoading: videosLoading } = useDivineSearch({
    q: initialQuery || undefined,
    tag: initialTag || undefined,
    enabled: !!(initialQuery || initialTag),
  });

  const { data: profiles, isLoading: profilesLoading } = useDivineProfileSearch(
    initialQuery || undefined,
    { enabled: !!initialQuery && activeTab === 'people' }
  );

  const { data: popularHashtags } = useDivineHashtags();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Check if it starts with # for tag search
      if (query.startsWith('#')) {
        setSearchParams({ tag: query.slice(1) });
      } else {
        setSearchParams({ q: query.trim() });
      }
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSearchParams({});
  };

  useEffect(() => {
    if (initialQuery || initialTag) {
      setQuery(initialQuery || initialTag);
    }
  }, [initialQuery, initialTag]);

  const hasResults = initialQuery || initialTag;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="max-w-2xl mx-auto mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-4 text-center">
            Search DiVine Space
          </h1>
          
          <form onSubmit={handleSearch} className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search videos, hashtags, or people..."
              className="pl-12 pr-20 h-12 text-lg bg-muted/50 border-muted-foreground/20 focus:border-primary"
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-12 top-1/2 -translate-y-1/2"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              Search
            </Button>
          </form>
          
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Tip: Use # to search for hashtags (e.g., #nostr)
          </p>
        </div>

        {/* Results or Popular Content */}
        {hasResults ? (
          <div className="space-y-6">
            {/* Active Tag Display */}
            {initialTag && (
              <div className="flex items-center gap-2 justify-center">
                <Badge variant="secondary" className="gap-1 text-base px-4 py-2">
                  <Hash className="h-4 w-4" />
                  {initialTag}
                </Badge>
                <Button variant="ghost" size="sm" onClick={clearSearch}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'videos' | 'people')}>
              <div className="flex justify-center">
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="videos" className="gap-2">
                    <Video className="h-4 w-4" />
                    Videos
                    {videos && (
                      <Badge variant="secondary" className="ml-1">
                        {videos.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="people" className="gap-2" disabled={!initialQuery}>
                    <User className="h-4 w-4" />
                    People
                    {profiles && (
                      <Badge variant="secondary" className="ml-1">
                        {profiles.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Videos Tab */}
              <TabsContent value="videos" className="mt-6">
                {videosLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <VideoCardSkeleton key={i} />
                    ))}
                  </div>
                ) : videos && videos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {videos.map((video) => (
                      <VideoCard key={video.id} video={video} />
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-16 text-center">
                      <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No videos found for "{initialQuery || initialTag}"
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* People Tab */}
              <TabsContent value="people" className="mt-6">
                {profilesLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-4 flex items-center gap-4">
                          <Skeleton className="h-14 w-14 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : profiles && profiles.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {profiles.map((user) => {
                      const npub = nip19.npubEncode(user.pubkey);
                      return (
                        <Link key={user.pubkey} to={`/${npub}`}>
                          <Card className="hover:border-primary/30 transition-colors">
                            <CardContent className="p-4 flex items-center gap-4">
                              <Avatar className="h-14 w-14 border-2 border-border">
                                <AvatarImage src={user.profile.picture} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {(user.profile.name || 'A')[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold truncate">
                                  {user.profile.display_name || user.profile.name || 'Anonymous'}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {user.stats.video_count} videos
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-16 text-center">
                      <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No people found for "{initialQuery}"
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          /* No Query - Show Popular Tags */
          <div className="max-w-3xl mx-auto">
            <Card className="myspace-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5 text-cyan-500" />
                  Popular Hashtags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {popularHashtags?.slice(0, 20).map((tag) => (
                    <Link key={tag.hashtag} to={`/search?tag=${tag.hashtag}`}>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors px-3 py-1"
                      >
                        #{tag.hashtag}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {tag.video_count}
                        </span>
                      </Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
