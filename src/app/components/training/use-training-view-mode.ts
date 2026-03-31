import { useSyncExternalStore } from 'react';

import { useAppSelector } from '@/app/store/hooks';
import {
  selectTrainingViewMode,
  type TrainingViewMode,
} from '@/app/store/preferences';

/** Default that matches the server-rendered initial state. */
const SERVER_DEFAULT: TrainingViewMode = 'intermediate';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Hydration-safe accessor for the training view mode.
 * Returns the server default on first render to avoid hydration mismatch,
 * then uses the persisted Redux value on the client.
 */
export function useTrainingViewMode(): TrainingViewMode {
  const storeValue = useAppSelector(selectTrainingViewMode);
  const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return isClient ? storeValue : SERVER_DEFAULT;
}
