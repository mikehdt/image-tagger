import { useEffect } from 'react';

/**
 * Hook to handle anchor scrolling after navigation
 * This is needed because Next.js client-side navigation doesn't automatically
 * scroll to anchors like traditional page loads do
 */
export const useAnchorScrolling = () => {
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        // Small delay to ensure DOM is ready after navigation
        const timeoutId = setTimeout(() => {
          const element = document.getElementById(hash.substring(1));
          if (element) {
            // Try to find the parent container (asset-group) for better positioning
            const container = element.parentElement;
            const targetElement = container || element;

            const headerOffset = 96; // 6rem = 96px (matching top-24)
            const elementPosition =
              targetElement.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth',
            });
          }
        }, 100);

        return () => clearTimeout(timeoutId);
      }
    };

    // Check hash on component mount/route change
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
};
