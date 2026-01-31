import { SwatchIcon } from '@heroicons/react/24/outline';
import { memo } from 'react';

import { ResponsiveToolbarGroup } from '../../shared/responsive-toolbar-group';
import { ToolbarDivider } from '../../shared/toolbar-divider';
import { AddTagsButton } from './add-tags-button';
import { AutoTaggerButton } from './auto-tagger-button';
import { ClearFiltersButton } from './clear-filters-button';
import { DeleteToggleButton } from './delete-toggle-button';
import { EditTagsButton } from './edit-tags-button';
import { TagActionsMenu } from './tag-actions-menu';
import { TagSortControls } from './tag-sort-controls';

const TagActionsComponent = () => {
  return (
    <ResponsiveToolbarGroup
      icon={<SwatchIcon className="w-4" />}
      title="Tags"
      position="right"
    >
      <TagSortControls />

      <ToolbarDivider />

      <AutoTaggerButton />

      <ToolbarDivider />

      <AddTagsButton />
      <EditTagsButton />
      <DeleteToggleButton />
      <TagActionsMenu />

      <ToolbarDivider />

      <ClearFiltersButton />
    </ResponsiveToolbarGroup>
  );
};

export const TagActions = memo(TagActionsComponent);
