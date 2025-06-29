import { useState } from 'react';

import { DropdownItem } from './dropdown';

/**
 * Hook to manage dropdown state and selection
 * @param items Array of dropdown items
 * @param initialSelectedValue Initially selected value
 * @returns State and handlers for the dropdown
 */
export function useDropdown<T>(
  items: DropdownItem<T>[],
  initialSelectedValue: T,
) {
  const [selectedValue, setSelectedValue] = useState<T>(initialSelectedValue);

  // Find the currently selected item
  const selectedItem = items.find((item) => item.value === selectedValue);

  // Handle selection change
  const handleSelect = (value: T) => {
    setSelectedValue(value);
  };

  return {
    items,
    selectedValue,
    selectedItem,
    handleSelect,
    setSelectedValue,
  };
}
