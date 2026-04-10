import { ListPlusIcon, PlayIcon } from 'lucide-react';

import { Button } from '@/app/components/shared/button';
import { BottomShelfFrame } from '@/app/components/shelf';
import { useAppSelector } from '@/app/store/hooks';
import { selectIsTraining } from '@/app/store/jobs';

type TrainingBottomShelfProps = {
  canStart: boolean;
  hasOutputName: boolean;
  onStart: () => void;
};

export const TrainingBottomShelf = ({
  canStart,
  hasOutputName,
  onStart,
}: TrainingBottomShelfProps) => {
  const isTraining = useAppSelector(selectIsTraining);

  return (
    <BottomShelfFrame>
      <div className="ml-auto flex items-center text-xs text-slate-400">
        {!canStart &&
          (!hasOutputName
            ? 'Enter an output name for the model'
            : 'Add at least one dataset source')}
      </div>

      <div className="ml-2 flex items-center">
        <Button
          size="medium"
          onClick={onStart}
          disabled={!canStart}
          color={canStart ? 'teal' : 'slate'}
        >
          {isTraining ? (
            <>
              <ListPlusIcon className="mr-2 h-4 w-4" />
              Add to Queue
            </>
          ) : (
            <>
              <PlayIcon className="mr-2 h-4 w-4" />
              Start Training
            </>
          )}
        </Button>
      </div>
    </BottomShelfFrame>
  );
};
