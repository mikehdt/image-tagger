'use client';

import { DownloadIcon, RefreshCwIcon, Trash2Icon, XIcon } from 'lucide-react';

import type { DownloadJob } from '@/app/store/jobs';

import { Button } from '../button';
import { ProgressBar } from '../progress-bar/progress-bar';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Right-hand-side content for a model row in the Model Manager modal
 * when a download job exists for that model. Renders progress for active
 * downloads, and Resume / Delete actions for interrupted or failed ones.
 *
 * If no job is provided, callers fall back to their default Download button.
 */
export function DownloadRowStatus({
  job,
  onRetry,
  onCancel,
  onDelete,
}: {
  job: DownloadJob;
  onRetry: (job: DownloadJob) => void;
  onCancel: (job: DownloadJob) => void;
  onDelete: (job: DownloadJob) => void;
}) {
  const isRunning = job.status === 'running' || job.status === 'preparing';
  const isInterrupted = job.status === 'interrupted';
  const isFailed = job.status === 'failed';
  const isCancelled = job.status === 'cancelled';
  const canResume = isInterrupted || isFailed || isCancelled;

  const progress = job.progress;
  const bytes = progress?.bytesDownloaded ?? 0;
  const total = progress?.totalBytes ?? 0;
  const pct = total > 0 ? Math.round((bytes / total) * 100) : 0;

  return (
    <div className="flex w-56 flex-col gap-1.5">
      <ProgressBar
        value={bytes}
        max={total || 1}
        size="sm"
        color={canResume ? 'amber' : 'indigo'}
        indeterminate={isRunning && (!progress || total === 0)}
      />

      <div className="flex justify-between text-xs text-slate-500 tabular-nums">
        <span className="truncate">
          {isRunning &&
            (progress?.currentFile ? progress.currentFile : 'Preparing…')}
          {isInterrupted && 'Interrupted'}
          {isFailed && 'Failed'}
          {isCancelled && 'Cancelled'}
        </span>
        {progress && total > 0 && (
          <span className="shrink-0 pl-2">
            {formatBytes(bytes)} / {formatBytes(total)} · {pct}%
          </span>
        )}
      </div>

      {(isFailed || isInterrupted) && job.error && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {job.error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        {isRunning && (
          <Button
            onClick={() => onCancel(job)}
            color="rose"
            variant="ghost"
            size="xs"
            width="sm"
          >
            <XIcon />
            Cancel
          </Button>
        )}
        {canResume && (
          <>
            <Button
              onClick={() => onDelete(job)}
              color="rose"
              variant="ghost"
              size="sm"
              width="sm"
            >
              <Trash2Icon />
              Delete
            </Button>

            <Button
              onClick={() => onRetry(job)}
              color="indigo"
              size="sm"
              width="sm"
            >
              <RefreshCwIcon />
              Resume
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Re-export the original Download button used when no job exists,
 * so callers have one place to import row-status UI from.
 */
export function DownloadRowButton({
  onClick,
  label = 'Download',
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button onClick={onClick} color="indigo" size="sm" width="md">
      <DownloadIcon />
      {label}
    </Button>
  );
}
