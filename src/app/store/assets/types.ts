// Types for the assets slice
export enum IoState {
  INITIAL = 'Initial',
  LOADING = 'Loading',
  SAVING = 'Saving',
  COMPLETING = 'Completing', // Brief state to show 100% progress before transitioning to complete
  COMPLETE = 'Complete',
  ERROR = 'IoError',
}

// Using bitwise flags instead of string enum to allow combined states
export enum TagState {
  SAVED = 0, // 0000 - Base state
  TO_DELETE = 1, // 0001 - Marked for deletion
  TO_ADD = 2, // 0010 - Newly added
  DIRTY = 4, // 0100 - Position changed
}

export type ImageDimensions = {
  width: number;
  height: number;
};

export type ImageAsset = {
  ioState: Extract<IoState, IoState.SAVING | IoState.COMPLETE>;
  fileId: string;
  fileExtension: string;
  dimensions: ImageDimensions;
  tagStatus: { [key: string]: number }; // Changed from TagState to number to support bit flags
  tagList: string[];
  savedTagList: string[]; // Original tag order from last save
};

export type SaveProgress = {
  total: number;
  completed: number;
  failed: number;
  errors?: string[]; // List of fileIds that failed to save
};

export type LoadProgress = {
  total: number;
  completed: number;
  failed: number;
  errors?: string[]; // List of fileIds that failed to load
};

export type ImageAssets = {
  ioState: IoState;
  ioMessage: undefined | string;
  images: ImageAsset[];
  saveProgress?: SaveProgress;
  loadProgress?: LoadProgress;
  // Project information
  projectName?: string; // Display name of the current project
  projectPath?: string; // Full path to the project folder
  projectThumbnail?: string; // Thumbnail filename for the current project
};

export type KeyedCountList = { [key: string]: number };

export type SaveAssetResult = {
  assetIndex: number;
  fileId: string;
  tagList: string[];
  tagStatus: { [key: string]: number };
  savedTagList: string[];
};
