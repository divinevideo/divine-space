import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useAuth } from './useAuth';
import { useKeycastPublish } from './useKeycastPublish';

// Kind for DiVine Space profile customization
export const MYSPACE_PROFILE_KIND = 16793;

// Available themes - MySpace meets Vine revival
export const MYSPACE_THEMES = [
  { id: 'default', name: 'DiVine Classic', description: 'The OG DiVine look', emoji: '✨', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'scene', name: 'Scene Kid', description: 'rawr XD ~*~ so random', emoji: '🖤', preview: 'linear-gradient(135deg, #ff69b4 0%, #000000 100%)' },
  { id: 'y2k', name: 'Y2K Princess', description: 'Butterfly clips era', emoji: '🦋', preview: 'linear-gradient(135deg, #ff9a9e 0%, #a8edea 100%)' },
  { id: 'gothic', name: 'Dark Romantic', description: 'Velvet & poetry', emoji: '🥀', preview: 'linear-gradient(135deg, #200122 0%, #6f0000 100%)' },
  { id: 'kawaii', name: 'Kawaii Star', description: 'Sparkles & pastels!', emoji: '⭐', preview: 'linear-gradient(135deg, #fbc2eb 0%, #a18cd1 100%)' },
  { id: 'neon', name: 'Cyber Punk', description: 'Neon nights', emoji: '🤖', preview: 'linear-gradient(135deg, #fc00ff 0%, #00dbde 100%)' },
  { id: 'retro', name: 'VHS Wave', description: 'Synthwave sunsets', emoji: '📼', preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'space', name: 'Cosmic Dreamer', description: 'Lost in the stars', emoji: '🌌', preview: 'linear-gradient(135deg, #0f0c29 0%, #302b63 100%)' },
  { id: 'vine', name: 'Vine Revival', description: '6 seconds of fame', emoji: '🍃', preview: 'linear-gradient(135deg, #00bf8f 0%, #001510 100%)' },
  { id: 'tiktok', name: 'For You Page', description: 'Algorithm energy', emoji: '🎵', preview: 'linear-gradient(135deg, #ff0050 0%, #00f2ea 100%)' },
  { id: 'grunge', name: 'Grunge Core', description: 'Chaos aesthetic', emoji: '🔥', preview: 'linear-gradient(135deg, #1a1a1a 0%, #4a3728 100%)' },
  { id: 'cottagecore', name: 'Cottagecore', description: 'Soft & whimsical', emoji: '🌸', preview: 'linear-gradient(135deg, #ffeaa7 0%, #dfe6e9 100%)' },
] as const;

// Color palette presets for customization
export const COLOR_PALETTES = [
  { id: 'divine-purple', name: 'DiVine Purple', primary: '#9333ea', secondary: '#c084fc', accent: '#22d3ee' },
  { id: 'vine-green', name: 'Vine Green', primary: '#00bf8f', secondary: '#10b981', accent: '#ffffff' },
  { id: 'hot-pink', name: 'Hot Pink', primary: '#ec4899', secondary: '#f472b6', accent: '#06b6d4' },
  { id: 'cyber-cyan', name: 'Cyber Cyan', primary: '#06b6d4', secondary: '#22d3ee', accent: '#f43f5e' },
  { id: 'sunset-orange', name: 'Sunset', primary: '#f97316', secondary: '#fb923c', accent: '#8b5cf6' },
  { id: 'blood-red', name: 'Blood Red', primary: '#dc2626', secondary: '#ef4444', accent: '#000000' },
  { id: 'forest-green', name: 'Forest', primary: '#16a34a', secondary: '#22c55e', accent: '#fbbf24' },
  { id: 'royal-blue', name: 'Royal Blue', primary: '#2563eb', secondary: '#3b82f6', accent: '#eab308' },
  { id: 'pastel-dream', name: 'Pastel Dream', primary: '#c4b5fd', secondary: '#fbcfe8', accent: '#a5f3fc' },
  { id: 'monochrome', name: 'Monochrome', primary: '#ffffff', secondary: '#a1a1aa', accent: '#18181b' },
  { id: 'neon-nights', name: 'Neon Nights', primary: '#f0abfc', secondary: '#5eead4', accent: '#fde047' },
  { id: 'dark-mode', name: 'Dark Mode', primary: '#a78bfa', secondary: '#818cf8', accent: '#34d399' },
] as const;

// Profile layout options
export const PROFILE_LAYOUTS = [
  { id: 'classic', name: 'Classic MySpace', description: 'Two-column layout with Top 8' },
  { id: 'vine', name: 'Vine Grid', description: 'Video-focused grid layout' },
  { id: 'minimalist', name: 'Minimalist', description: 'Clean, modern look' },
  { id: 'maximalist', name: 'Maximalist', description: 'All the widgets!' },
  { id: 'centered', name: 'Centered', description: 'Profile-focused center layout' },
] as const;

// Blinkie/decoration presets
export const PROFILE_BLINKIES = [
  { id: 'stars', pattern: '★ ☆ ★ ☆ ★', colors: ['#fbbf24', '#f59e0b'] },
  { id: 'hearts', pattern: '♥ ♡ ♥ ♡ ♥', colors: ['#ec4899', '#f472b6'] },
  { id: 'music', pattern: '♪ ♫ ♪ ♫ ♪', colors: ['#8b5cf6', '#a78bfa'] },
  { id: 'sparkles', pattern: '✦ ✧ ✦ ✧ ✦', colors: ['#22d3ee', '#06b6d4'] },
  { id: 'arrows', pattern: '» « » « »', colors: ['#f43f5e', '#fb7185'] },
  { id: 'diamonds', pattern: '◇ ◆ ◇ ◆ ◇', colors: ['#10b981', '#34d399'] },
  { id: 'scene', pattern: 'x X x X x', colors: ['#000000', '#ec4899'] },
  { id: 'kawaii', pattern: '☆ ♡ ☆ ♡ ☆', colors: ['#fbc2eb', '#a18cd1'] },
  { id: 'vine', pattern: '🍃 ✿ 🍃 ✿ 🍃', colors: ['#00bf8f', '#10b981'] },
  { id: 'fire', pattern: '🔥 ✦ 🔥 ✦ 🔥', colors: ['#f97316', '#ef4444'] },
] as const;

// Profile font options
export const PROFILE_FONTS = [
  { id: 'default', name: 'Inter', className: 'font-sans' },
  { id: 'serif', name: 'Serif', className: 'font-serif' },
  { id: 'mono', name: 'Monospace', className: 'font-mono' },
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
  presetColors: ProfileColors;
  presetBlinkie: typeof PROFILE_BLINKIES[number];
} {
  // Use pubkey characters to pick consistent defaults
  const moodIndex = seededRandom(pubkey, 1) % DEFAULT_MOODS.length;
  const quoteIndex = seededRandom(pubkey, 7) % DEFAULT_QUOTES.length;
  const statusIndex = seededRandom(pubkey, 13) % DEFAULT_STATUSES.length;
  const themeIndex = seededRandom(pubkey, 3) % MYSPACE_THEMES.length;
  const backgroundIndex = seededRandom(pubkey, 17) % DEFAULT_BACKGROUNDS.length;
  const musicIndex = seededRandom(pubkey, 23) % DEFAULT_MUSIC_SUGGESTIONS.length;
  const effectIndex = seededRandom(pubkey, 31) % DEFAULT_PROFILE_EFFECTS.length;
  const colorIndex = seededRandom(pubkey, 41) % COLOR_PALETTES.length;
  const blinkieIndex = seededRandom(pubkey, 47) % PROFILE_BLINKIES.length;
  const layoutIndex = seededRandom(pubkey, 53) % PROFILE_LAYOUTS.length;
  
  // Determine preset style based on theme
  const theme = MYSPACE_THEMES[themeIndex];
  const presetStyle = getPresetStyleForTheme(theme.id);
  const colorPalette = COLOR_PALETTES[colorIndex];
  const blinkie = PROFILE_BLINKIES[blinkieIndex];
  const layout = PROFILE_LAYOUTS[layoutIndex];
  
  // Generate some preset interests based on pubkey
  const allInterests = [
    'music', 'videos', 'gaming', 'art', 'photography', 'coding', 'memes',
    'anime', 'movies', 'fashion', 'fitness', 'travel', 'food', 'books',
    'crypto', 'nostr', 'vinyl', 'tattoos', 'skateboarding', 'surfing'
  ];
  const interestCount = 3 + (seededRandom(pubkey, 59) % 4);
  const interests: string[] = [];
  for (let i = 0; i < interestCount; i++) {
    const idx = seededRandom(pubkey, 61 + i) % allInterests.length;
    if (!interests.includes(allInterests[idx])) {
      interests.push(allInterests[idx]);
    }
  }
  
  return {
    mood: DEFAULT_MOODS[moodIndex],
    quote: DEFAULT_QUOTES[quoteIndex],
    status: DEFAULT_STATUSES[statusIndex],
    theme: theme.id,
    layout: layout.id,
    autoplay: false,
    topFriends: [],
    interests,
    guestbookEnabled: true,
    colors: {
      paletteId: colorPalette.id,
      primary: colorPalette.primary,
      secondary: colorPalette.secondary,
      accent: colorPalette.accent,
    },
    decorations: {
      blinkieId: blinkie.id,
      showSparkles: seededRandom(pubkey, 67) % 2 === 0,
      showStars: seededRandom(pubkey, 71) % 3 === 0,
      glitterText: seededRandom(pubkey, 73) % 4 === 0,
      animatedBorder: seededRandom(pubkey, 79) % 3 === 0,
    },
    isPreset: true,
    presetStyle,
    backgroundGradient: DEFAULT_BACKGROUNDS[backgroundIndex],
    musicSuggestion: DEFAULT_MUSIC_SUGGESTIONS[musicIndex],
    effect: DEFAULT_PROFILE_EFFECTS[effectIndex],
    presetColors: {
      paletteId: colorPalette.id,
      primary: colorPalette.primary,
      secondary: colorPalette.secondary,
      accent: colorPalette.accent,
    },
    presetBlinkie: blinkie,
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
  | 'chill-vibes'
  | 'vine-legend'
  | 'fyp-star'
  | 'grunge-chaos'
  | 'cottagecore-dream';

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
    'vine': 'vine-legend',
    'tiktok': 'fyp-star',
    'grunge': 'grunge-chaos',
    'cottagecore': 'cottagecore-dream',
  };
  return styleMap[theme];
}

// Get preset style info for display
export function getPresetStyleInfo(style: PresetStyle): {
  name: string;
  description: string;
  emoji: string;
  colors: string[];
  vibe: string;
} {
  const styles: Record<PresetStyle, { name: string; description: string; emoji: string; colors: string[]; vibe: string }> = {
    'cosmic-dreamer': {
      name: 'Cosmic Dreamer',
      description: 'Lost in the stars, vibing with the universe',
      emoji: '🌌',
      colors: ['#667eea', '#764ba2', '#0f0c29'],
      vibe: 'ethereal',
    },
    'scene-kid': {
      name: 'Scene Kid',
      description: 'rawr XD ~*~ so random ~~~',
      emoji: '🖤',
      colors: ['#ff69b4', '#000000', '#1a1a2e'],
      vibe: 'chaotic',
    },
    'y2k-princess': {
      name: 'Y2K Princess',
      description: 'Butterfly clips and lip gloss energy',
      emoji: '🦋',
      colors: ['#ff9a9e', '#fecfef', '#a8edea'],
      vibe: 'nostalgic',
    },
    'dark-romantic': {
      name: 'Dark Romantic',
      description: 'Poetry, candles, and velvet vibes',
      emoji: '🥀',
      colors: ['#200122', '#6f0000', '#2d132c'],
      vibe: 'moody',
    },
    'kawaii-star': {
      name: 'Kawaii Star',
      description: 'Sparkles, pastels, and good vibes only!',
      emoji: '⭐',
      colors: ['#fbc2eb', '#a18cd1', '#ffecd2'],
      vibe: 'cute',
    },
    'cyber-punk': {
      name: 'Cyber Punk',
      description: 'Neon lights and digital dreams',
      emoji: '🤖',
      colors: ['#fc00ff', '#00dbde', '#667eea'],
      vibe: 'futuristic',
    },
    'retro-wave': {
      name: 'VHS Wave',
      description: 'Synthwave sunsets and VHS vibes',
      emoji: '📼',
      colors: ['#f093fb', '#f5576c', '#fcb69f'],
      vibe: 'retro',
    },
    'chill-vibes': {
      name: 'Chill Vibes',
      description: 'Just here for a good time',
      emoji: '✨',
      colors: ['#4facfe', '#00f2fe', '#a8edea'],
      vibe: 'relaxed',
    },
    'vine-legend': {
      name: 'Vine Legend',
      description: '6 seconds of pure fame',
      emoji: '🍃',
      colors: ['#00bf8f', '#10b981', '#001510'],
      vibe: 'iconic',
    },
    'fyp-star': {
      name: 'FYP Star',
      description: 'Born for the algorithm',
      emoji: '🎵',
      colors: ['#ff0050', '#00f2ea', '#000000'],
      vibe: 'viral',
    },
    'grunge-chaos': {
      name: 'Grunge Chaos',
      description: 'Organized mess aesthetic',
      emoji: '🔥',
      colors: ['#1a1a1a', '#4a3728', '#8b4513'],
      vibe: 'raw',
    },
    'cottagecore-dream': {
      name: 'Cottagecore Dream',
      description: 'Soft, whimsical, & cozy',
      emoji: '🌸',
      colors: ['#ffeaa7', '#dfe6e9', '#fab1a0'],
      vibe: 'peaceful',
    },
  };
  return styles[style];
}

// Get theme info by ID
export function getThemeInfo(themeId: ThemeId) {
  return MYSPACE_THEMES.find(t => t.id === themeId);
}

// Get color palette by ID
export function getColorPalette(paletteId: ColorPaletteId) {
  return COLOR_PALETTES.find(p => p.id === paletteId);
}

// Get blinkie by ID
export function getBlinkie(blinkieId: BlinkieId) {
  return PROFILE_BLINKIES.find(b => b.id === blinkieId);
}

export type ThemeId = typeof MYSPACE_THEMES[number]['id'];
export type ColorPaletteId = typeof COLOR_PALETTES[number]['id'];
export type LayoutId = typeof PROFILE_LAYOUTS[number]['id'];
export type BlinkieId = typeof PROFILE_BLINKIES[number]['id'];
export type FontId = typeof PROFILE_FONTS[number]['id'];

export interface TopFriend {
  pubkey: string;
  position: number;
  nickname?: string; // Custom nickname for friend
}

export interface ProfileMusic {
  url: string;
  title?: string;
  artist?: string;
  coverArt?: string;
}

export interface ProfileColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text?: string;
  paletteId?: ColorPaletteId;
}

export interface ProfileDecorations {
  blinkieId?: BlinkieId;
  customBlinkie?: string;
  showSparkles?: boolean;
  showStars?: boolean;
  glitterText?: boolean;
  animatedBorder?: boolean;
  cursorTrail?: boolean;
}

export interface MySpaceProfileData {
  // Core profile data
  topFriends: TopFriend[];
  music?: ProfileMusic;
  autoplay: boolean;
  
  // Theme & appearance
  theme: ThemeId;
  layout?: LayoutId;
  colors?: ProfileColors;
  decorations?: ProfileDecorations;
  font?: FontId;
  
  // Custom backgrounds
  customCss?: string;
  background?: string; // Image URL
  backgroundGradient?: string; // CSS gradient
  backgroundPattern?: string; // Pattern overlay
  
  // Profile content
  mood?: { text: string; emoji?: string };
  status?: string;
  quote?: string;
  bio?: string;
  interests?: string[];
  
  // Video/content
  pinnedVideo?: string;
  featuredVideos?: string[]; // Array of video IDs
  
  // Social
  profileSong?: string; // Display text for the song
  lastOnline?: number;
  profileViews?: number;
  
  // Guestbook messages (stored separately but referenced here)
  guestbookEnabled?: boolean;
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
  musicSuggestion?: { title: string; artist: string; genre: string };
  effect?: string;
  presetColors?: ProfileColors;
  presetBlinkie?: typeof PROFILE_BLINKIES[number];
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
          layout: defaults.layout,
          mood: defaults.mood,
          quote: defaults.quote,
          status: defaults.status,
          interests: defaults.interests,
          colors: defaults.colors,
          decorations: defaults.decorations,
          guestbookEnabled: defaults.guestbookEnabled,
          backgroundGradient: defaults.backgroundGradient,
          // Extended preset properties
          isPreset: true,
          isClaimed: false,
          presetStyle: defaults.presetStyle,
          musicSuggestion: defaults.musicSuggestion,
          effect: defaults.effect,
          presetColors: defaults.presetColors,
          presetBlinkie: defaults.presetBlinkie,
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
  const { pubkey } = useAuth();
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
  const { pubkey } = useAuth();
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
  const { pubkey } = useAuth();
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
  const { pubkey } = useAuth();
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
