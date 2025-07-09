import { QueueListIcon } from '@heroicons/react/24/outline';
import { RefObject, useCallback, useState } from 'react';

import { FilterList } from '../../filter-list/filter-list';
import { PersistentFilterProvider } from '../../filter-list/persistent-filter-context';
import { Button } from '../../shared/button';

interface TagFilterButtonProps {
  tagButtonRef: RefObject<HTMLDivElement | null>;
}

export const TagFilterButton = ({ tagButtonRef }: TagFilterButtonProps) => {
  const [isTagPanelOpen, setIsTagPanelOpen] = useState<boolean>(false);

  const onToggleTagPanel = useCallback(
    () => setIsTagPanelOpen(!isTagPanelOpen),
    [isTagPanelOpen],
  );

  const onCloseTagPanel = useCallback(() => setIsTagPanelOpen(false), []);

  return (
    <div className="relative" ref={tagButtonRef}>
      <Button
        variant="toggle"
        size="large"
        isPressed={isTagPanelOpen}
        onClick={onToggleTagPanel}
        title="Show tag summary"
      >
        <QueueListIcon className="w-4" />

        <span className="ml-2 max-lg:hidden">Filters</span>
      </Button>

      <PersistentFilterProvider>
        <FilterList
          isOpen={isTagPanelOpen}
          onClose={onCloseTagPanel}
          containerRef={tagButtonRef}
        />
      </PersistentFilterProvider>
    </div>
  );
};
