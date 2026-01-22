/**
 * WD14 Tagger Provider
 * Anime/illustration focused image tagging using SmilingWolf's models
 */

import type { TaggerProvider } from '../../types';
import { ALL_WD14_MODELS } from './models';

export const wd14Provider: TaggerProvider = {
  id: 'wd14',
  name: 'WD14 Tagger',
  description:
    'Anime/illustration tagging models trained on Danbooru. Provides general tags, character recognition, and rating classification.',
  models: ALL_WD14_MODELS,
};
