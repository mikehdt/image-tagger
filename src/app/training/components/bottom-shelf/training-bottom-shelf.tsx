import { ListPlusIcon, PlayIcon } from 'lucide-react';

import { Button } from '@/app/components/shared/button';
import { BottomShelfFrame } from '@/app/components/shelf';
import { useAppSelector } from '@/app/store/hooks';
import { selectIsTraining } from '@/app/store/jobs';

type TrainingBottomShelfProps = {
  canStart: boolean;
  onStart: () => void;
};

export const TrainingBottomShelf = ({
  canStart,
  onStart,
}: TrainingBottomShelfProps) => {
  const isTraining = useAppSelector(selectIsTraining);

  return (
    <BottomShelfFrame>
      <div className="ml-auto flex items-center text-sm">
        <Button
          size="md"
          onClick={onStart}
          ghostDisabled
          neutralDisabled
          disabled={!canStart}
          color="teal"
        >
          {isTraining ? (
            <>
              <ListPlusIcon />
              Add to Queue
            </>
          ) : (
            <>
              <PlayIcon />
              Start Training
            </>
          )}
        </Button>
      </div>
    </BottomShelfFrame>
  );
};
