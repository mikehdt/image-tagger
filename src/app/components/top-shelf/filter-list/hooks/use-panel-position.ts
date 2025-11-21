import { RefObject, useEffect, useState } from 'react';

interface PanelPosition {
  top: number;
  left: number;
}

export const usePanelPosition = (
  isOpen: boolean,
  containerRef: RefObject<HTMLElement | null> | undefined,
) => {
  // We're keeping this simplified and similar to the dropdown's approach
  // We'll just track if we've attempted positioning - the actual positioning will be done with CSS
  const [isPositioned, setIsPositioned] = useState(false);

  // Simple position tracking for animation triggers
  const [position, setPosition] = useState<PanelPosition>({ top: 0, left: 0 });

  // Set positioned state when opening
  useEffect(() => {
    if (isOpen && containerRef?.current && !isPositioned) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional DOM measurement for positioning
      setIsPositioned(true);

      // Keep minimal position information for compatibility
      // The actual positioning will be handled by CSS absolute positioning
      const rect = containerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom,
        left: rect.right,
      });
    }
  }, [isOpen, containerRef, isPositioned]);

  // Handle window resize
  useEffect(() => {
    if (isOpen && containerRef?.current) {
      const handleResize = () => {
        const rect = containerRef.current!.getBoundingClientRect();
        setPosition({
          top: rect.bottom,
          left: rect.right,
        });
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen, containerRef]);

  return { position, isPositioned };
};
