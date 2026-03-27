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
 * Calculate aspect ratio from width and height using greatest common divisor
 * @param width The width value
 * @param height The height value
 * @returns A tuple containing the simplified width and height ratio
 */
export const getAspectRatio = (
  width: number,
  height: number,
): [number, number] => {
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  const divisor = gcd(width, height);
  return [width / divisor, height / divisor];
};

/**
 * Natural sort comparison function that handles numbers within strings correctly
 * Example: "file1", "file2", "file10" instead of "file1", "file10", "file2"
 */
const naturalCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});
export const naturalCompare = naturalCollator.compare;
