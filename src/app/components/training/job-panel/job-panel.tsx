'use client';

import { ChevronDownIcon, XIcon } from 'lucide-react';
import { memo } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  clearJob,
  closePanel,
  selectActiveJobConfig,
  selectActiveJobProgress,
  selectActiveJobStatus,
  selectPanelOpen,
} from '@/app/store/training';
import { cancelMockTraining } from '@/app/store/training/mock-training';

const JobPanelComponent = () => {
  const dispatch = useAppDispatch();
  const panelOpen = useAppSelector(selectPanelOpen);
  const status = useAppSelector(selectActiveJobStatus);
  const config = useAppSelector(selectActiveJobConfig);
  const progress = useAppSelector(selectActiveJobProgress);

  // Nothing to show
  if (!panelOpen || !status) return null;

  const isRunning = status === 'training' || status === 'preparing';
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const pct =
    progress && progress.totalSteps > 0
      ? Math.round((progress.currentStep / progress.totalSteps) * 100)
      : 0;

  const handleDismiss = () => {
    dispatch(closePanel());
    if (!isRunning) dispatch(clearJob());
  };

  const handleCancel = () => {
    dispatch(cancelMockTraining());
  };

  return (
    <div className="fixed right-4 bottom-4 z-50 w-80 rounded-lg border border-(--border-subtle) bg-(--surface) shadow-lg shadow-black/20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-(--border-subtle) px-3 py-2">
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
        <div className="flex items-center gap-1">
          {isRunning && (
            <button
              type="button"
              onClick={handleCancel}
              className="cursor-pointer rounded p-0.5 text-xs text-slate-400 hover:text-red-500"
              title="Cancel training"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            className="cursor-pointer rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            title={isRunning ? 'Minimise' : 'Dismiss'}
          >
            {isRunning ? (
              <ChevronDownIcon className="h-3.5 w-3.5" />
            ) : (
              <XIcon className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-3 py-2.5">
        {/* Bar */}
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

        {/* Stats */}
        <div className="flex items-baseline justify-between text-xs tabular-nums">
          <span className="text-slate-500">
            {progress
              ? `Step ${progress.currentStep.toLocaleString()} / ${progress.totalSteps.toLocaleString()}`
              : 'Preparing...'}
          </span>
          <span className="font-medium text-(--foreground)">{pct}%</span>
        </div>

        {/* Metrics */}
        {progress && (progress.loss !== null || progress.learningRate !== null) && (
          <div className="mt-1.5 flex gap-4 text-xs text-slate-400">
            {progress.loss !== null && (
              <span>
                Loss{' '}
                <span className="font-medium text-(--foreground)">
                  {progress.loss}
                </span>
              </span>
            )}
            {progress.learningRate !== null && (
              <span>
                LR{' '}
                <span className="font-medium text-(--foreground)">
                  {progress.learningRate}
                </span>
              </span>
            )}
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

        {/* Status message for terminal states */}
        {isCompleted && (
          <p className="mt-1.5 text-xs text-green-600 dark:text-green-400">
            Training complete
          </p>
        )}
        {isFailed && progress?.error && (
          <p className="mt-1.5 text-xs text-red-500">{progress.error}</p>
        )}
      </div>
    </div>
  );
};

export const JobPanel = memo(JobPanelComponent);
