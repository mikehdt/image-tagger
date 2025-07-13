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
  /** Additional classes for the container */
  className?: string;
  /** Classes for the popover */
  popoverClassName?: string;
}

/**
 * A responsive toolbar group that shows an inactive icon with inline actions at larger screens,
 * and becomes an active icon button with popover at smaller screens (max-md).
 */
export const ResponsiveToolbarGroup = ({
  icon,
  title,
  children,
  className = '',
  popoverClassName = '',
}: ResponsiveToolbarGroupProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({
    left: '50%',
    transform: 'translateX(-50%)',
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
  }, [isPopoverOpen]);

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

  // Update popover position when it opens to keep it centered and within viewport
  useEffect(() => {
    if (
      isPopoverOpen &&
      isMobile &&
      childrenContainerRef.current &&
      containerRef.current
    ) {
      const childrenContainer = childrenContainerRef.current;
      const container = containerRef.current;

      // Get container and children container dimensions
      const containerRect = container.getBoundingClientRect();
      const childrenRect = childrenContainer.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      // Default to center alignment
      let leftPosition = '50%';
      let transform = 'translateX(-50%)';

      // Calculate where the centered popover would be
      const childrenWidth = childrenRect.width || childrenContainer.offsetWidth;
      const containerCenterX = containerRect.left + containerRect.width / 2;
      const childrenLeft = containerCenterX - childrenWidth / 2;
      const childrenRight = containerCenterX + childrenWidth / 2;

      // Check if popover would go off the left edge
      if (childrenLeft < 10) {
        leftPosition = '0px';
        transform = 'translateX(0)';
      }
      // Check if popover would go off the right edge
      else if (childrenRight > viewportWidth - 10) {
        leftPosition = '100%';
        transform = 'translateX(-100%)';
      }

      setPopoverPosition({ left: leftPosition, transform });
    }
  }, [isPopoverOpen, isMobile]);

  const handleButtonClick = useCallback(() => {
    setIsPopoverOpen(!isPopoverOpen);
  }, [isPopoverOpen]);

  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setIsPopoverOpen(!isPopoverOpen);
      e.preventDefault();
    } else if (e.key === 'Escape' && isPopoverOpen) {
      setIsPopoverOpen(false);
      e.preventDefault();
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Container with icon and children */}
      <div className="flex items-center space-x-1 rounded-md bg-slate-100 px-1 py-1">
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
            isMobile && isPopoverOpen
              ? {
                  left: popoverPosition.left,
                  transform: popoverPosition.transform,
                }
              : undefined
          }
          className={
            isMobile
              ? `absolute top-full z-10 mt-1 min-w-max transform rounded-md border border-slate-200 bg-slate-50 shadow-lg transition-all focus:outline-none ${
                  isPopoverOpen
                    ? 'scale-100 opacity-100'
                    : 'pointer-events-none scale-95 opacity-0'
                } ${popoverClassName}`
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
