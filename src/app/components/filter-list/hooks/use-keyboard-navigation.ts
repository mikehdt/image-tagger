import { KeyboardEvent, RefObject, useCallback } from 'react';

export const useKeyboardNavigation = (
  listLength: number,
  selectedIndex: number,
  setSelectedIndex: (index: number) => void,
  onClose: () => void,
  inputRef: RefObject<HTMLInputElement | null>,
) => {
  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault(); // Prevent cursor movement in input
        setSelectedIndex(
          selectedIndex < listLength - 1 ? selectedIndex + 1 : selectedIndex,
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault(); // Prevent cursor movement in input
        setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : 0);
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        // The actual tag selection will be handled in the TagsView component
        e.preventDefault();
        // We'll maintain the selected index and just focus back on the input
        if (inputRef.current) {
          inputRef.current.focus();
        }
      } else if (e.key === 'Escape') {
        // Clear selection first, if another Escape is pressed, close the panel
        if (selectedIndex >= 0) {
          e.preventDefault();
          setSelectedIndex(-1);
        } else {
          onClose();
        }
      }
    },
    [listLength, selectedIndex, setSelectedIndex, onClose, inputRef],
  );

  return { handleKeyDown };
};
