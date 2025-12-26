// Utility functions for tag state management
import { ImageAsset, TagState } from './types';

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
 * @public For debugging and display purposes only
 */
export const debug_getTagStateString = (state: number): string => {
  if (hasState(state, TagState.SAVED)) return 'Saved';

  const states: string[] = [];
  if (hasState(state, TagState.TO_DELETE)) states.push('ToDelete');
  if (hasState(state, TagState.TO_ADD)) states.push('ToAdd');
  if (hasState(state, TagState.DIRTY)) states.push('Dirty');

  return states.join(', ');
};

/**
 * Build a lookup map from fileId to array index for O(1) asset access
 */
export const buildImageIndexMap = (
  images: ImageAsset[],
): { [fileId: string]: number } => {
  const indexMap: { [fileId: string]: number } = {};
  for (let i = 0; i < images.length; i++) {
    indexMap[images[i].fileId] = i;
  }
  return indexMap;
};
