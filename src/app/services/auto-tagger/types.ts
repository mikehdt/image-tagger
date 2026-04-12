/**
 * Types for the auto-tagger service
 * Supports ONNX booru taggers (Node.js) and NL vision-language models (Python sidecar)
 */

/** How the provider runs inference */
export type ProviderType = 'onnx' | 'vlm';

/**
 * Which Python runtime handles a VLM model.
 * - 'llama-cpp': GGUF quants via llama-cpp-python (CPU / Linux CUDA)
 * - 'transformers': HuggingFace transformers + PyTorch (Windows CUDA path)
 *
 * Ignored for 'onnx' provider models.
 */
export type VlmRuntime = 'llama-cpp' | 'transformers';

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
  /**
   * Which Python runtime loads this model. Only meaningful for VLM models.
   * Defaults to 'llama-cpp' for backwards compatibility with existing GGUF entries.
   */
  runtime?: VlmRuntime;
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
  /**
   * If true, the project's trigger phrases are appended to the prompt as a
   * must-include instruction. The backend handles the actual injection at
   * request time so the prompt the user edits stays clean.
   */
  injectTriggerPhrases: boolean;
};

export const DEFAULT_VLM_OPTIONS: VlmOptions = {
  prompt:
    'Describe this image as a caption for AI training. Use plain prose only — no markdown, headings, bullet points, or lists. Keep it tight and factual: subject, pose and clothing, art style or medium, composition, lighting. Avoid narrative interpretation and flowery language. Stay within 2–3 short paragraphs total.',
  maxTokens: 512,
  temperature: 0.7,
  injectTriggerPhrases: true,
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
