/**
 * Types for the auto-tagger service
 * Designed to support multiple tagger providers (WD14, BLIP2, etc.)
 */

export type TaggerProvider = {
  id: string;
  name: string;
  description: string;
  models: TaggerModel[];
};

export type TaggerModel = {
  id: string;
  name: string;
  provider: string;
  repoId: string;
  files: ModelFile[];
  description?: string;
  isDefault?: boolean;
};

export type ModelFile = {
  name: string;
  size: number;
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
  generalThreshold: number;
  characterThreshold: number;
  removeUnderscore: boolean;
  includeCharacterTags: boolean;
  includeRatingTags: boolean;
  excludeTags: string[];
  includeTags: string[];
  tagInsertMode: TagInsertMode;
};

export const DEFAULT_TAGGER_OPTIONS: TaggerOptions = {
  generalThreshold: 0.3,
  characterThreshold: 0.9,
  removeUnderscore: true,
  includeCharacterTags: false,
  includeRatingTags: false,
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
