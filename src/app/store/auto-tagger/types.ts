/**
 * Types for the auto-tagger Redux slice
 */

export type ModelInfo = {
  id: string;
  name: string;
  provider: string;
  description?: string;
  isDefault?: boolean;
  totalSize: number;
  /**
   * Rough memory estimate in GB. For `runtime: 'transformers'` this is
   * VRAM; for `runtime: 'llama-cpp'` on a CPU build it's system RAM.
   * The UI picks the correct label based on runtime.
   */
  memoryEstimate?: number;
  /** VLM runtime; undefined for ONNX providers. */
  runtime?: 'llama-cpp' | 'transformers';
  status:
    | 'not_installed'
    | 'downloading'
    | 'ready'
    | 'partial'
    | 'error'
    | 'checking';
};

export type ProviderInfo = {
  id: string;
  name: string;
  description: string;
  providerType: 'onnx' | 'vlm';
};

export type AutoTaggerState = {
  // Whether the models list has been loaded from the API
  isInitialised: boolean;

  // Whether we're currently loading model info
  isLoading: boolean;

  // Available providers
  providers: ProviderInfo[];

  // Available models with their status
  models: ModelInfo[];

  // Currently selected model ID (for tagging)
  selectedModelId: string | null;

  // Error message if something went wrong
  error: string | null;
};
