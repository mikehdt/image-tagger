import {
  ArrowLeftCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import {
  IoState,
  loadAllAssets,
  selectFilteredAssets,
  selectIoState,
  selectLoadProgress,
  selectSaveProgress,
} from '@/app/store/assets';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';

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
  const router = useRouter();
  const { showToast } = useToast();

  // IO state selectors
  const ioState = useAppSelector(selectIoState);
  const saveProgress = useAppSelector(selectSaveProgress) || null;
  const loadProgress = useAppSelector(selectLoadProgress) || null;

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

  // Action handlers
  const doRefresh = () => {
    const selectedProject = sessionStorage.getItem('selectedProject');
    if (selectedProject) {
      dispatch(
        loadAllAssets({
          maintainIoState: false, // Show loading state when user manually refreshes
          projectPath: selectedProject,
        }),
      );
    } else {
      // No project selected, redirect to project list
      router.push('/');
    }
  };

  const handleBackToProjects = () => {
    // Just navigate back - project list will handle clearing state
    router.push('/');
  };

  // Get filtered assets directly from the selector
  const filteredAssets = useAppSelector(selectFilteredAssets);
  const filteredCount = filteredAssets.length;

  const ioInProgress =
    ioState === IoState.LOADING ||
    ioState === IoState.SAVING ||
    ioState === IoState.COMPLETING;

  return (
    <div className="fixed bottom-0 left-0 z-10 w-full border-t border-t-white/50 bg-white/80 inset-shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-400 items-center px-4">
        <div className="flex w-1/4 items-center gap-2 text-xs whitespace-nowrap text-slate-500">
          <Button
            size="small"
            variant="ghost"
            onClick={handleBackToProjects}
            title="Back to project selection"
            disabled={ioInProgress}
          >
            <ArrowLeftCircleIcon className="w-6" />
          </Button>

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
              totalItems={filteredCount}
            />
          ) : null}
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
