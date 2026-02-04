import { IdCardIcon } from 'lucide-react';
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
      icon={<IdCardIcon className="h-4 w-4" />}
      title="Assets"
      position="left"
      breakpoint="large"
    >
      <FilterModeDropdown />

      <ToolbarDivider />

      <span className="mx-0.5 cursor-default text-xs text-slate-500 max-xl:hidden">
        by
      </span>
      <AssetSortControls />
      <ModifiedFilterToggle />

      <ToolbarDivider />

      <SelectAllButton />
      <ClearSelectionButton />
    </ResponsiveToolbarGroup>
  );
};

export const AssetSelectionControls = memo(AssetSelectionControlsComponent);
