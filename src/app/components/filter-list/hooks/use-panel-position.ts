import { RefObject, useCallback, useEffect, useState } from 'react';

interface PanelPosition {
  top: number;
  left: number;
}

export const usePanelPosition = (
  isOpen: boolean,
  containerRef: RefObject<HTMLElement | null> | undefined,
) => {
  const [position, setPosition] = useState<PanelPosition>({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);

  // Calculate and update panel position
  const updatePosition = useCallback(() => {
    if (isOpen && containerRef?.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const panelWidth = 256; // w-64 = 16rem = 256px

      // Calculate position to align with the right edge of the button
      // This positions the right edge of the panel at the right edge of the button
      const rightAlignedPosition = rect.right - panelWidth;

      // Check if panel would overflow the left side of the window
      const wouldOverflowLeft = rightAlignedPosition < 0;

      // Adjust left position to keep panel fully visible
      const leftPos = wouldOverflowLeft
        ? 16 // 16px padding from left edge if it would overflow
        : rightAlignedPosition;

      setPosition({
        top: rect.bottom,
        left: leftPos,
      });
      setIsPositioned(true);
    }
  }, [isOpen, containerRef]);

  // Update position when the panel opens or container reference changes
  useEffect(() => {
    if (isOpen) {
      updatePosition();
    } else {
      // Reset positioning state when panel closes
      setIsPositioned(false);
    }
  }, [isOpen, containerRef, updatePosition]);

  // Handle window resize to keep panel in view
  useEffect(() => {
    if (isOpen) {
      const handleResize = () => {
        updatePosition();
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen, updatePosition]);

  return { position, isPositioned };
};
