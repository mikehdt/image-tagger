/**
 * Types for the auto-tagger service
 * Designed to support multiple tagger providers (WD14, BLIP2, etc.)
 */

export type TaggerProvider = {
  id: string; // 'wd14', 'blip2', etc.
  name: string; // Display name
  description: string;
  models: TaggerModel[];
};

export type TaggerModel = {
  id: string; // 'wd-convnextv2-tagger-v2'
  name: string; // Display name
  provider: string; // 'wd14'
  repoId: string; // HuggingFace repo: 'SmilingWolf/wd-v1-4-convnextv2-tagger-v2'
  files: ModelFile[]; // Files to download
  description?: string;
  isDefault?: boolean;
};

export type ModelFile = {
  name: string; // 'model.onnx'
  size: number; // Size in bytes (for progress calculation)
};

export type ModelStatus =
  | 'not_installed'
  | 'downloading'
  | 'ready'
  | 'error'
  | 'checking';

export type DownloadProgress = {
  modelId: string;
  status: ModelStatus;
  currentFile?: string;
  bytesDownloaded: number;
  totalBytes: number;
  error?: string;
};

export type TagResult = {
  tag: string;
  confidence: number;
};

export type TaggerOutput = {
  general: TagResult[];
  character: TagResult[];
  rating: TagResult[];
};

export type TagInsertMode = 'prepend' | 'append';

export type TaggerOptions = {
  generalThreshold: number; // Default 0.35
  characterThreshold: number; // Default 0.85 (higher since usually excluded)
  removeUnderscore: boolean; // Replace _ with space
  includeCharacterTags: boolean; // Whether to include character tags
  includeRatingTags: boolean; // Whether to include rating tags
  excludeTags: string[]; // Tags to never include
  includeTags: string[]; // Tags to always include
  tagInsertMode: TagInsertMode; // How to order/insert new tags
};

export const DEFAULT_TAGGER_OPTIONS: TaggerOptions = {
  generalThreshold: 0.35,
  characterThreshold: 0.85,
  removeUnderscore: true,
  includeCharacterTags: false, // Excluded by default
  includeRatingTags: false, // Excluded by default
  excludeTags: [],
  includeTags: [],
  tagInsertMode: 'append',
};

/**
 * Settings saved to project config
 */
export type AutoTaggerSettings = {
  defaultModelId?: string;
} & Partial<Omit<TaggerOptions, 'includeTags'>>; // includeTags not saved (session only)
