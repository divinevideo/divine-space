/**
 * Chrome Skin Registry
 *
 * Site-wide skins that restyle the platform chrome (header, nav, cards)
 * via the data-chrome-skin attribute on <html>. Independent from the
 * per-profile .theme-* classes, which style profile page bodies.
 */

export type ChromeSkinId = 'plain' | 'classic-blue' | 'terminal' | 'scene-kid';

export interface ChromeSkin {
  id: ChromeSkinId;
  name: string;
  description: string;
}

export const CHROME_SKIN_STORAGE_KEY = 'divine-chrome-skin';

export const DEFAULT_CHROME_SKIN: ChromeSkinId = 'plain';

export const CHROME_SKINS: ChromeSkin[] = [
  {
    id: 'plain',
    name: 'Plain',
    description: 'Quiet default. Flat white, Verdana, orange-red accent.',
  },
  {
    id: 'classic-blue',
    name: 'Classic Blue',
    description: 'MySpace 1.0 chrome. White pages, #003399 blue bar and links.',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    description: 'Phosphor green on near-black, monospace everything.',
  },
  {
    id: 'scene-kid',
    name: 'Scene Kid',
    description: 'Black background, hot pink and cyan. rawr xD.',
  },
];

export function isChromeSkin(value: string): value is ChromeSkinId {
  return CHROME_SKINS.some((s) => s.id === value);
}

export function getChromeSkin(id: string): ChromeSkin {
  return CHROME_SKINS.find((s) => s.id === id) ?? CHROME_SKINS[0];
}
