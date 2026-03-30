import { SwatchBookIcon } from 'lucide-react';
import { memo } from 'react';

import { ResponsiveToolbarGroup } from '../../shared/responsive-toolbar-group';
import { ToolbarDivider } from '../../shared/toolbar-divider';
import { AddTagsButton } from './add-tags-button';
import { DeleteToggleButton } from './delete-toggle-button';
import { EditTagsButton } from './edit-tags-button';
import { TagActionsMenu } from './tag-actions-menu';
import { TagSortControls } from './tag-sort-controls';

const TagActionsComponent = () => {
  return (
    <ResponsiveToolbarGroup
      icon={<SwatchBookIcon className="h-4 w-4" />}
      title="Tags"
      position="right"
    >
      <span className="mx-0.5 cursor-default text-xs text-slate-500 max-xl:hidden">
        by
      </span>
      <TagSortControls />

      <ToolbarDivider />

      <AddTagsButton />
      <EditTagsButton />
      <DeleteToggleButton />

      <TagActionsMenu />
    </ResponsiveToolbarGroup>
  );
};

export const TagActions = memo(TagActionsComponent);
