/**
 * Types for the auto-tagger service
 * Supports ONNX booru taggers (Node.js) and NL vision-language models (Python sidecar)
 */

/** How the provider runs inference */
export type ProviderType = 'onnx' | 'vlm';

export type TaggerProvider = {
  id: string;
  name: string;
  description: string;
  providerType: ProviderType;
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
  /** VRAM estimate in GB for VLM models (helps users pick the right quant) */
  vramEstimate?: number;
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
 * VLM (natural-language captioner) options.
 * Used when the selected model's provider is 'vlm'.
 */
export type VlmOptions = {
  prompt: string;
  maxTokens: number;
  temperature: number;
};

export const DEFAULT_VLM_OPTIONS: VlmOptions = {
  prompt: 'Describe this image in detail for AI training purposes.',
  maxTokens: 512,
  temperature: 0.7,
};

/**
 * Settings saved to project config.
 * Both ONNX and VLM fields are optional — a project tracks defaults for
 * whichever providers it's been used with.
 */
export type AutoTaggerSettings = {
  defaultModelId?: string;
} & Partial<Omit<TaggerOptions, 'includeTags'>> & // includeTags not saved (session only)
  Partial<VlmOptions>;
