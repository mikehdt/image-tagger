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

      // Calculate the right edge position of the panel if aligned to the left of the button
      const rightEdge = rect.left + panelWidth;

      // Check if panel would overflow the window when placed at button's left
      const windowWidth = window.innerWidth;
      const wouldOverflow = rightEdge > windowWidth;

      // Adjust left position to keep panel fully visible
      let leftPos = rect.left;
      if (wouldOverflow) {
        // Align to the right edge of the window with some padding
        leftPos = Math.max(0, windowWidth - panelWidth - 16); // 16px padding from right edge
      }

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
