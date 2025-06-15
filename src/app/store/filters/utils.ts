// Utility functions for filters
export const toggleFilter = (haystack: string[], needle: string): string[] => {
  if (!needle || needle.trim() === '') return haystack;

  return haystack.includes(needle)
    ? haystack.filter((i) => i !== needle)
    : [...haystack, needle];
};
