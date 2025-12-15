import { NumberedListIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useId, useMemo, useRef } from 'react';

import { Button } from '@/app/components/shared/button';
import { Popup, usePopup } from '@/app/components/shared/popup-v2';
import {
  selectFilteredAssets,
  selectSortDirection,
  selectSortType,
} from '@/app/store/assets';
import { selectPaginationSize } from '@/app/store/filters';
import { useAppSelector } from '@/app/store/hooks';
import { selectSelectedAssets } from '@/app/store/selection';
import { getCategoriesWithPageInfo } from '@/app/utils/category-utils';
import { scrollToAnchor } from '@/app/utils/scroll-to-anchor';

import { CategoryList } from './category-list';

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
  const selectedAssets = useAppSelector(selectSelectedAssets);
  const paginationSize = useAppSelector(selectPaginationSize);

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
        <NumberedListIcon className="w-4" />
      </Button>

      <Popup
        id={popupId}
        position="bottom-left"
        triggerRef={buttonRef}
        className="flex max-h-[80vh] w-64 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
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
