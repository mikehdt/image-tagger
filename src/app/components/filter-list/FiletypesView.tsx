import { SortDirection, SortType } from './types';

// Get sort options for the filetypes view
export const getFiletypeSortOptions = (
  sortType: SortType,
  sortDirection: SortDirection,
) => {
  return {
    directionLabel:
      sortType === 'count'
        ? `Sort: ${sortDirection === 'asc' ? '↑ 9-0' : '↓ 0-9'}`
        : `Sort: ${sortDirection === 'asc' ? '↑ A-Z' : '↓ Z-A'}`,
    typeLabel:
      sortType === 'count'
        ? 'Count'
        : sortType === 'alphabetical'
          ? 'Name'
          : 'Active',
    nextType:
      sortType === 'count'
        ? ('alphabetical' as SortType)
        : sortType === 'alphabetical'
          ? ('active' as SortType)
          : ('count' as SortType),
  };
};

export const FiletypesView = () => {
  return (
    <div className="p-4 text-center text-sm text-slate-500">
      Filetype filters not implemented yet
    </div>
  );
};
