import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/outline';
import { memo, useCallback } from 'react';

import { Button } from '@/app/components/shared/button';
import { Dropdown, DropdownItem } from '@/app/components/shared/dropdown';
import { ResponsiveToolbarGroup } from '@/app/components/shared/responsive-toolbar-group';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  selectTagSortDirection,
  selectTagSortType,
  setTagSortDirection,
  setTagSortType,
  TagSortDirection,
  TagSortType,
  toggleTagSortDirection,
} from '@/app/store/project';

/**
 * Get the appropriate sort direction label based on sort type
 */
const getTagSortDirectionLabel = (
  sortType: TagSortType,
  sortDirection: TagSortDirection,
): string => {
  const isAsc = sortDirection === TagSortDirection.ASC;

  switch (sortType) {
    case TagSortType.ALPHABETICAL:
      return isAsc ? 'A-Z' : 'Z-A';
    case TagSortType.FREQUENCY:
      return isAsc ? '0-9' : '9-0'; // 0-9 for least frequent first, 9-0 for most frequent first
    case TagSortType.SORTABLE:
    default:
      return 'Saved'; // Sortable order doesn't have a meaningful direction
  }
};

const TagSortControlsComponent = () => {
  const dispatch = useAppDispatch();
  const tagSortType = useAppSelector(selectTagSortType);
  const tagSortDirection = useAppSelector(selectTagSortDirection);

  const handleSortTypeChange = useCallback(
    (newSortType: TagSortType) => {
      dispatch(setTagSortType(newSortType));
      // Set default direction based on sort type
      const defaultDirection =
        newSortType === TagSortType.FREQUENCY
          ? TagSortDirection.DESC // Most frequent first (9-0)
          : TagSortDirection.ASC; // A-Z for alphabetical, saved order for sortable
      dispatch(setTagSortDirection(defaultDirection));
    },
    [dispatch],
  );

  const handleToggleSortDirection = useCallback(() => {
    dispatch(toggleTagSortDirection());
  }, [dispatch]);

  // Create sort type dropdown items
  const tagSortTypeItems: DropdownItem<TagSortType>[] = [
    {
      value: TagSortType.SORTABLE,
      label: 'Sort Order',
    },
    {
      value: TagSortType.ALPHABETICAL,
      label: 'Alphabetical',
    },
    {
      value: TagSortType.FREQUENCY,
      label: 'Frequency',
    },
  ];

  // Don't show direction toggle for sortable order since it doesn't have meaningful direction
  const showDirectionToggle = tagSortType !== TagSortType.SORTABLE;

  return (
    <ResponsiveToolbarGroup
      icon={<ChevronUpDownIcon className="w-4" />}
      title="Tag Sort"
      position="center"
      breakpoint="large"
    >
      <Dropdown
        items={tagSortTypeItems}
        selectedValue={tagSortType}
        onChange={handleSortTypeChange}
      />

      {showDirectionToggle && (
        <Button
          type="button"
          onClick={handleToggleSortDirection}
          variant="ghost"
          size="medium"
          title={`Sort ${tagSortDirection === TagSortDirection.ASC ? 'ascending' : 'descending'}`}
        >
          {tagSortDirection === TagSortDirection.ASC ? (
            <ArrowUpIcon className="w-4" />
          ) : (
            <ArrowDownIcon className="w-4" />
          )}

          <span className="ml-1 max-xl:hidden">
            {getTagSortDirectionLabel(tagSortType, tagSortDirection)}
          </span>
        </Button>
      )}
    </ResponsiveToolbarGroup>
  );
};

export const TagSortControls = memo(TagSortControlsComponent);
