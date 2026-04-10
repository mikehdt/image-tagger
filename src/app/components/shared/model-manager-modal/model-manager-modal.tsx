'use client';

import { DownloadIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type {
  DownloadableModel,
  ModelVariant,
} from '@/app/services/model-manager/types';
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
import type { ModelEntry } from '@/app/store/model-manager/types';

import { Modal } from '../modal';
import { getModelStatus, useModelManager } from './use-model-manager';

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
// Main modal
// ---------------------------------------------------------------------------

export function ModelManagerModal() {
  const {
    isOpen,
    activeTab,
    setActiveTab,
    statuses,
    loading,
    handleClose,
    startDownload,
    trainingModelGroups,
    sharedComponents,
  } = useModelManager();

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-2xl">
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-300">
          Model Manager
        </h2>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
          <TabButton
            active={activeTab === 'auto-tagger'}
            onClick={() => setActiveTab('auto-tagger')}
          >
            Auto-Tagger
          </TabButton>
          <TabButton
            active={activeTab === 'training'}
            onClick={() => setActiveTab('training')}
          >
            Training
          </TabButton>
        </div>

        {/* Tab content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {activeTab === 'auto-tagger' ? (
            <AutoTaggerTab />
          ) : (
            <TrainingTab
              groups={trainingModelGroups}
              sharedComponents={sharedComponents}
              statuses={statuses}
              loading={loading}
              onDownload={startDownload}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Tab button
// ---------------------------------------------------------------------------

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-800 dark:text-slate-200'
          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
      }`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Auto-Tagger tab (reuses existing modal logic)
// ---------------------------------------------------------------------------

function AutoTaggerTab() {
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
    <div className="flex flex-col gap-3 p-1">
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
                          <button
                            type="button"
                            onClick={() => handleDownload(model.id)}
                            className="flex cursor-pointer items-center gap-1 rounded-md border border-indigo-300 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900"
                          >
                            <DownloadIcon className="h-3 w-3" />
                            {isPartialAT ? 'Resume' : 'Download'}
                          </button>
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

// ---------------------------------------------------------------------------
// Training tab
// ---------------------------------------------------------------------------

type TrainingModelGroup = {
  architecture: string;
  label: string;
  checkpoints: DownloadableModel[];
  dependencies: DownloadableModel[];
};

function TrainingTab({
  groups,
  sharedComponents,
  statuses,
  loading,
  onDownload,
}: {
  groups: TrainingModelGroup[];
  sharedComponents: DownloadableModel[];
  statuses: Record<string, ModelEntry>;
  loading: boolean;
  onDownload: (model: DownloadableModel, variant?: ModelVariant) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-slate-400">
        Checking model status...
      </div>
    );
  }

  // Find which shared components are used by any model
  const usedSharedIds = new Set<string>();
  for (const group of groups) {
    for (const cp of group.checkpoints) {
      for (const dep of cp.dependencies ?? []) {
        usedSharedIds.add(dep);
      }
    }
  }

  const usedSharedComponents = sharedComponents.filter(
    (c) => c.sharedId && usedSharedIds.has(c.sharedId),
  );

  return (
    <div className="flex flex-col gap-5 p-1">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Download base models and shared components for training.
      </p>

      {/* Shared components section */}
      {usedSharedComponents.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            Shared Components
          </h3>
          <p className="mb-3 text-xs text-slate-400">
            These are shared across multiple models. Download once, use
            everywhere.
          </p>
          <div className="flex flex-col gap-2">
            {usedSharedComponents.map((comp) => {
              // Fade if no checkpoint that depends on this component is installed
              const hasInstalledDependent = groups.some((g) =>
                g.checkpoints.some(
                  (cp) =>
                    cp.dependencies?.includes(comp.sharedId!) &&
                    getModelStatus(statuses, cp.id) === 'ready',
                ),
              );
              return (
                <DownloadableModelRow
                  key={comp.id}
                  model={comp}
                  status={getModelStatus(statuses, comp.id)}
                  onDownload={(variant) => onDownload(comp, variant)}
                  faded={!hasInstalledDependent}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Model groups by architecture */}
      {groups.map((group) => (
        <div key={group.architecture}>
          <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            {group.label}
          </h3>
          <div className="flex flex-col gap-2">
            {group.checkpoints.map((cp) => (
              <DownloadableModelRow
                key={cp.id}
                model={cp}
                status={getModelStatus(statuses, cp.id)}
                onDownload={(variant) => onDownload(cp, variant)}
                dependencies={cp.dependencies}
                sharedStatuses={statuses}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Downloadable model row
// ---------------------------------------------------------------------------

function DownloadableModelRow({
  model,
  status,
  onDownload,
  dependencies,
  sharedStatuses,
  faded,
}: {
  model: DownloadableModel;
  status: string;
  onDownload: (variant?: ModelVariant) => void;
  dependencies?: string[];
  sharedStatuses?: Record<string, ModelEntry>;
  /** Fade the row when no dependent model needs this component */
  faded?: boolean;
}) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    model.variants?.[0]?.id ?? 'default',
  );

  const isReady = status === 'ready';
  const isDownloading = status === 'downloading';
  const isError = status === 'error';
  const isPartial = status === 'partial';

  const activeFiles =
    model.variants?.find((v) => v.id === selectedVariantId)?.files ??
    model.files;
  const totalSize = activeFiles.reduce((sum, f) => sum + f.size, 0);

  // Check dependency status
  const missingDeps =
    dependencies?.filter((depId) => {
      const sharedModelId = `shared-${depId}`;
      return getModelStatus(sharedStatuses ?? {}, sharedModelId) !== 'ready';
    }) ?? [];

  const handleDownload = useCallback(() => {
    const variant = model.variants?.find((v) => v.id === selectedVariantId);
    onDownload(variant);
  }, [onDownload, model.variants, selectedVariantId]);

  return (
    <div
      className={`rounded-md border p-3 transition-colors ${
        isReady
          ? 'border-teal-200 bg-teal-50/50 dark:border-teal-800 dark:bg-teal-950/30'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
      } ${faded ? 'opacity-40' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {model.name}
            </span>
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
            {isPartial && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                Incomplete
              </span>
            )}
            {isError && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700">
                Error
              </span>
            )}
          </div>
          {model.description && (
            <p className="mt-1 text-xs text-slate-500">{model.description}</p>
          )}
          {dependencies && dependencies.length > 0 && (
            <p className="mt-1 text-xs text-slate-400">
              Requires: {dependencies.join(', ')}
              {missingDeps.length > 0 && (
                <span className="text-amber-500">
                  {' '}
                  ({missingDeps.length} missing)
                </span>
              )}
            </p>
          )}
        </div>
        <div className="ml-2 flex shrink-0 flex-col items-end gap-1.5">
          {/* Variant selector */}
          {model.variants && model.variants.length > 1 && !isReady && (
            <select
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              className="rounded border border-(--border-subtle) bg-(--surface) px-2 py-0.5 text-xs text-(--foreground)"
            >
              {model.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 tabular-nums">
              {formatBytes(totalSize)}
            </span>
            {!isReady && !isDownloading && (
              <button
                type="button"
                onClick={handleDownload}
                className="flex cursor-pointer items-center gap-1 rounded-md border border-indigo-300 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900"
              >
                <DownloadIcon className="h-3 w-3" />
                {isPartial ? 'Resume' : 'Download'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
