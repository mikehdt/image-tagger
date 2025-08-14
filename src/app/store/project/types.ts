// Types for the project slice
type ProjectInfo = {
  projectName?: string; // Display name of the current project
  projectPath?: string; // Full path to the project folder
  projectThumbnail?: string; // Thumbnail filename for the current project
};

export enum TagSortType {
  SORTABLE = 'SORTABLE', // Default - maintain loaded/saved order (allows drag/drop)
  ALPHABETICAL = 'ALPHABETICAL', // Sort alphabetically A-Z
  FREQUENCY = 'FREQUENCY', // Sort by frequency (most frequent first)
}

export enum TagSortDirection {
  ASC = 'ASC', // Ascending
  DESC = 'DESC', // Descending
}

type ProjectConfig = {
  showCropVisualization: boolean; // Whether to show crop visualization on assets
  tagSortType: TagSortType; // How tags should be sorted for display
  tagSortDirection: TagSortDirection; // Sort direction for tags
};

export type ProjectState = {
  info: ProjectInfo;
  config: ProjectConfig;
};
