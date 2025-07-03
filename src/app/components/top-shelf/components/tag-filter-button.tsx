import { QueueListIcon } from '@heroicons/react/24/outline';
import { RefObject, useState } from 'react';

import { FilterList } from '../../filter-list/filter-list';
import { PersistentFilterProvider } from '../../filter-list/persistent-filter-context';
import { Button } from '../../shared/button';

interface TagFilterButtonProps {
  tagButtonRef: RefObject<HTMLDivElement | null>;
}

export const TagFilterButton = ({ tagButtonRef }: TagFilterButtonProps) => {
  const [isTagPanelOpen, setIsTagPanelOpen] = useState<boolean>(false);

  return (
    <div className="relative" ref={tagButtonRef}>
      <Button
        variant="toggle"
        size="large"
        isPressed={isTagPanelOpen}
        onClick={() => setIsTagPanelOpen(!isTagPanelOpen)}
        title="Show tag summary"
      >
        <QueueListIcon className="mr-2 w-4" />

        <span className="max-lg:hidden">Filter List</span>
      </Button>

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
