import { useSeoMeta, useHead } from '@unhead/react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useDivineVideo, useDivineVideoStats } from '@/hooks/useDivineVideos';
import { useVideoComments, useVideoReaction, useToggleVideoReaction, usePostComment, useRepostVideo } from '@/hooks/useDivineSocial';
import { useDivineUserVideos } from '@/hooks/useDivineUser';
import { useAuth } from '@/hooks/useAuth';
import { useAuthor } from '@/hooks/useAuthor';
import { VideoCard, VideoCardSkeleton } from '@/components/VideoCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  MessageCircle, 
  Repeat2, 
  Share2, 
  Loader2, 
  Send,
  Play,
  User,
  Clock,
  Video as VideoIcon
} from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { nip19 } from 'nostr-tools';
import { useToast } from '@/hooks/useToast';
import NotFound from './NotFound';

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export default function Video() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState('');

  const { data: video, isLoading: videoLoading, error: videoError } = useDivineVideo(id);
  const { data: stats } = useDivineVideoStats(id);
  const { data: comments, isLoading: commentsLoading } = useVideoComments(id);
  const { data: existingReaction, isLoading: reactionLoading } = useVideoReaction(id, video?.pubkey);
  const { mutate: toggleReaction, isPending: reactionPending } = useToggleVideoReaction();
  const { mutate: postComment, isPending: commentPending } = usePostComment();
  const { mutate: repost, isPending: repostPending } = useRepostVideo();

  const author = useAuthor(video?.pubkey);
  const { data: moreVideos } = useDivineUserVideos(video?.pubkey, { limit: 4 });

  // Dynamic SEO meta tags for social embeds
  const videoTitle = video?.title || 'Video';
  const videoDescription = video?.content?.slice(0, 200) || 'Watch this video on DiVine Space';
  const videoThumbnail = video?.thumbnail || 'https://divine.space/og-image.svg';
  const videoUrl = `https://divine.space/video/${id}`;
  const authorName = author.data?.metadata?.display_name || author.data?.metadata?.name || 'Creator';

  useSeoMeta({
    title: `${videoTitle} - DiVine Space`,
    description: videoDescription,
  });

  // Open Graph and Twitter Card meta tags for video embeds
  useHead({
    meta: [
      // Open Graph
      { property: 'og:type', content: 'video.other' },
      { property: 'og:url', content: videoUrl },
      { property: 'og:title', content: videoTitle },
      { property: 'og:description', content: videoDescription },
      { property: 'og:image', content: videoThumbnail },
      { property: 'og:image:width', content: '1280' },
      { property: 'og:image:height', content: '720' },
      { property: 'og:video', content: video?.video_url || '' },
      { property: 'og:video:type', content: 'video/mp4' },
      { property: 'og:site_name', content: 'DiVine Space' },
      // Twitter Card
      { name: 'twitter:card', content: 'player' },
      { name: 'twitter:title', content: videoTitle },
      { name: 'twitter:description', content: videoDescription },
      { name: 'twitter:image', content: videoThumbnail },
      { name: 'twitter:player', content: `https://divine.space/embed/${id}` },
      { name: 'twitter:player:width', content: '480' },
      { name: 'twitter:player:height', content: '854' },
    ],
    link: [
      // oEmbed discovery
      { rel: 'alternate', type: 'application/json+oembed', href: `https://relay.divine.video/api/oembed?url=${encodeURIComponent(videoUrl)}` },
    ],
  });

  if (videoLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="aspect-video w-full rounded-lg mb-4" />
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </Layout>
    );
  }

  if (videoError || !video) {
    return <NotFound />;
  }

  const npub = nip19.npubEncode(video.pubkey);
  const createdAt = typeof video.created_at === 'number' 
    ? new Date(video.created_at * 1000) 
    : new Date(video.created_at);
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });
  const isLiked = !!existingReaction;

  const handleLike = () => {
    if (!isAuthenticated) {
      toast({ title: 'Please log in to like videos', variant: 'destructive' });
      return;
    }
    toggleReaction({
      videoId: video.id,
      videoAuthorPubkey: video.pubkey,
      videoKind: video.kind,
      existingReaction: existingReaction ?? null,
    });
  };

  const handleComment = () => {
    if (!isAuthenticated) {
      toast({ title: 'Please log in to comment', variant: 'destructive' });
      return;
    }
    if (!commentText.trim()) return;

    postComment({
      videoId: video.id,
      videoAuthorPubkey: video.pubkey,
      videoKind: video.kind,
      content: commentText.trim(),
    }, {
      onSuccess: () => {
        setCommentText('');
        toast({ title: 'Comment posted!' });
      },
      onError: () => {
        toast({ title: 'Failed to post comment', variant: 'destructive' });
      },
    });
  };

  const handleRepost = () => {
    if (!isAuthenticated) {
      toast({ title: 'Please log in to repost', variant: 'destructive' });
      return;
    }
    repost({
      videoId: video.id,
      videoAuthorPubkey: video.pubkey,
      videoKind: video.kind,
    }, {
      onSuccess: () => toast({ title: 'Reposted!' }),
      onError: () => toast({ title: 'Failed to repost', variant: 'destructive' }),
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied to clipboard!' });
    } catch {
      toast({ title: 'Failed to copy link', variant: 'destructive' });
    }
  };

  // Get hashtags from tags
  const hashtags = video.tags
    ?.filter(([t]) => t === 't')
    .map(([, tag]) => tag) || [];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="video-frame aspect-video bg-black">
              <video
                src={video.video_url}
                poster={video.thumbnail}
                controls
                autoPlay
                playsInline
                className="w-full h-full"
              />
            </div>

            {/* Video Info */}
            <div className="space-y-4">
              <h1 className="text-2xl md:text-3xl font-bold">
                {video.title || 'Untitled Video'}
              </h1>

              {/* Stats & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-muted-foreground text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {timeAgo}
                  </span>
                  {stats && (
                    <>
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {formatNumber(stats.reactions)} likes
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {formatNumber(stats.comments)} comments
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    size="sm"
                    onClick={handleLike}
                    disabled={reactionPending || reactionLoading}
                    className={isLiked ? "bg-pink-500 hover:bg-pink-600 border-pink-500" : ""}
                  >
                    {reactionPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                    )}
                    <span className="ml-1">{isLiked ? 'Liked' : 'Like'}</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRepost}
                    disabled={repostPending}
                  >
                    {repostPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Repeat2 className="h-4 w-4" />
                    )}
                    <span className="ml-1">Repost</span>
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                    <span className="ml-1 hidden sm:inline">Share</span>
                  </Button>
                </div>
              </div>

              {/* Author */}
              <Link to={`/${npub}`}>
                <Card className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-border">
                      <AvatarImage src={author.data?.metadata?.picture} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(author.data?.metadata?.name || 'A')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">
                        {author.data?.metadata?.display_name || author.data?.metadata?.name || 'Anonymous'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {author.data?.metadata?.about?.slice(0, 100) || 'No bio'}
                      </p>
                    </div>
                    <Button variant="secondary" size="sm">
                      <User className="h-4 w-4 mr-1" />
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              {/* Description */}
              {video.content && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm whitespace-pre-wrap">{video.content}</p>
                  </CardContent>
                </Card>
              )}

              {/* Hashtags */}
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag) => (
                    <Link key={tag} to={`/search?tag=${tag}`}>
                      <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                        #{tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Comments */}
            <Card className="myspace-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Comments ({comments?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Comment Form */}
                {isAuthenticated ? (
                  <div className="flex gap-3">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="min-h-[80px] bg-muted/50"
                    />
                    <Button 
                      onClick={handleComment} 
                      disabled={commentPending || !commentText.trim()}
                      size="icon"
                      className="shrink-0"
                    >
                      {commentPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Log in to leave a comment
                  </p>
                )}

                {/* Comments List */}
                {commentsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : comments && comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <CommentItem key={comment.id} comment={comment} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <Card className="myspace-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <VideoIcon className="h-5 w-5" />
                  More from this creator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {moreVideos?.filter(v => v.id !== video.id).slice(0, 4).map((v) => (
                  <Link key={v.id} to={`/video/${v.id}`} className="flex gap-3 group">
                    <div className="relative w-24 aspect-video rounded overflow-hidden shrink-0">
                      <img 
                        src={v.thumbnail || '/placeholder-video.jpg'} 
                        alt={v.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Play className="h-4 w-4 text-white opacity-0 group-hover:opacity-100" fill="currentColor" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {v.title || 'Untitled'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatNumber(v.reactions)} likes
                      </p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </Layout>
  );
}

// Comment item component
function CommentItem({ comment }: { comment: { id: string; pubkey: string; content: string; created_at: number } }) {
  const author = useAuthor(comment.pubkey);
  const npub = nip19.npubEncode(comment.pubkey);
  const timeAgo = formatDistanceToNow(new Date(comment.created_at * 1000), { addSuffix: true });

  return (
    <div className="flex gap-3">
      <Link to={`/${npub}`}>
        <Avatar className="h-10 w-10 border border-border">
          <AvatarImage src={author.data?.metadata?.picture} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {(author.data?.metadata?.name || 'A')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link to={`/${npub}`} className="font-medium text-sm hover:text-primary">
            {author.data?.metadata?.name || 'Anonymous'}
          </Link>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  );
}
