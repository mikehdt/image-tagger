// Utilities for handling repeat training subfolders

/**
 * Regex pattern for valid repeat folder names: {number}_{label}
 * Examples: 2_sonic, 3_knuckles, 10_test
 */
const REPEAT_FOLDER_PATTERN = /^(\d+)_([a-zA-Z0-9-]+)$/;

/**
 * Check if a folder name matches the repeat folder pattern
 */
export const isValidRepeatFolder = (folderName: string): boolean => {
  return REPEAT_FOLDER_PATTERN.test(folderName);
};

/**
 * Parse a subfolder name into its repeat count and label components
 * @param subfolder - Folder name (e.g., "2_sonic")
 * @returns Object with repeatCount and label, or null if invalid
 */
export const parseSubfolder = (
  subfolder: string,
): { repeatCount: number; label: string } | null => {
  const match = subfolder.match(REPEAT_FOLDER_PATTERN);
  if (!match) {
    return null;
  }

  const [, countStr, label] = match;
  const repeatCount = parseInt(countStr, 10);

  return {
    repeatCount,
    label,
  };
};
