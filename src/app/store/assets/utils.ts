// Utility functions for tag state management
import { TagState } from './types';

// Bitwise & 0 would always return 0 so let's check it specifically
export const hasState = (state: number, flag: TagState): boolean =>
  flag === TagState.SAVED ? state === 0 : (state & flag) !== 0;

export const addState = (state: number, flag: TagState): number => state | flag;

/**
 * @public
 */
export const removeState = (state: number, flag: TagState): number =>
  state & ~flag;

export const toggleState = (state: number, flag: TagState): number =>
  state ^ flag;

/**
 * @public For debugging and display purposes
 */
export const debug_getTagStateString = (state: number): string => {
  if (hasState(state, TagState.SAVED)) return 'Saved';

  const states: string[] = [];
  if (hasState(state, TagState.TO_DELETE)) states.push('ToDelete');
  if (hasState(state, TagState.TO_ADD)) states.push('ToAdd');
  if (hasState(state, TagState.DIRTY)) states.push('Dirty');

  return states.join('+');
};
