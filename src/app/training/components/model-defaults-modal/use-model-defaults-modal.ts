import { useCallback, useSyncExternalStore } from 'react';

/**
 * Lightweight shared state for the model defaults modal open/close,
 * without needing Redux or a context provider above both the
 * training menu and the config form.
 */

let isOpen = false;
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notify() {
  for (const listener of listeners) listener();
}

function getSnapshot() {
  return isOpen;
}

function getServerSnapshot() {
  return false;
}

export function useModelDefaultsModal() {
  const open = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const openModal = useCallback(() => {
    isOpen = true;
    notify();
  }, []);

  const closeModal = useCallback(() => {
    isOpen = false;
    notify();
  }, []);

  return { isOpen: open, openModal, closeModal };
}
