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
