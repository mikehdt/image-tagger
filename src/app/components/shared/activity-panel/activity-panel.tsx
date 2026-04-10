'use client';

import { ActivityIcon, ChevronDownIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { memo, useCallback, useEffect, useRef } from 'react';

import { abortDownload } from '@/app/services/model-manager/download-controllers';
import { startModelDownload } from '@/app/services/model-manager/start-download';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  clearCompletedJobs,
  closePanel,
  type DownloadJob,
  openPanel,
  removeJob,
  restoreJobs,
  selectActiveJobs,
  selectCompletedJobs,
  selectHasJobs,
  selectPanelOpen,
  selectPendingJobs,
  updateJobStatus,
} from '@/app/store/jobs';
import { loadPersistedDownloads } from '@/app/store/jobs/persistence';
import { setModelStatus } from '@/app/store/model-manager';

import { DownloadJobCard } from './download-job-card';
import { PendingJobsList } from './pending-jobs-list';
import { TrainingJobCard } from './training-job-card';

const ActivityPanelComponent = () => {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const panelOpen = useAppSelector(selectPanelOpen);
  const hasJobs = useAppSelector(selectHasJobs);
  const activeJobs = useAppSelector(selectActiveJobs);
  const pendingJobs = useAppSelector(selectPendingJobs);
  const completedJobs = useAppSelector(selectCompletedJobs);

  // Push up above the bottom shelf on views that have one
  const hasBottomShelf =
    pathname.startsWith('/tagging') || pathname.startsWith('/training');
  const bottomClass = hasBottomShelf ? 'bottom-16' : 'bottom-4';

  // Restore persisted downloads from localStorage on mount
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const persisted = loadPersistedDownloads();
    if (persisted.length > 0) {
      dispatch(restoreJobs(persisted));
      if (persisted.some((j) => j.status === 'interrupted')) {
        dispatch(openPanel());
      }
    }
  }, [dispatch]);

  const handleOpen = useCallback(() => {
    dispatch(openPanel());
  }, [dispatch]);

  const handleClose = useCallback(() => {
    dispatch(closePanel());
  }, [dispatch]);

  const handleRetryDownload = useCallback(
    async (job: DownloadJob) => {
      dispatch(removeJob(job.id));
      await startModelDownload({
        modelId: job.modelId,
        modelName: job.modelName,
        dispatch,
      });
    },
    [dispatch],
  );

  const handleCancelDownload = useCallback(
    (job: DownloadJob) => {
      abortDownload(job.id);
      dispatch(
        updateJobStatus({
          id: job.id,
          status: 'cancelled',
          error: 'Download cancelled',
        }),
      );
      dispatch(
        setModelStatus({ modelId: job.modelId, status: 'not_installed' }),
      );
    },
    [dispatch],
  );

  const handleDeleteDownload = useCallback(
    async (job: DownloadJob) => {
      try {
        await fetch('/api/model-manager/download', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modelId: job.modelId }),
        });
      } catch {
        // Best-effort cleanup
      }
      dispatch(removeJob(job.id));
      dispatch(
        setModelStatus({ modelId: job.modelId, status: 'not_installed' }),
      );
    },
    [dispatch],
  );

  const handleClearAll = useCallback(() => {
    dispatch(clearCompletedJobs());
  }, [dispatch]);

  if (!hasJobs) return null;

  const activeCount = activeJobs.length;
  const hasActive = activeCount > 0;
  const hasClearable = completedJobs.length > 0;

  // Minimised: floating icon button
  if (!panelOpen) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className={`fixed right-4 ${bottomClass} z-50 flex cursor-pointer items-center justify-center rounded-full border border-(--border-subtle) bg-(--surface) p-2.5 shadow-lg shadow-black/20 transition-colors hover:bg-(--surface-hover)`}
        title="Show activity"
      >
        <ActivityIcon
          className={`h-4.5 w-4.5 ${hasActive ? 'text-sky-500' : 'text-(--foreground)/50'}`}
        />
        {hasActive && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>
    );
  }

  // Expanded: full panel
  return (
    <div
      className={`fixed right-4 ${bottomClass} z-50 w-80 rounded-lg border border-(--border-subtle) bg-(--surface) shadow-lg shadow-black/20`}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-(--border-subtle) px-3 py-2">
        <span className="text-sm text-(--foreground)">
          Activity
          {hasActive && (
            <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={handleClose}
          className="cursor-pointer rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          title="Minimise"
        >
          <ChevronDownIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Jobs list */}
      <div className="max-h-96 overflow-y-auto">
        {/* Pending jobs */}
        {pendingJobs.length > 0 && <PendingJobsList jobs={pendingJobs} />}

        {/* Active jobs */}
        {activeJobs.map((job) =>
          job.type === 'training' ? (
            <TrainingJobCard key={job.id} job={job} />
          ) : (
            <DownloadJobCard
              key={job.id}
              job={job}
              onRetry={handleRetryDownload}
              onCancel={handleCancelDownload}
              onDelete={handleDeleteDownload}
            />
          ),
        )}

        {/* Completed/failed/interrupted jobs */}
        {completedJobs.map((job) =>
          job.type === 'training' ? (
            <TrainingJobCard key={job.id} job={job} />
          ) : (
            <DownloadJobCard
              key={job.id}
              job={job}
              onRetry={handleRetryDownload}
              onCancel={handleCancelDownload}
              onDelete={handleDeleteDownload}
            />
          ),
        )}
      </div>

      {/* Footer with Clear All */}
      {hasClearable && (
        <div className="flex justify-end border-t border-(--border-subtle) px-3 py-1.5">
          <button
            type="button"
            onClick={handleClearAll}
            className="cursor-pointer text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};

export const ActivityPanel = memo(ActivityPanelComponent);
