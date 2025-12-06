// Animation timing constants for consistent UI animations
export const ANIMATION_DURATION = {
  FAST: 150,      // 150ms - For quick interactions
  NORMAL: 300,    // 300ms - Default animation speed
  SLOW: 500,      // 500ms - For complex transitions
} as const;

// CSS transition strings
export const TRANSITIONS = {
  FAST: `${ANIMATION_DURATION.FAST}ms ease-in-out`,
  NORMAL: `${ANIMATION_DURATION.NORMAL}ms ease-in-out`,
  SLOW: `${ANIMATION_DURATION.SLOW}ms ease-in-out`,
} as const;
