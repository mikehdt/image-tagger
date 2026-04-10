import { DownloadIcon, RefreshCwIcon, Trash2Icon, XIcon } from 'lucide-react';

import { useAppDispatch } from '@/app/store/hooks';
import { type DownloadJob, removeJob } from '@/app/store/jobs';

import { ActionButton } from './action-button';
import { formatBytes } from './helpers';

export function DownloadJobCard({
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
