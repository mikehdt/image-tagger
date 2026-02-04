import {
  ArrowUpFromLineIcon,
  CopyIcon,
  EllipsisVerticalIcon,
} from 'lucide-react';
import { useCallback, useState } from 'react';

import { MenuButton, MenuItem } from '@/app/components/shared/menu-button';
import { gatherTags } from '@/app/store/assets';
import { selectFilterTags } from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectSelectedAssetsCount } from '@/app/store/selection';
import { selectEffectiveScopeAssetIds } from '@/app/store/selection/combinedSelectors';

import { CopyTagsModal } from './copy-tags-modal';

export const TagActionsMenu = () => {
  const dispatch = useAppDispatch();
  const [isCopyTagsModalOpen, setIsCopyTagsModalOpen] = useState(false);

  const filterTags = useAppSelector(selectFilterTags);
  const selectedAssetsCount = useAppSelector(selectSelectedAssetsCount);
  const effectiveScopeAssetIds = useAppSelector(selectEffectiveScopeAssetIds);

  const openCopyTagsModal = useCallback(() => setIsCopyTagsModalOpen(true), []);
  const closeCopyTagsModal = useCallback(
    () => setIsCopyTagsModalOpen(false),
    [],
  );

  const handleGatherTags = useCallback(() => {
    if (filterTags.length >= 2) {
      dispatch(
        gatherTags({ tags: filterTags, assetIds: effectiveScopeAssetIds }),
      );
    }
  }, [dispatch, filterTags, effectiveScopeAssetIds]);

  const overflowMenuItems: MenuItem[] = [
    {
      label: 'Copy Tags',
      icon: <CopyIcon className="h-4 w-4" />,
      onClick: openCopyTagsModal,
      disabled: selectedAssetsCount < 2,
    },
    {
      label: 'Gather Tags',
      icon: <ArrowUpFromLineIcon className="h-4 w-4" />,
      onClick: handleGatherTags,
      disabled: filterTags.length < 2,
    },
  ];

  return (
    <>
      <MenuButton
        icon={<EllipsisVerticalIcon className="h-4 w-4" />}
        items={overflowMenuItems}
        position="bottom-right"
        title="More tag actions"
      />

      <CopyTagsModal
        isOpen={isCopyTagsModalOpen}
        onClose={closeCopyTagsModal}
      />
    </>
  );
};
