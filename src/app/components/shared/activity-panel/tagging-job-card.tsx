import { ScanSearchIcon, XIcon } from 'lucide-react';

import { useAppDispatch } from '@/app/store/hooks';
import { removeJob,type TaggingJob } from '@/app/store/jobs';

import { ProgressBar } from '../progress-bar/progress-bar';
import { ActionButton } from './action-button';

export function TaggingJobCard({
  job,
  onCancel,
}: {
  job: TaggingJob;
  onCancel?: (job: TaggingJob) => void;
}) {
  const dispatch = useAppDispatch();

  const isRunning = job.status === 'running' || job.status === 'preparing';
  const isCompleted = job.status === 'completed';
  const isFailed = job.status === 'failed';
  const isCancelled = job.status === 'cancelled';
  const isDone = !isRunning;

  const progress = job.progress;
  const summary = job.summary;

  const pct =
    progress && progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  const iconColour = isRunning
    ? 'text-indigo-500'
    : isCompleted
      ? 'text-green-500'
      : isFailed
        ? 'text-red-500'
        : 'text-slate-400';

  const statusLabel = isRunning
    ? progress?.currentFileId || 'Processing...'
    : isCancelled
      ? 'Cancelled'
      : isFailed
        ? 'Failed'
        : isCompleted && summary
          ? `${summary.totalTagsFound} tag${summary.totalTagsFound !== 1 ? 's' : ''} across ${summary.imagesWithNewTags} image${summary.imagesWithNewTags !== 1 ? 's' : ''}`
          : 'Done';

  return (
    <div className="border-b border-(--border-subtle) px-3 py-2.5 last:border-b-0">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ScanSearchIcon className={`h-3.5 w-3.5 shrink-0 ${iconColour}`} />
        <span className="text-xs font-medium text-(--foreground)">
          {job.modelName}
        </span>
        <span className="text-[10px] text-slate-400">
          {job.projectFolderName}
        </span>
      </div>

      {/* Progress */}
      <div className="mt-2">
        <ProgressBar
          value={isCompleted ? 1 : (progress?.current ?? 0)}
          max={isCompleted ? 1 : (progress?.total ?? 1)}
          size="xs"
          color={
            isCompleted ? 'green' : isFailed || isCancelled ? 'amber' : 'indigo'
          }
          indeterminate={isRunning && !progress}
          className="mb-1"
        />
        <div className="flex justify-between text-[10px] text-slate-500 tabular-nums">
          <span className="truncate">{statusLabel}</span>
          {isRunning && progress && (
            <span className="shrink-0 pl-2">
              {progress.current} / {progress.total} · {pct}%
            </span>
          )}
        </div>
      </div>

      {isFailed && job.error && (
        <p className="mt-1 text-[10px] text-red-500">{job.error}</p>
      )}

      {/* Actions */}
      <div className="mt-1.5 flex items-center gap-1">
        {isRunning && onCancel && (
          <ActionButton
            onClick={() => onCancel(job)}
            title="Cancel tagging"
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
