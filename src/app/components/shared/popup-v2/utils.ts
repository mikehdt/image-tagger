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

interface ViewportAdjustmentResult {
  styles: React.CSSProperties;
  adjustedPosition: PopupPosition;
  /** True when the popup needed to be constrained to fit the viewport */
  isConstrained: boolean;
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
  disableOverflowHandling: boolean = false,
): ViewportAdjustmentResult {
  const popupRect = popupElement.getBoundingClientRect();
  const triggerRect = triggerElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const styles = calculateInitialStyles(desiredPosition, offset);
  const adjustedPosition = desiredPosition;
  const verticalPart = desiredPosition.startsWith('top') ? 'top' : 'bottom';

  // --- Horizontal adjustment ---
  // Calculate how much the popup overflows on each side
  const overflowRight = Math.max(
    0,
    popupRect.right - (viewportWidth - VIEWPORT_MARGIN),
  );
  const overflowLeft = Math.max(0, VIEWPORT_MARGIN - popupRect.left);
  const maxAvailableWidth = viewportWidth - VIEWPORT_MARGIN * 2;
  const isConstrained = overflowRight > 0 || overflowLeft > 0;

  if (overflowRight > 0 && overflowLeft > 0) {
    // Popup is wider than viewport - constrain width and center it
    styles.maxWidth = `${maxAvailableWidth}px`;
    styles.minWidth = `${Math.min(300, maxAvailableWidth)}px`;
    delete styles.right;
    delete styles.transform;
    // Position relative to trigger: shift left edge to viewport margin
    styles.left = VIEWPORT_MARGIN - triggerRect.left;
  } else if (overflowRight > 0) {
    // Overflowing right edge - shift left by the overflow amount
    // Keep the original alignment style but apply an offset
    if (styles.transform === 'translateX(-50%)') {
      // Centered popup - adjust the transform
      delete styles.transform;
      delete styles.left;
      // Use right alignment with the trigger's right edge as reference
      styles.right = triggerRect.right - popupRect.right - overflowRight;
    } else if (styles.left !== undefined) {
      // Left-aligned popup - shift it left
      styles.left = -overflowRight;
    } else {
      // Right-aligned but still overflowing (trigger near right edge)
      styles.right = -overflowRight;
    }
  } else if (overflowLeft > 0) {
    // Overflowing left edge - shift right by the overflow amount
    if (styles.transform === 'translateX(-50%)') {
      // Centered popup - adjust the transform
      delete styles.transform;
      delete styles.right;
      styles.left = overflowLeft;
    } else if (styles.right !== undefined) {
      // Right-aligned popup - shift it right
      delete styles.right;
      styles.left = overflowLeft;
    } else {
      // Left-aligned but still overflowing (trigger near left edge)
      styles.left = overflowLeft;
    }
  }

  // --- Vertical adjustment ---
  // Skip overflow handling if disabled (useful for popups containing nested popups)
  if (!disableOverflowHandling) {
    // Always cap maxHeight to 80vh or available space, whichever is smaller
    // This ensures proper scrolling and responsive resize behavior
    const maxPreferredHeight = viewportHeight * MAX_HEIGHT_VH;

    if (verticalPart === 'bottom') {
      const availableHeight =
        viewportHeight - triggerRect.bottom - offset - VIEWPORT_MARGIN;
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
  }

  return { styles, adjustedPosition, isConstrained };
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
