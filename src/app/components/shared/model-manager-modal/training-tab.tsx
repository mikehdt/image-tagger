'use client';

import { DownloadIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import type {
  DownloadableModel,
  ModelVariant,
} from '@/app/services/model-manager/types';
import type { ModelEntry } from '@/app/store/model-manager/types';

import { Button } from '../button';
import { Dropdown, type DropdownItem } from '../dropdown';
import { getModelStatus } from './use-model-manager';

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
// Types
// ---------------------------------------------------------------------------

export type TrainingModelGroup = {
  architecture: string;
  label: string;
  checkpoints: DownloadableModel[];
  dependencies: DownloadableModel[];
};

// ---------------------------------------------------------------------------
// Training tab
// ---------------------------------------------------------------------------

export function TrainingTab({
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
    <div className="flex flex-col gap-4 p-1">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Download base models and shared components for training.
      </p>

      {/* Shared components section */}
      {usedSharedComponents.length > 0 && (
        <div>
          <div className="mb-2 rounded-md bg-slate-50 p-3 dark:bg-slate-900">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Shared Components
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Shared across multiple models. Download once, use everywhere.
            </p>
          </div>
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
          <div className="mb-2 rounded-md bg-slate-50 p-3 dark:bg-slate-900">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {group.label}
            </h3>
          </div>
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

  const variantItems = useMemo<DropdownItem<string>[]>(
    () => model.variants?.map((v) => ({ value: v.id, label: v.label })) ?? [],
    [model.variants],
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
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 tabular-nums">
            {formatBytes(totalSize)}
          </span>

          {/* Variant selector */}
          {model.variants && model.variants.length > 1 && !isReady && (
            <Dropdown
              items={variantItems}
              selectedValue={selectedVariantId}
              onChange={setSelectedVariantId}
              selectedValueRenderer={(item) => (
                <span className="text-sm">{item.value.toUpperCase()}</span>
              )}
              aria-label={`${model.name} precision`}
              size="sm"
            />
          )}

          {!isReady && !isDownloading && (
            <Button
              onClick={handleDownload}
              color="indigo"
              size="sm"
              width="sm"
            >
              <DownloadIcon />
              {isPartial ? 'Resume' : 'Download'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
