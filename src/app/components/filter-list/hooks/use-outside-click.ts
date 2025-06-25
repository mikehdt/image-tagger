import { RefObject, useEffect } from 'react';

export const useOutsideClick = (
  isOpen: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLElement | null>,
  containerRef: RefObject<HTMLElement | null> | undefined,
) => {
  // Handle click outside to close panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        containerRef?.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, panelRef, containerRef]);
};
