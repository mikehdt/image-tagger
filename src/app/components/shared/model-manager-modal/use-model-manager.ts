/**
 * Hook for the model manager modal.
 * Handles fetching model status, triggering downloads,
 * and coordinating with the jobs slice.
 */

import { useCallback, useEffect, useState } from 'react';

import {
  getDownloadablesForArchitecture,
  SHARED_COMPONENTS,
  TRAINING_CHECKPOINTS,
} from '@/app/services/model-manager/registries/training-models';
import { startModelDownload } from '@/app/services/model-manager/start-download';
import type {
  DownloadableModel,
  ModelVariant,
} from '@/app/services/model-manager/types';
import {
  ARCHITECTURE_LABELS,
  type ModelArchitecture,
} from '@/app/services/training/models';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  closeModelManagerModal,
  selectAllModelStatuses,
  selectIsModelManagerModalOpen,
  selectModelManagerInitialTab,
  setModelStatus,
} from '@/app/store/model-manager';
import type { ModelEntry } from '@/app/store/model-manager/types';

export function useModelManager() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectIsModelManagerModalOpen);
  const initialTab = useAppSelector(selectModelManagerInitialTab);
  const statuses = useAppSelector(selectAllModelStatuses);

  const [activeTab, setActiveTab] = useState<
    'auto-tagger' | 'training' | 'settings'
  >(initialTab ?? 'auto-tagger');
  const [loading, setLoading] = useState(false);

  // Sync tab when modal opens with a specific tab
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Fetch model statuses when modal opens
  const fetchStatuses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/model-manager/status');
      const data = await res.json();

      // Sync to Redux (single source of truth)
      for (const [modelId, entry] of Object.entries(data.statuses ?? {})) {
        const e = entry as { status: string; localPath: string | null };
        dispatch(
          setModelStatus({
            modelId,
            status: e.status as 'ready' | 'not_installed',
            localPath: e.localPath,
          }),
        );
      }
    } catch {
      // Silently fail — statuses show as unknown
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (isOpen) {
      fetchStatuses();
    }
  }, [isOpen, fetchStatuses]);

  // Start a download (optionally with a specific variant)
  const startDownload = useCallback(
    async (model: DownloadableModel, variant?: ModelVariant) => {
      await startModelDownload({
        modelId: model.id,
        modelName: model.name,
        variantId: variant?.id,
        dispatch,
      });
    },
    [dispatch],
  );

  const handleClose = useCallback(() => {
    dispatch(closeModelManagerModal());
  }, [dispatch]);

  // Training models grouped by architecture
  const trainingModelGroups = getTrainingModelGroups();

  return {
    isOpen,
    activeTab,
    setActiveTab,
    statuses,
    loading,
    handleClose,
    startDownload,
    fetchStatuses,
    trainingModelGroups,
    sharedComponents: SHARED_COMPONENTS,
    trainingCheckpoints: TRAINING_CHECKPOINTS,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get the status string for a model from the Redux state. */
export function getModelStatus(
  statuses: Record<string, ModelEntry>,
  modelId: string,
): string {
  return statuses[modelId]?.status ?? 'not_installed';
}

function getTrainingModelGroups() {
  const archOrder: ModelArchitecture[] = [
    'flux',
    'sdxl',
    'zimage',
    'wan',
    'ltx',
  ];

  return archOrder
    .map((arch) => {
      const { checkpoints, dependencies } =
        getDownloadablesForArchitecture(arch);
      if (checkpoints.length === 0) return null;
      return {
        architecture: arch,
        label: ARCHITECTURE_LABELS[arch],
        checkpoints,
        dependencies,
      };
    })
    .filter(Boolean) as {
    architecture: ModelArchitecture;
    label: string;
    checkpoints: DownloadableModel[];
    dependencies: DownloadableModel[];
  }[];
}
