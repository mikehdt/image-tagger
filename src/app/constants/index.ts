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

// Load configuration from API with fallback defaults
let configPromise: Promise<AppConfig> | null = null;
let loadedConfig: Required<AppConfig> | null = null;

const loadConfigFromAPI = async (): Promise<AppConfig> => {
  try {
    // Use relative URL that works in both dev and production
    const response = await fetch('/api/config', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(
        `Config API returned ${response.status}:`,
        response.statusText,
      );
      return {};
    }

    const config = await response.json();
    console.log('Loaded config from API:', config);
    return config;
  } catch (error) {
    console.warn('Failed to load config from API, using defaults:', error);
    return {};
  }
};

// Get configuration (async)
const getConfig = (): Promise<Required<AppConfig>> => {
  if (loadedConfig) {
    return Promise.resolve(loadedConfig);
  }

  if (!configPromise) {
    configPromise = loadConfigFromAPI();
  }

  return configPromise.then((config) => {
    loadedConfig = {
      batchSize: config.batchSize ?? DEFAULT_CONFIG.batchSize,
      projectsFolder: config.projectsFolder ?? DEFAULT_CONFIG.projectsFolder,
    };
    return loadedConfig;
  });
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
