// Shared utility functions for Redux store

/**
 * Generic toggle function for ASC/DESC direction enums
 * Works with any enum that has ASC and DESC values
 */
export const toggleDirection = <T extends string>(
  currentDirection: T,
  ascValue: T,
  descValue: T,
): T => {
  return currentDirection === ascValue ? descValue : ascValue;
};
