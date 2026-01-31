import { SparklesIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AutoTaggerModal } from '@/app/components/auto-tagger';
import { Button } from '@/app/components/shared/button';
import {
  selectHasReadyModel,
  selectIsInitialised,
  setModelsAndProviders,
} from '@/app/store/auto-tagger';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectSelectedAssetsCount } from '@/app/store/selection';
import { selectSelectedAssetsData } from '@/app/store/selection/combinedSelectors';

export const AutoTaggerButton = () => {
  const dispatch = useAppDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedAssetsCount = useAppSelector(selectSelectedAssetsCount);
  const selectedAssetsData = useAppSelector(selectSelectedAssetsData);
  const hasReadyModel = useAppSelector(selectHasReadyModel);
  const isAutoTaggerInitialised = useAppSelector(selectIsInitialised);

  // Fetch auto-tagger models on mount to determine if any are ready
  useEffect(() => {
    if (!isAutoTaggerInitialised) {
      fetch('/api/auto-tagger/models')
        .then((res) => res.json())
        .then((data) => {
          dispatch(setModelsAndProviders(data));
        })
        .catch(console.error);
    }
  }, [isAutoTaggerInitialised, dispatch]);

  // Prepare selected assets for auto-tagger (only need fileId and extension)
  const selectedAssetsForTagger = useMemo(
    () =>
      selectedAssetsData.map((asset) => ({
        fileId: asset.fileId,
        fileExtension: asset.fileExtension,
      })),
    [selectedAssetsData],
  );

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  return (
    <>
      <Button
        type="button"
        onClick={openModal}
        disabled={!hasReadyModel || selectedAssetsCount === 0}
        variant="ghost"
        color="slate"
        size="medium"
        title={
          !hasReadyModel
            ? 'Set up auto-tagger first (Project menu)'
            : selectedAssetsCount === 0
              ? 'Select assets to auto-tag'
              : `Auto-tag ${selectedAssetsCount} selected asset${selectedAssetsCount === 1 ? '' : 's'}`
        }
      >
        <SparklesIcon className="w-4" />
        <span className="ml-2 max-2xl:hidden">Auto</span>
      </Button>

      <AutoTaggerModal
        isOpen={isModalOpen}
        onClose={closeModal}
        selectedAssets={selectedAssetsForTagger}
      />
    </>
  );
};
