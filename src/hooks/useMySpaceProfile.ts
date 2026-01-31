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
  { text: 'Feeling Nostalgic', emoji: '📼' },
  { text: 'In My Element', emoji: '🌟' },
  { text: 'Main Character Energy', emoji: '👑' },
  { text: 'Late Night Vibes', emoji: '🌃' },
  { text: 'Creating Chaos', emoji: '🎪' },
  { text: 'Living the Dream', emoji: '🦋' },
  { text: 'Plotting World Domination', emoji: '🗺️' },
  { text: 'Feeling Aesthetic', emoji: '🎀' },
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
  "We're all stories in the end. Just make it a good one.",
  "The internet is just a world passing notes around a classroom.",
  "rawr means i love you in dinosaur xD",
  "If you can dream it, you can do it. ★彡",
  "music is my escape from this crazy world",
  "☆ follow your heart but take your brain with you ☆",
  "i'm not weird, i'm limited edition",
  "live, laugh, love... and code",
  "PC4PC? Add me!",
  "Thanks for the add! ♥",
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
  "Currently obsessing over new music",
  "Probably watching videos rn",
  "On my way to becoming internet famous",
  "Editing my page... again lol",
  "Taking profile pics in bathroom mirrors",
  "Counting down to the weekend",
  "Procrastinating productively",
  "Existing chaotically",
];

// MySpace-style preset backgrounds (CSS gradients and patterns)
export const DEFAULT_BACKGROUNDS = [
  // Space/Galaxy themes
  'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'linear-gradient(to bottom, #000428 0%, #004e92 100%)',
  'radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)',
  // Neon/Cyberpunk
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(to right, #fc00ff 0%, #00dbde 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  // Scene/Emo aesthetic
  'linear-gradient(to bottom, #232526 0%, #414345 100%)',
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(to right, #0f0f0f 0%, #2d132c 100%)',
  // Y2K/Retro
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(to right, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  // Nature/Aesthetic
  'linear-gradient(to top, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
  // Dark luxury
  'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
  'linear-gradient(to bottom right, #200122 0%, #6f0000 100%)',
  'linear-gradient(to right, #0f2027 0%, #203a43 50%, #2c5364 100%)',
];

// Music suggestions (placeholder URLs - these would be real tracks)
export const DEFAULT_MUSIC_SUGGESTIONS = [
  { title: 'Dreams', artist: 'Nuages', genre: 'Electronic' },
  { title: 'Midnight City', artist: 'M83', genre: 'Synthwave' },
  { title: 'Intro', artist: 'The xx', genre: 'Indie' },
  { title: 'Resonance', artist: 'HOME', genre: 'Synthwave' },
  { title: 'Take On Me', artist: 'a-ha', genre: 'Retro' },
  { title: 'Digital Love', artist: 'Daft Punk', genre: 'Electronic' },
  { title: 'Somebody That I Used to Know', artist: 'Gotye', genre: 'Indie' },
  { title: 'Electric Feel', artist: 'MGMT', genre: 'Psychedelic' },
];

// CSS animations and effects that can be randomly assigned
export const DEFAULT_PROFILE_EFFECTS = [
  'sparkle',
  'glow',
  'float',
  'pulse',
  'rainbow',
  'glitch',
  'retro-scan',
  'star-field',
];

// Generate a seeded random number from pubkey for consistent randomization
function seededRandom(pubkey: string, seed: number): number {
  const hash = pubkey.split('').reduce((acc, char, i) => {
    return acc + char.charCodeAt(0) * (i + 1) * seed;
  }, 0);
  return hash;
}

// Generate deterministic defaults based on pubkey for consistency
// Every profile gets unique but consistent MySpace-like customization!
function getDefaultsForPubkey(pubkey: string): Partial<MySpaceProfileData> & { 
  isPreset: boolean;
  presetStyle: PresetStyle;
  backgroundGradient: string;
  musicSuggestion?: { title: string; artist: string; genre: string };
  effect?: string;
} {
  // Use pubkey characters to pick consistent defaults
  const charSum = pubkey.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  
  const moodIndex = seededRandom(pubkey, 1) % DEFAULT_MOODS.length;
  const quoteIndex = seededRandom(pubkey, 7) % DEFAULT_QUOTES.length;
  const statusIndex = seededRandom(pubkey, 13) % DEFAULT_STATUSES.length;
  const themeIndex = seededRandom(pubkey, 3) % MYSPACE_THEMES.length;
  const backgroundIndex = seededRandom(pubkey, 17) % DEFAULT_BACKGROUNDS.length;
  const musicIndex = seededRandom(pubkey, 23) % DEFAULT_MUSIC_SUGGESTIONS.length;
  const effectIndex = seededRandom(pubkey, 31) % DEFAULT_PROFILE_EFFECTS.length;
  
  // Determine preset style based on theme
  const theme = MYSPACE_THEMES[themeIndex];
  const presetStyle = getPresetStyleForTheme(theme.id);
  
  return {
    mood: DEFAULT_MOODS[moodIndex],
    quote: DEFAULT_QUOTES[quoteIndex],
    status: DEFAULT_STATUSES[statusIndex],
    theme: theme.id,
    autoplay: false,
    topFriends: [],
    isPreset: true,
    presetStyle,
    backgroundGradient: DEFAULT_BACKGROUNDS[backgroundIndex],
    musicSuggestion: DEFAULT_MUSIC_SUGGESTIONS[musicIndex],
    effect: DEFAULT_PROFILE_EFFECTS[effectIndex],
  };
}

// Preset styles define the visual "vibe" of uncustomized profiles
export type PresetStyle = 
  | 'cosmic-dreamer'
  | 'scene-kid'
  | 'y2k-princess'
  | 'dark-romantic'
  | 'kawaii-star'
  | 'cyber-punk'
  | 'retro-wave'
  | 'chill-vibes';

// Map themes to preset styles
function getPresetStyleForTheme(theme: ThemeId): PresetStyle {
  const styleMap: Record<ThemeId, PresetStyle> = {
    'default': 'chill-vibes',
    'scene': 'scene-kid',
    'y2k': 'y2k-princess',
    'gothic': 'dark-romantic',
    'kawaii': 'kawaii-star',
    'neon': 'cyber-punk',
    'retro': 'retro-wave',
    'space': 'cosmic-dreamer',
  };
  return styleMap[theme];
}

// Get preset style info for display
export function getPresetStyleInfo(style: PresetStyle): {
  name: string;
  description: string;
  emoji: string;
  colors: string[];
} {
  const styles: Record<PresetStyle, { name: string; description: string; emoji: string; colors: string[] }> = {
    'cosmic-dreamer': {
      name: 'Cosmic Dreamer',
      description: 'Lost in the stars, vibing with the universe',
      emoji: '🌌',
      colors: ['#667eea', '#764ba2', '#0f0c29'],
    },
    'scene-kid': {
      name: 'Scene Kid',
      description: 'rawr XD ~*~ so random ~~~',
      emoji: '🖤',
      colors: ['#ff69b4', '#000000', '#1a1a2e'],
    },
    'y2k-princess': {
      name: 'Y2K Princess',
      description: 'Butterfly clips and lip gloss energy',
      emoji: '🦋',
      colors: ['#ff9a9e', '#fecfef', '#a8edea'],
    },
    'dark-romantic': {
      name: 'Dark Romantic',
      description: 'Poetry, candles, and velvet vibes',
      emoji: '🥀',
      colors: ['#200122', '#6f0000', '#2d132c'],
    },
    'kawaii-star': {
      name: 'Kawaii Star',
      description: 'Sparkles, pastels, and good vibes only!',
      emoji: '⭐',
      colors: ['#fbc2eb', '#a18cd1', '#ffecd2'],
    },
    'cyber-punk': {
      name: 'Cyber Punk',
      description: 'Neon lights and digital dreams',
      emoji: '🤖',
      colors: ['#fc00ff', '#00dbde', '#667eea'],
    },
    'retro-wave': {
      name: 'Retro Wave',
      description: 'Synthwave sunsets and VHS vibes',
      emoji: '📼',
      colors: ['#f093fb', '#f5576c', '#fcb69f'],
    },
    'chill-vibes': {
      name: 'Chill Vibes',
      description: 'Just here for a good time',
      emoji: '✨',
      colors: ['#4facfe', '#00f2fe', '#a8edea'],
    },
  };
  return styles[style];
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

// Extended profile data that includes preset info for unclaimed profiles
export interface MySpaceProfileDataExtended extends MySpaceProfileData {
  isPreset?: boolean;
  isClaimed?: boolean;
  presetStyle?: PresetStyle;
  backgroundGradient?: string;
  musicSuggestion?: { title: string; artist: string; genre: string };
  effect?: string;
}

/**
 * Fetch a user's MySpace profile customization
 */
export function useMySpaceProfile(pubkey: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['myspace-profile', pubkey],
    queryFn: async (): Promise<MySpaceProfileDataExtended | null> => {
      if (!pubkey) return null;
      
      const events = await nostr.query([
        { kinds: [MYSPACE_PROFILE_KIND], authors: [pubkey], limit: 1 }
      ]);

      if (events.length === 0) {
        // Return fun defaults based on pubkey for users without customization
        // This makes every profile unique and interesting even without user input!
        const defaults = getDefaultsForPubkey(pubkey);
        return {
          topFriends: [],
          autoplay: false,
          theme: defaults.theme as ThemeId,
          mood: defaults.mood,
          quote: defaults.quote,
          status: defaults.status,
          // Extended preset properties
          isPreset: true,
          isClaimed: false,
          presetStyle: defaults.presetStyle,
          backgroundGradient: defaults.backgroundGradient,
          musicSuggestion: defaults.musicSuggestion,
          effect: defaults.effect,
        };
      }

      // User has claimed and customized their profile
      const parsed = parseMySpaceProfile(events[0].tags);
      return {
        ...parsed,
        isPreset: false,
        isClaimed: true,
      };
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
