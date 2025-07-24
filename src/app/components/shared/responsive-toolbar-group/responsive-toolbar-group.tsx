import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { Button } from '../button';

interface ResponsiveToolbarGroupProps {
  /** Icon to display as the visual indicator/button */
  icon: ReactNode;
  /** Title/tooltip for the group */
  title?: string;
  /** Child components to render inside the toolbar/popover */
  children: ReactNode;
  /** Preferred position for the popover - defaults to center */
  position?: 'left' | 'center' | 'right';
}

/**
 * A responsive toolbar group that shows an inactive icon with inline actions at larger screens,
 * and becomes an active icon button with popover at smaller screens (max-md).
 */
export const ResponsiveToolbarGroup = ({
  icon,
  title,
  children,
  position = 'center',
}: ResponsiveToolbarGroupProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Initialize position state based on the position prop to avoid first-render issues
  const [popoverPosition, setPopoverPosition] = useState(() => {
    if (position === 'left') {
      return { left: '0px', transform: 'translateX(0)' };
    } else if (position === 'right') {
      return { left: '100%', transform: 'translateX(-100%)' };
    } else {
      return { left: '50%', transform: 'translateX(-50%)' };
    }
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const childrenContainerRef = useRef<HTMLDivElement>(null);

  // Detect mobile breakpoint and handle resize
  useEffect(() => {
    const checkIsMobile = () => {
      const isMobileView = window.innerWidth < 768; // md breakpoint

      setIsMobile(isMobileView);

      // Close popover when switching to desktop
      if (!isMobileView && isPopoverOpen) {
        setIsPopoverOpen(false);
      }
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, [isPopoverOpen, isMobile]);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsPopoverOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isPopoverOpen) {
        setIsPopoverOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isPopoverOpen && isMobile) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isPopoverOpen, isMobile]);

  // Calculate position before opening popover
  const calculatePopoverPosition = useCallback(() => {
    if (!isMobile || !containerRef.current || !childrenContainerRef.current) {
      return { left: '50%', transform: 'translateX(-50%)' };
    }

    const container = containerRef.current;
    const childrenContainer = childrenContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const margin = 16; // Minimum margin from viewport edges

    // Temporarily show the popover off-screen to measure its actual width
    const originalStyle = {
      position: childrenContainer.style.position,
      visibility: childrenContainer.style.visibility,
      opacity: childrenContainer.style.opacity,
      left: childrenContainer.style.left,
      top: childrenContainer.style.top,
    };

    // Position off-screen but visible to get measurements
    childrenContainer.style.position = 'fixed';
    childrenContainer.style.visibility = 'hidden';
    childrenContainer.style.opacity = '0';
    childrenContainer.style.left = '-9999px';
    childrenContainer.style.top = '-9999px';

    // Force a layout to get accurate dimensions
    void childrenContainer.offsetHeight; // Force reflow

    const actualPopoverWidth = childrenContainer.offsetWidth;

    // Restore original styles
    Object.assign(childrenContainer.style, originalStyle);

    let leftPosition: string;
    let transform: string;

    // Calculate based on desired position
    if (position === 'left') {
      // Start from left edge of container
      leftPosition = '0px';
      transform = 'translateX(0)';

      // Check if it would go off the right edge
      const containerLeft = containerRect.left;
      if (containerLeft + actualPopoverWidth > viewportWidth - margin) {
        // Move left to fit, but not closer than margin from left edge
        const adjustedLeft = Math.max(margin - containerLeft, 0);
        leftPosition = `${adjustedLeft}px`;
      }
    } else if (position === 'right') {
      // Start from right edge of container
      leftPosition = '100%';
      transform = 'translateX(-100%)';

      // Check if it would go off the left edge
      const containerRight = containerRect.right;
      if (containerRight - actualPopoverWidth < margin) {
        // Move right to fit, keeping margin from right edge
        const adjustedRight = Math.min(
          viewportWidth - margin - containerRect.left,
          containerRect.width,
        );
        leftPosition = `${adjustedRight}px`;
        transform = 'translateX(-100%)';
      }
    } else {
      // Center position (default)
      const containerCenterX = containerRect.left + containerRect.width / 2;
      const popoverLeft = containerCenterX - actualPopoverWidth / 2;
      const popoverRight = containerCenterX + actualPopoverWidth / 2;

      // Default to center alignment
      leftPosition = '50%';
      transform = 'translateX(-50%)';

      // Check if popover would go off the left edge
      if (popoverLeft < margin) {
        // Position from left edge with margin
        const offsetFromContainer = margin - containerRect.left;
        leftPosition = `${offsetFromContainer}px`;
        transform = 'translateX(0)';
      }
      // Check if popover would go off the right edge
      else if (popoverRight > viewportWidth - margin) {
        // Position from right edge with margin
        const offsetFromContainer = viewportWidth - margin - containerRect.left;
        leftPosition = `${offsetFromContainer}px`;
        transform = 'translateX(-100%)';
      }
    }

    return { left: leftPosition, transform };
  }, [isMobile, position]);

  const handleButtonClick = useCallback(() => {
    if (!isPopoverOpen && isMobile) {
      // Calculate position first, then open
      const newPosition = calculatePopoverPosition();
      setPopoverPosition(newPosition);
      // Use a small delay to ensure position is set before opening
      setTimeout(() => setIsPopoverOpen(true), 0);
    } else {
      setIsPopoverOpen(false);
    }
  }, [isPopoverOpen, isMobile, calculatePopoverPosition]);

  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (!isPopoverOpen && isMobile) {
        // Calculate position first, then open
        const newPosition = calculatePopoverPosition();
        setPopoverPosition(newPosition);
        // Use a small delay to ensure position is set before opening
        setTimeout(() => setIsPopoverOpen(true), 0);
      } else {
        setIsPopoverOpen(false);
      }
      e.preventDefault();
    } else if (e.key === 'Escape' && isPopoverOpen) {
      setIsPopoverOpen(false);
      e.preventDefault();
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Container with icon and children */}
      <div className="flex items-center rounded-md bg-slate-100 px-1 py-1">
        {/* Desktop: inactive icon with border */}
        <span
          className="mr-1 border-r border-dotted border-r-slate-400 py-1.5 pr-1 text-slate-400 max-md:hidden"
          title={title}
        >
          {icon}
        </span>

        {/* Mobile: active icon button */}
        <span className="md:hidden">
          <Button
            ref={buttonRef}
            type="button"
            onClick={handleButtonClick}
            onKeyDown={handleButtonKeyDown}
            variant="ghost"
            isPressed={isPopoverOpen}
            title={title}
            aria-haspopup="true"
            aria-expanded={isPopoverOpen}
          >
            {icon}
          </Button>
        </span>

        {/* Children container - renders inline on desktop, as popover on mobile */}
        <div
          ref={childrenContainerRef}
          style={
            isMobile
              ? {
                  left: popoverPosition.left,
                  transform: popoverPosition.transform,
                }
              : undefined
          }
          className={
            isMobile
              ? `absolute top-full z-10 mt-1 min-w-max rounded-md border border-slate-200 bg-slate-50 shadow-lg transition-all focus:outline-none ${
                  // Transform origin based on position for natural animation
                  position === 'left'
                    ? 'origin-top-left'
                    : position === 'right'
                      ? 'origin-top-right'
                      : 'origin-[0_top]'
                } ${
                  isPopoverOpen
                    ? 'scale-100 opacity-100'
                    : 'pointer-events-none scale-95 opacity-0'
                }`
              : 'flex space-x-1'
          }
          role={isMobile ? 'menu' : undefined}
        >
          <div
            className={
              isMobile
                ? 'flex items-center space-x-1 p-2'
                : 'flex items-center space-x-1'
            }
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
