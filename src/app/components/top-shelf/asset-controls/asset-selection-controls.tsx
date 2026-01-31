import { IdentificationIcon } from '@heroicons/react/24/outline';
import { memo } from 'react';

import { ResponsiveToolbarGroup } from '../../shared/responsive-toolbar-group';
import { ToolbarDivider } from '../../shared/toolbar-divider';
import { AssetSortControls } from './asset-sort-controls';
import { ClearSelectionButton } from './clear-selection-button';
import { FilterModeDropdown } from './filter-mode-dropdown';
import { ModifiedFilterToggle } from './modified-filter-toggle';
import { SelectAllButton } from './select-all-button';

const AssetSelectionControlsComponent = () => {
  return (
    <ResponsiveToolbarGroup
      icon={<IdentificationIcon className="w-4" />}
      title="Assets"
      position="left"
      breakpoint="large"
    >
      <FilterModeDropdown />
      <AssetSortControls />
      <ModifiedFilterToggle />

      <ToolbarDivider />

      <SelectAllButton />
      <ClearSelectionButton />
    </ResponsiveToolbarGroup>
  );
};

export const AssetSelectionControls = memo(AssetSelectionControlsComponent);
