/**
 * VLM Captioning Provider
 * Natural-language image captioning using vision-language models via Python sidecar
 */

import type { TaggerProvider } from '../../types';
import { VLM_MODELS } from './models';

export const vlmProvider: TaggerProvider = {
  id: 'vlm',
  name: 'NL Captioner',
  description:
    'Vision-language models for natural-language captions. Runs via the Python sidecar using GGUF quants.',
  providerType: 'vlm',
  models: VLM_MODELS,
};
