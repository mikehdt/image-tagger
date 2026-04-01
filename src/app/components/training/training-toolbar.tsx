'use client';

import { ListIcon, SaveIcon } from 'lucide-react';
import { memo, useCallback } from 'react';

import { Button } from '@/app/components/shared/button';
import { Dropdown } from '@/app/components/shared/dropdown';
import { SegmentedControl } from '@/app/components/shared/segmented-control/segmented-control';
import { ToolbarDivider } from '@/app/components/shared/toolbar-divider';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  setTrainingViewMode,
  type TrainingViewMode,
} from '@/app/store/preferences';
import {
  selectActiveJobStatus,
  selectPanelOpen,
  togglePanel,
} from '@/app/store/training';

import { useTrainingViewMode } from './use-training-view-mode';

const VIEW_MODE_OPTIONS: { value: TrainingViewMode; label: string }[] = [
  { value: 'simple', label: 'Simple' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const VERSION_ITEMS = [{ value: 'v1', label: 'v1 — current' }];

const TrainingToolbarComponent = () => {
  const dispatch = useAppDispatch();
  const viewMode = useTrainingViewMode();
  const jobStatus = useAppSelector(selectActiveJobStatus);
  const panelOpen = useAppSelector(selectPanelOpen);

  const hasActiveJob = jobStatus !== null;
  const isRunning = jobStatus === 'training' || jobStatus === 'preparing';

  const handleViewModeChange = useCallback(
    (mode: TrainingViewMode) => {
      dispatch(setTrainingViewMode(mode));
    },
    [dispatch],
  );

  return (
    <>
      {/* Left: version management (placeholders) */}
      <Dropdown
        items={VERSION_ITEMS}
        selectedValue="v1"
        onChange={() => console.log('Version selector (placeholder)')}
        aria-label="Configuration version"
      />

      <ToolbarDivider />

      <Button
        size="small"
        variant="ghost"
        onClick={() => console.log('Save (placeholder)')}
      >
        <SaveIcon className="mr-1 h-3.5 w-3.5" />
        Save
      </Button>
      <Button
        size="small"
        variant="ghost"
        onClick={() => console.log('Save As (placeholder)')}
      >
        Save As
      </Button>
      <Button
        size="small"
        variant="ghost"
        onClick={() => console.log('Rename (placeholder)')}
      >
        Rename
      </Button>

      {/* Spacer */}
      <div className="mr-auto!" />

      {/* Right: queue button + view mode toggle */}
      <Button
        size="small"
        variant="ghost"
        disabled={!hasActiveJob}
        isPressed={panelOpen}
        onClick={() => dispatch(togglePanel())}
        className="relative"
      >
        <ListIcon className="mr-1 h-3.5 w-3.5" />
        Queue
        {isRunning && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">
            1
          </span>
        )}
      </Button>

      <ToolbarDivider />

      <div className="w-64">
        <SegmentedControl
          options={VIEW_MODE_OPTIONS}
          value={viewMode}
          onChange={handleViewModeChange}
        />
      </div>
    </>
  );
};

export const TrainingToolbar = memo(TrainingToolbarComponent);
