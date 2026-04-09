import { PlayIcon } from 'lucide-react';

import { Button } from '@/app/components/shared/button';
import { BottomShelfFrame } from '@/app/components/shelf';

type TrainingBottomShelfProps = {
  canStart: boolean;
  hasOutputName: boolean;
  onStart: () => void;
};

export const TrainingBottomShelf = ({
  canStart,
  hasOutputName,
  onStart,
}: TrainingBottomShelfProps) => (
  <BottomShelfFrame>
    <div className="flex flex-1 items-center text-xs text-slate-400">
      {!canStart &&
        (!hasOutputName
          ? 'Enter an output name to continue'
          : 'Add at least one dataset source to continue')}
    </div>

    <div className="flex items-center">
      <Button size="medium" onClick={onStart} disabled={!canStart}>
        <PlayIcon className="mr-2 h-4 w-4" />
        Start Training
      </Button>
    </div>
  </BottomShelfFrame>
);
