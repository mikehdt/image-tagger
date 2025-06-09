// Utility functions for tag state management
import { TagState } from './types';

export const hasState = (state: number, flag: TagState): boolean =>
  (state & flag) !== 0;

export const addState = (state: number, flag: TagState): number => state | flag;

export const removeState = (state: number, flag: TagState): number =>
  state & ~flag;

export const toggleState = (state: number, flag: TagState): number =>
  state ^ flag;

// For debugging and display purposes
export const getTagStateString = (state: number): string => {
  if (state === TagState.SAVED) return 'Saved';

  const states: string[] = [];
  if (hasState(state, TagState.TO_DELETE)) states.push('ToDelete');
  if (hasState(state, TagState.TO_ADD)) states.push('ToAdd');
  if (hasState(state, TagState.DIRTY)) states.push('Dirty');

  return states.join('+');
};
