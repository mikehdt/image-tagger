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
  status: 'not_installed' | 'downloading' | 'ready' | 'error' | 'checking';
};

export type ProviderInfo = {
  id: string;
  name: string;
  description: string;
};

export type DownloadProgress = {
  modelId: string;
  currentFile?: string;
  bytesDownloaded: number;
  totalBytes: number;
  error?: string;
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

  // Download state (null if not downloading)
  downloadProgress: DownloadProgress | null;

  // Whether the setup modal is open
  isSetupModalOpen: boolean;

  // Error message if something went wrong
  error: string | null;
};
