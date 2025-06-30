import { TagIcon } from '@heroicons/react/24/outline';
import { RefObject, useState } from 'react';

import { FilterList } from '../../filter-list/filter-list';
import { PersistentFilterProvider } from '../../filter-list/persistent-filter-context';

interface TagFilterButtonProps {
  tagButtonRef: RefObject<HTMLDivElement | null>;
}

export const TagFilterButton = ({ tagButtonRef }: TagFilterButtonProps) => {
  const [isTagPanelOpen, setIsTagPanelOpen] = useState<boolean>(false);

  return (
    <div className="relative" ref={tagButtonRef}>
      <div
        onClick={() => setIsTagPanelOpen(!isTagPanelOpen)}
        className={`inline-flex cursor-pointer items-center rounded-md border border-slate-300 p-2 inset-shadow-xs inset-shadow-white transition-colors ${isTagPanelOpen ? 'bg-slate-300 hover:bg-slate-200' : 'bg-slate-100 hover:bg-slate-200'}`}
        title="Show tag summary"
      >
        <TagIcon className="w-4" />

        <span className="mr-1 ml-2 max-lg:hidden"> Filter List</span>
      </div>

      <PersistentFilterProvider>
        <FilterList
          isOpen={isTagPanelOpen}
          onClose={() => setIsTagPanelOpen(false)}
          containerRef={tagButtonRef}
        />
      </PersistentFilterProvider>
    </div>
  );
};
