'use client';

import {
  ActivityIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DownloadIcon,
  RefreshCwIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { abortDownload } from '@/app/services/model-manager/download-controllers';
import { startModelDownload } from '@/app/services/model-manager/start-download';
import { SCHEDULER_OPTIONS } from '@/app/services/training/models';
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
  type TrainingJob,
  updateJobStatus,
} from '@/app/store/jobs';
import { loadPersistedDownloads } from '@/app/store/jobs/persistence';
import { setModelStatus } from '@/app/store/model-manager';
import { cancelMockTraining } from '@/app/store/training/mock-training';

import { SchedulerSparkline } from '../../../training/components/scheduler-sparkline';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/** Small text button used in action rows */
function ActionButton({
  onClick,
  title,
  variant = 'default',
  children,
}: {
  onClick: () => void;
  title: string;
  variant?: 'default' | 'danger';
  children: React.ReactNode;
}) {
  const colour =
    variant === 'danger'
      ? 'text-red-500/70 hover:text-red-500'
      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${colour}`}
      title={title}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Training job card
// ---------------------------------------------------------------------------

function TrainingJobCard({ job }: { job: TrainingJob }) {
  const dispatch = useAppDispatch();

  const isRunning = job.status === 'running' || job.status === 'preparing';
  const isCompleted = job.status === 'completed';
  const isFailed = job.status === 'failed';
  const isDone = !isRunning;

  const progress = job.progress;
  const config = job.config;

  const pct =
    progress && progress.totalSteps > 0
      ? Math.round((progress.currentStep / progress.totalSteps) * 100)
      : 0;

  const elapsed =
    progress?.completedAt != null && progress.startedAt != null
      ? progress.completedAt - progress.startedAt
      : null;

  const schedulerCurve = useMemo(() => {
    const schedulerName = config?.hyperparameters?.scheduler;
    if (!schedulerName) return null;
    return (
      SCHEDULER_OPTIONS.find((s) => s.value === schedulerName)?.curve ?? null
    );
  }, [config]);

  return (
    <div className="border-b border-(--border-subtle) last:border-b-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              isRunning
                ? 'animate-pulse bg-sky-500'
                : isCompleted
                  ? 'bg-green-500'
                  : isFailed
                    ? 'bg-red-500'
                    : 'bg-slate-400'
            }`}
          />
          <span className="text-xs font-medium text-(--foreground)">
            {config?.outputName || 'Training'}
          </span>
        </div>
      </div>

      {/* Scheduler curve */}
      {schedulerCurve && isRunning && (
        <div className="border-t border-(--border-subtle) px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase">
              LR Schedule
            </span>
            {progress?.learningRate != null && (
              <span className="text-[10px] text-slate-400 tabular-nums">
                LR {progress.learningRate}
              </span>
            )}
          </div>
          <div className="mt-1 rounded bg-slate-100 p-1 dark:bg-slate-800">
            <SchedulerSparkline
              curve={schedulerCurve}
              width={264}
              height={40}
              className="w-full text-sky-500"
            />
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="px-3 pb-2.5">
        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isCompleted
                ? 'bg-green-500'
                : isFailed
                  ? 'bg-red-500'
                  : 'bg-sky-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-baseline justify-between text-xs tabular-nums">
          <span className="text-slate-500">
            {progress
              ? `Step ${progress.currentStep.toLocaleString()} / ${progress.totalSteps.toLocaleString()}`
              : 'Preparing...'}
          </span>
          <span className="font-medium text-(--foreground)">{pct}%</span>
        </div>

        {progress && progress.loss !== null && (
          <div className="mt-1.5 flex gap-4 text-xs text-slate-400">
            <span>
              Loss{' '}
              <span className="font-medium text-(--foreground)">
                {progress.loss}
              </span>
            </span>
            {progress.etaSeconds !== null && progress.etaSeconds > 0 && (
              <span>
                ETA{' '}
                <span className="font-medium text-(--foreground)">
                  {progress.etaSeconds}s
                </span>
              </span>
            )}
          </div>
        )}

        {isCompleted && (
          <p className="mt-1.5 text-xs text-green-600 dark:text-green-400">
            Complete{elapsed != null ? ` in ${formatDuration(elapsed)}` : ''}
          </p>
        )}
        {isFailed && progress?.error && (
          <p className="mt-1.5 text-xs text-red-500">{progress.error}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 border-t border-(--border-subtle) px-3 py-1.5">
        {isRunning && (
          <ActionButton
            onClick={() => dispatch(cancelMockTraining(job.id))}
            title="Cancel training"
            variant="danger"
          >
            <XIcon className="h-2.5 w-2.5" />
            Cancel
          </ActionButton>
        )}
        {isDone && (
          <>
            <div className="mr-auto" />
            <ActionButton
              onClick={() => dispatch(removeJob(job.id))}
              title="Clear from list"
            >
              <XIcon className="h-2.5 w-2.5" />
              Clear
            </ActionButton>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Download job card
// ---------------------------------------------------------------------------

function DownloadJobCard({
  job,
  onRetry,
  onCancel,
  onDelete,
}: {
  job: DownloadJob;
  onRetry?: (job: DownloadJob) => void;
  onCancel?: (job: DownloadJob) => void;
  onDelete?: (job: DownloadJob) => void;
}) {
  const dispatch = useAppDispatch();

  const isRunning = job.status === 'running';
  const isCompleted = job.status === 'completed';
  const isFailed = job.status === 'failed';
  const isInterrupted = job.status === 'interrupted';
  const isCancelled = job.status === 'cancelled';
  const canRetry = isFailed || isInterrupted || isCancelled;
  const isDone = !isRunning;

  const pct =
    job.progress && job.progress.totalBytes > 0
      ? Math.round(
          (job.progress.bytesDownloaded / job.progress.totalBytes) * 100,
        )
      : 0;

  const iconColour = isRunning
    ? 'text-indigo-500'
    : isCompleted
      ? 'text-green-500'
      : isFailed || isInterrupted
        ? 'text-amber-500'
        : isCancelled
          ? 'text-slate-400'
          : 'text-slate-400';

  const statusLabel = isInterrupted
    ? 'Interrupted'
    : isCancelled
      ? 'Cancelled'
      : isFailed
        ? 'Failed'
        : isCompleted
          ? 'Done'
          : job.progress?.currentFile || 'Preparing...';

  return (
    <div className="border-b border-(--border-subtle) px-3 py-2.5 last:border-b-0">
      {/* Header */}
      <div className="flex items-center gap-2">
        <DownloadIcon className={`h-3.5 w-3.5 shrink-0 ${iconColour}`} />
        <span className="text-xs font-medium text-(--foreground)">
          {job.modelName}
        </span>
      </div>

      {/* Progress bar */}
      {(isRunning || isCompleted || canRetry) && (
        <div className="mt-2">
          <div className="mb-1 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isCompleted
                  ? 'bg-green-500'
                  : canRetry
                    ? 'bg-amber-500'
                    : 'bg-indigo-500'
              }`}
              style={{ width: `${isCompleted ? 100 : pct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 tabular-nums">
            <span>{statusLabel}</span>
            <span>
              {job.progress
                ? `${formatBytes(job.progress.bytesDownloaded)} / ${formatBytes(job.progress.totalBytes)}`
                : ''}
            </span>
          </div>
        </div>
      )}

      {isFailed && job.error && (
        <p className="mt-1 text-[10px] text-red-500">{job.error}</p>
      )}

      {/* Actions */}
      <div className="mt-1.5 flex items-center gap-1">
        {isRunning && onCancel && (
          <ActionButton
            onClick={() => onCancel(job)}
            title="Cancel download"
            variant="danger"
          >
            <XIcon className="h-2.5 w-2.5" />
            Cancel
          </ActionButton>
        )}
        {canRetry && onRetry && (
          <ActionButton onClick={() => onRetry(job)} title="Retry download">
            <RefreshCwIcon className="h-2.5 w-2.5" />
            Retry
          </ActionButton>
        )}
        {canRetry && onDelete && (
          <ActionButton
            onClick={() => onDelete(job)}
            title="Delete partial files and remove"
            variant="danger"
          >
            <Trash2Icon className="h-2.5 w-2.5" />
            Delete
          </ActionButton>
        )}
        {isDone && (
          <>
            <div className="mr-auto" />
            <ActionButton
              onClick={() => dispatch(removeJob(job.id))}
              title="Clear from list"
            >
              <XIcon className="h-2.5 w-2.5" />
              Clear
            </ActionButton>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity panel
// ---------------------------------------------------------------------------

const ActivityPanelComponent = () => {
  const dispatch = useAppDispatch();
  const panelOpen = useAppSelector(selectPanelOpen);
  const hasJobs = useAppSelector(selectHasJobs);
  const activeJobs = useAppSelector(selectActiveJobs);
  const pendingJobs = useAppSelector(selectPendingJobs);
  const completedJobs = useAppSelector(selectCompletedJobs);

  // Restore interrupted downloads from sessionStorage on mount
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const persisted = loadPersistedDownloads();
    if (persisted.length > 0) {
      dispatch(restoreJobs(persisted));
      // Auto-open if any need attention (interrupted or still running)
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
      // Request server to clean up partial files
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
        className="fixed right-4 bottom-4 z-50 flex cursor-pointer items-center justify-center rounded-full border border-(--border-subtle) bg-(--surface) p-2.5 shadow-lg shadow-black/20 transition-colors hover:bg-(--surface-hover)"
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
    <div className="fixed right-4 bottom-4 z-50 w-80 rounded-lg border border-(--border-subtle) bg-(--surface) shadow-lg shadow-black/20">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-(--border-subtle) px-3 py-2">
        <span className="text-xs font-medium text-(--foreground)">
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

        {/* Pending jobs (collapsed summary) */}
        {pendingJobs.length > 0 && (
          <div className="border-b border-(--border-subtle) px-3 py-2">
            <div className="flex items-center gap-2">
              <ChevronUpIcon className="h-3 w-3 text-slate-400" />
              <span className="text-xs text-slate-500">
                {pendingJobs.length} pending{' '}
                {pendingJobs.length === 1 ? 'job' : 'jobs'}
              </span>
            </div>
          </div>
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
