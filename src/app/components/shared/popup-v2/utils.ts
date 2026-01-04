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
  // Calculate where the popup WOULD be at its natural/desired position
  // This avoids oscillation from measuring already-adjusted positions
  const popupWidth = popupRect.width;
  let naturalLeft: number;
  let naturalRight: number;

  if (desiredPosition.includes('left')) {
    // Left-aligned: popup's left edge aligns with trigger's left edge
    naturalLeft = triggerRect.left;
    naturalRight = naturalLeft + popupWidth;
  } else if (desiredPosition.includes('right')) {
    // Right-aligned: popup's right edge aligns with trigger's right edge
    naturalRight = triggerRect.right;
    naturalLeft = naturalRight - popupWidth;
  } else {
    // Centered: popup is centered on trigger
    const triggerCenter = triggerRect.left + triggerRect.width / 2;
    naturalLeft = triggerCenter - popupWidth / 2;
    naturalRight = triggerCenter + popupWidth / 2;
  }

  // Calculate overflow based on natural position
  const overflowRight = Math.max(0, naturalRight - (viewportWidth - VIEWPORT_MARGIN));
  const overflowLeft = Math.max(0, VIEWPORT_MARGIN - naturalLeft);
  const maxAvailableWidth = viewportWidth - VIEWPORT_MARGIN * 2;
  const isConstrained = overflowRight > 0 || overflowLeft > 0;

  if (overflowRight > 0 && overflowLeft > 0) {
    // Popup is wider than viewport - constrain width and pin to left margin
    styles.maxWidth = `${maxAvailableWidth}px`;
    styles.minWidth = `${Math.min(300, maxAvailableWidth)}px`;
    delete styles.right;
    delete styles.transform;
    // Position so popup's left edge is at viewport margin
    styles.left = VIEWPORT_MARGIN - triggerRect.left;
  } else if (overflowRight > 0) {
    // Overflowing right edge only - shift left to fit
    // We want popup's left edge at: (viewportWidth - VIEWPORT_MARGIN) - popupWidth
    const targetLeft = viewportWidth - VIEWPORT_MARGIN - popupWidth;

    delete styles.transform;
    delete styles.right;
    // Position so popup's left edge is at targetLeft
    styles.left = targetLeft - triggerRect.left;
  } else if (overflowLeft > 0) {
    // Overflowing left edge only - shift right to fit
    const targetLeft = VIEWPORT_MARGIN;

    delete styles.transform;
    delete styles.right;
    // Position so popup's left edge is at targetLeft
    styles.left = targetLeft - triggerRect.left;
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
