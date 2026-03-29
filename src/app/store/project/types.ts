type ProjectInfo = {
  projectName?: string;
  projectPath?: string;
  projectFolderName?: string;
  projectThumbnail?: string;
};

export enum TagSortType {
  SORTABLE = 'SORTABLE',
  ALPHABETICAL = 'ALPHABETICAL',
  FREQUENCY = 'FREQUENCY',
}

export enum TagSortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum TagEditMode {
  BUTTON = 'BUTTON',
  DOUBLE_CLICK = 'DOUBLE_CLICK',
}

type ProjectConfig = {
  showCropVisualization: boolean;
  tagSortType: TagSortType;
  tagSortDirection: TagSortDirection;
  tagEditMode: TagEditMode;
};

export type ProjectState = {
  info: ProjectInfo;
  config: ProjectConfig;
};
