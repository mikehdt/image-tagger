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
  const [popoverPosition, setPopoverPosition] = useState({
    left: '50%',
    transform: 'translateX(-50%)',
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

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

    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isPopoverOpen]);

  // Update popover position when it opens to keep it centered and within viewport
  useEffect(() => {
    if (isPopoverOpen && popoverRef.current && containerRef.current) {
      const popover = popoverRef.current;
      const container = containerRef.current;

      // Get container and popover dimensions
      const containerRect = container.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      // Default to center alignment
      let leftPosition = '50%';
      let transform = 'translateX(-50%)';

      // Calculate where the centered popover would be
      const popoverWidth = popoverRect.width || popover.offsetWidth;
      const containerCenterX = containerRect.left + containerRect.width / 2;
      const popoverLeft = containerCenterX - popoverWidth / 2;
      const popoverRight = containerCenterX + popoverWidth / 2;

      // Check if popover would go off the left edge
      if (popoverLeft < 10) {
        leftPosition = '0px';
        transform = 'translateX(0)';
      }
      // Check if popover would go off the right edge
      else if (popoverRight > viewportWidth - 10) {
        leftPosition = '100%';
        transform = 'translateX(-100%)';
      }

      setPopoverPosition({ left: leftPosition, transform });
    }
  }, [isPopoverOpen]);

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
      {/* Large screen: inactive icon + inline actions */}
      <div className="flex items-center space-x-1 rounded-md bg-slate-100 px-1 py-1 md:flex">
        <span
          className="mr-1 border-r border-dotted border-r-slate-400 py-1.5 pr-1 max-md:hidden"
          title={title}
        >
          {icon}
        </span>
        <div className="flex space-x-1 max-md:hidden">{children}</div>

        {/* Small screen: active icon button */}
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
      </div>

      {/* Small screen: popover with actions */}
      <div
        ref={popoverRef}
        style={{
          left: popoverPosition.left,
          transform: popoverPosition.transform,
        }}
        className={`absolute top-full z-10 mt-1 min-w-max transform rounded-md border border-slate-200 bg-white shadow-lg transition-all focus:outline-none md:hidden ${
          isPopoverOpen
            ? 'scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0'
        } ${popoverClassName}`}
        role="menu"
      >
        <div className="flex items-center space-x-1 p-2">{children}</div>
      </div>
    </div>
  );
};
