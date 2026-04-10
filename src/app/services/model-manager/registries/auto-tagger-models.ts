/**
 * Auto-tagger models wrapped as DownloadableModel entries.
 *
 * This bridges the existing auto-tagger provider model definitions
 * into the unified model manager format. The auto-tagger providers
 * remain the source of truth for inference-specific details; this
 * module only re-exports them in a download-compatible shape.
 */

import type { TaggerModel } from '../../auto-tagger/types';
import type { DownloadableModel } from '../types';

/**
 * Convert a TaggerModel to a DownloadableModel.
 */
export function taggerModelToDownloadable(
  model: TaggerModel,
): DownloadableModel {
  return {
    id: model.id,
    name: model.name,
    repoId: model.repoId,
    files: model.files,
    description: model.description,
    isDefault: model.isDefault,
    vramEstimate: model.vramEstimate,
    feature: 'auto-tagger',
  };
}
