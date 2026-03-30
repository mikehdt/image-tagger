import { memo } from 'react';

import { CollapsibleSection } from '../collapsible-section';
import type {
  FormState,
  SectionName,
} from '../training-config-form/use-training-config-form';

type SavingSectionProps = {
  saveEveryNEpochs: number;
  sampleEveryNSteps: number;
  samplePrompts: string;
  hasChanges: boolean;
  onFieldChange: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  onReset: (section: SectionName) => void;
};

const SavingSectionComponent = ({
  saveEveryNEpochs,
  sampleEveryNSteps,
  samplePrompts,
  hasChanges,
  onFieldChange,
  onReset,
}: SavingSectionProps) => {
  return (
    <CollapsibleSection
      title="Saving & Samples"
      defaultExpanded={false}
      hasChanges={hasChanges}
      onReset={() => onReset('saving')}
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
            className="w-20 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm tabular-nums text-(--foreground) focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
            Sample Prompts
          </label>
          <textarea
            value={samplePrompts}
            onChange={(e) => onFieldChange('samplePrompts', e.target.value)}
            placeholder="One prompt per line (optional)&#10;e.g. a woman with red hair, sitting at a cafe"
            rows={3}
            className="w-full rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm text-(--foreground) placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-400">
            Sample images will be generated during training so you can see
            progress visually
          </p>
        </div>

        {samplePrompts.trim() && (
          <div>
            <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
              Generate Samples Every N Steps
            </label>
            <input
              type="number"
              min={50}
              step={50}
              value={sampleEveryNSteps}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val > 0) onFieldChange('sampleEveryNSteps', val);
              }}
              className="w-32 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm tabular-nums text-(--foreground) focus:border-sky-500 focus:outline-none"
            />
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};

export const SavingSection = memo(SavingSectionComponent);
