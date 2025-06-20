import { selectSaveProgress } from '../store/assets/selectors';
import { IoState } from '../store/assets/types';
import { useAppSelector } from '../store/hooks';

type AssetActionsProps = {
  onSave: () => void;
  onCancel: () => void;
  ioState?: IoState;
};

export const AssetActions = ({
  onSave,
  onCancel,
  ioState,
}: AssetActionsProps) => {
  const saveProgress = useAppSelector(selectSaveProgress);
  // Disable buttons when either individual asset is saving or a batch save is in progress
  const isBatchSaveInProgress =
    saveProgress &&
    saveProgress.total > 0 &&
    saveProgress.completed < saveProgress.total;
  const isSaving = ioState === IoState.SAVING || isBatchSaveInProgress;

  return (
    <span className="ml-auto flex pl-2">
      <button
        className={`${isSaving ? 'cursor-not-allowed' : 'cursor-pointer'} rounded-sm bg-slate-200 px-4 py-1 ${isSaving ? 'opacity-50' : 'hover:bg-slate-400'}`}
        onClick={isSaving ? undefined : onCancel}
        disabled={isSaving}
      >
        Cancel
      </button>
      <button
        className={`ml-2 ${isSaving ? 'cursor-not-allowed' : 'cursor-pointer'} rounded-sm bg-emerald-200 px-4 py-1 ${isSaving ? 'opacity-50' : 'hover:bg-emerald-400'}`}
        onClick={isSaving ? undefined : onSave}
        disabled={isSaving}
      >
        Save
      </button>
    </span>
  );
};
