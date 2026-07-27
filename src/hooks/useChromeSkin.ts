import { useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  CHROME_SKIN_STORAGE_KEY,
  DEFAULT_CHROME_SKIN,
  isChromeSkin,
  type ChromeSkinId,
} from '@/lib/chromeSkins';

/**
 * Manages the site-wide chrome skin. Applies data-chrome-skin to <html>
 * and persists the choice to localStorage. Logged-out visitors always
 * start from the plain default.
 */
export function useChromeSkin() {
  const [stored, setStored] = useLocalStorage<string>(
    CHROME_SKIN_STORAGE_KEY,
    DEFAULT_CHROME_SKIN
  );

  const skin: ChromeSkinId = isChromeSkin(stored) ? stored : DEFAULT_CHROME_SKIN;

  useEffect(() => {
    document.documentElement.dataset.chromeSkin = skin;
  }, [skin]);

  const setSkin = useCallback(
    (next: string) => {
      if (isChromeSkin(next)) {
        setStored(next);
      }
    },
    [setStored]
  );

  return { skin, setSkin };
}
