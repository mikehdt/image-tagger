import { Button } from '@/app/components/shared/button';

import type { TaggingProgress } from '../types';

type AutoTaggerProgressProps = {
  progress: TaggingProgress | null;
  onCancel: () => void;
};

export function AutoTaggerProgress({
  progress,
  onCancel,
}: AutoTaggerProgressProps) {
  const progressPercent = progress
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Tagging image {progress?.current || 0} of {progress?.total || 0}...
      </p>

      <div className="flex flex-col gap-2">
        <div className="h-3 w-full overflow-hidden rounded-full bg-linear-to-t from-slate-200 to-slate-300 inset-shadow-xs inset-shadow-slate-400">
          <div
            className="h-full bg-linear-to-t from-indigo-600 to-indigo-500 inset-shadow-xs inset-shadow-indigo-300 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-slate-500">
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
