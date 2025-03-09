import { ImageDimensions } from '../store/slice-assets';

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
