import { QueueListIcon } from '@heroicons/react/24/outline';
import { memo, useCallback, useRef, useState } from 'react';

import { Button } from '../../shared/button';
import { FilterList } from '../filter-list/filter-list';

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
        title="Show filters"
      >
        <QueueListIcon className="w-4" />
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
