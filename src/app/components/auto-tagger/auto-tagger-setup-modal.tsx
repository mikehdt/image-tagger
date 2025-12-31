'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Button } from '@/app/components/shared/button';
import { Modal } from '@/app/components/shared/modal';
import type { AppDispatch } from '@/app/store';
import {
  closeSetupModal,
  downloadComplete,
  downloadFailed,
  selectDownloadProgress,
  selectIsDownloading,
  selectIsSetupModalOpen,
  selectModels,
  selectProviders,
  setModelsAndProviders,
  startDownload,
  updateDownloadProgress,
} from '@/app/store/auto-tagger';

type ModelInfo = {
  id: string;
  name: string;
  provider: string;
  description?: string;
  isDefault?: boolean;
  totalSize: number;
  status: 'not_installed' | 'downloading' | 'ready' | 'error' | 'checking';
};

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Auto-tagger setup modal
 * Allows users to select and download tagger models
 */
export function AutoTaggerSetupModal() {
  const dispatch = useDispatch<AppDispatch>();
  const isOpen = useSelector(selectIsSetupModalOpen);
  const providers = useSelector(selectProviders);
  const models = useSelector(selectModels);
  const isDownloading = useSelector(selectIsDownloading);
  const downloadProgress = useSelector(selectDownloadProgress);

  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch models when modal opens
  useEffect(() => {
    if (isOpen && models.length === 0) {
      fetchModels();
    }
  }, [isOpen, models.length, fetchModels]);

  // Auto-select default model
  useEffect(() => {
    if (models.length > 0 && !selectedModelId) {
      const defaultModel = models.find((m) => m.isDefault) || models[0];
      setSelectedModelId(defaultModel.id);
    }
  }, [models, selectedModelId]);

  const handleClose = useCallback(() => {
    if (!isDownloading) {
      dispatch(closeSetupModal());
      setError(null);
    }
  }, [dispatch, isDownloading]);

  const handleDownload = useCallback(async () => {
    if (!selectedModelId) return;

    setError(null);
    dispatch(startDownload(selectedModelId));

    try {
      const response = await fetch('/api/auto-tagger/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: selectedModelId }),
      });

      if (!response.ok) {
        throw new Error('Failed to start download');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.status === 'error') {
              dispatch(
                downloadFailed({ modelId: selectedModelId, error: data.error }),
              );
              setError(data.error);
              return;
            }

            if (data.status === 'ready') {
              dispatch(downloadComplete(selectedModelId));
              return;
            }

            dispatch(updateDownloadProgress(data));
          }
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Download failed';
      dispatch(
        downloadFailed({ modelId: selectedModelId, error: errorMessage }),
      );
      setError(errorMessage);
    }
  }, [dispatch, selectedModelId]);

  const selectedModel = models.find((m) => m.id === selectedModelId);
  const progressPercent = downloadProgress
    ? Math.round(
        (downloadProgress.bytesDownloaded / downloadProgress.totalBytes) * 100,
      )
    : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      preventClose={isDownloading}
      className="max-w-lg"
    >
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">
          Set Up Auto-Tagger
        </h2>

        {isDownloading ? (
          // Download progress view
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Downloading {selectedModel?.name}...
            </p>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{downloadProgress?.currentFile || 'Preparing...'}</span>
                <span>
                  {formatBytes(downloadProgress?.bytesDownloaded || 0)} /{' '}
                  {formatBytes(downloadProgress?.totalBytes || 0)}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Please wait while the model downloads. Do not close this window.
            </p>
          </div>
        ) : (
          // Model selection view
          <>
            <p className="text-sm text-slate-600">
              Select a model to download. The model will be used for automatic
              image tagging.
            </p>

            {/* Provider info */}
            {providers.length > 0 && (
              <div className="rounded-md bg-slate-50 p-3">
                <h3 className="text-sm font-medium text-slate-700">
                  {providers[0].name}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {providers[0].description}
                </p>
              </div>
            )}

            {/* Model list */}
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {models.map((model) => (
                <ModelOption
                  key={model.id}
                  model={model}
                  isSelected={model.id === selectedModelId}
                  onSelect={() => setSelectedModelId(model.id)}
                />
              ))}
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={handleClose} color="slate" size="medium">
                Cancel
              </Button>
              <Button
                onClick={handleDownload}
                color="indigo"
                size="medium"
                disabled={!selectedModelId || selectedModel?.status === 'ready'}
              >
                {selectedModel?.status === 'ready'
                  ? 'Already Installed'
                  : 'Download'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

/**
 * Individual model option in the list
 */
function ModelOption({
  model,
  isSelected,
  onSelect,
}: {
  model: ModelInfo;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const statusBadge = {
    ready: (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
        Installed
      </span>
    ),
    not_installed: null,
    downloading: (
      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
        Downloading
      </span>
    ),
    error: (
      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700">
        Error
      </span>
    ),
    checking: (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
        Checking
      </span>
    ),
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full cursor-pointer rounded-md border p-3 text-left transition-colors ${
        isSelected
          ? 'border-indigo-300 bg-indigo-50'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800">{model.name}</span>
            {model.isDefault && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                Recommended
              </span>
            )}
            {statusBadge[model.status]}
          </div>
          {model.description && (
            <p className="mt-1 text-xs text-slate-500">{model.description}</p>
          )}
        </div>
        <span className="ml-2 text-xs text-slate-400">
          {formatBytes(model.totalSize)}
        </span>
      </div>
    </button>
  );
}
