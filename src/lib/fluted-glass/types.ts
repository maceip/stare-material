export const FLUTED_PATTERN_OPTIONS = [
  'fluted vertical',
  'fluted horizontal',
  'fluted diagonal',
  'bubbles',
  'lenses',
] as const;

export type FlutedPattern = (typeof FLUTED_PATTERN_OPTIONS)[number];

export const patternToIndex = (pattern: FlutedPattern | number): number => {
  if (typeof pattern === 'number') {
    return Math.min(Math.max(Math.floor(pattern), 0), FLUTED_PATTERN_OPTIONS.length - 1);
  }
  const index = FLUTED_PATTERN_OPTIONS.indexOf(pattern);
  return index === -1 ? 0 : index;
};

export const indexToPattern = (index: number): FlutedPattern => {
  const clamped = Math.min(Math.max(Math.floor(index), 0), FLUTED_PATTERN_OPTIONS.length - 1);
  return FLUTED_PATTERN_OPTIONS[clamped];
};
