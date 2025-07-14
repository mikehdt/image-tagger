import { QueueListIcon } from '@heroicons/react/24/outline';
import { memo, useCallback, useRef, useState } from 'react';

import { FilterList } from '../../filter-list/filter-list';
import { Button } from '../../shared/button';

const FilterListButtonComponent = () => {
  const tagButtonRef = useRef<HTMLDivElement>(null);

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

        <span className="ml-2 max-lg:hidden">List</span>
      </Button>

      <FilterList
        isOpen={isTagPanelOpen}
        onClose={onCloseTagPanel}
        containerRef={tagButtonRef}
      />
    </div>
  );
};

export const FilterListButton = memo(FilterListButtonComponent);
