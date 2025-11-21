import { NumberedListIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/app/components/shared/button';
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

export const CategoryNavigation = ({
  currentPage,
}: CategoryNavigationProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [renderList, setRenderList] = useState(false);
  const [panelPosition, setPanelPosition] = useState({
    alignRight: false,
    left: 0,
  });
  const [isPositioned, setIsPositioned] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Get data from Redux
  const filteredAssets = useAppSelector(selectFilteredAssets);
  const sortType = useAppSelector(selectSortType);
  const sortDirection = useAppSelector(selectSortDirection);
  const selectedAssets = useAppSelector(selectSelectedAssets);
  const paginationSize = useAppSelector(selectPaginationSize);

  // Get categories with page information
  const categoriesWithPageInfo = getCategoriesWithPageInfo(
    filteredAssets,
    sortType,
    sortDirection,
    selectedAssets,
    paginationSize === -1 ? Number.MAX_SAFE_INTEGER : paginationSize,
  );

  const handleToggle = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

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

  // Set positioned state when opening
  useEffect(() => {
    if (isOpen && containerRef.current && !isPositioned) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional state sync for DOM measurement
      setIsPositioned(true);
    }
  }, [isOpen, isPositioned]);

  // Calculate position when the panel opens
  useEffect(() => {
    if (isOpen && isPositioned && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const panelWidth = 256; // w-64 = 16rem = 256px

      // Default to left-aligned dropdown (left edges of button and panel align)
      const alignRight = false; // This means we use the left property
      let leftPosition = 0; // Panel's left edge aligns with button's left edge

      // Check if this would put panel off-screen to the right
      if (rect.left + panelWidth > window.innerWidth - 16) {
        // Panel would go off-screen, so adjust leftPosition to keep it in bounds
        leftPosition = window.innerWidth - 16 - panelWidth - rect.left;
      }

      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional DOM measurement for positioning
      setPanelPosition({
        alignRight,
        left: leftPosition,
      });
    }
  }, [isOpen, isPositioned]);

  // Handle rendering timing similar to filter-list
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional animation state management
      setRenderList(true);
    } else if (!isOpen && renderList) {
      setTimeout(() => setRenderList(false), 150);
    }
  }, [isOpen, renderList]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClose]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  return (
    <div ref={containerRef} className="relative">
      <Button
        onClick={handleToggle}
        variant="toggle"
        size="large"
        title="Jump to category"
        isPressed={isOpen}
        disabled={categoriesWithPageInfo.length <= 1}
      >
        <NumberedListIcon className="w-4" />
      </Button>

      <div
        ref={panelRef}
        style={{
          left: panelPosition.alignRight ? 'auto' : `${panelPosition.left}px`,
          right: panelPosition.alignRight ? 0 : 'auto',
          minWidth: '256px',
        }}
        className={`absolute z-20 mt-1 flex max-h-[80vh] w-64 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg transition-all duration-150 ease-in-out ${
          isOpen
            ? 'scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0'
        } ${panelPosition.alignRight ? 'origin-top-right' : 'origin-top-left'}`}
      >
        {renderList ? (
          <CategoryList
            categoriesWithPageInfo={categoriesWithPageInfo}
            currentPage={currentPage}
            onCategoryClick={handleCategoryClick}
            onClose={handleClose}
          />
        ) : null}
      </div>
    </div>
  );
};
