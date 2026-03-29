import {
  ArrowUpFromLineIcon,
  ChevronsDownIcon,
  CopyIcon,
  SparklesIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AutoTaggerModal } from '@/app/components/auto-tagger';
import { MenuButton, MenuItem } from '@/app/components/shared/menu-button';
import { gatherTags } from '@/app/store/assets';
import { selectFilteredAssets } from '@/app/store/assets';
import {
  selectHasReadyModel,
  selectIsInitialised,
  setModelsAndProviders,
} from '@/app/store/auto-tagger';
import { selectFilterTags } from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectSelectedAssetsCount } from '@/app/store/selection';
import {
  selectAssetsWithActiveFiltersCount,
  selectEffectiveScopeAssetIds,
  selectSelectedAssetsData,
} from '@/app/store/selection/combinedSelectors';

import { CopyTagsModal } from './copy-tags-modal';

export const TagActionsMenu = () => {
  const dispatch = useAppDispatch();
  const [isCopyTagsModalOpen, setIsCopyTagsModalOpen] = useState(false);
  const [isTaggerModalOpen, setIsTaggerModalOpen] = useState(false);

  const filterTags = useAppSelector(selectFilterTags);
  const selectedAssetsCount = useAppSelector(selectSelectedAssetsCount);
  const effectiveScopeAssetIds = useAppSelector(selectEffectiveScopeAssetIds);

  const openCopyTagsModal = useCallback(() => setIsCopyTagsModalOpen(true), []);
  const closeCopyTagsModal = useCallback(
    () => setIsCopyTagsModalOpen(false),
    [],
  );

  const selectedAssetsData = useAppSelector(selectSelectedAssetsData);
  const filteredAssets = useAppSelector(selectFilteredAssets);
  const filteredAssetsCount = useAppSelector(selectAssetsWithActiveFiltersCount);
  const hasReadyModel = useAppSelector(selectHasReadyModel);
  const isAutoTaggerInitialised = useAppSelector(selectIsInitialised);

  // Fetch auto-tagger models on mount to determine if any are ready
  useEffect(() => {
    if (!isAutoTaggerInitialised) {
      fetch('/api/auto-tagger/models')
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          dispatch(setModelsAndProviders(data));
        })
        .catch(console.error);
    }
  }, [isAutoTaggerInitialised, dispatch]);

  // Whether there are any assets available for auto-tagging (cheap count check)
  const hasAssetsForTagger =
    selectedAssetsData.length > 0 || filteredAssetsCount > 0;

  // Prepare assets for auto-tagger: only compute the full mapped array when modal is open
  const assetsForTagger = useMemo(() => {
    if (!isTaggerModalOpen) return [];
    const source = selectedAssetsData.length > 0 ? selectedAssetsData : filteredAssets;
    return source.map((asset) => ({
      fileId: asset.fileId,
      fileExtension: asset.fileExtension,
    }));
  }, [isTaggerModalOpen, selectedAssetsData, filteredAssets]);

  const openTaggerModal = useCallback(() => setIsTaggerModalOpen(true), []);
  const closeTaggerModal = useCallback(() => setIsTaggerModalOpen(false), []);

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
    {
      label: 'Auto Tagger',
      icon: <SparklesIcon className="h-4 w-4" />,
      onClick: openTaggerModal,
      disabled: !hasReadyModel || !hasAssetsForTagger,
    },
  ];

  return (
    <>
      <MenuButton
        icon={<ChevronsDownIcon className="h-4 w-4" />}
        items={overflowMenuItems}
        position="bottom-right"
        title="More tag actions"
      />

      <CopyTagsModal
        isOpen={isCopyTagsModalOpen}
        onClose={closeCopyTagsModal}
      />

      <AutoTaggerModal
        isOpen={isTaggerModalOpen}
        onClose={closeTaggerModal}
        selectedAssets={assetsForTagger}
      />
    </>
  );
};
