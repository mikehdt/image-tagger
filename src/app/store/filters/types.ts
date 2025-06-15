// Types for the filters slice
export enum FilterMode {
  SHOW_ALL = 'ShowAll',
  MATCH_ANY = 'MatchAny',
  MATCH_ALL = 'MatchAll',
}

export type Filters = {
  filterMode: FilterMode;
  filterTags: string[];
  filterSizes: string[];
};

export type FilterCount = {
  tags: number;
  sizes: number;
  total: number;
};
