import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import type { SyntheticEvent } from 'react';

import { getImageSizes } from '../utils/image-sizes';
import { Loader } from './loader';

export const TopShelf = ({
  showLoader,
  filters,
  clearFilters,
  toggleFilterMode,
  includeFilterMode,
}: {
  showLoader: boolean;
  filters: string[];
  clearFilters: () => void;
  toggleFilterMode: (e: SyntheticEvent) => void;
  includeFilterMode: boolean;
}) => {
  return (
    <div className="fixed left-0 top-0 z-10 flex h-12 w-full items-center bg-white/80 shadow-md backdrop-blur-md">
      {showLoader ? (
        <div className="py-2 pl-8 pr-2">
          <div className="w-8">
            <Loader />
          </div>
        </div>
      ) : null}
      <div className="ml-auto flex content-center py-2 pl-2 pr-8">
        {filters.length ? (
          <a href="#" onClick={clearFilters}>
            [tags: {filters.join(', ')}]
          </a>
        ) : null}{' '}
        [image sizes] [show only pending] [
        <a href="#" onClick={toggleFilterMode} className="inline-flex">
          <span className="mr-1 w-6">
            {includeFilterMode ? <CheckCircleIcon /> : <XCircleIcon />}
          </span>
          Show only filtered
        </a>
        ]
      </div>
    </div>
  );
};
