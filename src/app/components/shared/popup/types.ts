import { ReactNode, RefObject } from 'react';

export type PopupPosition =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right';

export interface PopupState {
  isOpen: boolean;
  isAnimating: boolean;
  shouldRender: boolean;
}

export interface PopupConfig {
  position?: PopupPosition;
  triggerRef?: RefObject<HTMLElement | null>;
  offset?: number;
  className?: string;
}

export interface PopupContextValue {
  activePopupId: string | null;
  openPopup: (id: string, config?: PopupConfig) => void;
  closePopup: (id: string) => void;
  closeAllPopups: () => void;
  getPopupState: (id: string) => PopupState;
  setPopupConfig: (id: string, config: PopupConfig) => void;
  getPopupConfig: (id: string) => PopupConfig | undefined;
}

export interface PopupProviderProps {
  children: ReactNode;
}

export interface PopupProps {
  id: string;
  position?: PopupPosition;
  triggerRef?: RefObject<HTMLElement | null>;
  offset?: number;
  className?: string;
  children: ReactNode;
}
