import { QueueListIcon, XMarkIcon } from '@heroicons/react/24/outline';
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

interface CategoryNavigationProps {
  currentPage: number;
}

export const CategoryNavigation = ({
  currentPage,
}: CategoryNavigationProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [renderList, setRenderList] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ right: false, left: 0 });
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
        // Same page - just scroll to anchor (scroll-margin-top CSS will handle offset)
        const element = document.getElementById(anchorId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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
      setIsPositioned(true);
    }
  }, [isOpen, isPositioned]);

  // Calculate position when the panel opens
  useEffect(() => {
    if (isOpen && isPositioned && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const panelWidth = 256; // w-64 = 16rem = 256px

      // Use right alignment by default (like filter-list)
      let useRightAlignment = true;
      let leftPosition = 0;

      // When right-aligned, the panel's right edge aligns with button's right edge
      // Check if the panel's left edge would go off-screen to the left
      const panelLeftEdge = rect.right - panelWidth;

      if (panelLeftEdge < 16) {
        // Switch to left alignment
        useRightAlignment = false;
        leftPosition = 16; // Small padding from left edge
      }

      setPanelPosition({
        right: useRightAlignment,
        left: leftPosition,
      });
    }
  }, [isOpen, isPositioned]);

  // Handle rendering timing similar to filter-list
  useEffect(() => {
    if (isOpen) {
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

  // Don't render if no categories or only one category
  if (categoriesWithPageInfo.length <= 1) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        onClick={handleToggle}
        variant="ghost"
        size="medium"
        title="Jump to category"
        isPressed={isOpen}
      >
        <QueueListIcon className="w-4" />
      </Button>

      <div
        ref={panelRef}
        style={{
          right: panelPosition.right ? 0 : 'auto',
          left: panelPosition.right ? 'auto' : `${panelPosition.left}px`,
          minWidth: '256px',
        }}
        className={`absolute z-20 mt-1 flex max-h-[60vh] w-64 ${
          panelPosition.right ? 'origin-top-right' : 'origin-top-left'
        } flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg transition-all duration-150 ease-in-out ${
          isOpen
            ? 'scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        {renderList ? (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 p-3">
              <h3 className="text-sm font-medium text-slate-700">
                Jump to Category
              </h3>
              <button
                onClick={handleClose}
                className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                title="Close"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto">
              {categoriesWithPageInfo.map(({ category, page }) => {
                const isCurrentPage = page === currentPage;
                const anchorId = `category-${category.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;

                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(page, anchorId)}
                    className={`block w-full border-b border-slate-100 px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 ${
                      isCurrentPage
                        ? 'border-sky-200 bg-sky-50 text-sky-700'
                        : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium">{category}</span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          isCurrentPage
                            ? 'bg-sky-100 text-sky-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        Page {page}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
