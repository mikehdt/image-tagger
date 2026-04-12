/**
 * VLM Captioning Provider
 * Natural-language image captioning using vision-language models via Python sidecar
 */

import type { TaggerProvider } from '../../types';
import { VLM_MODELS } from './models';

export const vlmProvider: TaggerProvider = {
  id: 'vlm',
  name: 'Natural Language Captioning',
  description: 'Vision-language models for natural-language captions.',
  providerType: 'vlm',
  models: VLM_MODELS,
};
