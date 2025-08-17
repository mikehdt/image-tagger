// Shared constants for the application

// Configuration interface
interface AppConfig {
  batchSize?: number;
  projectsFolder?: string;
}

// Default values
const DEFAULT_CONFIG: Required<AppConfig> = {
  batchSize: 48,
  projectsFolder: 'public/assets',
};

// Synchronous constants with defaults (for immediate use)
// These will be the defaults until config is loaded
export const DEFAULT_BATCH_SIZE = DEFAULT_CONFIG.batchSize;

// Supported image file extensions (including the dot)
const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

// MIME type mapping for supported image extensions
const IMAGE_MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
} as const;

// Helper function to check if a file extension is a supported image format
export const isSupportedImageExtension = (extension: string): boolean => {
  return (SUPPORTED_IMAGE_EXTENSIONS as readonly string[]).includes(
    extension.toLowerCase(),
  );
};

// Helper function to get MIME type for an image extension
export const getImageMimeType = (extension: string): string => {
  const mimeType = IMAGE_MIME_TYPES[extension.toLowerCase()];
  return mimeType || 'application/octet-stream';
};
