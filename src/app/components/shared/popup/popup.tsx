'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { usePopup } from './popup-context';
import type { PopupProps } from './types';
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
  disableOverflowHandling = false,
  onPositioned,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const { getPopupState, getPopupConfig, setPopupConfig, finishPositioning } =
    usePopup();
  const [positionStyles, setPositionStyles] = useState<React.CSSProperties>({});
  const [isConstrained, setIsConstrained] = useState(false);
  // Store the natural width measured during positioning phase
  // This is needed for resize calculations since scrollWidth changes once constrained
  const naturalWidthRef = useRef<number | null>(null);

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

  const calculateAndApplyPosition = useCallback(
    (isInitialPositioning: boolean = false) => {
      const popup = popupRef.current;
      const currentConfig = configRef.current;
      const trigger = currentConfig?.triggerRef?.current ?? triggerRef?.current;

      if (!popup || !trigger) return;

      const desiredPosition = currentConfig?.position || position;
      const currentOffset = currentConfig?.offset ?? offset;

      // For initial positioning, measure and store the natural width
      // For resize, reuse the stored width (scrollWidth changes once constrained)
      let popupWidth: number;
      if (isInitialPositioning || naturalWidthRef.current === null) {
        popupWidth = popup.scrollWidth;
        naturalWidthRef.current = popupWidth;
      } else {
        popupWidth = naturalWidthRef.current;
      }

      const triggerRect = trigger.getBoundingClientRect();

      // Calculate final position using pure math (no DOM manipulation)
      const {
        styles,
        adjustedPosition,
        isConstrained: constrained,
      } = calculatePopupPosition(
        popupWidth,
        triggerRect,
        desiredPosition,
        currentOffset,
        disableOverflowHandling,
      );

      // Add transform origin to styles
      styles.transformOrigin = getTransformOrigin(adjustedPosition);

      // Apply everything through React state
      setPositionStyles(styles);
      setIsConstrained(constrained);
    },
    [position, offset, triggerRef, disableOverflowHandling],
  );

  // Handle the positioning phase when popup opens
  useEffect(() => {
    if (!state.shouldRender || !state.isPositioning) return;
    if (!popupRef.current) return;

    // Clear the stored natural width so we measure fresh
    naturalWidthRef.current = null;

    // We're in positioning phase - calculate position while hidden
    calculateAndApplyPosition(true);

    // Use double rAF to ensure styles are applied before enabling transitions
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Positioning complete - tell context to enable transitions and animate
        finishPositioning(id);
        // Notify consumer that popup is positioned and about to be visible
        onPositioned?.();
      });
    });
  }, [
    state.shouldRender,
    state.isPositioning,
    calculateAndApplyPosition,
    finishPositioning,
    id,
    onPositioned,
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

  // During positioning phase:
  // 1. Hide with visibility:hidden (prevents flash, allows measurement)
  // 2. Clear all positioning styles so we can measure natural width
  // Note: autoFocus won't work during this phase - use onPositioned callback instead
  // After positioning, apply the calculated styles
  const appliedStyles: React.CSSProperties = state.isPositioning
    ? {
        position: 'absolute',
        zIndex: 60,
        visibility: 'hidden',
      }
    : positionStyles;

  return (
    <div
      ref={popupRef}
      data-popup-id={id}
      data-constrained={isConstrained || undefined}
      style={appliedStyles}
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
