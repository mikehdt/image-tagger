'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useModalPortal } from './modal-provider';

type ModalProps = {
  /**
   * Whether the modal is currently open
   */
  isOpen: boolean;
  /**
   * Function to close the modal
   */
  onClose: () => void;
  /**
   * Content to render inside the modal
   */
  children: React.ReactNode;
  /**
   * Optional custom class names for the modal container
   */
  className?: string;
  /**
   * Optional custom animation duration
   * This is just for documentation - actual duration is controlled by Tailwind classes
   */
  animationDuration?: never;
};

/**
 * A customizable modal component that dims the background and focuses on content
 * - Dims the UI behind it (clickable to dismiss)
 * - Resets when dismissed (doesn't maintain state)
 * - Customizable layout and design
 * - Remains centered and responsive
 * - Smooth fade in/out animations
 * - Includes dismiss button (X)
 */
export const Modal = ({
  isOpen,
  onClose,
  children,
  className = '',
}: ModalProps) => {
  // State to control the visibility of the modal for animation purposes
  const [isVisible, setIsVisible] = useState(false);

  // State to determine if the modal should be completely unmounted
  const [shouldUnmount, setShouldUnmount] = useState(!isOpen);

  // Animation duration in ms (matches the Tailwind duration-300 class)
  const ANIMATION_DURATION = 300;

  // Ref to track the modal container element
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle ESC key press to close the modal
  const handleEscapeKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose],
  );

  // This effect handles the modal open/close animation state
  useEffect(() => {
    let rafId: number;

    // This function repeatedly checks if the modal element exists in the DOM
    // and only starts the animation once it does
    const checkAndAnimate = () => {
      if (modalRef.current !== null) {
        // Element exists in DOM, we can safely start the animation
        setIsVisible(true);
      } else if (isOpen) {
        // Element doesn't exist yet, keep checking
        rafId = requestAnimationFrame(checkAndAnimate);
      }
    };

    if (isOpen) {
      // First ensure the component is mounted but invisible
      setShouldUnmount(false);
      setIsVisible(false);

      // Start checking for the DOM element using requestAnimationFrame
      // This ensures we only animate when the element is actually in the DOM
      rafId = requestAnimationFrame(checkAndAnimate);
    } else {
      // When closing, first trigger the fade-out animation
      setIsVisible(false);

      // Use nested requestAnimationFrames to approximate the animation duration
      // This gives us better alignment with the browser's rendering cycle
      const startTime = performance.now();
      const animateUnmount = (currentTime: number) => {
        if (currentTime - startTime >= ANIMATION_DURATION) {
          // Animation duration elapsed, now unmount
          setShouldUnmount(true);
        } else {
          // Keep waiting, ask for another frame
          rafId = requestAnimationFrame(animateUnmount);
        }
      };

      rafId = requestAnimationFrame(animateUnmount);
    }

    // Clean up all possible async operations
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [isOpen, ANIMATION_DURATION]);

  useEffect(() => {
    // Add event listener for ESC key
    document.addEventListener('keydown', handleEscapeKey);

    // Lock body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscapeKey]);

  // Get the portal container
  const portalContainer = useModalPortal();

  // Don't render anything if we should unmount the component
  // This only happens after the fade-out animation has completed
  if (shouldUnmount) {
    return null;
  }

  // Use createPortal to render modal at the document body level
  return portalContainer
    ? createPortal(
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ease-in-out ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop overlay - clickable to close */}
          <div
            className={`absolute inset-0 bg-black transition-opacity duration-300 ease-in-out ${
              isVisible ? 'opacity-60' : 'opacity-0'
            }`}
            onClick={onClose}
          />

          {/* Modal container */}
          <div
            ref={modalRef}
            className={`relative max-h-[90vh] max-w-[90vw] overflow-auto bg-white p-6 shadow-lg transition-all duration-300 ease-in-out ${
              isVisible
                ? 'translate-y-0 scale-100 opacity-100'
                : 'translate-y-4 scale-95 opacity-0'
            } ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={onClose}
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Modal content */}
            <div className="mt-2">{children}</div>
          </div>
        </div>,
        portalContainer,
      )
    : null;
};
