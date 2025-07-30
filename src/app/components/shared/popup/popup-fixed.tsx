import React, { useEffect, useRef } from 'react';

import { usePopup } from './popup-context';
import { PopupProps } from './types';
import {
  calculatePopupPosition,
  DEFAULT_OFFSET,
  getTransformOrigin,
} from './utils';

export const Popup: React.FC<PopupProps> = ({
  id,
  position = 'bottom',
  triggerRef,
  offset = DEFAULT_OFFSET,
  className = '',
  children,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const { getPopupState, getPopupConfig, setPopupConfig } = usePopup();

  const state = getPopupState(id);
  const config = getPopupConfig(id);

  console.log(
    `Popup ${id} render - state:`,
    state,
    'shouldRender:',
    state.shouldRender,
  );

  // Set config when popup mounts or props change
  useEffect(() => {
    setPopupConfig(id, { position, triggerRef, offset, className });
  }, [id, position, triggerRef, offset, className, setPopupConfig]);

  // Calculate position when popup opens
  useEffect(() => {
    if (state.shouldRender && popupRef.current && config?.triggerRef?.current) {
      // Force a layout to ensure accurate measurements
      const popup = popupRef.current;
      void popup.offsetHeight; // Force reflow

      const result = calculatePopupPosition(
        config.triggerRef.current,
        popup,
        config.position || position,
        config.offset || offset,
      );

      // Apply calculated styles
      Object.assign(popup.style, result.styles);

      // Set transform origin for smooth animation
      popup.style.transformOrigin = getTransformOrigin(result.position);
    }
  }, [state.shouldRender, config, position, offset]);

  // Don't render if not needed
  if (!state.shouldRender) {
    return null;
  }

  return (
    <div
      ref={popupRef}
      data-popup-id={id}
      className={`transition-all duration-150 ease-in-out ${
        state.isOpen
          ? 'scale-100 opacity-100'
          : 'pointer-events-none scale-95 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
};
