import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  PopupConfig,
  PopupContextValue,
  PopupProviderProps,
  PopupState,
} from './types';
import { ANIMATION_DURATION } from './utils';

const PopupContext = createContext<PopupContextValue | null>(null);

export const PopupProvider: React.FC<PopupProviderProps> = ({ children }) => {
  const [activePopupId, setActivePopupId] = useState<string | null>(null);
  const [popupStates, setPopupStates] = useState<Map<string, PopupState>>(
    new Map(),
  );
  const popupConfigsRef = useRef<Map<string, PopupConfig>>(new Map());

  const getPopupState = useCallback(
    (id: string): PopupState => {
      return (
        popupStates.get(id) || {
          isOpen: false,
          isAnimating: false,
          shouldRender: false,
        }
      );
    },
    [popupStates],
  );

  const getPopupConfig = useCallback((id: string): PopupConfig | undefined => {
    return popupConfigsRef.current.get(id);
  }, []);

  const setPopupConfig = useCallback((id: string, config: PopupConfig) => {
    popupConfigsRef.current.set(id, config);
  }, []);

  const updatePopupState = useCallback(
    (id: string, updates: Partial<PopupState>) => {
      setPopupStates((prev) => {
        const current = prev.get(id) || {
          isOpen: false,
          isAnimating: false,
          shouldRender: false,
        };
        const newState = { ...current, ...updates };
        const newMap = new Map(prev);
        newMap.set(id, newState);
        return newMap;
      });
    },
    [],
  );

  const closePopup = useCallback(
    (id: string) => {
      const state = getPopupState(id);
      if (!state.isOpen) return;

      // Start closing animation
      updatePopupState(id, {
        isOpen: false,
        isAnimating: true,
      });

      // After animation completes, stop rendering
      setTimeout(() => {
        updatePopupState(id, {
          isAnimating: false,
          shouldRender: false,
        });
        if (activePopupId === id) {
          setActivePopupId(null);
        }
      }, ANIMATION_DURATION);
    },
    [activePopupId, getPopupState, updatePopupState],
  );

  const closeAllPopups = useCallback(() => {
    if (activePopupId) {
      closePopup(activePopupId);
    }
  }, [activePopupId, closePopup]);

  const openPopup = useCallback(
    (id: string, config?: PopupConfig) => {
      // Close any currently open popup first
      if (activePopupId && activePopupId !== id) {
        closePopup(activePopupId);
      }

      // Update config if provided
      if (config) {
        popupConfigsRef.current.set(id, {
          ...popupConfigsRef.current.get(id),
          ...config,
        });
      }

      // Start opening sequence
      setActivePopupId(id);
      updatePopupState(id, {
        shouldRender: true,
        isAnimating: true,
        isOpen: false, // Will be set to true after render
      });

      // Use requestAnimationFrame to ensure DOM is updated before starting animation
      requestAnimationFrame(() => {
        updatePopupState(id, {
          isOpen: true,
          isAnimating: false,
        });
      });
    },
    [activePopupId, closePopup, updatePopupState],
  );

  // Handle escape key to close active popup
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && activePopupId) {
        closePopup(activePopupId);
      }
    };

    if (activePopupId) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [activePopupId, closePopup]);

  // Handle click outside to close active popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!activePopupId) return;

      const config = getPopupConfig(activePopupId);
      const triggerElement = config?.triggerRef?.current;

      // Check if click is outside both trigger and popup
      const target = event.target as Node;
      const popupElement = document.querySelector(
        `[data-popup-id="${activePopupId}"]`,
      );

      if (
        triggerElement &&
        !triggerElement.contains(target) &&
        popupElement &&
        !popupElement.contains(target)
      ) {
        closePopup(activePopupId);
      }
    };

    if (activePopupId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activePopupId, closePopup, getPopupConfig]);

  const contextValue: PopupContextValue = {
    activePopupId,
    openPopup,
    closePopup,
    closeAllPopups,
    getPopupState,
    setPopupConfig,
    getPopupConfig,
  };

  return (
    <PopupContext.Provider value={contextValue}>
      {children}
    </PopupContext.Provider>
  );
};

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
};
