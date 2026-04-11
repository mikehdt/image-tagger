'use client';

import { DownloadIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch } from '@/app/store';
import {
  downloadComplete,
  downloadFailed,
  selectModels,
  selectProviders,
  setModelsAndProviders,
  startDownload as startAutoTaggerDownload,
  updateDownloadProgress as updateAutoTaggerProgress,
} from '@/app/store/auto-tagger';

import { Button } from '../button';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

// ---------------------------------------------------------------------------
// Auto-Tagger tab
// ---------------------------------------------------------------------------

export function AutoTaggerTab() {
  const dispatch = useDispatch<AppDispatch>();
  const providers = useSelector(selectProviders);
  const models = useSelector(selectModels);

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

  useEffect(() => {
    if (models.length === 0) {
      fetchModels();
    }
  }, [models.length, fetchModels]);

  const handleDownload = useCallback(
    async (modelId: string) => {
      setError(null);
      dispatch(startAutoTaggerDownload(modelId));

      try {
        const response = await fetch('/api/auto-tagger/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modelId }),
        });

        if (!response.ok || !response.body) {
          throw new Error('Failed to start download');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = JSON.parse(line.slice(6));

            if (data.status === 'error') {
              dispatch(downloadFailed({ modelId, error: data.error }));
              setError(data.error);
              return;
            }

            if (data.status === 'ready') {
              dispatch(downloadComplete(modelId));
              return;
            }

            dispatch(updateAutoTaggerProgress(data));
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Download failed';
        dispatch(downloadFailed({ modelId, error: errorMessage }));
        setError(errorMessage);
      }
    },
    [dispatch],
  );

  return (
    <div className="flex flex-col gap-4 p-1">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Models for automatic image tagging and captioning.
      </p>

      {providers.map((provider) => {
        const providerModels = models.filter((m) => m.provider === provider.id);
        if (providerModels.length === 0) return null;
        return (
          <div key={provider.id}>
            <div className="mb-2 rounded-md bg-slate-50 p-3 dark:bg-slate-900">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {provider.name}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {provider.description}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {providerModels.map((model) => {
                const isReady = model.status === 'ready';
                const isDownloading = model.status === 'downloading';
                const isPartialAT = model.status === 'partial';

                return (
                  <div
                    key={model.id}
                    className={`rounded-md border p-3 transition-colors ${
                      isReady
                        ? 'border-teal-200 bg-teal-50/50 dark:border-teal-800 dark:bg-teal-950/30'
                        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {model.name}
                          </span>
                          {model.isDefault && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                              Recommended
                            </span>
                          )}
                          {isReady && (
                            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                              Installed
                            </span>
                          )}
                          {isDownloading && (
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                              Downloading
                            </span>
                          )}
                          {isPartialAT && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                              Incomplete
                            </span>
                          )}
                        </div>
                        {model.description && (
                          <p className="mt-1 text-xs text-slate-500">
                            {model.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-2 flex shrink-0 items-center gap-2">
                        <span className="text-xs text-slate-400 tabular-nums">
                          {formatBytes(model.totalSize)}
                          {model.vramEstimate && (
                            <span className="block text-slate-400/70">
                              ~{model.vramEstimate}GB VRAM
                            </span>
                          )}
                        </span>
                        {!isReady && !isDownloading && (
                          <Button
                            onClick={() => handleDownload(model.id)}
                            color="indigo"
                            size="sm"
                            width="sm"
                          >
                            <DownloadIcon />
                            {isPartialAT ? 'Resume' : 'Download'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {error && (
        <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}
    </div>
  );
}
