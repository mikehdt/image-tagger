import { HighlighterIcon, SparklesIcon, TextIcon } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { AutoTaggerModal } from '@/app/components/auto-tagger';
import { Button } from '@/app/components/shared/button';
import { Modal } from '@/app/components/shared/modal';
import { selectFilteredAssets } from '@/app/store/assets';
import {
  selectHasReadyModel,
  selectIsInitialised,
  setModelsAndProviders,
} from '@/app/store/auto-tagger';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  selectProjectFolderName,
  selectTriggerPhrases,
  setTriggerPhrases,
} from '@/app/store/project';
import { selectSelectedAssetsCount } from '@/app/store/selection';
import {
  selectAssetsWithActiveFiltersCount,
  selectSelectedAssetsData,
} from '@/app/store/selection/combinedSelectors';
import { updateProject } from '@/app/utils/project-actions';

import { ResponsiveToolbarGroup } from '../../shared/responsive-toolbar-group';
import { ToolbarDivider } from '../../shared/toolbar-divider';

/** Modal for editing trigger phrases — one per line in a textarea */
const TriggerPhrasesModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const dispatch = useAppDispatch();
  const triggerPhrases = useAppSelector(selectTriggerPhrases);
  const projectFolderName = useAppSelector(selectProjectFolderName);
  const [text, setText] = useState(() => triggerPhrases.join('\n'));

  const handleSave = useCallback(() => {
    const phrases = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    dispatch(setTriggerPhrases(phrases));
    if (projectFolderName) {
      updateProject(projectFolderName, { triggerPhrases: phrases });
    }
    onClose();
  }, [text, dispatch, projectFolderName, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <h2 className="mb-1 text-lg font-semibold">Trigger Phrases</h2>
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
        One phrase per line. These are highlighted in captions.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full rounded border border-slate-300 bg-white p-2 text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-300 dark:border-slate-600 dark:bg-slate-700 dark:focus:border-amber-500"
        rows={5}
        placeholder={'ohwx\na photo of sks'}
        autoFocus
      />
      <div className="mt-3 flex justify-end gap-2">
        <Button size="medium" color="stone" onClick={onClose}>
          Cancel
        </Button>
        <Button size="medium" color="amber" onClick={handleSave}>
          Save
        </Button>
      </div>
    </Modal>
  );
};

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
        size="small"
        variant="default"
        color="indigo"
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
        <span className="max-lg:hidden">Auto Tag</span>
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
  const [isTriggersModalOpen, setIsTriggersModalOpen] = useState(false);
  const triggerPhrases = useAppSelector(selectTriggerPhrases);

  return (
    <ResponsiveToolbarGroup
      icon={<TextIcon className="h-4 w-4" />}
      title="Captions"
      position="right"
    >
      <Button
        size="small"
        variant="default"
        color="amber"
        onClick={() => setIsTriggersModalOpen(true)}
        title="Edit trigger phrases"
      >
        <HighlighterIcon className="h-4 w-4" />
        <span className="max-lg:hidden">
          Triggers
          {triggerPhrases.length > 0 ? ` (${triggerPhrases.length})` : ''}
        </span>
      </Button>

      <TriggerPhrasesModal
        isOpen={isTriggersModalOpen}
        onClose={() => setIsTriggersModalOpen(false)}
      />

      <ToolbarDivider />

      <AutoTaggerButton />
    </ResponsiveToolbarGroup>
  );
};

export const CaptionActions = memo(CaptionActionsComponent);
