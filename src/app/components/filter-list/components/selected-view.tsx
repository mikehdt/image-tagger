import { useAppSelector } from '@/app/store/hooks';
import { selectSelectedAssets } from '@/app/store/selection';

export const SelectedView = () => {
  const selectedAssets = useAppSelector(selectSelectedAssets);

  return (
    <div className="px-3 py-4 text-center text-sm text-slate-500">
      <div className="mb-2">
        {selectedAssets.length} asset{selectedAssets.length !== 1 ? 's' : ''}{' '}
        selected
      </div>
      {selectedAssets.length > 0 && (
        <div className="text-xs text-slate-400">
          Use the selection controls in the top bar to manage selected assets
        </div>
      )}
    </div>
  );
};
