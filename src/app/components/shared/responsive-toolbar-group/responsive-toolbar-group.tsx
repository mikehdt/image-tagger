import React, { ReactNode, useCallback, useRef } from 'react';

import { Button } from '../button';
import { Popup, PopupProvider, usePopup } from '../popup';

interface ResponsiveToolbarGroupProps {
  /** Icon to display as the visual indicator/button */
  icon: ReactNode;
  /** Title/tooltip for the group */
  title?: string;
  /** Child components to render inside the toolbar/popover */
  children: ReactNode;
  /** Preferred position for the popover - defaults to center */
  position?: 'left' | 'center' | 'right';
  /** Breakpoint at which to switch from mobile to desktop layout - defaults to medium */
  breakpoint?: 'medium' | 'large';
}

/**
 * Internal component that uses the popup context
 */
function ResponsiveToolbarGroupInternal({
  icon,
  title,
  children,
  position = 'center',
  breakpoint = 'medium',
}: ResponsiveToolbarGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { openPopup, closePopup, getPopupState } = usePopup();

  const popupId = 'responsive-toolbar-popover';
  const isPopoverOpen = getPopupState(popupId).isOpen;

  // Define breakpoint-specific classes
  const showDesktop = breakpoint === 'large' ? 'lg:flex' : 'md:flex';
  const hideDesktop = breakpoint === 'large' ? 'lg:hidden' : 'md:hidden';
  const hideIconOnMobile =
    breakpoint === 'large' ? 'max-lg:hidden' : 'max-md:hidden';

  // Determine popup position based on the position prop
  const popupPosition =
    position === 'left'
      ? 'bottom-left'
      : position === 'right'
        ? 'bottom-right'
        : 'bottom';

  const handleButtonClick = useCallback(() => {
    if (isPopoverOpen) {
      closePopup(popupId);
    } else {
      openPopup(popupId, {
        position: popupPosition,
        triggerRef: buttonRef,
      });
    }
  }, [isPopoverOpen, closePopup, openPopup, popupPosition]);

  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleButtonClick();
    } else if (e.key === 'Escape' && isPopoverOpen) {
      e.preventDefault();
      closePopup(popupId);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Desktop: Show icon with inline children */}
      <div
        className={`hidden min-h-9.5 items-center gap-1 rounded-md bg-slate-100 px-1 py-1 ${showDesktop}`}
      >
        <div
          className={`mr-1 border-r border-dotted border-r-slate-400 py-1.5 pr-1 text-slate-400 ${hideIconOnMobile}`}
          title={title}
        >
          {icon}
        </div>
        {children}
      </div>

      {/* Mobile: Show button that opens popover */}
      <div
        className={`flex items-center rounded-md bg-slate-100 px-1 py-1 ${hideDesktop}`}
      >
        <Button
          ref={buttonRef}
          variant="ghost"
          size="medium"
          onClick={handleButtonClick}
          onKeyDown={handleButtonKeyDown}
          isPressed={isPopoverOpen}
          title={title}
        >
          {icon}
        </Button>

        <Popup
          id={popupId}
          position={popupPosition}
          triggerRef={buttonRef}
          className="rounded-md border border-slate-200 bg-white shadow-lg focus:outline-none"
        >
          <div className="flex items-center gap-1 bg-slate-50 p-2">
            {children}
          </div>
        </Popup>
      </div>
    </div>
  );
}

/**
 * A responsive toolbar group that shows an inactive icon with inline actions at larger screens,
 * and becomes an active icon button with popover at smaller screens.
 * The breakpoint can be customized to 'medium' (md) or 'large' (lg) - defaults to 'medium'.
 * This version uses the popup system for consistent behavior across the application.
 */
export const ResponsiveToolbarGroup = (props: ResponsiveToolbarGroupProps) => {
  return (
    <PopupProvider>
      <ResponsiveToolbarGroupInternal {...props} />
    </PopupProvider>
  );
};
