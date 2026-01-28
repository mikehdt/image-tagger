import { Button } from '@/app/components/shared/button';

import type { TaggingSummary } from '../types';

type AutoTaggerSummaryProps = {
  summary: TaggingSummary;
  wasCancelled: boolean;
  onClose: () => void;
};

export function AutoTaggerSummary({
  summary,
  wasCancelled,
  onClose,
}: AutoTaggerSummaryProps) {
  return (
    <div className="flex flex-col gap-4">
      <div
        className={`rounded-md border p-4 text-sm ${wasCancelled ? 'border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200' : 'border-teal-400 bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200'}`}
      >
        <p className="font-medium">
          {wasCancelled ? 'Tagging cancelled' : 'Tagging complete!'}
        </p>
        <ul className="mt-2 space-y-1">
          <li>
            Processed {summary.imagesProcessed} image
            {summary.imagesProcessed !== 1 ? 's' : ''}
          </li>
          <li>
            Found {summary.totalTagsFound} tag
            {summary.totalTagsFound !== 1 ? 's' : ''} across{' '}
            {summary.imagesWithNewTags} image
            {summary.imagesWithNewTags !== 1 ? 's' : ''}
          </li>
          {summary.imagesProcessed > summary.imagesWithNewTags && (
            <li className={wasCancelled ? 'text-amber-600' : 'text-teal-600'}>
              {summary.imagesProcessed - summary.imagesWithNewTags} image
              {summary.imagesProcessed - summary.imagesWithNewTags !== 1
                ? 's'
                : ''}{' '}
              had no new tags (threshold not met or already tagged)
            </li>
          )}
        </ul>
      </div>

      <div className="flex justify-end">
        <Button onClick={onClose} color="indigo" size="medium">
          Done
        </Button>
      </div>
    </div>
  );
}
