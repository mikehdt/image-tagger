import { XIcon } from 'lucide-react';
import { memo, useState } from 'react';

import { Dropdown, type DropdownItem } from '@/app/components/shared/dropdown';

import { CollapsibleSection } from '../collapsible-section';
import type {
  FormState,
  SectionName,
} from '../training-config-form/use-training-config-form';

type PerformanceSectionProps = {
  batchSize: number;
  resolution: number[];
  mixedPrecision: 'bf16' | 'fp16' | 'fp8';
  gradientAccumulationSteps: number;
  gradientCheckpointing: boolean;
  cacheLatents: boolean;
  captionDropoutRate: number;
  captionShuffling: boolean;
  flipAugment: boolean;
  hasChanges: boolean;
  visibleFields: Set<string>;
  hiddenChangesCount?: number;
  onFieldChange: <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => void;
  onReset: (section: SectionName) => void;
};

const PRECISION_ITEMS: DropdownItem<string>[] = [
  { value: 'bf16', label: 'bfloat16 (recommended)' },
  { value: 'fp16', label: 'float16' },
  { value: 'fp8', label: 'float8 (lower VRAM)' },
];

const PerformanceSectionComponent = ({
  batchSize,
  resolution,
  mixedPrecision,
  gradientAccumulationSteps,
  gradientCheckpointing,
  cacheLatents,
  captionDropoutRate,
  captionShuffling,
  flipAugment,
  hasChanges,
  visibleFields,
  hiddenChangesCount,
  onFieldChange,
  onReset,
}: PerformanceSectionProps) => {
  const [resolutionInput, setResolutionInput] = useState('');

  const hasVisibleFields =
    visibleFields.has('batchSize') ||
    visibleFields.has('resolution') ||
    visibleFields.has('mixedPrecision') ||
    visibleFields.has('gradientAccumulationSteps') ||
    visibleFields.has('gradientCheckpointing') ||
    visibleFields.has('cacheLatents') ||
    visibleFields.has('captionDropoutRate') ||
    visibleFields.has('captionShuffling') ||
    visibleFields.has('flipAugment');

  if (!hasVisibleFields) return null;

  const handleAddResolution = () => {
    const val = parseInt(resolutionInput, 10);
    if (val > 0 && !resolution.includes(val)) {
      onFieldChange(
        'resolution',
        [...resolution, val].sort((a, b) => a - b),
      );
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
      title="Performance"
      hasChanges={hasChanges}
      onReset={() => onReset('performance')}
      hiddenChangesCount={hiddenChangesCount}
    >
      <div className="space-y-3">
        {/* Batch Size */}
        {visibleFields.has('batchSize' satisfies keyof FormState) && (
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
              className="w-20 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm text-(--foreground) tabular-nums focus:border-sky-500 focus:outline-none"
            />
            {batchSize > 1 && (
              <p className="mt-1 text-xs text-amber-500">
                Higher batch sizes use significantly more VRAM
              </p>
            )}
          </div>
        )}

        {/* Mixed Precision */}
        {visibleFields.has('mixedPrecision' satisfies keyof FormState) && (
          <div>
            <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
              Mixed Precision
            </label>
            <Dropdown
              items={PRECISION_ITEMS}
              selectedValue={mixedPrecision}
              onChange={(val) =>
                onFieldChange(
                  'mixedPrecision',
                  val as FormState['mixedPrecision'],
                )
              }
              aria-label="Mixed precision"
            />
            <p className="mt-1 text-xs text-slate-400">
              Training precision — independent of the base model&apos;s format.
              BF16 is more stable on modern GPUs (RTX 3000+)
            </p>
          </div>
        )}

        {/* Resolution */}
        {visibleFields.has('resolution' satisfies keyof FormState) && (
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
                  className="w-16 rounded border border-(--border-subtle) bg-(--surface) px-2 py-0.5 text-xs text-(--foreground) tabular-nums placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
                />
              </form>
            </div>
          </div>
        )}

        {/* Gradient Accumulation */}
        {visibleFields.has(
          'gradientAccumulationSteps' satisfies keyof FormState,
        ) && (
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
              className="w-20 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm text-(--foreground) tabular-nums focus:border-sky-500 focus:outline-none"
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
        )}

        {/* Gradient Checkpointing */}
        {visibleFields.has(
          'gradientCheckpointing' satisfies keyof FormState,
        ) && (
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={gradientCheckpointing}
              onChange={(e) =>
                onFieldChange('gradientCheckpointing', e.target.checked)
              }
              className="accent-sky-500"
            />
            <span className="text-xs font-medium text-(--foreground)/70">
              Gradient Checkpointing
            </span>
            <span className="text-xs text-slate-400">
              Reduces VRAM at cost of speed
            </span>
          </label>
        )}

        {/* Cache Latents */}
        {visibleFields.has('cacheLatents' satisfies keyof FormState) && (
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={cacheLatents}
              onChange={(e) => onFieldChange('cacheLatents', e.target.checked)}
              className="accent-sky-500"
            />
            <span className="text-xs font-medium text-(--foreground)/70">
              Cache Latents
            </span>
            <span className="text-xs text-slate-400">
              Caches VAE outputs for faster training
            </span>
          </label>
        )}

        {/* Caption Dropout Rate */}
        {visibleFields.has('captionDropoutRate' satisfies keyof FormState) && (
          <div>
            <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
              Caption Dropout Rate
            </label>
            <input
              type="text"
              value={captionDropoutRate}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val >= 0 && val <= 1) {
                  onFieldChange('captionDropoutRate', val);
                }
              }}
              className="w-20 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm text-(--foreground) tabular-nums focus:border-sky-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-400">
              Probability of dropping captions during training (0 = disabled)
            </p>
          </div>
        )}

        {/* Caption Shuffling */}
        {visibleFields.has('captionShuffling' satisfies keyof FormState) && (
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={captionShuffling}
              onChange={(e) =>
                onFieldChange('captionShuffling', e.target.checked)
              }
              className="accent-sky-500"
            />
            <span className="text-xs font-medium text-(--foreground)/70">
              Caption Shuffling
            </span>
            <span className="text-xs text-slate-400">
              Randomise tag order during training
            </span>
          </label>
        )}

        {/* Flip Augment */}
        {visibleFields.has('flipAugment' satisfies keyof FormState) && (
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={flipAugment}
              onChange={(e) => onFieldChange('flipAugment', e.target.checked)}
              className="accent-sky-500"
            />
            <span className="text-xs font-medium text-(--foreground)/70">
              Flip Augment
            </span>
            <span className="text-xs text-slate-400">
              Randomly flip images horizontally
            </span>
          </label>
        )}
      </div>
    </CollapsibleSection>
  );
};

export const PerformanceSection = memo(PerformanceSectionComponent);
