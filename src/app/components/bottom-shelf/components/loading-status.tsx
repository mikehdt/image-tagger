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
}: LoadingStatusProps) => (
  <>
    <div className="border border-white/0 px-1 py-0.5">
      <Loader className="w-6" />
    </div>

    <div className="ml-1 text-xs font-medium text-slate-500 tabular-nums">
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
          {loadProgress.failed > 0 &&
            ` (${loadProgress.failed} error${loadProgress.failed !== 1 ? 's' : ''})`}
        </>
      ) : null}
      {((ioState === IoState.SAVING || ioState === IoState.COMPLETING) &&
        !saveProgress?.total) ||
      ((ioState === IoState.LOADING || ioState === IoState.COMPLETING) &&
        !loadProgress?.total) ? (
        <>Preparing...</>
      ) : (
        ''
      )}
    </div>
  </>
);
