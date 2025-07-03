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
      <div className="w-6">
        <Loader />
      </div>

      <div className="self-center text-xs font-medium text-slate-500 tabular-nums">
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
            {loadProgress.failed > 0 &&
              ` (${loadProgress.failed} error${loadProgress.failed !== 1 ? 's' : ''})`}
          </>
        )}
      </div>
    </>
  );
};
