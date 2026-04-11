import { Button } from '@/app/components/shared/button';
import { ProgressBar } from '@/app/components/shared/progress-bar/progress-bar';

import type { TaggingProgress } from './types';

type AutoTaggerProgressProps = {
  progress: TaggingProgress | null;
  onCancel: () => void;
};

export function AutoTaggerProgress({
  progress,
  onCancel,
}: AutoTaggerProgressProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Tagging image {progress?.current || 0} of {progress?.total || 0}...
      </p>

      <div className="flex flex-col gap-2">
        <ProgressBar
          value={progress?.current ?? 0}
          max={progress?.total ?? 1}
          color="indigo"
          indeterminate={!progress}
        />
        <p className="truncate text-xs text-slate-500">
          {progress?.currentFileId || 'Processing...'}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Tags from completed images will still be applied.
        </p>
        <Button onClick={onCancel} color="slate" size="medium">
          Cancel
        </Button>
      </div>
    </div>
  );
}
