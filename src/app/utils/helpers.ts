import { ImageDimensions } from '../store/assets';

export const composeDimensions = (dimensions: ImageDimensions): string =>
  `${dimensions.width}x${dimensions.height}`;

export const decomposeDimensions = (
  composedDimensions: string,
): ImageDimensions => ({
  width: parseInt(
    composedDimensions.substring(0, composedDimensions.indexOf('x')),
    10,
  ),
  height: parseInt(
    composedDimensions.substring(composedDimensions.indexOf('x') + 1),
    10,
  ),
});

/**
 * Natural sort comparison function that handles numbers within strings correctly
 * Example: "file1", "file2", "file10" instead of "file1", "file10", "file2"
 */
export const naturalCompare = (a: string, b: string): number => {
  // Split strings into chunks of text and numbers
  const regex = /(\d+)|(\D+)/g;

  const aParts = a.match(regex) || [];
  const bParts = b.match(regex) || [];

  const maxLength = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < maxLength; i++) {
    const aPart = aParts[i] || '';
    const bPart = bParts[i] || '';

    // If both parts are numeric, compare as numbers
    const aIsNum = /^\d+$/.test(aPart);
    const bIsNum = /^\d+$/.test(bPart);

    if (aIsNum && bIsNum) {
      const aNum = parseInt(aPart, 10);
      const bNum = parseInt(bPart, 10);
      if (aNum !== bNum) {
        return aNum - bNum;
      }
    } else {
      // Compare as strings (case-insensitive)
      const comparison = aPart.localeCompare(bPart);
      if (comparison !== 0) {
        return comparison;
      }
    }
  }

  return 0;
};
