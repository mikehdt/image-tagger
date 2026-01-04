import { IoState, LoadProgress, SaveProgress } from '@/app/store/assets';

import { Loader } from '../../loader';

interface LoadingStatusProps {
  ioState: IoState;
  saveProgress: SaveProgress | null;
  loadProgress: LoadProgress | null;
}

export const LoadingStatus = ({
  ioState,
  saveProgress,
  loadProgress,
}: LoadingStatusProps) => {
  // Calculate progress percentage for mini progress bar
  const getProgressPercentage = () => {
    if (saveProgress?.total && saveProgress.total > 0) {
      return Math.round((saveProgress.completed / saveProgress.total) * 100);
    }
    if (loadProgress?.total && loadProgress.total > 0) {
      return Math.round((loadProgress.completed / loadProgress.total) * 100);
    }
    return 0;
  };

  const progressPercentage = getProgressPercentage();
  const hasProgress =
    (saveProgress?.total && saveProgress.total > 0) ||
    (loadProgress?.total && loadProgress.total > 0);

  return (
    <>
      <div className="border border-white/0 px-1 py-0.5">
        <Loader className="w-6" />
      </div>

      <div className="ml-1 text-xs font-medium text-(--foreground) tabular-nums">
        {(ioState === IoState.SAVING || ioState === IoState.COMPLETING) &&
        saveProgress?.total ? (
          <>
            {saveProgress.completed} / {saveProgress.total}
            {saveProgress.failed > 0 &&
              ` (${saveProgress.failed} error${saveProgress.failed !== 1 ? 's' : ''})`}
          </>
        ) : null}

        {(ioState === IoState.LOADING || ioState === IoState.COMPLETING) &&
        loadProgress?.total ? (
          <>
            {loadProgress.total > 0
              ? `${loadProgress.completed} / ${loadProgress.total}`
              : ''}
            {loadProgress.failed > 0
              ? ` (${loadProgress.failed} error${loadProgress.failed !== 1 ? 's' : ''})`
              : ''}
          </>
        ) : null}

        {(ioState === IoState.SAVING ||
          ioState === IoState.LOADING ||
          ioState === IoState.COMPLETING) &&
        !saveProgress?.total &&
        !loadProgress?.total ? (
          <>Preparing...</>
        ) : null}

        {/* Mini progress bar */}
        {hasProgress ? (
          <div className="mt-1 h-2 w-24 overflow-hidden rounded-full border border-(--border) bg-linear-to-t from-(--surface) to-(--surface-alt) inset-shadow-(--border) inset-shadow-xs">
            <div
              className="h-2 rounded-full bg-linear-to-t from-teal-600 to-teal-500 transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        ) : null}
      </div>
    </>
  );
};
