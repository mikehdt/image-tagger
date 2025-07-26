import { NumberedListIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
        // Same page - scroll to anchor with manual offset AND update URL hash
        const element = document.getElementById(anchorId);
        if (element) {
          // Try to find the parent container (asset-group) for better positioning
          const container = element.parentElement;
          const targetElement = container || element;

          const headerOffset = 96; // 6rem = 96px (matching top-24)
          const elementPosition =
            targetElement.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - headerOffset;

          // Update the URL hash without triggering navigation
          const newUrl = `${window.location.pathname}${window.location.search}#${anchorId}`;
          window.history.replaceState(null, '', newUrl);

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
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

      // Default to left-aligned dropdown (left edges of button and panel align)
      const alignRight = false; // This means we use the left property
      let leftPosition = 0; // Panel's left edge aligns with button's left edge

      // Check if this would put panel off-screen to the right
      if (rect.left + panelWidth > window.innerWidth - 16) {
        // Panel would go off-screen, so adjust leftPosition to keep it in bounds
        leftPosition = window.innerWidth - 16 - panelWidth - rect.left;
      }

      setPanelPosition({
        alignRight,
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
  // if (categoriesWithPageInfo.length <= 1) {
  //   return null;
  // }

  return (
    <div ref={containerRef} className="relative">
      <Button
        onClick={handleToggle}
        variant="toggle"
        size="medium"
        title="Jump to category"
        isPressed={isOpen}
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
        className={`absolute z-20 mt-1 flex max-h-[60vh] w-64 ${
          panelPosition.alignRight ? 'origin-top-right' : 'origin-top-left'
        } flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg transition-all duration-150 ease-in-out ${
          isOpen
            ? 'scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        {renderList ? (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 p-2">
              <h3 className="text-sm font-medium text-slate-700">
                Jump to Category
              </h3>
              <button
                onClick={handleClose}
                className="ml-2 cursor-pointer rounded-full p-1 transition-colors hover:bg-slate-200"
                title="Close"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <ul className="divide-y divide-slate-100">
              {categoriesWithPageInfo.map(
                ({ category, page, isFirstOccurrence }, index) => {
                  const isCurrentPage = page === currentPage;
                  const anchorId = `category-${category.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;

                  // Show page number only when it changes from the previous item
                  const showPageNumber =
                    index === 0 ||
                    categoriesWithPageInfo[index - 1].page !== page;

                  return (
                    <li
                      key={`${category}-${page}`} // Use both category and page for unique keys
                      onClick={() => handleCategoryClick(page, anchorId)}
                      className={`flex cursor-pointer items-center justify-between px-3 py-2 transition-colors hover:bg-blue-50 ${
                        isCurrentPage
                          ? 'border-sky-200 bg-sky-50 text-sky-700'
                          : 'text-slate-700'
                      }`}
                    >
                      <span
                        className={`truncate ${isFirstOccurrence ? 'font-medium' : 'font-normal'}`}
                      >
                        {category}
                        {!isFirstOccurrence && (
                          <span className="ml-1 text-xs text-slate-500">
                            (continued)
                          </span>
                        )}
                      </span>
                      {showPageNumber && (
                        <span
                          className={`text-xs ${
                            isCurrentPage ? 'text-sky-600' : 'text-slate-500'
                          }`}
                        >
                          Page {page}
                        </span>
                      )}
                    </li>
                  );
                },
              )}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
};
