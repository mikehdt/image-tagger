import { PopupPosition } from './types';

export const ANIMATION_DURATION = 150; // ms - should match CSS transition duration

export const DEFAULT_OFFSET = 4; // px spacing between trigger and popup - matches Tailwind mt-1

const VIEWPORT_MARGIN = 16; // px minimum margin from viewport edges

/**
 * Calculate the optimal position for a popup based on trigger element and desired position
 */
export function calculatePopupPosition(
  desiredPosition: PopupPosition,
  offset: number = DEFAULT_OFFSET,
): { position: PopupPosition; styles: React.CSSProperties } {
  // For absolute positioning, we use CSS classes instead of complex calculations
  // This matches the original dropdown behavior more closely

  const position = desiredPosition;
  const styles: React.CSSProperties = {
    position: 'absolute',
    zIndex: 60, // Higher than modal (z-50) to appear on top
  };

  // Handle horizontal positioning
  if (position.includes('left')) {
    styles.left = 0;
  } else if (position.includes('right')) {
    styles.right = 0;
  } else {
    // Center positioning - we'll handle this with CSS transforms
    styles.left = '50%';
    styles.transform = 'translateX(-50%)';
  }

  // Handle vertical positioning
  if (position.startsWith('top')) {
    styles.bottom = '100%';
    styles.marginBottom = `${offset}px`;
  } else {
    styles.top = '100%';
    styles.marginTop = `${offset}px`;
  }

  // TODO: Add viewport clipping detection if needed
  // For now, we'll rely on the simpler CSS approach

  return {
    position,
    styles,
  };
} /**
 * Get the transform origin CSS value based on popup position for smooth animations
 */
export function getTransformOrigin(position: PopupPosition): string {
  switch (position) {
    case 'top-left':
      return 'bottom left';
    case 'top':
      return 'bottom left'; // Don't ask me why
    case 'top-right':
      return 'bottom right';
    case 'bottom-left':
      return 'top left';
    case 'bottom':
      return 'top left'; // Don't ask me why
    case 'bottom-right':
      return 'top right';
    default:
      return 'center';
  }
}
