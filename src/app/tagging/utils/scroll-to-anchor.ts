/**
 * Utility function to smoothly scroll to an anchor element with proper header offset
 * and update the URL hash without triggering navigation
 */
export const scrollToAnchor = (anchorId: string) => {
  const element = document.getElementById(anchorId);
  if (element) {
    // Try to find the parent container (asset-group) for better positioning
    const container = element.parentElement;
    const targetElement = container || element;

    const headerOffset = 96; // 6rem = 96px (matching top-24)
    const elementPosition =
      targetElement.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - headerOffset;

    // Update the URL hash without triggering navigation
    const newUrl = `${window.location.pathname}${window.location.search}#${anchorId}`;
    window.history.replaceState(null, '', newUrl);

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  }
};
