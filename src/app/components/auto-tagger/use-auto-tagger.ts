import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { DropdownItem } from '@/app/components/shared/dropdown';
import type {
  AutoTaggerSettings,
  TaggerOptions,
  TagInsertMode,
} from '@/app/services/auto-tagger';
import { DEFAULT_TAGGER_OPTIONS } from '@/app/services/auto-tagger';
import type { AppDispatch, RootState } from '@/app/store';
import { addMultipleTags } from '@/app/store/assets';
import {
  selectHasReadyModel,
  selectModels,
  selectReadyModels,
  selectSelectedModelId,
  setModelsAndProviders,
  setSelectedModel,
} from '@/app/store/auto-tagger';
import { selectProjectInfo } from '@/app/store/project';
import { setAssetsSelectionState } from '@/app/store/selection';
import {
  getAutoTaggerSettings,
  saveAutoTaggerSettings,
} from '@/app/utils/project-actions';

import type { TaggingProgress, TaggingResult, TaggingSummary } from './types';

type UseAutoTaggerParams = {
  isOpen: boolean;
  onClose: () => void;
  selectedAssets: { fileId: string; fileExtension: string }[];
};

const INSERT_MODE_OPTIONS: { value: TagInsertMode; label: string }[] = [
  { value: 'prepend', label: 'Prepend to start' },
  { value: 'append', label: 'Append to end' },
];

export function useAutoTagger({
  isOpen,
  onClose,
  selectedAssets,
}: UseAutoTaggerParams) {
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const models = useSelector(selectModels);
  const readyModels = useSelector(selectReadyModels);
  const hasReadyModel = useSelector(selectHasReadyModel);
  const selectedModelId = useSelector(selectSelectedModelId);
  const projectInfo = useSelector((state: RootState) =>
    selectProjectInfo(state),
  );

  // Local options state
  const [options, setOptions] = useState<TaggerOptions>({
    ...DEFAULT_TAGGER_OPTIONS,
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [unselectOnComplete, setUnselectOnComplete] = useState(true);

  // Tagging state
  const [isTagging, setIsTagging] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<TaggingProgress | null>(null);
  const [summary, setSummary] = useState<TaggingSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wasCancelled, setWasCancelled] = useState(false);

  // Fetch models callback
  const fetchModels = useCallback(async () => {
    try {
      const response = await fetch('/api/auto-tagger/models');
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      dispatch(setModelsAndProviders(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
    }
  }, [dispatch]);

  // Fetch models if not already loaded
  useEffect(() => {
    if (isOpen && models.length === 0) {
      fetchModels();
    }
  }, [isOpen, models.length, fetchModels]);

  // Load saved settings when modal opens
  useEffect(() => {
    if (isOpen && projectInfo.projectName && !settingsLoaded) {
      getAutoTaggerSettings(projectInfo.projectName).then((savedSettings) => {
        if (savedSettings) {
          setOptions((prev) => ({
            ...prev,
            generalThreshold:
              savedSettings.generalThreshold ?? prev.generalThreshold,
            characterThreshold:
              savedSettings.characterThreshold ?? prev.characterThreshold,
            removeUnderscore:
              savedSettings.removeUnderscore ?? prev.removeUnderscore,
            includeCharacterTags:
              savedSettings.includeCharacterTags ?? prev.includeCharacterTags,
            includeRatingTags:
              savedSettings.includeRatingTags ?? prev.includeRatingTags,
            excludeTags: savedSettings.excludeTags ?? prev.excludeTags,
            tagInsertMode:
              savedSettings.tagInsertMode === 'prepend' ||
              savedSettings.tagInsertMode === 'append'
                ? savedSettings.tagInsertMode
                : prev.tagInsertMode,
          }));

          if (savedSettings.defaultModelId) {
            dispatch(setSelectedModel(savedSettings.defaultModelId));
          }
        }
        setSettingsLoaded(true);
      });
    }
  }, [isOpen, projectInfo.projectName, settingsLoaded, dispatch]);

  // Model dropdown items
  const modelItems: DropdownItem<string>[] = useMemo(
    () =>
      readyModels.map((model) => ({
        value: model.id,
        label: model.name,
      })),
    [readyModels],
  );

  const handleModelChange = useCallback(
    (modelId: string) => {
      dispatch(setSelectedModel(modelId));
    },
    [dispatch],
  );

  const handleOptionChange = useCallback(
    <K extends keyof TaggerOptions>(key: K, value: TaggerOptions[K]) => {
      setOptions((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleClose = useCallback(() => {
    if (!isTagging) {
      onClose();
      setProgress(null);
      setSummary(null);
      setError(null);
      setWasCancelled(false);
      setSettingsLoaded(false);
    }
  }, [isTagging, onClose]);

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const applyTagsToAssets = useCallback(
    (taggingResults: TaggingResult[]) => {
      for (const result of taggingResults) {
        if (result.tags.length > 0) {
          dispatch(
            addMultipleTags({
              assetId: result.fileId,
              tagNames: result.tags,
              position: options.tagInsertMode === 'prepend' ? 'start' : 'end',
            }),
          );
        }
      }
    },
    [dispatch, options.tagInsertMode],
  );

  const deselectTaggedAssets = useCallback(
    (collectedResults: TaggingResult[]) => {
      if (!unselectOnComplete) return;
      const taggedIds = collectedResults
        .filter((r) => r.tags.length > 0)
        .map((r) => r.fileId);
      if (taggedIds.length > 0) {
        dispatch(
          setAssetsSelectionState({ assetIds: taggedIds, selected: false }),
        );
      }
    },
    [unselectOnComplete, dispatch],
  );

  const finaliseResults = useCallback(
    (collectedResults: TaggingResult[]) => {
      const imagesWithNewTags = collectedResults.filter(
        (r) => r.tags.length > 0,
      ).length;
      const totalTagsFound = collectedResults.reduce(
        (sum, r) => sum + r.tags.length,
        0,
      );
      setSummary({
        imagesProcessed: collectedResults.length,
        imagesWithNewTags,
        totalTagsFound,
      });
      applyTagsToAssets(collectedResults);
      deselectTaggedAssets(collectedResults);
    },
    [applyTagsToAssets, deselectTaggedAssets],
  );

  const handleStartTagging = useCallback(async () => {
    if (!selectedModelId || !projectInfo.projectPath) return;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsTagging(true);
    setProgress({ current: 0, total: selectedAssets.length });
    setSummary(null);
    setError(null);
    setWasCancelled(false);

    const collectedResults: TaggingResult[] = [];

    try {
      const response = await fetch('/api/auto-tagger/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModelId,
          projectPath: projectInfo.projectPath,
          assets: selectedAssets,
          options,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to start tagging');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let receivedComplete = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === 'progress') {
                setProgress({
                  current: event.current,
                  total: event.total,
                  currentFileId: event.fileId,
                });
              } else if (event.type === 'result') {
                collectedResults.push({
                  fileId: event.fileId,
                  tags: event.tags || [],
                });
              } else if (event.type === 'error' && event.fileId) {
                console.warn(`Error tagging ${event.fileId}:`, event.error);
              } else if (event.type === 'error') {
                throw new Error(event.error);
              } else if (event.type === 'complete') {
                receivedComplete = true;
                finaliseResults(collectedResults);

                // Save settings as defaults for this project
                if (projectInfo.projectName) {
                  const settingsToSave: AutoTaggerSettings = {
                    defaultModelId: selectedModelId,
                    generalThreshold: options.generalThreshold,
                    characterThreshold: options.characterThreshold,
                    removeUnderscore: options.removeUnderscore,
                    includeCharacterTags: options.includeCharacterTags,
                    includeRatingTags: options.includeRatingTags,
                    excludeTags: options.excludeTags,
                    tagInsertMode: options.tagInsertMode,
                  };
                  saveAutoTaggerSettings(
                    projectInfo.projectName,
                    settingsToSave,
                  ).catch(console.error);
                }
              }
            } catch (parseErr) {
              console.warn('Failed to parse SSE event:', line, parseErr);
            }
          }
        }
      }

      // Process any remaining data in buffer
      if (buffer.startsWith('data: ')) {
        try {
          const event = JSON.parse(buffer.slice(6));
          if (event.type === 'result') {
            collectedResults.push({
              fileId: event.fileId,
              tags: event.tags,
            });
          } else if (event.type === 'complete') {
            receivedComplete = true;
          }
        } catch (parseErr) {
          console.warn('Failed to parse final SSE event:', buffer, parseErr);
        }
      }

      if (!receivedComplete) {
        if (collectedResults.length > 0) {
          finaliseResults(collectedResults);
        } else {
          throw new Error(
            'No results received from tagger. Check server logs for errors.',
          );
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setWasCancelled(true);
        if (collectedResults.length > 0) {
          finaliseResults(collectedResults);
        } else {
          setSummary({
            imagesProcessed: 0,
            imagesWithNewTags: 0,
            totalTagsFound: 0,
          });
        }
      } else {
        setError(err instanceof Error ? err.message : 'Tagging failed');
      }
    } finally {
      setIsTagging(false);
      setProgress(null);
      abortControllerRef.current = null;
    }
  }, [
    selectedModelId,
    projectInfo.projectPath,
    projectInfo.projectName,
    selectedAssets,
    options,
    finaliseResults,
  ]);

  return {
    // State
    options,
    unselectOnComplete,
    isTagging,
    progress,
    summary,
    error,
    wasCancelled,
    hasReadyModel,
    modelItems,
    selectedModelId,
    insertModeOptions: INSERT_MODE_OPTIONS,
    // Actions
    handleModelChange,
    handleOptionChange,
    setUnselectOnComplete,
    handleClose,
    handleCancel,
    handleStartTagging,
  };
}
