// Types for the filters slice
export enum FilterMode {
  SHOW_ALL = 'ShowAll',
  MATCH_ANY = 'MatchAny',
  MATCH_ALL = 'MatchAll',
  MATCH_NONE = 'MatchNone',
}

export enum PaginationSize {
  FIFTY = 50,
  HUNDRED = 100,
  TWO_FIFTY = 250,
  ALL = -1,
}

export type Filters = {
  filterMode: FilterMode;
  filterTags: string[];
  filterSizes: string[];
  filterExtensions: string[];
  paginationSize: PaginationSize;
  showModified: boolean;
};

export type FilterCount = {
  tags: number;
  sizes: number;
  extensions: number;
  total: number;
};
