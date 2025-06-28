import {
  ArrowPathIcon,
  BookmarkSlashIcon,
  BookmarkSquareIcon,
} from '@heroicons/react/24/outline';

interface AssetActionsProps {
  hasModifiedAssets: boolean;
  doRefresh: () => void;
  saveAllChanges: () => void;
  cancelAllChanges: () => void;
}

export const AssetActions = ({
  hasModifiedAssets,
  doRefresh,
  saveAllChanges,
  cancelAllChanges,
}: AssetActionsProps) => {
  return (
    <>
      <button
        type="button"
        onClick={doRefresh}
        className="mr-4 inline-flex cursor-pointer"
        title="Reload asset list"
      >
        <ArrowPathIcon className="w-6" />
      </button>

      <button
        type="button"
        onClick={saveAllChanges}
        className={`mr-4 inline-flex items-center py-2 ${hasModifiedAssets ? 'cursor-pointer text-emerald-700' : 'cursor-not-allowed text-slate-300'}`}
        title={
          hasModifiedAssets ? 'Save all tag changes' : 'No changes to save'
        }
        disabled={!hasModifiedAssets}
      >
        <BookmarkSquareIcon className="w-4" />
        <span className="ml-1 max-lg:hidden">Save All</span>
      </button>

      <button
        type="button"
        onClick={cancelAllChanges}
        className={`mr-4 inline-flex items-center py-2 ${hasModifiedAssets ? 'cursor-pointer text-slate-700' : 'cursor-not-allowed text-slate-300'}`}
        title={
          hasModifiedAssets ? 'Cancel all tag changes' : 'No changes to cancel'
        }
        disabled={!hasModifiedAssets}
      >
        <BookmarkSlashIcon className="w-4" />
        <span className="ml-1 max-lg:hidden">Cancel All</span>
      </button>
    </>
  );
};
