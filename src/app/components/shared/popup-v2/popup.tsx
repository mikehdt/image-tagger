'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { usePopup } from './popup-context';
import type { PopupProps } from './types';
import {
  adjustForViewport,
  calculateInitialStyles,
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
  const { getPopupState, getPopupConfig, setPopupConfig, finishPositioning } =
    usePopup();
  const [positionStyles, setPositionStyles] = useState<React.CSSProperties>({});

  const state = getPopupState(id);
  const config = getPopupConfig(id);

  // Set config when popup mounts or props change
  useEffect(() => {
    setPopupConfig(id, { position, triggerRef, offset, className });
  }, [id, position, triggerRef, offset, className, setPopupConfig]);

  /**
   * Calculate and apply position, adjusting for viewport if needed.
   * Uses a ref to access config to avoid useCallback dependency issues.
   */
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  });

  const calculateAndApplyPosition = useCallback(() => {
    const popup = popupRef.current;
    const currentConfig = configRef.current;
    const trigger = currentConfig?.triggerRef?.current ?? triggerRef?.current;

    if (!popup || !trigger) return;

    const desiredPosition = currentConfig?.position || position;
    const currentOffset = currentConfig?.offset ?? offset;

    // First, apply initial styles so we can measure
    const initialStyles = calculateInitialStyles(
      desiredPosition,
      currentOffset,
    );
    Object.assign(popup.style, initialStyles);

    // Force a layout so getBoundingClientRect returns accurate values
    popup.getBoundingClientRect();

    // Now check viewport and adjust if needed
    const { styles, adjustedPosition } = adjustForViewport(
      popup,
      trigger,
      desiredPosition,
      currentOffset,
    );

    // Apply adjusted styles and transform origin
    setPositionStyles(styles);
    popup.style.transformOrigin = getTransformOrigin(adjustedPosition);
  }, [position, offset, triggerRef]);

  // Handle the positioning phase when popup opens
  useEffect(() => {
    if (!state.shouldRender || !state.isPositioning) return;
    if (!popupRef.current) return;

    // We're in positioning phase - transitions are disabled via CSS class
    // Calculate position, then signal we're ready to animate
    calculateAndApplyPosition();

    // Use double rAF to ensure styles are applied before enabling transitions
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Positioning complete - tell context to enable transitions and animate
        finishPositioning(id);
      });
    });
  }, [
    state.shouldRender,
    state.isPositioning,
    calculateAndApplyPosition,
    finishPositioning,
    id,
  ]);

  // Handle window resize while popup is open
  // Use rAF to batch with browser's render cycle and avoid jitter
  useEffect(() => {
    if (!state.isOpen) return;

    let rafId: number | null = null;

    const handleResize = () => {
      // Cancel any pending frame
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      // Schedule recalculation for next frame
      rafId = requestAnimationFrame(() => {
        calculateAndApplyPosition();
        rafId = null;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [state.isOpen, calculateAndApplyPosition]);

  // Don't render if not needed
  if (!state.shouldRender) {
    return null;
  }

  // Determine if transitions should be enabled
  // Disabled during positioning phase to prevent "fly-in" effect
  const transitionsEnabled = !state.isPositioning;

  return (
    <div
      ref={popupRef}
      data-popup-id={id}
      style={positionStyles}
      className={`${
        transitionsEnabled ? 'transition-all duration-150 ease-in-out' : ''
      } ${
        state.isOpen
          ? 'scale-100 opacity-100'
          : 'pointer-events-none scale-95 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
};
