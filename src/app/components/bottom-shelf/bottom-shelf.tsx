import { ArrowPathIcon } from '@heroicons/react/24/outline';

import {
  IoState,
  loadAllAssets,
  selectFilteredAssets,
  selectIoState,
  selectLoadProgress,
  selectSaveProgress,
} from '@/app/store/assets';
import { PaginationSize, selectPaginationSize } from '@/app/store/filters';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';

import { PaginationControls } from '../pagination/controls';
import { Pagination } from '../pagination/pagination';
import { Button } from '../shared/button';
import { LoadingStatus } from './components';
import { IoActions } from './components/io-actions';

type BottomShelfProps = {
  currentPage?: number;
  totalPages?: number;
};

export const BottomShelf = ({ currentPage = 1 }: BottomShelfProps) => {
  const dispatch = useAppDispatch();
  const paginationSize = useAppSelector(selectPaginationSize);

  // IO state selectors
  const ioState = useAppSelector(selectIoState);
  const saveProgress = useAppSelector(selectSaveProgress) || null;
  const loadProgress = useAppSelector(selectLoadProgress) || null;

  // Action handlers
  const doRefresh = () => dispatch(loadAllAssets());

  // Get filtered assets directly from the selector
  const filteredAssets = useAppSelector(selectFilteredAssets);
  const filteredCount = filteredAssets.length;

  const ioInProgress =
    ioState === IoState.LOADING ||
    ioState === IoState.SAVING ||
    ioState === IoState.COMPLETING;

  return (
    <div className="fixed bottom-0 left-0 z-10 w-full bg-white/80 inset-shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-400 items-center px-4">
        <div className="flex w-1/4 items-center space-x-2 text-xs whitespace-nowrap text-slate-500">
          {ioInProgress ? (
            <LoadingStatus
              ioState={ioState}
              saveProgress={saveProgress}
              loadProgress={loadProgress}
            />
          ) : (
            <Button
              type="button"
              onClick={doRefresh}
              size="small"
              variant="ghost"
              title="Reload asset list"
            >
              <ArrowPathIcon className="w-6" />
            </Button>
          )}

          {!ioInProgress ? (
            <PaginationControls
              currentPage={currentPage}
              totalPages={
                paginationSize === PaginationSize.ALL
                  ? 1
                  : Math.ceil(filteredCount / paginationSize)
              }
              totalItems={filteredCount}
            />
          ) : null}
        </div>

        <div className="flex w-2/4 items-center justify-center">
          <Pagination currentPage={currentPage} totalItems={filteredCount} />
        </div>

        <div className="flex w-1/4 items-center justify-end space-x-2 text-sm">
          <IoActions ioInProgress={ioInProgress} />
        </div>
      </div>
    </div>
  );
};
