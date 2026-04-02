type ProjectInfo = {
  projectName?: string;
  projectPath?: string;
  projectFolderName?: string;
  projectThumbnail?: string;
};

export type CaptionMode = 'tags' | 'caption';

export enum TagSortType {
  SORTABLE = 'SORTABLE',
  ALPHABETICAL = 'ALPHABETICAL',
  FREQUENCY = 'FREQUENCY',
}

export enum TagSortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

type ProjectConfig = {
  showCropVisualization: boolean;
  tagSortType: TagSortType;
  tagSortDirection: TagSortDirection;
  captionMode: CaptionMode;
  triggerPhrases: string[];
};

export type ProjectState = {
  info: ProjectInfo;
  config: ProjectConfig;
};
