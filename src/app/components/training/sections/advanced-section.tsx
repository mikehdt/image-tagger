import { XIcon } from 'lucide-react';
import { memo, useMemo, useState } from 'react';

import {
  Dropdown,
  type DropdownItem,
} from '@/app/components/shared/dropdown';
import {
  SCHEDULER_OPTIONS,
  type TrainingDefaults,
} from '@/app/services/training/models';

import { CollapsibleSection } from '../collapsible-section';
import { SchedulerSparkline } from '../scheduler-sparkline';
import type {
  FormState,
  SectionName,
} from '../training-config-form/use-training-config-form';

type AdvancedSectionProps = {
  scheduler: string;
  warmupSteps: number;
  gradientAccumulationSteps: number;
  mixedPrecision: 'bf16' | 'fp16';
  resolution: number[];
  batchSize: number;
  hasChanges: boolean;
  defaults: TrainingDefaults;
  onFieldChange: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  onReset: (section: SectionName) => void;
};

const PRECISION_ITEMS: DropdownItem<string>[] = [
  { value: 'bf16', label: 'bfloat16 (recommended)' },
  { value: 'fp16', label: 'float16' },
];

const AdvancedSectionComponent = ({
  scheduler,
  warmupSteps,
  gradientAccumulationSteps,
  mixedPrecision,
  resolution,
  batchSize,
  hasChanges,
  defaults,
  onFieldChange,
  onReset,
}: AdvancedSectionProps) => {
  const [resolutionInput, setResolutionInput] = useState('');

  const selectedScheduler = SCHEDULER_OPTIONS.find((s) => s.value === scheduler);

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

  const handleAddResolution = () => {
    const val = parseInt(resolutionInput, 10);
    if (val > 0 && !resolution.includes(val)) {
      onFieldChange('resolution', [...resolution, val].sort((a, b) => a - b));
      setResolutionInput('');
    }
  };

  const handleRemoveResolution = (val: number) => {
    if (resolution.length > 1) {
      onFieldChange(
        'resolution',
        resolution.filter((r) => r !== val),
      );
    }
  };

  return (
    <CollapsibleSection
      title="Advanced"
      defaultExpanded={false}
      hasChanges={hasChanges}
      onReset={() => onReset('advanced')}
    >
      <div className="space-y-3">
        {/* Scheduler */}
        <div>
          <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
            LR Scheduler
          </label>
          <div className="flex items-center gap-2">
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
          </div>
          {selectedScheduler && (
            <p className="mt-1 text-xs text-slate-400">
              {selectedScheduler.hint}
            </p>
          )}
        </div>

        {/* Warmup */}
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
            className="w-32 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm tabular-nums text-(--foreground) focus:border-sky-500 focus:outline-none"
          />
        </div>

        {/* Gradient Accumulation */}
        <div>
          <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
            Gradient Accumulation Steps
          </label>
          <input
            type="number"
            min={1}
            max={16}
            value={gradientAccumulationSteps}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (val > 0) onFieldChange('gradientAccumulationSteps', val);
            }}
            className="w-20 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm tabular-nums text-(--foreground) focus:border-sky-500 focus:outline-none"
          />
          {gradientAccumulationSteps > 1 && (
            <p className="mt-1 text-xs text-slate-400">
              Effective batch size:{' '}
              <span className="font-medium">
                {batchSize * gradientAccumulationSteps}
              </span>{' '}
              ({batchSize} &times; {gradientAccumulationSteps})
            </p>
          )}
        </div>

        {/* Mixed Precision */}
        <div>
          <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
            Mixed Precision
          </label>
          <Dropdown
            items={PRECISION_ITEMS}
            selectedValue={mixedPrecision}
            onChange={(val) => onFieldChange('mixedPrecision', val as FormState['mixedPrecision'])}
            aria-label="Mixed precision"
          />
        </div>

        {/* Resolution */}
        <div>
          <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
            Resolution
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            {resolution.map((res) => (
              <span
                key={res}
                className="flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
              >
                {res}
                {resolution.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveResolution(res)}
                    className="cursor-pointer rounded-full p-0.5 hover:bg-sky-200 dark:hover:bg-sky-800"
                  >
                    <XIcon className="h-2.5 w-2.5" />
                  </button>
                )}
              </span>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddResolution();
              }}
              className="inline-flex"
            >
              <input
                type="number"
                min={128}
                max={2048}
                step={64}
                value={resolutionInput}
                onChange={(e) => setResolutionInput(e.target.value)}
                placeholder="Add"
                className="w-16 rounded border border-(--border-subtle) bg-(--surface) px-2 py-0.5 text-xs tabular-nums text-(--foreground) placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
              />
            </form>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
};

export const AdvancedSection = memo(AdvancedSectionComponent);
