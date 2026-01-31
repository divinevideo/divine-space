/**
 * Divine Video API client
 * REST API endpoints for relay.divine.video
 */

const API_BASE = 'https://relay.divine.video/api';

// Types for Divine Video API responses

export interface VideoListItem {
  id: string;
  pubkey: string;
  created_at: string;
  kind: number;
  d_tag: string;
  title: string;
  content: string;
  thumbnail: string;
  video_url: string;
  reactions: number;
  comments: number;
  reposts: number;
  engagement_score: number;
  trending_score: number;
  author_name?: string;
  author_avatar?: string;
}

export interface VideoStats {
  reactions: number;
  comments: number;
  reposts: number;
  engagement_score: number;
  trending_score?: number;
  embedded_loops?: number;
}

export interface VideoWithEvent {
  event: {
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
    sig: string;
  };
  stats: VideoStats;
}

export interface VideosEventsResponse {
  videos: VideoWithEvent[];
  next_cursor?: string;
  has_more: boolean;
}

export interface UserProfile {
  name?: string;
  display_name?: string;
  picture?: string;
  banner?: string;
  about?: string;
  nip05?: string;
  lud16?: string;
  website?: string;
}

export interface UserSocial {
  follower_count: number;
  following_count: number;
}

export interface UserStats {
  video_count: number;
  total_reactions: number;
  total_comments: number;
  total_reposts: number;
}

export interface UserEngagement {
  avg_reactions_per_video: number;
  avg_comments_per_video: number;
  engagement_rate: number;
}

export interface UserResponse {
  pubkey: string;
  profile: UserProfile;
  social: UserSocial;
  stats: UserStats;
  engagement: UserEngagement;
}

export interface HashtagItem {
  hashtag: string;
  video_count: number;
}

export interface TrendingHashtag extends HashtagItem {
  total_count: number;
  recent_24h: number;
  recent_7d: number;
  trending_score: number;
}

export interface LeaderboardVideoEntry {
  id: string;
  pubkey: string;
  title: string;
  thumbnail: string;
  d_tag: string;
  video_url: string;
  kind: number;
  author_name?: string;
  author_avatar?: string;
  views: number;
  unique_viewers: number;
  loops: number;
}

export interface LeaderboardCreatorEntry {
  pubkey: string;
  name?: string;
  display_name?: string;
  picture?: string;
  views: number;
  unique_viewers: number;
  loops: number;
  videos_with_views: number;
}

export interface LeaderboardResponse<T> {
  period: string;
  entries: T[];
}

export interface PlatformStats {
  total_events: number;
  total_videos: number;
  vine_videos: number;
}

export type VideoSort = 'recent' | 'trending' | 'popular' | 'loops';
export type LeaderboardPeriod = 'day' | 'week' | 'month' | 'year' | 'alltime';

// API functions

export async function fetchVideos(options: {
  sort?: VideoSort;
  kind?: number;
  limit?: number;
  offset?: number;
  tag?: string;
  before?: number;
  after?: number;
  platform?: string;
}): Promise<VideoListItem[]> {
  const params = new URLSearchParams();
  
  if (options.sort) params.set('sort', options.sort);
  if (options.kind) params.set('kind', options.kind.toString());
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.offset) params.set('offset', options.offset.toString());
  if (options.tag) params.set('tag', options.tag);
  if (options.before) params.set('before', options.before.toString());
  if (options.after) params.set('after', options.after.toString());
  if (options.platform) params.set('platform', options.platform);

  const response = await fetch(`${API_BASE}/videos?${params}`);
  if (!response.ok) throw new Error('Failed to fetch videos');
  return response.json();
}

export async function fetchVideosWithEvents(options: {
  limit?: number;
  before?: number;
}): Promise<VideosEventsResponse> {
  const params = new URLSearchParams();
  
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.before) params.set('before', options.before.toString());

  const response = await fetch(`${API_BASE}/videos/events?${params}`);
  if (!response.ok) throw new Error('Failed to fetch videos');
  return response.json();
}

export async function fetchVideo(id: string): Promise<VideoListItem & { sig: string; tags: string[][] }> {
  const response = await fetch(`${API_BASE}/videos/${id}`);
  if (!response.ok) throw new Error('Failed to fetch video');
  return response.json();
}

export async function fetchVideoStats(id: string): Promise<VideoStats> {
  const response = await fetch(`${API_BASE}/videos/${id}/stats`);
  if (!response.ok) throw new Error('Failed to fetch video stats');
  return response.json();
}

export async function fetchUser(pubkey: string): Promise<UserResponse> {
  const response = await fetch(`${API_BASE}/users/${pubkey}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
}

export async function fetchUserVideos(pubkey: string, options?: {
  limit?: number;
  offset?: number;
}): Promise<VideoListItem[]> {
  const params = new URLSearchParams();
  
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.offset) params.set('offset', options.offset.toString());

  const response = await fetch(`${API_BASE}/users/${pubkey}/videos?${params}`);
  if (!response.ok) throw new Error('Failed to fetch user videos');
  return response.json();
}

export async function fetchUserFollowers(pubkey: string, options?: {
  limit?: number;
  offset?: number;
}): Promise<{ pubkeys: string[] }> {
  const params = new URLSearchParams();
  
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.offset) params.set('offset', options.offset.toString());

  const response = await fetch(`${API_BASE}/users/${pubkey}/followers?${params}`);
  if (!response.ok) throw new Error('Failed to fetch followers');
  return response.json();
}

export async function fetchUserFollowing(pubkey: string): Promise<{ pubkeys: string[] }> {
  const response = await fetch(`${API_BASE}/users/${pubkey}/following`);
  if (!response.ok) throw new Error('Failed to fetch following');
  return response.json();
}

export async function fetchUserSocial(pubkey: string): Promise<UserSocial> {
  const response = await fetch(`${API_BASE}/users/${pubkey}/social`);
  if (!response.ok) throw new Error('Failed to fetch social stats');
  return response.json();
}

export async function fetchUserFeed(pubkey: string, options?: {
  sort?: 'recent' | 'trending';
  limit?: number;
  before?: number;
}): Promise<{ videos: VideoListItem[]; next_cursor?: string; has_more: boolean }> {
  const params = new URLSearchParams();
  
  if (options?.sort) params.set('sort', options.sort);
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.before) params.set('before', options.before.toString());

  const response = await fetch(`${API_BASE}/users/${pubkey}/feed?${params}`);
  if (!response.ok) throw new Error('Failed to fetch user feed');
  return response.json();
}

export async function fetchUserRecommendations(pubkey: string, options?: {
  limit?: number;
  category?: string;
  fallback?: 'popular' | 'recent';
}): Promise<{ videos: VideoListItem[]; source: string }> {
  const params = new URLSearchParams();
  
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.category) params.set('category', options.category);
  if (options?.fallback) params.set('fallback', options.fallback);

  const response = await fetch(`${API_BASE}/users/${pubkey}/recommendations?${params}`);
  if (!response.ok) throw new Error('Failed to fetch recommendations');
  return response.json();
}

export async function searchVideos(options: {
  q?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}): Promise<VideoListItem[]> {
  const params = new URLSearchParams();
  
  if (options.q) params.set('q', options.q);
  if (options.tag) params.set('tag', options.tag);
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.offset) params.set('offset', options.offset.toString());

  const response = await fetch(`${API_BASE}/search?${params}`);
  if (!response.ok) throw new Error('Failed to search videos');
  return response.json();
}

export async function searchProfiles(q: string, options?: {
  limit?: number;
  offset?: number;
}): Promise<UserResponse[]> {
  const params = new URLSearchParams();
  params.set('q', q);
  
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.offset) params.set('offset', options.offset.toString());

  const response = await fetch(`${API_BASE}/search/profiles?${params}`);
  if (!response.ok) throw new Error('Failed to search profiles');
  return response.json();
}

export async function fetchHashtags(): Promise<HashtagItem[]> {
  const response = await fetch(`${API_BASE}/hashtags`);
  if (!response.ok) throw new Error('Failed to fetch hashtags');
  return response.json();
}

export async function fetchTrendingHashtags(): Promise<TrendingHashtag[]> {
  const response = await fetch(`${API_BASE}/hashtags/trending`);
  if (!response.ok) throw new Error('Failed to fetch trending hashtags');
  return response.json();
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const response = await fetch(`${API_BASE}/stats`);
  if (!response.ok) throw new Error('Failed to fetch platform stats');
  return response.json();
}

export async function fetchVideoLeaderboard(options?: {
  period?: LeaderboardPeriod;
  limit?: number;
  offset?: number;
}): Promise<LeaderboardResponse<LeaderboardVideoEntry>> {
  const params = new URLSearchParams();
  
  if (options?.period) params.set('period', options.period);
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.offset) params.set('offset', options.offset.toString());

  const response = await fetch(`${API_BASE}/leaderboard/videos?${params}`);
  if (!response.ok) throw new Error('Failed to fetch video leaderboard');
  return response.json();
}

export async function fetchCreatorLeaderboard(options?: {
  period?: LeaderboardPeriod;
  limit?: number;
  offset?: number;
}): Promise<LeaderboardResponse<LeaderboardCreatorEntry>> {
  const params = new URLSearchParams();
  
  if (options?.period) params.set('period', options.period);
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.offset) params.set('offset', options.offset.toString());

  const response = await fetch(`${API_BASE}/leaderboard/creators?${params}`);
  if (!response.ok) throw new Error('Failed to fetch creator leaderboard');
  return response.json();
}

// Bulk operations

export async function fetchUsersBulk(pubkeys: string[]): Promise<{ users: UserResponse[] }> {
  const response = await fetch(`${API_BASE}/users/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pubkeys }),
  });
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

export async function fetchVideoStatsBulk(eventIds: string[]): Promise<{ 
  stats: Array<VideoStats & { id: string }>; 
  missing: string[];
}> {
  const response = await fetch(`${API_BASE}/videos/stats/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_ids: eventIds }),
  });
  if (!response.ok) throw new Error('Failed to fetch video stats');
  return response.json();
}
