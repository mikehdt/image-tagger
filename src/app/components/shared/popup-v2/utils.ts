import { PopupPosition } from './types';

export const ANIMATION_DURATION = 150; // ms - should match CSS transition duration

export const DEFAULT_OFFSET = 4; // px spacing between trigger and popup - matches Tailwind mt-1

const VIEWPORT_MARGIN = 16; // px minimum margin from viewport edges
const MAX_HEIGHT_VH = 0.8; // Maximum height as fraction of viewport height (80vh)

/**
 * Calculate the initial position styles for a popup based on desired position.
 * This gives us a starting point before viewport adjustment.
 */
export function calculateInitialStyles(
  desiredPosition: PopupPosition,
  offset: number = DEFAULT_OFFSET,
): React.CSSProperties {
  const styles: React.CSSProperties = {
    position: 'absolute',
    zIndex: 60, // Higher than modal (z-50) to appear on top
  };

  // Handle horizontal positioning
  if (desiredPosition.includes('left')) {
    styles.left = 0;
  } else if (desiredPosition.includes('right')) {
    styles.right = 0;
  } else {
    // Center positioning
    styles.left = '50%';
    styles.transform = 'translateX(-50%)';
  }

  // Handle vertical positioning
  if (desiredPosition.startsWith('top')) {
    styles.bottom = '100%';
    styles.marginBottom = `${offset}px`;
  } else {
    styles.top = '100%';
    styles.marginTop = `${offset}px`;
  }

  return styles;
}

export interface ViewportAdjustmentResult {
  styles: React.CSSProperties;
  adjustedPosition: PopupPosition;
}

/**
 * Adjust popup position to keep it within viewport bounds.
 * Handles both horizontal (left/right) and vertical (bottom) overflow.
 */
export function adjustForViewport(
  popupElement: HTMLElement,
  triggerElement: HTMLElement,
  desiredPosition: PopupPosition,
  offset: number = DEFAULT_OFFSET,
): ViewportAdjustmentResult {
  const popupRect = popupElement.getBoundingClientRect();
  const triggerRect = triggerElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const styles = calculateInitialStyles(desiredPosition, offset);
  let adjustedPosition = desiredPosition;

  // --- Horizontal adjustment ---
  const overflowRight = popupRect.right > viewportWidth - VIEWPORT_MARGIN;
  const overflowLeft = popupRect.left < VIEWPORT_MARGIN;

  // Determine the vertical part of position (top or bottom)
  const verticalPart = desiredPosition.startsWith('top') ? 'top' : 'bottom';

  if (overflowRight && overflowLeft) {
    // Overflow both sides - extreme edge case
    // Left-align to the viewport margin as a fallback
    delete styles.right;
    delete styles.transform;
    styles.left = VIEWPORT_MARGIN - triggerRect.left;
    // Keep the horizontal part as 'left' since we're left-aligning
    adjustedPosition = `${verticalPart}-left` as PopupPosition;
  } else if (overflowRight) {
    // Overflowing right edge - try right-aligning
    if (
      desiredPosition.includes('left') ||
      desiredPosition === 'top' ||
      desiredPosition === 'bottom'
    ) {
      // Switch from left/center to right alignment
      delete styles.left;
      delete styles.transform;
      styles.right = 0;
      adjustedPosition = `${verticalPart}-right` as PopupPosition;
    }
    // If already right-aligned and still overflowing, we may need to shift it
    // This happens if the trigger itself is near the right edge
    if (popupRect.right > viewportWidth - VIEWPORT_MARGIN) {
      const shiftNeeded = popupRect.right - (viewportWidth - VIEWPORT_MARGIN);
      delete styles.left;
      delete styles.transform;
      styles.right = -shiftNeeded;
    }
  } else if (overflowLeft) {
    // Overflowing left edge - try left-aligning
    if (
      desiredPosition.includes('right') ||
      desiredPosition === 'top' ||
      desiredPosition === 'bottom'
    ) {
      // Switch from right/center to left alignment
      delete styles.right;
      delete styles.transform;
      styles.left = 0;
      adjustedPosition = `${verticalPart}-left` as PopupPosition;
    }
    // If already left-aligned and still overflowing, shift it
    if (popupRect.left < VIEWPORT_MARGIN) {
      const shiftNeeded = VIEWPORT_MARGIN - popupRect.left;
      delete styles.right;
      delete styles.transform;
      styles.left = shiftNeeded;
    }
  }

  // --- Vertical adjustment ---
  // Always cap maxHeight to 80vh or available space, whichever is smaller
  // This ensures proper scrolling and responsive resize behavior
  const maxPreferredHeight = viewportHeight * MAX_HEIGHT_VH;

  if (verticalPart === 'bottom') {
    const availableHeight = viewportHeight - triggerRect.bottom - offset - VIEWPORT_MARGIN;
    const maxHeight = Math.min(maxPreferredHeight, availableHeight);

    if (maxHeight > 0) {
      styles.maxHeight = `${maxHeight}px`;
      styles.overflowY = 'auto';
    }
  } else {
    // For top-opening popups, cap based on space above trigger
    const availableHeight = triggerRect.top - offset - VIEWPORT_MARGIN;
    const maxHeight = Math.min(maxPreferredHeight, availableHeight);

    if (maxHeight > 0) {
      styles.maxHeight = `${maxHeight}px`;
      styles.overflowY = 'auto';
    }
  }

  return { styles, adjustedPosition };
}

/**
 * Get the transform origin CSS value based on popup position for smooth animations.
 */
export function getTransformOrigin(position: PopupPosition): string {
  switch (position) {
    case 'top-left':
      return 'bottom left';
    case 'top':
      return 'bottom center';
    case 'top-right':
      return 'bottom right';
    case 'bottom-left':
      return 'top left';
    case 'bottom':
      return 'top center';
    case 'bottom-right':
      return 'top right';
    default:
      return 'center';
  }
}
