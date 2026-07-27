import { useChromeSkin } from '@/hooks/useChromeSkin';

/**
 * Applies the stored chrome skin globally by mounting useChromeSkin
 * once at the app root. Renders nothing.
 */
export function ChromeSkinApplicator() {
  useChromeSkin();
  return null;
}

export default ChromeSkinApplicator;
