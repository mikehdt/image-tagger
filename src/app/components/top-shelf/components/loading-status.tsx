import { IoState, LoadProgress, SaveProgress } from '../../../store/assets';
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
  const showLoader = ioState === IoState.LOADING || ioState === IoState.SAVING;

  if (!showLoader) return null;

  return (
    <>
      <div className="mr-4 w-6">
        <Loader />
      </div>

      <div className="mr-4 self-center text-xs font-medium text-slate-500 tabular-nums">
        {saveProgress && (
          <>
            {saveProgress.completed} / {saveProgress.total}
            {saveProgress.failed > 0 &&
              ` (${saveProgress.failed} error${saveProgress.failed !== 1 ? 's' : ''})`}
          </>
        )}
        {loadProgress && (
          <>
            {loadProgress.total > 0
              ? `${loadProgress.completed} / ${loadProgress.total}`
              : ''}
          </>
        )}
      </div>
    </>
  );
};
