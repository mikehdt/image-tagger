'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Button } from '@/app/components/shared/button';
import { Checkbox } from '@/app/components/shared/checkbox';
import { Dropdown, DropdownItem } from '@/app/components/shared/dropdown';
import { Modal } from '@/app/components/shared/modal';
import { MultiTagInput } from '@/app/components/shared/multi-tag-input';
import { RadioGroup } from '@/app/components/shared/radio-group';
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
import {
  getAutoTaggerSettings,
  saveAutoTaggerSettings,
} from '@/app/utils/project-actions';

type TaggingProgress = {
  current: number;
  total: number;
  currentFileId?: string;
};

type TaggingResult = {
  fileId: string;
  tags: string[];
};

type TaggingSummary = {
  imagesProcessed: number;
  imagesWithNewTags: number;
  totalTagsFound: number;
};

type AutoTaggerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedAssets: { fileId: string; fileExtension: string }[];
};

/**
 * Modal for configuring and running auto-tagging on selected images
 */
export function AutoTaggerModal({
  isOpen,
  onClose,
  selectedAssets,
}: AutoTaggerModalProps) {
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

  // Tagging state
  const [isTagging, setIsTagging] = useState(false);
  const [progress, setProgress] = useState<TaggingProgress | null>(null);
  const [results, setResults] = useState<TaggingResult[]>([]);
  const [summary, setSummary] = useState<TaggingSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          // Apply saved settings to options
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
            // Validate tagInsertMode is still a valid option (we removed 'confidence')
            tagInsertMode:
              savedSettings.tagInsertMode === 'prepend' ||
              savedSettings.tagInsertMode === 'append'
                ? savedSettings.tagInsertMode
                : prev.tagInsertMode,
          }));

          // Apply saved model selection
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

  // Insert mode options for radio group
  const insertModeOptions: { value: TagInsertMode; label: string }[] = [
    { value: 'prepend', label: 'Prepend to start' },
    { value: 'append', label: 'Append to end' },
  ];

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
      // Reset state after closing
      setProgress(null);
      setResults([]);
      setSummary(null);
      setError(null);
      setSettingsLoaded(false);
    }
  }, [isTagging, onClose]);

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

  const handleStartTagging = useCallback(async () => {
    if (!selectedModelId || !projectInfo.projectPath) return;

    setIsTagging(true);
    setProgress({ current: 0, total: selectedAssets.length });
    setResults([]);
    setSummary(null);
    setError(null);

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
      });

      if (!response.ok) {
        throw new Error('Failed to start tagging');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const collectedResults: TaggingResult[] = [];
      let buffer = '';
      let receivedComplete = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Append new data to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines from buffer
        const lines = buffer.split('\n');
        // Keep the last potentially incomplete line in the buffer
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
                // Per-image error, continue processing
                console.warn(`Error tagging ${event.fileId}:`, event.error);
              } else if (event.type === 'error') {
                // Global error
                throw new Error(event.error);
              } else if (event.type === 'complete') {
                receivedComplete = true;
                // Calculate summary before applying tags
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

                // Apply all collected tags to assets
                applyTagsToAssets(collectedResults);

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

      // If we exit the loop without a complete event, still set the summary
      // (this can happen if the stream ends unexpectedly)
      if (!receivedComplete) {
        if (collectedResults.length > 0) {
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
        } else {
          // No results received at all - something went wrong
          throw new Error(
            'No results received from tagger. Check server logs for errors.',
          );
        }
      }

      setResults(collectedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tagging failed');
    } finally {
      setIsTagging(false);
      setProgress(null);
    }
  }, [
    selectedModelId,
    projectInfo.projectPath,
    projectInfo.projectName,
    selectedAssets,
    options,
    applyTagsToAssets,
  ]);

  const progressPercent = progress
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      preventClose={isTagging}
      className="max-w-xl"
    >
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-800">
          Auto-Tag Images
        </h2>

        {!hasReadyModel ? (
          // No models installed
          <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">No models installed</p>
            <p className="mt-1">
              Please set up an auto-tagger model first using the menu option.
            </p>
          </div>
        ) : isTagging ? (
          // Tagging in progress
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-600">
              Tagging image {progress?.current || 0} of {progress?.total || 0}
              ...
            </p>

            <div className="flex flex-col gap-2">
              <div className="h-3 w-full overflow-hidden rounded-full bg-linear-to-t from-slate-200 to-slate-300 inset-shadow-xs inset-shadow-slate-400">
                <div
                  className="h-full bg-linear-to-t from-indigo-600 to-indigo-500 inset-shadow-xs inset-shadow-indigo-300 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                {progress?.currentFileId || 'Processing...'}
              </p>
            </div>

            <p className="text-xs text-slate-500">
              Please wait while images are being tagged.
            </p>
          </div>
        ) : summary ? (
          // Tagging complete - show summary
          <div className="flex flex-col gap-4">
            <div className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-medium">Tagging complete!</p>
              <ul className="mt-2 space-y-1">
                <li>
                  Processed {summary.imagesProcessed} image
                  {summary.imagesProcessed !== 1 ? 's' : ''}
                </li>
                <li>
                  Found {summary.totalTagsFound} tag
                  {summary.totalTagsFound !== 1 ? 's' : ''} across{' '}
                  {summary.imagesWithNewTags} image
                  {summary.imagesWithNewTags !== 1 ? 's' : ''}
                </li>
                {summary.imagesProcessed > summary.imagesWithNewTags && (
                  <li className="text-emerald-600">
                    {summary.imagesProcessed - summary.imagesWithNewTags} image
                    {summary.imagesProcessed - summary.imagesWithNewTags !== 1
                      ? 's'
                      : ''}{' '}
                    had no new tags (threshold not met or already tagged)
                  </li>
                )}
              </ul>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose} color="indigo" size="medium">
                Done
              </Button>
            </div>
          </div>
        ) : (
          // Settings view
          <>
            <p className="text-sm text-slate-600">
              Configure tagging options for {selectedAssets.length} selected
              image{selectedAssets.length !== 1 ? 's' : ''}.
            </p>

            {error && (
              <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {/* Model selection */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">
                Model
              </label>
              <Dropdown
                items={modelItems}
                selectedValue={selectedModelId || ''}
                onChange={handleModelChange}
              />
            </div>

            {/* Thresholds */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">
                  General Threshold: {options.generalThreshold.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={options.generalThreshold}
                  onChange={(e) =>
                    handleOptionChange(
                      'generalThreshold',
                      parseFloat(e.target.value),
                    )
                  }
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">
                  Character Threshold: {options.characterThreshold.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={options.characterThreshold}
                  onChange={(e) =>
                    handleOptionChange(
                      'characterThreshold',
                      parseFloat(e.target.value),
                    )
                  }
                  className="w-full"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-4">
              <Checkbox
                isSelected={options.includeCharacterTags}
                onChange={() =>
                  handleOptionChange(
                    'includeCharacterTags',
                    !options.includeCharacterTags,
                  )
                }
                label="Include character tags"
                size="small"
              />
              <Checkbox
                isSelected={options.includeRatingTags}
                onChange={() =>
                  handleOptionChange(
                    'includeRatingTags',
                    !options.includeRatingTags,
                  )
                }
                label="Include rating tags"
                size="small"
              />
              <Checkbox
                isSelected={options.removeUnderscore}
                onChange={() =>
                  handleOptionChange(
                    'removeUnderscore',
                    !options.removeUnderscore,
                  )
                }
                label="Replace underscores with spaces"
                size="small"
              />
            </div>

            {/* Tag insert mode */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">
                New tags
              </label>
              <RadioGroup
                name="tagInsertMode"
                options={insertModeOptions}
                value={options.tagInsertMode}
                onChange={(mode) => handleOptionChange('tagInsertMode', mode)}
                size="small"
              />
            </div>

            {/* Exclude tags */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">
                Exclude Tags
              </label>
              <MultiTagInput
                tags={options.excludeTags}
                onTagsChange={(tags) => handleOptionChange('excludeTags', tags)}
                placeholder="Tags to never add..."
                className="bg-white"
              />
            </div>

            {/* Include tags */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">
                Always Include Tags
              </label>
              <MultiTagInput
                tags={options.includeTags}
                onTagsChange={(tags) => handleOptionChange('includeTags', tags)}
                placeholder="Tags to always add..."
                className="bg-white"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={handleClose} color="slate" size="medium">
                Cancel
              </Button>
              <Button
                onClick={handleStartTagging}
                color="indigo"
                size="medium"
                disabled={!selectedModelId || selectedAssets.length === 0}
              >
                Start Tagging
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
