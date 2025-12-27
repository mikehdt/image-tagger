// Types for the filters slice
export enum FilterMode {
  SHOW_ALL = 'ShowAll',
  MATCH_ANY = 'MatchAny',
  MATCH_ALL = 'MatchAll',
  MATCH_NONE = 'MatchNone',
  SELECTED_ASSETS = 'SelectedAssets',
  TAGLESS = 'Tagless',
}

export enum PaginationSize {
  TWENTY_FIVE = 25,
  FIFTY = 50,
  ONE_HUNDRED = 100,
  TWO_HUNDRED = 200,
  ALL = -1,
}

export type Filters = {
  filterMode: FilterMode;
  filterTags: string[];
  filterSizes: string[];
  filterBuckets: string[];
  filterExtensions: string[];
  filenamePatterns: string[];
  paginationSize: PaginationSize;
  showModified: boolean;
};

export type FilterCount = {
  tags: number;
  sizes: number;
  buckets: number;
  extensions: number;
  total: number;
};
