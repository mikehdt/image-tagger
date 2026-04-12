/**
 * Thunk to flush pending auto-tagger results from localStorage into Redux.
 *
 * Called after tagging completes (if the project is loaded) and after
 * project asset loading finishes (to reconcile results that arrived
 * while the user was away from the project).
 *
 * Handles both ONNX tag results (applied as TO_ADD tags) and VLM caption
 * results (applied as captionText, which is dirty until the user saves).
 */

import {
  getPendingTagResults,
  type PendingTagResult,
  setPendingTagResults,
} from '@/app/services/auto-tagger/pending-tag-results';

import type { AppThunk } from '../index';
import { addMultipleTags, setCaptionText } from './index';

/**
 * Read pending results from localStorage and apply them to loaded assets.
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
      const assetLoaded = imageIndexById[result.fileId] !== undefined;
      const hasTags = result.tags && result.tags.length > 0;
      const hasCaption = result.caption && result.caption.length > 0;

      if (!hasTags && !hasCaption) continue;

      if (!assetLoaded) {
        // Project not loaded — keep for later reconciliation
        remaining.push(result);
        continue;
      }

      if (hasTags) {
        dispatch(
          addMultipleTags({
            assetId: result.fileId,
            tagNames: result.tags!,
            position: result.position,
          }),
        );
      }

      if (hasCaption) {
        dispatch(
          setCaptionText({
            assetId: result.fileId,
            text: result.caption!,
          }),
        );
      }
    }

    setPendingTagResults(projectFolderName, remaining);
  };
}
