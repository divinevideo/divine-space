import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useKeycast } from '@/contexts/KeycastContext';
import { useKeycastPublish } from './useKeycastPublish';

// Kind for DiVine Space profile customization
export const MYSPACE_PROFILE_KIND = 16793;

// Available themes
export const MYSPACE_THEMES = [
  { id: 'default', name: 'Default', description: 'Classic DiVine Space' },
  { id: 'scene', name: 'Scene', description: 'Scene/Emo aesthetic' },
  { id: 'y2k', name: 'Y2K', description: 'Early 2000s aesthetic' },
  { id: 'gothic', name: 'Gothic', description: 'Dark gothic vibes' },
  { id: 'kawaii', name: 'Kawaii', description: 'Cute anime aesthetic' },
  { id: 'neon', name: 'Neon', description: 'Cyberpunk neon' },
  { id: 'retro', name: 'Retro', description: '90s retro' },
  { id: 'space', name: 'Space', description: 'Cosmic vibes' },
] as const;

// Default fun widgets for users without customization
export const DEFAULT_MOODS = [
  { text: 'Vibing', emoji: '✨' },
  { text: 'Creative', emoji: '🎨' },
  { text: 'Chill', emoji: '😎' },
  { text: 'Inspired', emoji: '💡' },
  { text: 'Musical', emoji: '🎵' },
  { text: 'Caffeinated', emoji: '☕' },
  { text: 'Dreamy', emoji: '🌙' },
  { text: 'On Fire', emoji: '🔥' },
];

export const DEFAULT_QUOTES = [
  "Life moves pretty fast. If you don't stop and look around once in a while, you could miss it.",
  "Be yourself; everyone else is already taken.",
  "Not all those who wander are lost.",
  "In a world where you can be anything, be kind.",
  "The only way to do great work is to love what you do.",
  "Stay hungry, stay foolish.",
  "Everything you can imagine is real.",
  "Create the things you wish existed.",
  "Do what you love and you'll never work a day in your life.",
  "Life is what happens when you're busy making other plans.",
];

export const DEFAULT_STATUSES = [
  "Living my best life ✨",
  "Making magic happen",
  "Building something cool 🛠️",
  "Exploring the nostrverse 🌐",
  "Creating content 🎬",
  "Vibing with good music 🎧",
  "Always learning, always growing 📚",
  "Here for the good vibes only",
];

// Generate deterministic defaults based on pubkey for consistency
function getDefaultsForPubkey(pubkey: string): Partial<MySpaceProfileData> {
  // Use pubkey characters to pick consistent defaults
  const charSum = pubkey.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  
  const moodIndex = charSum % DEFAULT_MOODS.length;
  const quoteIndex = (charSum * 7) % DEFAULT_QUOTES.length;
  const statusIndex = (charSum * 13) % DEFAULT_STATUSES.length;
  const themeIndex = (charSum * 3) % MYSPACE_THEMES.length;
  
  return {
    mood: DEFAULT_MOODS[moodIndex],
    quote: DEFAULT_QUOTES[quoteIndex],
    status: DEFAULT_STATUSES[statusIndex],
    theme: MYSPACE_THEMES[themeIndex].id,
    autoplay: false,
    topFriends: [],
  };
}

export type ThemeId = typeof MYSPACE_THEMES[number]['id'];

export interface TopFriend {
  pubkey: string;
  position: number;
}

export interface ProfileMusic {
  url: string;
  title?: string;
  artist?: string;
}

export interface MySpaceProfileData {
  topFriends: TopFriend[];
  music?: ProfileMusic;
  autoplay: boolean;
  theme: ThemeId;
  customCss?: string;
  background?: string;
  mood?: { text: string; emoji?: string };
  status?: string;
  pinnedVideo?: string;
  quote?: string;
}

// Parse a MySpace profile event into structured data
function parseMySpaceProfile(tags: string[][]): MySpaceProfileData {
  const topFriends: TopFriend[] = [];
  let music: ProfileMusic | undefined;
  let autoplay = false;
  let theme: ThemeId = 'default';
  let customCss: string | undefined;
  let background: string | undefined;
  let mood: { text: string; emoji?: string } | undefined;
  let status: string | undefined;
  let pinnedVideo: string | undefined;
  let quote: string | undefined;

  for (const tag of tags) {
    const [name, ...values] = tag;
    
    switch (name) {
      case 'p':
        if (values[2]) { // Has position
          const position = parseInt(values[2], 10);
          if (position >= 1 && position <= 8) {
            topFriends.push({ pubkey: values[0], position });
          }
        }
        break;
      case 'music':
        if (values[0]) {
          music = { url: values[0], title: values[1], artist: values[2] };
        }
        break;
      case 'autoplay':
        autoplay = values[0] === 'true';
        break;
      case 'theme':
        if (MYSPACE_THEMES.some(t => t.id === values[0])) {
          theme = values[0] as ThemeId;
        }
        break;
      case 'css':
        customCss = values[0];
        break;
      case 'background':
        background = values[0];
        break;
      case 'mood':
        if (values[0]) {
          mood = { text: values[0], emoji: values[1] };
        }
        break;
      case 'status':
        status = values[0];
        break;
      case 'pinned':
        pinnedVideo = values[0];
        break;
      case 'quote':
        quote = values[0];
        break;
    }
  }

  // Sort top friends by position
  topFriends.sort((a, b) => a.position - b.position);

  return {
    topFriends,
    music,
    autoplay,
    theme,
    customCss,
    background,
    mood,
    status,
    pinnedVideo,
    quote,
  };
}

// Convert profile data to tags
function profileToTags(data: Partial<MySpaceProfileData>): string[][] {
  const tags: string[][] = [
    ['alt', 'DiVine Space profile customization'],
  ];

  // Top friends
  if (data.topFriends) {
    for (const friend of data.topFriends) {
      tags.push(['p', friend.pubkey, '', friend.position.toString()]);
    }
  }

  // Music
  if (data.music?.url) {
    const musicTag = ['music', data.music.url];
    if (data.music.title) musicTag.push(data.music.title);
    if (data.music.artist) musicTag.push(data.music.artist);
    tags.push(musicTag);
  }

  // Autoplay
  tags.push(['autoplay', data.autoplay ? 'true' : 'false']);

  // Theme
  if (data.theme) {
    tags.push(['theme', data.theme]);
  }

  // Custom CSS
  if (data.customCss) {
    tags.push(['css', data.customCss]);
  }

  // Background
  if (data.background) {
    tags.push(['background', data.background]);
  }

  // Mood
  if (data.mood?.text) {
    const moodTag = ['mood', data.mood.text];
    if (data.mood.emoji) moodTag.push(data.mood.emoji);
    tags.push(moodTag);
  }

  // Status
  if (data.status) {
    tags.push(['status', data.status]);
  }

  // Pinned video
  if (data.pinnedVideo) {
    tags.push(['pinned', data.pinnedVideo]);
  }

  // Quote
  if (data.quote) {
    tags.push(['quote', data.quote]);
  }

  return tags;
}

/**
 * Fetch a user's MySpace profile customization
 */
export function useMySpaceProfile(pubkey: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['myspace-profile', pubkey],
    queryFn: async () => {
      if (!pubkey) return null;
      
      const events = await nostr.query([
        { kinds: [MYSPACE_PROFILE_KIND], authors: [pubkey], limit: 1 }
      ]);

      if (events.length === 0) {
        // Return fun defaults based on pubkey for users without customization
        const defaults = getDefaultsForPubkey(pubkey);
        return {
          topFriends: [],
          autoplay: false,
          theme: defaults.theme as ThemeId,
          mood: defaults.mood,
          quote: defaults.quote,
          status: defaults.status,
        } as MySpaceProfileData;
      }

      return parseMySpaceProfile(events[0].tags);
    },
    enabled: !!pubkey,
  });
}

/**
 * Update the current user's MySpace profile
 */
export function useUpdateMySpaceProfile() {
  const { pubkey } = useKeycast();
  const { mutateAsync: publish } = useKeycastPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<MySpaceProfileData>) => {
      if (!pubkey) throw new Error('Not authenticated');

      const tags = profileToTags(data);
      
      await publish({
        kind: MYSPACE_PROFILE_KIND,
        content: '',
        tags,
      });

      return data;
    },
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(['myspace-profile', pubkey], (old: MySpaceProfileData | undefined) => ({
        ...old,
        ...data,
      }));
    },
  });
}

/**
 * Add a friend to the Top 8
 */
export function useAddTopFriend() {
  const { pubkey } = useKeycast();
  const { data: profile } = useMySpaceProfile(pubkey);
  const { mutateAsync: updateProfile } = useUpdateMySpaceProfile();

  return useMutation({
    mutationFn: async (friendPubkey: string) => {
      if (!profile) throw new Error('Profile not loaded');
      
      const existingFriends = profile.topFriends || [];
      
      // Check if already in top 8
      if (existingFriends.some(f => f.pubkey === friendPubkey)) {
        throw new Error('Already in Top 8');
      }
      
      // Check if top 8 is full
      if (existingFriends.length >= 8) {
        throw new Error('Top 8 is full');
      }

      // Add to next available position
      const usedPositions = new Set(existingFriends.map(f => f.position));
      let nextPosition = 1;
      while (usedPositions.has(nextPosition) && nextPosition <= 8) {
        nextPosition++;
      }

      const newFriends = [...existingFriends, { pubkey: friendPubkey, position: nextPosition }];
      
      await updateProfile({ ...profile, topFriends: newFriends });
      return newFriends;
    },
  });
}

/**
 * Remove a friend from the Top 8
 */
export function useRemoveTopFriend() {
  const { pubkey } = useKeycast();
  const { data: profile } = useMySpaceProfile(pubkey);
  const { mutateAsync: updateProfile } = useUpdateMySpaceProfile();

  return useMutation({
    mutationFn: async (friendPubkey: string) => {
      if (!profile) throw new Error('Profile not loaded');
      
      const newFriends = (profile.topFriends || []).filter(f => f.pubkey !== friendPubkey);
      
      await updateProfile({ ...profile, topFriends: newFriends });
      return newFriends;
    },
  });
}

/**
 * Reorder Top 8 friends
 */
export function useReorderTopFriends() {
  const { pubkey } = useKeycast();
  const { data: profile } = useMySpaceProfile(pubkey);
  const { mutateAsync: updateProfile } = useUpdateMySpaceProfile();

  return useMutation({
    mutationFn: async (newOrder: string[]) => {
      if (!profile) throw new Error('Profile not loaded');
      
      const newFriends = newOrder.map((pk, index) => ({
        pubkey: pk,
        position: index + 1,
      }));
      
      await updateProfile({ ...profile, topFriends: newFriends });
      return newFriends;
    },
  });
}
