import { Button } from '@/app/components/shared/button';
import { ProgressBar } from '@/app/components/shared/progress-bar/progress-bar';
import type { TaggingProgress } from '@/app/store/jobs';

type AutoTaggerProgressProps = {
  progress: TaggingProgress | null;
  onCancel: () => void;
  onLeave?: () => void;
};

export function AutoTaggerProgress({
  progress,
  onCancel,
  onLeave,
}: AutoTaggerProgressProps) {
  // `current` is the number of images completed so far (0 at start, total at end).
  // The "currently on" label is one ahead, clamped to total so it doesn't overshoot.
  const completed = progress?.current ?? 0;
  const total = progress?.total ?? 0;
  const currentlyOn = total > 0 ? Math.min(completed + 1, total) : 0;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Tagging image {currentlyOn} of {total}...
      </p>

      <div className="flex flex-col gap-2">
        <ProgressBar
          value={completed}
          max={total || 1}
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
        <div className="flex gap-2">
          {onLeave && (
            <Button onClick={onLeave} color="slate" size="md">
              Go to Projects
            </Button>
          )}
          <Button onClick={onCancel} color="slate" size="md">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
