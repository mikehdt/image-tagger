'use client';

import { SaveIcon } from 'lucide-react';
import { memo, useCallback } from 'react';

import { Button } from '@/app/components/shared/button';
import { Dropdown } from '@/app/components/shared/dropdown';
import { SegmentedControl } from '@/app/components/shared/segmented-control/segmented-control';
import { ToolbarDivider } from '@/app/components/shared/toolbar-divider';
import { useAppDispatch } from '@/app/store/hooks';
import {
  setTrainingViewMode,
  type TrainingViewMode,
} from '@/app/store/preferences';

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

      {/* Right: view mode toggle */}
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
