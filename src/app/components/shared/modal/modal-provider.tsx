'use client';

import { createContext, useContext, useRef } from 'react';

type ModalContextType = {
  portalRef: React.RefObject<HTMLDivElement | null>;
};

const ModalContext = createContext<ModalContextType | null>(null);

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const portalRef = useRef<HTMLDivElement>(null);

  return (
    <ModalContext.Provider value={{ portalRef }}>
      {children}
      {/* This div serves as the portal container for all modals */}
      <div id="modal-portal-container" ref={portalRef} />
    </ModalContext.Provider>
  );
};

export const useModalPortal = (): HTMLElement | null => {
  const context = useContext(ModalContext);

  // For client-side rendering, use the portal container if available
  if (typeof document !== 'undefined') {
    // If the portal container exists from the provider, use it
    if (context?.portalRef.current) {
      return context.portalRef.current;
    }

    // Fallback: check if portal element exists in the DOM
    const existingPortal = document.getElementById('modal-portal-container');
    if (existingPortal) {
      return existingPortal;
    }

    // Last resort: create a portal container and append it to the body
    const newPortalContainer = document.createElement('div');
    newPortalContainer.id = 'modal-portal-container';
    document.body.appendChild(newPortalContainer);
    return newPortalContainer;
  }

  // For SSR - return null until client-side rendering takes over
  return null;
};
