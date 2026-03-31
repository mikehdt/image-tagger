import { memo } from 'react';

import { CollapsibleSection } from '../collapsible-section';
import type {
  FormState,
  SectionName,
} from '../training-config-form/use-training-config-form';

type SavingSectionProps = {
  saveEveryNEpochs: number;
  hasChanges: boolean;
  visibleFields: Set<string>;
  hiddenChangesCount?: number;
  onFieldChange: <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => void;
  onReset: (section: SectionName) => void;
};

const SavingSectionComponent = ({
  saveEveryNEpochs,
  hasChanges,
  visibleFields,
  hiddenChangesCount,
  onFieldChange,
  onReset,
}: SavingSectionProps) => {
  if (!visibleFields.has('saveEveryNEpochs')) return null;

  return (
    <CollapsibleSection
      title="Saving"
      hasChanges={hasChanges}
      onReset={() => onReset('saving')}
      hiddenChangesCount={hiddenChangesCount}
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
            Save Checkpoint Every N Epochs
          </label>
          <input
            type="number"
            min={1}
            value={saveEveryNEpochs}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (val > 0) onFieldChange('saveEveryNEpochs', val);
            }}
            className="w-20 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm text-(--foreground) tabular-nums focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>
    </CollapsibleSection>
  );
};

export const SavingSection = memo(SavingSectionComponent);
