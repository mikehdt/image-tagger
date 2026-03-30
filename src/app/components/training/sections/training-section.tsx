import { memo, useMemo } from 'react';

import {
  Dropdown,
  type DropdownItem,
} from '@/app/components/shared/dropdown';
import {
  OPTIMIZER_OPTIONS,
  type TrainingDefaults,
} from '@/app/services/training/models';

import { CollapsibleSection } from '../collapsible-section';
import type {
  DurationMode,
  FormState,
  SectionName,
} from '../training-config-form/use-training-config-form';

type TrainingSectionProps = {
  durationMode: DurationMode;
  epochs: number;
  steps: number;
  learningRate: number;
  optimizer: string;
  batchSize: number;
  calculatedSteps: number;
  calculatedEpochs: number;
  totalEffective: number;
  hasChanges: boolean;
  defaults: TrainingDefaults;
  onFieldChange: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  onReset: (section: SectionName) => void;
};

const TrainingSectionComponent = ({
  durationMode,
  epochs,
  steps,
  learningRate,
  optimizer,
  batchSize,
  calculatedSteps,
  calculatedEpochs,
  totalEffective,
  hasChanges,
  defaults,
  onFieldChange,
  onReset,
}: TrainingSectionProps) => {
  const optimizerItems = useMemo(() => {
    return OPTIMIZER_OPTIONS.map((group) => ({
      groupLabel: group.group,
      items: group.items.map(
        (opt) =>
          ({
            value: opt.value,
            label: (
              <div className="flex flex-col">
                <span>{opt.label}</span>
                <span className="text-xs text-slate-400">{opt.hint}</span>
              </div>
            ),
          }) satisfies DropdownItem<string>,
      ),
    }));
  }, []);

  const selectedOptimizer = OPTIMIZER_OPTIONS.flatMap((g) => g.items).find(
    (o) => o.value === optimizer,
  );

  return (
    <CollapsibleSection
      title="Training"
      hasChanges={hasChanges}
      onReset={() => onReset('training')}
    >
      <div className="space-y-3">
        {/* Duration */}
        <div>
          <div className="mb-1 flex items-center gap-2">
            <label className="text-xs font-medium text-(--foreground)/70">
              Duration
            </label>
            <div className="flex rounded border border-(--border-subtle) text-xs">
              <button
                type="button"
                onClick={() => onFieldChange('durationMode', 'epochs')}
                className={`cursor-pointer px-2 py-0.5 ${
                  durationMode === 'epochs'
                    ? 'bg-sky-500 text-white dark:bg-sky-700'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Epochs
              </button>
              <button
                type="button"
                onClick={() => onFieldChange('durationMode', 'steps')}
                className={`cursor-pointer px-2 py-0.5 ${
                  durationMode === 'steps'
                    ? 'bg-sky-500 text-white dark:bg-sky-700'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Steps
              </button>
            </div>
          </div>

          <input
            type="number"
            min={1}
            value={durationMode === 'epochs' ? epochs : steps}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (val > 0) {
                onFieldChange(
                  durationMode === 'epochs' ? 'epochs' : 'steps',
                  val,
                );
              }
            }}
            className="w-32 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm tabular-nums text-(--foreground) focus:border-sky-500 focus:outline-none"
          />

          {totalEffective > 0 && (
            <p className="mt-1 text-xs tabular-nums text-slate-400">
              {totalEffective} images/epoch &times;{' '}
              {durationMode === 'epochs' ? epochs : calculatedEpochs} epochs
              &divide; {batchSize} batch ={' '}
              <span className="font-medium text-slate-500">
                {durationMode === 'epochs'
                  ? calculatedSteps.toLocaleString()
                  : steps.toLocaleString()}{' '}
                steps
              </span>
            </p>
          )}
        </div>

        {/* Learning Rate */}
        <div>
          <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
            Learning Rate
          </label>
          <input
            type="text"
            value={learningRate}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val > 0) {
                onFieldChange('learningRate', val);
              }
            }}
            placeholder={String(defaults.learningRate)}
            className="w-32 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm tabular-nums text-(--foreground) focus:border-sky-500 focus:outline-none"
          />
        </div>

        {/* Optimizer */}
        <div>
          <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
            Optimizer
          </label>
          <Dropdown
            items={optimizerItems}
            selectedValue={optimizer}
            onChange={(val) => onFieldChange('optimizer', val)}
            selectedValueRenderer={() => (
              <span className="text-sm">{selectedOptimizer?.label ?? optimizer}</span>
            )}
            aria-label="Select optimizer"
          />
          {selectedOptimizer && (
            <p className="mt-1 text-xs text-slate-400">
              {selectedOptimizer.hint}
            </p>
          )}
        </div>

        {/* Batch Size */}
        <div>
          <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
            Batch Size
          </label>
          <input
            type="number"
            min={1}
            max={8}
            value={batchSize}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (val > 0) onFieldChange('batchSize', val);
            }}
            className="w-20 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm tabular-nums text-(--foreground) focus:border-sky-500 focus:outline-none"
          />
          {batchSize > 1 && (
            <p className="mt-1 text-xs text-amber-500">
              Higher batch sizes use significantly more VRAM
            </p>
          )}
        </div>
      </div>
    </CollapsibleSection>
  );
};

export const TrainingSection = memo(TrainingSectionComponent);
