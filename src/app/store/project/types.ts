// Types for the project slice
type ProjectInfo = {
  projectName?: string; // Display name of the current project
  projectPath?: string; // Full path to the project folder
  projectThumbnail?: string; // Thumbnail filename for the current project
};

type ProjectConfig = {
  showCropVisualization: boolean; // Whether to show crop visualization on assets
};

export type ProjectState = {
  info: ProjectInfo;
  config: ProjectConfig;
};
