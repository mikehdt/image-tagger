// Shared constants for the application

// Default batch size for asset operations (loading and saving)
export const DEFAULT_BATCH_SIZE = 48;

// Hardcoded projects folder path - update this to your projects directory
// Examples:
// Windows: 'C:\\Users\\YourUsername\\Pictures\\ImageProjects'
// macOS/Linux: '/Users/YourUsername/Pictures/ImageProjects'
export const PROJECTS_FOLDER = '';

// Supported image file extensions (including the dot)
export const SUPPORTED_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
] as const;

// Project info folder name (contains project.json and thumbnail images)
export const PROJECT_INFO_FOLDER = '_info';

// MIME type mapping for supported image extensions
export const IMAGE_MIME_TYPES: Record<string, string> = {
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
