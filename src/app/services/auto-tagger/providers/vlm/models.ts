/**
 * Vision-Language Model definitions for natural-language captioning
 *
 * These models run via the Python sidecar using llama-cpp-python with GGUF quants.
 * Abliterated variants are preferred — standard models can be overly conservative
 * on content that's perfectly fine for training data.
 *
 * File sizes and VRAM estimates are for the recommended quant level.
 * Actual VRAM usage depends on context length and image resolution.
 */

import type { TaggerModel } from '../../types';

const PROVIDER_ID = 'vlm';

export const VLM_MODELS: TaggerModel[] = [
  {
    id: 'qwen3-vl-8b-abliterated',
    name: 'Qwen3-VL 8B',
    provider: PROVIDER_ID,
    repoId: 'mradermacher/Qwen3-VL-8B-Instruct-abliterated-v2.0-GGUF',
    description: 'Strong vision model, less restrictive (recommended)',
    isDefault: true,
    vramEstimate: 6,
    files: [
      {
        name: 'Qwen3-VL-8B-Instruct-abliterated-v2.0.Q6_K.gguf',
        size: 6_730_000_000,
      },
    ],
  },
  {
    id: 'qwen3.5-vl-8b',
    name: 'Qwen3.5-VL 8B',
    provider: PROVIDER_ID,
    repoId: 'Qwen/Qwen3.5-VL-8B-Instruct-GGUF',
    description: 'Latest Qwen vision model, conservative safety filters',
    vramEstimate: 6,
    files: [{ name: 'qwen3.5-vl-8b-instruct-q6_k.gguf', size: 6_700_000_000 }],
  },
  {
    id: 'gemma-3-12b-abliterated',
    name: 'Gemma 3 12B',
    provider: PROVIDER_ID,
    repoId: 'mradermacher/gemma-3-12b-it-abliterated-i1-GGUF',
    description: 'Google vision model, different description style',
    vramEstimate: 9,
    files: [
      {
        name: 'gemma-3-12b-it-abliterated.i1-Q6_K.gguf',
        size: 9_800_000_000,
      },
    ],
  },
];
