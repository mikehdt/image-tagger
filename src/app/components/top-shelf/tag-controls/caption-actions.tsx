import { SparklesIcon, SwatchBookIcon } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { AutoTaggerModal } from '@/app/components/auto-tagger';
import { Button } from '@/app/components/shared/button';
import { selectFilteredAssets } from '@/app/store/assets';
import {
  selectHasReadyModel,
  selectIsInitialised,
  setModelsAndProviders,
} from '@/app/store/auto-tagger';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectSelectedAssetsCount } from '@/app/store/selection';
import {
  selectAssetsWithActiveFiltersCount,
  selectSelectedAssetsData,
} from '@/app/store/selection/combinedSelectors';

import { ResponsiveToolbarGroup } from '../../shared/responsive-toolbar-group';
import { ToolbarDivider } from '../../shared/toolbar-divider';
import { TriggerPhrasesButton } from './trigger-phrases-button';

/** Auto Tagger button — first-class in caption mode */
const AutoTaggerButton = () => {
  const dispatch = useAppDispatch();
  const [isTaggerModalOpen, setIsTaggerModalOpen] = useState(false);

  const selectedAssetsData = useAppSelector(selectSelectedAssetsData);
  const filteredAssets = useAppSelector(selectFilteredAssets);
  const filteredAssetsCount = useAppSelector(
    selectAssetsWithActiveFiltersCount,
  );
  const selectedAssetsCount = useAppSelector(selectSelectedAssetsCount);
  const hasReadyModel = useAppSelector(selectHasReadyModel);
  const isAutoTaggerInitialised = useAppSelector(selectIsInitialised);

  // Initialise auto-tagger models (same logic as TagActionsMenu)
  useEffect(() => {
    if (!isAutoTaggerInitialised) {
      const fetchModels = (isRetry: boolean) => {
        fetch('/api/auto-tagger/models')
          .then((res) => {
            if (!res.ok) throw new Error(`${res.status}`);
            return res.json();
          })
          .then((data) => {
            dispatch(setModelsAndProviders(data));
          })
          .catch((err) => {
            if (!isRetry) {
              setTimeout(() => fetchModels(true), 3000);
            } else {
              console.error('Failed to fetch auto-tagger models:', err);
            }
          });
      };
      fetchModels(false);
    }
  }, [isAutoTaggerInitialised, dispatch]);

  const hasAssetsForTagger =
    selectedAssetsData.length > 0 || filteredAssetsCount > 0;

  const assetsForTagger = useMemo(() => {
    if (!isTaggerModalOpen) return [];
    const source =
      selectedAssetsData.length > 0 ? selectedAssetsData : filteredAssets;
    return source.map((asset) => ({
      fileId: asset.fileId,
      fileExtension: asset.fileExtension,
    }));
  }, [isTaggerModalOpen, selectedAssetsData, filteredAssets]);

  const openTaggerModal = useCallback(() => setIsTaggerModalOpen(true), []);
  const closeTaggerModal = useCallback(() => setIsTaggerModalOpen(false), []);

  return (
    <>
      <Button
        variant="ghost"
        onClick={openTaggerModal}
        disabled={!hasReadyModel || !hasAssetsForTagger}
        title={
          !hasReadyModel
            ? 'No tagger model ready'
            : selectedAssetsCount > 0
              ? `Auto-tag ${selectedAssetsCount} selected`
              : `Auto-tag ${filteredAssetsCount} filtered`
        }
      >
        <SparklesIcon className="h-4 w-4" />
        <span className="ml-2 max-lg:hidden">Auto Tag</span>
      </Button>

      <AutoTaggerModal
        isOpen={isTaggerModalOpen}
        onClose={closeTaggerModal}
        selectedAssets={assetsForTagger}
      />
    </>
  );
};

const CaptionActionsComponent = () => {
  return (
    <ResponsiveToolbarGroup
      icon={<SwatchBookIcon className="h-4 w-4" />}
      title="Captions"
      position="right"
    >
      <TriggerPhrasesButton />

      <ToolbarDivider />

      <AutoTaggerButton />
    </ResponsiveToolbarGroup>
  );
};

export const CaptionActions = memo(CaptionActionsComponent);
