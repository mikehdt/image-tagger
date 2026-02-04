import { PopupPosition } from './types';

export const ANIMATION_DURATION = 150; // ms - should match CSS transition duration

export const DEFAULT_OFFSET = 4; // px spacing between trigger and popup - matches Tailwind mt-1

const VIEWPORT_MARGIN = 16; // px minimum margin from viewport edges
const MAX_HEIGHT_VH = 0.8; // Maximum height as fraction of viewport height (80vh)

interface PopupPositionResult {
  styles: React.CSSProperties;
  adjustedPosition: PopupPosition;
  /** True when the popup needed to be constrained to fit the viewport */
  isConstrained: boolean;
}

/**
 * Calculate popup position using pure math - no DOM manipulation.
 * Takes the popup's natural width and trigger rect, returns final styles.
 */
export function calculatePopupPosition(
  popupWidth: number,
  triggerRect: DOMRect,
  desiredPosition: PopupPosition,
  offset: number = DEFAULT_OFFSET,
  disableOverflowHandling: boolean = false,
): PopupPositionResult {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const styles: React.CSSProperties = {
    position: 'absolute',
    zIndex: 60,
  };

  const adjustedPosition = desiredPosition;
  const verticalPart = desiredPosition.startsWith('top') ? 'top' : 'bottom';

  // --- Vertical positioning ---
  if (verticalPart === 'top') {
    styles.bottom = '100%';
    styles.marginBottom = `${offset}px`;
  } else {
    styles.top = '100%';
    styles.marginTop = `${offset}px`;
  }

  // --- Horizontal positioning ---
  // Calculate where the popup's edges would be at natural position
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

  // Calculate overflow with 1px buffer for rounding tolerance
  const ROUNDING_BUFFER = 1;
  const rightEdgeLimit = viewportWidth - VIEWPORT_MARGIN;
  const leftEdgeLimit = VIEWPORT_MARGIN;
  const maxAvailableWidth = viewportWidth - VIEWPORT_MARGIN * 2;

  const overflowRight = Math.max(0, naturalRight - rightEdgeLimit);
  const overflowLeft = Math.max(0, leftEdgeLimit - naturalLeft);

  // Check if popup is wider than available space (with buffer for rounding)
  const fitsInViewport = popupWidth <= maxAvailableWidth + ROUNDING_BUFFER;
  const isConstrained = !fitsInViewport || overflowRight > 0 || overflowLeft > 0;

  if (!fitsInViewport) {
    // Popup is wider than viewport - constrain width and pin to left margin
    styles.maxWidth = `${maxAvailableWidth}px`;
    styles.minWidth = `${Math.min(300, maxAvailableWidth)}px`;
    styles.left = leftEdgeLimit - triggerRect.left;
  } else if (overflowRight > ROUNDING_BUFFER && overflowLeft > ROUNDING_BUFFER) {
    // Somehow overflowing both sides but fits - this shouldn't happen, but handle it
    styles.left = leftEdgeLimit - triggerRect.left;
  } else if (overflowRight > ROUNDING_BUFFER) {
    // Overflowing right only - shift left to fit
    styles.left = rightEdgeLimit - popupWidth - triggerRect.left;
  } else if (overflowLeft > ROUNDING_BUFFER) {
    // Overflowing left only - shift right to fit
    styles.left = leftEdgeLimit - triggerRect.left;
  } else {
    // No overflow - use natural positioning
    if (desiredPosition.includes('left')) {
      styles.left = 0;
    } else if (desiredPosition.includes('right')) {
      styles.right = 0;
    } else {
      // Center
      styles.left = '50%';
      styles.transform = 'translateX(-50%)';
    }
  }

  // --- Vertical height constraint ---
  if (!disableOverflowHandling) {
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
