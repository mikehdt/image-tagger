/**
 * Thunk to flush pending auto-tagger results from localStorage into Redux.
 *
 * Called after tagging completes (if the project is loaded) and after
 * project asset loading finishes (to reconcile results that arrived
 * while the user was away from the project).
 */

import {
  getPendingTagResults,
  type PendingTagResult,
  setPendingTagResults,
} from '@/app/services/auto-tagger/pending-tag-results';

import type { AppThunk } from '../index';
import { addMultipleTags } from './index';

/**
 * Read pending tag results from localStorage and apply them to loaded assets.
 * Only clears results that were successfully applied. If the project isn't
 * loaded (assets not in store), unflushed results remain in localStorage
 * for reconciliation when the user returns.
 */
export function flushPendingTagResults(projectFolderName: string): AppThunk {
  return (dispatch, getState) => {
    const results = getPendingTagResults(projectFolderName);
    if (results.length === 0) return;

    const { imageIndexById } = getState().assets;
    const remaining: PendingTagResult[] = [];

    for (const result of results) {
      if (
        result.tags.length > 0 &&
        imageIndexById[result.fileId] !== undefined
      ) {
        dispatch(
          addMultipleTags({
            assetId: result.fileId,
            tagNames: result.tags,
            position: result.position,
          }),
        );
      } else if (result.tags.length > 0) {
        // Asset not loaded — keep for later reconciliation
        remaining.push(result);
      }
    }

    setPendingTagResults(projectFolderName, remaining);
  };
}
