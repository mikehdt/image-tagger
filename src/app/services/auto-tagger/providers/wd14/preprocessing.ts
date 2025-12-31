/**
 * WD14 image preprocessing
 * Matches the preprocessing from kohya-ss/sd-scripts tag_images_by_wd14_tagger.py
 *
 * Requirements:
 * - Input size: 448x448
 * - Colour space: BGR (not RGB)
 * - Padding: Square with white (255) before resize
 * - Normalisation: None (0-255 range as float32)
 * - Tensor format: NHWC [batch, height, width, channels]
 */

import sharp from 'sharp';

const IMAGE_SIZE = 448;

/**
 * Preprocess an image for WD14 inference
 * @param imagePath Path to the image file
 * @returns Float32Array in NHWC format ready for ONNX inference
 */
export async function preprocessImage(
  imagePath: string,
): Promise<Float32Array> {
  // Load image and get metadata
  const image = sharp(imagePath);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`Could not read image dimensions: ${imagePath}`);
  }

  // Calculate padding to make the image square
  const maxDim = Math.max(metadata.width, metadata.height);

  // Resize and pad to square, then resize to target size
  // Using white background (255, 255, 255) for padding
  const resized = await image
    .resize(IMAGE_SIZE, IMAGE_SIZE, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255 },
      kernel:
        maxDim > IMAGE_SIZE ? sharp.kernel.lanczos3 : sharp.kernel.lanczos2,
    })
    .removeAlpha()
    .raw()
    .toBuffer();

  // Convert to Float32Array in NHWC format with BGR channel order
  // sharp outputs RGB, we need BGR
  const float32Data = new Float32Array(IMAGE_SIZE * IMAGE_SIZE * 3);

  for (let i = 0; i < IMAGE_SIZE * IMAGE_SIZE; i++) {
    const srcIdx = i * 3;
    const dstIdx = i * 3;

    // RGB to BGR conversion
    float32Data[dstIdx] = resized[srcIdx + 2]; // B
    float32Data[dstIdx + 1] = resized[srcIdx + 1]; // G
    float32Data[dstIdx + 2] = resized[srcIdx]; // R
  }

  return float32Data;
}

/**
 * Preprocess multiple images in a batch
 * @param imagePaths Array of paths to image files
 * @returns Float32Array containing all images in NHWC format
 */
export async function preprocessImageBatch(
  imagePaths: string[],
): Promise<Float32Array> {
  const batchSize = imagePaths.length;
  const imageSize = IMAGE_SIZE * IMAGE_SIZE * 3;
  const batchData = new Float32Array(batchSize * imageSize);

  const preprocessed = await Promise.all(imagePaths.map(preprocessImage));

  for (let i = 0; i < batchSize; i++) {
    batchData.set(preprocessed[i], i * imageSize);
  }

  return batchData;
}

export { IMAGE_SIZE };
