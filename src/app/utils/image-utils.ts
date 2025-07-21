/**
 * Generate a URL for an image that can be used with Next.js Image component
 * This works with images from any folder on disk via our API route
 */
export const getImageUrl = (fileName: string, projectPath?: string): string => {
  if (!projectPath) {
    // Fallback to public/assets for backward compatibility
    return `/assets/${fileName}`;
  }

  // Use our API route to serve images from any folder
  const encodedProjectPath = encodeURIComponent(projectPath);
  const encodedFileName = encodeURIComponent(fileName);

  return `/api/images/${encodedFileName}?projectPath=${encodedProjectPath}`;
};

/**
 * Get the current project path from sessionStorage (client-side only)
 */
export const getCurrentProjectPath = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return sessionStorage.getItem('selectedProject');
};

/**
 * Kohya SS model configurations for different Stable Diffusion versions
 */
type KohyaConfig = {
  targetResolution: number; // Base resolution (e.g., 512, 768, 1024)
  stepSize: number; // Increment size (typically 64)
  minSize: number; // Minimum bucket dimension
};

export const KOHYA_CONFIGS = {
  SD15: { targetResolution: 512, stepSize: 64, minSize: 256 } as KohyaConfig,
  SDXL_768: {
    targetResolution: 768,
    stepSize: 64,
    minSize: 256,
  } as KohyaConfig,
  SDXL_1024: {
    targetResolution: 1024,
    stepSize: 64,
    minSize: 256,
  } as KohyaConfig,
} as const;

/**
 * Calculate the Kohya SS bucket dimensions for a given image
 * Based on Kohya SS bucketing logic where:
 * - Buckets are in 64-pixel increments
 * - Bucket width + height = targetResolution * 2 (for square max resolution)
 * - Images are assigned to minimize crop loss while preserving area
 */
export const calculateKohyaBucket = (
  imageWidth: number,
  imageHeight: number,
  config: KohyaConfig = KOHYA_CONFIGS.SDXL_1024, // Default to SDXL 1024
): { width: number; height: number; aspectRatio: number } => {
  const TARGET_PERIMETER = config.targetResolution * 2;
  const STEP_SIZE = config.stepSize;
  const MIN_SIZE = config.minSize;
  const MAX_SIZE = TARGET_PERIMETER - MIN_SIZE; // Max individual dimension

  // Generate all possible buckets
  const buckets: Array<{ width: number; height: number; area: number }> = [];

  for (let width = MIN_SIZE; width <= MAX_SIZE; width += STEP_SIZE) {
    const height = TARGET_PERIMETER - width;
    if (height >= MIN_SIZE && height <= MAX_SIZE) {
      buckets.push({
        width,
        height,
        area: width * height,
      });
    }
  }

  let bestBucket = buckets[0];
  let bestScore = -Infinity;

  // For each bucket, calculate the score based on minimal loss
  for (const bucket of buckets) {
    // Calculate scale factor needed to fill the bucket completely
    const scaleToFillWidth = bucket.width / imageWidth;
    const scaleToFillHeight = bucket.height / imageHeight;

    // Use the larger scale factor to ensure bucket is completely filled
    const scale = Math.max(scaleToFillWidth, scaleToFillHeight);

    // Calculate scaled image dimensions
    const scaledWidth = imageWidth * scale;
    const scaledHeight = imageHeight * scale;

    // Calculate excess area that will be cropped off
    const scaledArea = scaledWidth * scaledHeight;
    const excessArea = scaledArea - bucket.area;

    // Score = bucket area - excess area (higher is better)
    // This represents how much image content is preserved
    const score = bucket.area - excessArea;

    if (score > bestScore) {
      bestScore = score;
      bestBucket = bucket;
    }
  }

  return {
    width: bestBucket.width,
    height: bestBucket.height,
    aspectRatio: bestBucket.width / bestBucket.height,
  };
};

/**
 * Examples of convenience functions for specific Stable Diffusion versions
 */
// export const calculateSD15Bucket = (imageWidth: number, imageHeight: number) =>
//   calculateKohyaBucket(imageWidth, imageHeight, KOHYA_CONFIGS.SD15);

// export const calculateSDXL768Bucket = (
//   imageWidth: number,
//   imageHeight: number,
// ) => calculateKohyaBucket(imageWidth, imageHeight, KOHYA_CONFIGS.SDXL_768);

// export const calculateSDXL1024Bucket = (
//   imageWidth: number,
//   imageHeight: number,
// ) => calculateKohyaBucket(imageWidth, imageHeight, KOHYA_CONFIGS.SDXL_1024);
