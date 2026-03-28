import { ListOrderedIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useId, useMemo, useRef } from 'react';

import { Button } from '@/app/components/shared/button';
import { Popup, usePopup } from '@/app/components/shared/popup';
import {
  selectFilteredAssets,
  selectSortDirection,
  selectSortType,
  SortType,
} from '@/app/store/assets';
import { selectPaginationSize } from '@/app/store/filters';
import { useAppSelector } from '@/app/store/hooks';
import { getCategoriesWithPageInfo } from '@/app/utils/category-utils';
import { scrollToAnchor } from '@/app/utils/scroll-to-anchor';

import { CategoryList } from './category-list';

const EMPTY_SELECTED: string[] = [];

interface CategoryNavigationProps {
  currentPage: number;
}

const CategoryNavigationComponent = ({
  currentPage,
}: CategoryNavigationProps) => {
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { openPopup, closePopup, getPopupState } = usePopup();

  const popupId = useId();
  const isOpen = getPopupState(popupId).isOpen;

  // Get data from Redux
  const filteredAssets = useAppSelector(selectFilteredAssets);
  const sortType = useAppSelector(selectSortType);
  const sortDirection = useAppSelector(selectSortDirection);
  const paginationSize = useAppSelector(selectPaginationSize);

  // Only returns selectedAssets when sorting by SELECTED —
  // otherwise returns stable empty array, so selection changes don't trigger re-renders
  const selectedAssets = useAppSelector((state) =>
    state.assets.sortType === SortType.SELECTED
      ? state.selection.selectedAssets
      : EMPTY_SELECTED,
  );

  // Get categories with page information
  const categoriesWithPageInfo = useMemo(
    () =>
      getCategoriesWithPageInfo(
        filteredAssets,
        sortType,
        sortDirection,
        selectedAssets,
        paginationSize === -1 ? Number.MAX_SAFE_INTEGER : paginationSize,
      ),
    [filteredAssets, sortType, sortDirection, selectedAssets, paginationSize],
  );

  const handleToggle = useCallback(() => {
    if (isOpen) {
      closePopup(popupId);
    } else {
      openPopup(popupId, {
        position: 'bottom-left',
        triggerRef: buttonRef,
      });
    }
  }, [isOpen, closePopup, openPopup, popupId]);

  const handleClose = useCallback(() => {
    closePopup(popupId);
  }, [closePopup, popupId]);

  const handleCategoryClick = useCallback(
    (page: number, anchorId: string) => {
      handleClose();

      if (page === currentPage) {
        // Same page - scroll to anchor with utility function
        scrollToAnchor(anchorId);
      } else {
        // Different page - navigate and then scroll
        router.push(`/${page}#${anchorId}`);
      }
    },
    [currentPage, handleClose, router],
  );

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        onClick={handleToggle}
        variant="toggle"
        size="large"
        title="Jump to category"
        isPressed={isOpen}
        disabled={categoriesWithPageInfo.length <= 1}
      >
        <ListOrderedIcon className="h-4 w-4" />
      </Button>

      <Popup
        id={popupId}
        position="bottom-left"
        triggerRef={buttonRef}
        className="flex max-h-[80vh] w-64 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg shadow-slate-600/50 dark:border-slate-600 dark:bg-slate-800 dark:shadow-slate-950/50"
      >
        <CategoryList
          categoriesWithPageInfo={categoriesWithPageInfo}
          currentPage={currentPage}
          onCategoryClick={handleCategoryClick}
          onClose={handleClose}
        />
      </Popup>
    </div>
  );
};

export const CategoryNavigation = memo(CategoryNavigationComponent);
