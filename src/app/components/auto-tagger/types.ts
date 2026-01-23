export type TaggingProgress = {
  current: number;
  total: number;
  currentFileId?: string;
};

export type TaggingResult = {
  fileId: string;
  tags: string[];
};

export type TaggingSummary = {
  imagesProcessed: number;
  imagesWithNewTags: number;
  totalTagsFound: number;
};
