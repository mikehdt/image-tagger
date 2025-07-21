import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  selectShowCropVisualization,
  toggleCropVisualization,
} from '@/app/store/project';

import { Button } from '../../shared/button';

export const ViewButtons = () => {
  const dispatch = useAppDispatch();
  const showCropVisualization = useAppSelector(selectShowCropVisualization);

  const handleToggleCropVisualization = () => {
    dispatch(toggleCropVisualization());
  };

  return (
    <Button
      variant="ghost"
      onClick={handleToggleCropVisualization}
      isPressed={showCropVisualization}
      title={`${showCropVisualization ? 'Hide' : 'Show'} crop visualisation`}
    >
      {showCropVisualization ? (
        <EyeSlashIcon className="w-4" />
      ) : (
        <EyeIcon className="w-4" />
      )}
      <span className="ml-2 max-lg:hidden">Cropping</span>
    </Button>
  );
};
