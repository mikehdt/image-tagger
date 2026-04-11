import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { DropdownItem } from '@/app/components/shared/dropdown';
import type {
  AutoTaggerSettings,
  TaggerOptions,
  TagInsertMode,
} from '@/app/services/auto-tagger';
import { DEFAULT_TAGGER_OPTIONS } from '@/app/services/auto-tagger';
import {
  abortTagging,
  registerTaggingController,
  removeTaggingController,
} from '@/app/services/auto-tagger/tagging-controllers';
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
import {
  addJob,
  cancelTagging,
  completeTagging,
  failTagging,
  selectActiveTaggingJob,
  updateTaggingProgress,
} from '@/app/store/jobs';
import { selectProjectInfo } from '@/app/store/project';
import { setAssetsSelectionState } from '@/app/store/selection';
import {
  getAutoTaggerSettings,
  saveAutoTaggerSettings,
} from '@/app/utils/project-actions';

import type { TaggingResult } from './types';

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

  // Active tagging job for this project (from the jobs slice)
  const activeTaggingJob = useSelector(
    selectActiveTaggingJob(projectInfo.projectFolderName ?? ''),
  );

  // Derived state from the job
  const isTagging = activeTaggingJob !== null;
  const progress = activeTaggingJob?.progress ?? null;

  // Local settings state (not part of the job)
  const [options, setOptions] = useState<TaggerOptions>({
    ...DEFAULT_TAGGER_OPTIONS,
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [unselectOnComplete, setUnselectOnComplete] = useState(true);

  // Summary and error are set locally after the job completes,
  // since they drive the modal's summary view
  const [summary, setSummary] = useState<{
    imagesProcessed: number;
    imagesWithNewTags: number;
    totalTagsFound: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wasCancelled, setWasCancelled] = useState(false);

  // Track the current job ID so we can cancel it
  const currentJobIdRef = useRef<string | null>(null);

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

  // Load saved settings when modal opens (after models are available)
  useEffect(() => {
    if (
      isOpen &&
      projectInfo.projectFolderName &&
      !settingsLoaded &&
      models.length > 0
    ) {
      getAutoTaggerSettings(projectInfo.projectFolderName).then(
        (savedSettings) => {
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

            if (
              savedSettings.defaultModelId &&
              readyModels.some((m) => m.id === savedSettings.defaultModelId)
            ) {
              dispatch(setSelectedModel(savedSettings.defaultModelId));
            }
          }
          setSettingsLoaded(true);
        },
      );
    }
  }, [
    isOpen,
    projectInfo.projectFolderName,
    settingsLoaded,
    models,
    readyModels,
    dispatch,
  ]);

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
      setSummary(null);
      setError(null);
      setWasCancelled(false);
      setSettingsLoaded(false);
    }
  }, [isTagging, onClose]);

  const handleCancel = useCallback(() => {
    const jobId = currentJobIdRef.current;
    if (jobId) {
      abortTagging(jobId);
      dispatch(cancelTagging(jobId));
    }
  }, [dispatch]);

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
    (jobId: string, collectedResults: TaggingResult[]) => {
      const imagesWithNewTags = collectedResults.filter(
        (r) => r.tags.length > 0,
      ).length;
      const totalTagsFound = collectedResults.reduce(
        (sum, r) => sum + r.tags.length,
        0,
      );
      const summaryData = {
        imagesProcessed: collectedResults.length,
        imagesWithNewTags,
        totalTagsFound,
      };
      setSummary(summaryData);
      dispatch(completeTagging({ id: jobId, summary: summaryData }));
      applyTagsToAssets(collectedResults);
      deselectTaggedAssets(collectedResults);
    },
    [applyTagsToAssets, deselectTaggedAssets, dispatch],
  );

  const handleStartTagging = useCallback(async () => {
    if (
      !selectedModelId ||
      !projectInfo.projectPath ||
      !projectInfo.projectFolderName
    )
      return;

    // Create a job in the queue
    const jobId = `tagging-${Date.now()}`;
    const modelName =
      readyModels.find((m) => m.id === selectedModelId)?.name ??
      selectedModelId;

    dispatch(
      addJob({
        id: jobId,
        type: 'tagging',
        status: 'preparing',
        createdAt: Date.now(),
        startedAt: Date.now(),
        completedAt: null,
        error: null,
        projectFolderName: projectInfo.projectFolderName,
        modelName,
        progress: { current: 0, total: selectedAssets.length },
        summary: null,
      }),
    );

    currentJobIdRef.current = jobId;
    const abortController = registerTaggingController(jobId);

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
                dispatch(
                  updateTaggingProgress({
                    id: jobId,
                    progress: {
                      current: event.current,
                      total: event.total,
                      currentFileId: event.fileId,
                    },
                  }),
                );
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
                finaliseResults(jobId, collectedResults);

                // Save settings as defaults for this project
                if (projectInfo.projectFolderName) {
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
                    projectInfo.projectFolderName,
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
          finaliseResults(jobId, collectedResults);
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
          // Apply partial results but mark as cancelled
          const imagesWithNewTags = collectedResults.filter(
            (r) => r.tags.length > 0,
          ).length;
          const totalTagsFound = collectedResults.reduce(
            (sum, r) => sum + r.tags.length,
            0,
          );
          const summaryData = {
            imagesProcessed: collectedResults.length,
            imagesWithNewTags,
            totalTagsFound,
          };
          setSummary(summaryData);
          applyTagsToAssets(collectedResults);
          deselectTaggedAssets(collectedResults);
        } else {
          setSummary({
            imagesProcessed: 0,
            imagesWithNewTags: 0,
            totalTagsFound: 0,
          });
        }
        // cancelTagging already dispatched by the abort handler
      } else {
        const message = err instanceof Error ? err.message : 'Tagging failed';
        setError(message);
        dispatch(failTagging({ id: jobId, error: message }));
      }
    } finally {
      removeTaggingController(jobId);
      currentJobIdRef.current = null;
    }
  }, [
    selectedModelId,
    projectInfo.projectPath,
    projectInfo.projectFolderName,
    selectedAssets,
    readyModels,
    options,
    finaliseResults,
    applyTagsToAssets,
    deselectTaggedAssets,
    dispatch,
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
