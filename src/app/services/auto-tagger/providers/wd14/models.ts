/**
 * WD14 model definitions from SmilingWolf
 * https://huggingface.co/SmilingWolf
 */

import type { TaggerModel } from '../../types';

const PROVIDER_ID = 'wd14';

// Common files needed for all WD14 models
const WD14_FILES = [
  { name: 'model.onnx', size: 0 }, // Size varies by model, set below
  { name: 'selected_tags.csv', size: 500_000 }, // ~500KB tags file
];

/**
 * WD14 v2 models - support both TensorFlow and ONNX
 */
export const WD14_V2_MODELS: TaggerModel[] = [
  {
    id: 'wd-convnextv2-tagger-v2',
    name: 'ConvNextV2 v2',
    provider: PROVIDER_ID,
    repoId: 'SmilingWolf/wd-v1-4-convnextv2-tagger-v2',
    description: 'Good balance of speed and accuracy (recommended)',
    isDefault: true,
    files: [
      { name: 'model.onnx', size: 378_000_000 }, // ~378MB
      { name: 'selected_tags.csv', size: 500_000 },
    ],
  },
  {
    id: 'wd-convnext-tagger-v2',
    name: 'ConvNext v2',
    provider: PROVIDER_ID,
    repoId: 'SmilingWolf/wd-v1-4-convnext-tagger-v2',
    description: 'Original ConvNext architecture',
    files: [
      { name: 'model.onnx', size: 378_000_000 },
      { name: 'selected_tags.csv', size: 500_000 },
    ],
  },
  {
    id: 'wd-vit-tagger-v2',
    name: 'ViT v2',
    provider: PROVIDER_ID,
    repoId: 'SmilingWolf/wd-v1-4-vit-tagger-v2',
    description: 'Vision Transformer architecture',
    files: [
      { name: 'model.onnx', size: 344_000_000 }, // ~344MB
      { name: 'selected_tags.csv', size: 500_000 },
    ],
  },
  {
    id: 'wd-swinv2-tagger-v2',
    name: 'SwinV2 v2',
    provider: PROVIDER_ID,
    repoId: 'SmilingWolf/wd-v1-4-swinv2-tagger-v2',
    description: 'Swin Transformer V2',
    files: [
      { name: 'model.onnx', size: 220_000_000 }, // ~220MB
      { name: 'selected_tags.csv', size: 500_000 },
    ],
  },
  {
    id: 'wd-moat-tagger-v2',
    name: 'MOAT v2',
    provider: PROVIDER_ID,
    repoId: 'SmilingWolf/wd-v1-4-moat-tagger-v2',
    description: 'MOAT architecture',
    files: [
      { name: 'model.onnx', size: 220_000_000 },
      { name: 'selected_tags.csv', size: 500_000 },
    ],
  },
];

/**
 * WD14 v3 models - ONNX only
 */
export const WD14_V3_MODELS: TaggerModel[] = [
  {
    id: 'wd-swinv2-tagger-v3',
    name: 'SwinV2 v3',
    provider: PROVIDER_ID,
    repoId: 'SmilingWolf/wd-swinv2-tagger-v3',
    description: 'Latest SwinV2, ONNX-only',
    files: [
      { name: 'model.onnx', size: 220_000_000 },
      { name: 'selected_tags.csv', size: 500_000 },
    ],
  },
  {
    id: 'wd-vit-tagger-v3',
    name: 'ViT v3',
    provider: PROVIDER_ID,
    repoId: 'SmilingWolf/wd-vit-tagger-v3',
    description: 'Latest ViT, ONNX-only',
    files: [
      { name: 'model.onnx', size: 344_000_000 },
      { name: 'selected_tags.csv', size: 500_000 },
    ],
  },
  {
    id: 'wd-convnext-tagger-v3',
    name: 'ConvNext v3',
    provider: PROVIDER_ID,
    repoId: 'SmilingWolf/wd-convnext-tagger-v3',
    description: 'Latest ConvNext, ONNX-only',
    files: [
      { name: 'model.onnx', size: 378_000_000 },
      { name: 'selected_tags.csv', size: 500_000 },
    ],
  },
];

export const ALL_WD14_MODELS: TaggerModel[] = [
  ...WD14_V2_MODELS,
  ...WD14_V3_MODELS,
];
