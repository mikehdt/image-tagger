import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef } from 'react';

import {
  IoState,
  selectFilteredAssetsCount,
  selectIoState,
  selectLoadProgress,
  selectSaveProgress,
} from '@/app/store/assets';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  selectShowCropVisualization,
  toggleCropVisualization,
} from '@/app/store/project';

import { PaginationControls } from '../pagination/controls';
import { Pagination } from '../pagination/pagination';
import { Button } from '../shared/button';
import { useToast } from '../shared/toast';
import { LoadingStatus } from './components';
import { IoActions } from './components/io-actions';

type BottomShelfProps = {
  currentPage?: number;
  totalPages?: number;
};

export const BottomShelf = ({ currentPage = 1 }: BottomShelfProps) => {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  // IO state selectors
  const ioState = useAppSelector(selectIoState);
  const saveProgress = useAppSelector(selectSaveProgress) || null;
  const loadProgress = useAppSelector(selectLoadProgress) || null;

  // Crop visualisation
  const showCropVisualization = useAppSelector(selectShowCropVisualization);

  // Track previous IO state and operation type to detect completion
  const prevIoStateRef = useRef<IoState>(ioState);
  const lastOperationTypeRef = useRef<'loading' | 'saving' | null>(null);

  // Show toast when operations complete
  useEffect(() => {
    const prevIoState = prevIoStateRef.current;

    // Track the type of operation when entering LOADING or SAVING states
    if (ioState === IoState.LOADING) {
      lastOperationTypeRef.current = 'loading';
    } else if (ioState === IoState.SAVING) {
      lastOperationTypeRef.current = 'saving';
    }

    // If we transitioned from COMPLETING to COMPLETE, show completion toast based on operation type
    if (prevIoState === IoState.COMPLETING && ioState === IoState.COMPLETE) {
      const operationType = lastOperationTypeRef.current;

      if (operationType === 'loading') {
        showToast('Asset reload complete');
      } else if (operationType === 'saving') {
        showToast('Asset save complete');
      }

      // Clear the operation type after showing the toast
      lastOperationTypeRef.current = null;
    }

    // Update the ref for next comparison
    prevIoStateRef.current = ioState;
  }, [ioState, showToast]);

  const handleToggleCropVisualization = () => {
    dispatch(toggleCropVisualization());
  };

  // Get filtered asset count only - avoids re-render when array contents change but count stays same
  const filteredCount = useAppSelector(selectFilteredAssetsCount);

  const ioInProgress =
    ioState === IoState.LOADING ||
    ioState === IoState.SAVING ||
    ioState === IoState.COMPLETING;

  return (
    <div className="fixed bottom-0 left-0 z-10 w-full border-t border-t-(--border-subtle) bg-(--surface-glass) inset-shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-400 items-center px-4">
        <div className="flex w-1/4 items-center gap-2 text-xs whitespace-nowrap text-(--unselected-text)">
          <Button
            variant="ghost"
            color="slate"
            size="small"
            onClick={handleToggleCropVisualization}
            isPressed={showCropVisualization}
            title={`${showCropVisualization ? 'Hide' : 'Show'} crop visualisation`}
          >
            {showCropVisualization ? (
              <EyeSlashIcon className="w-5" />
            ) : (
              <EyeIcon className="w-5" />
            )}
          </Button>

          {ioInProgress ? (
            <LoadingStatus
              ioState={ioState}
              saveProgress={saveProgress}
              loadProgress={loadProgress}
            />
          ) : (
            <PaginationControls
              currentPage={currentPage}
              totalItems={filteredCount}
            />
          )}
        </div>

        <div className="flex w-2/4 items-center justify-center">
          <Pagination currentPage={currentPage} totalItems={filteredCount} />
        </div>

        <div className="flex w-1/4 items-center justify-end gap-2 text-sm">
          <IoActions ioInProgress={ioInProgress} />
        </div>
      </div>
    </div>
  );
};
