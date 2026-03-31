import { memo, useMemo } from 'react';

import { Dropdown, type DropdownItem } from '@/app/components/shared/dropdown';
import {
  OPTIMIZER_OPTIONS,
  SCHEDULER_OPTIONS,
  type TrainingDefaults,
} from '@/app/services/training/models';

import { CollapsibleSection } from '../collapsible-section';
import { SchedulerSparkline } from '../scheduler-sparkline';
import type {
  DurationMode,
  FormState,
  SectionName,
} from '../training-config-form/use-training-config-form';

type LearningSectionProps = {
  durationMode: DurationMode;
  epochs: number;
  steps: number;
  learningRate: number;
  optimizer: string;
  scheduler: string;
  warmupSteps: number;
  weightDecay: number;
  calculatedSteps: number;
  calculatedEpochs: number;
  totalEffective: number;
  batchSize: number;
  hasChanges: boolean;
  defaults: TrainingDefaults;
  visibleFields: Set<string>;
  hiddenChangesCount?: number;
  onFieldChange: <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => void;
  onReset: (section: SectionName) => void;
};

const LearningSectionComponent = ({
  durationMode,
  epochs,
  steps,
  learningRate,
  optimizer,
  scheduler,
  warmupSteps,
  weightDecay,
  calculatedSteps,
  calculatedEpochs,
  totalEffective,
  batchSize,
  hasChanges,
  defaults,
  visibleFields,
  hiddenChangesCount,
  onFieldChange,
  onReset,
}: LearningSectionProps) => {
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

  const selectedScheduler = SCHEDULER_OPTIONS.find(
    (s) => s.value === scheduler,
  );

  const schedulerItems = useMemo(() => {
    return SCHEDULER_OPTIONS.map(
      (sched) =>
        ({
          value: sched.value,
          label: (
            <div className="flex items-center gap-2">
              <SchedulerSparkline
                curve={sched.curve}
                className="text-sky-500"
              />
              <div className="flex flex-col">
                <span>{sched.label}</span>
                <span className="text-xs text-slate-400">{sched.hint}</span>
              </div>
            </div>
          ),
        }) satisfies DropdownItem<string>,
    );
  }, []);

  const showDuration =
    visibleFields.has('durationMode' satisfies keyof FormState) ||
    visibleFields.has('epochs' satisfies keyof FormState) ||
    visibleFields.has('steps' satisfies keyof FormState);

  return (
    <CollapsibleSection
      title="Learning"
      hasChanges={hasChanges}
      onReset={() => onReset('learning')}
      hiddenChangesCount={hiddenChangesCount}
    >
      <div className="space-y-3">
        {/* Duration */}
        {showDuration && (
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
              className="w-32 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm text-(--foreground) tabular-nums focus:border-sky-500 focus:outline-none"
            />

            {totalEffective > 0 && (
              <p className="mt-1 text-xs text-slate-400 tabular-nums">
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
        )}

        {/* Learning Rate */}
        {visibleFields.has('learningRate' satisfies keyof FormState) && (
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
              className="w-32 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm text-(--foreground) tabular-nums focus:border-sky-500 focus:outline-none"
            />
          </div>
        )}

        {/* Optimizer */}
        {visibleFields.has('optimizer' satisfies keyof FormState) && (
          <div>
            <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
              Optimizer
            </label>
            <Dropdown
              items={optimizerItems}
              selectedValue={optimizer}
              onChange={(val) => onFieldChange('optimizer', val)}
              selectedValueRenderer={() => (
                <span className="text-sm">
                  {selectedOptimizer?.label ?? optimizer}
                </span>
              )}
              aria-label="Select optimizer"
            />
            {selectedOptimizer && (
              <p className="mt-1 text-xs text-slate-400">
                {selectedOptimizer.hint}
              </p>
            )}
          </div>
        )}

        {/* Scheduler */}
        {visibleFields.has('scheduler' satisfies keyof FormState) && (
          <div>
            <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
              LR Scheduler
            </label>
            <Dropdown
              items={schedulerItems}
              selectedValue={scheduler}
              onChange={(val) => onFieldChange('scheduler', val)}
              selectedValueRenderer={() => (
                <div className="flex items-center gap-2">
                  {selectedScheduler && (
                    <SchedulerSparkline
                      curve={selectedScheduler.curve}
                      className="text-sky-500"
                    />
                  )}
                  <span className="text-sm">
                    {selectedScheduler?.label ?? scheduler}
                  </span>
                </div>
              )}
              aria-label="LR scheduler"
            />
            {selectedScheduler && (
              <p className="mt-1 text-xs text-slate-400">
                {selectedScheduler.hint}
              </p>
            )}
          </div>
        )}

        {/* Warmup */}
        {visibleFields.has('warmupSteps' satisfies keyof FormState) && (
          <div>
            <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
              Warmup Steps
            </label>
            <input
              type="number"
              min={0}
              value={warmupSteps}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 0) onFieldChange('warmupSteps', val);
              }}
              placeholder={String(defaults.warmupSteps)}
              className="w-32 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm text-(--foreground) tabular-nums focus:border-sky-500 focus:outline-none"
            />
          </div>
        )}

        {/* Weight Decay */}
        {visibleFields.has('weightDecay' satisfies keyof FormState) && (
          <div>
            <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
              Weight Decay
            </label>
            <input
              type="text"
              value={weightDecay}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val >= 0) onFieldChange('weightDecay', val);
              }}
              placeholder={String(defaults.weightDecay)}
              className="w-32 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm text-(--foreground) tabular-nums focus:border-sky-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-400">
              L2 regularisation to prevent overfitting (0 = disabled)
            </p>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};

export const LearningSection = memo(LearningSectionComponent);
