import { PlusIcon, XIcon } from 'lucide-react';
import { memo } from 'react';

import { CollapsibleSection } from '@/app/components/shared/collapsible-section';
import { SectionResetButton } from './section-reset-button';
import type {
  FormState,
  SectionName,
} from '../training-config-form/use-training-config-form';

type SamplingSectionProps = {
  samplingEnabled: boolean;
  samplePrompts: string[];
  sampleMode: 'epochs' | 'steps';
  sampleEveryEpochs: number;
  sampleEverySteps: number;
  sampleSteps: number;
  seed: number;
  guidanceScale: number;
  noiseScheduler: string;
  visibleFields: Set<string>;
  hiddenChangesCount?: number;
  onFieldChange: <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => void;
  onAddPrompt: () => void;
  onRemovePrompt: (index: number) => void;
  onSetPrompt: (index: number, value: string) => void;
  onReset: (section: SectionName) => void;
};

const SamplingSectionComponent = ({
  samplingEnabled,
  samplePrompts,
  sampleMode,
  sampleEveryEpochs,
  sampleEverySteps,
  sampleSteps,
  seed,
  guidanceScale,
  noiseScheduler,
  visibleFields,
  hiddenChangesCount,
  onFieldChange,
  onAddPrompt,
  onRemovePrompt,
  onSetPrompt,
  onReset,
}: SamplingSectionProps) => {
  const activeField =
    sampleMode === 'epochs' ? 'sampleEveryEpochs' : 'sampleEverySteps';
  const activeValue =
    sampleMode === 'epochs' ? sampleEveryEpochs : sampleEverySteps;

  const hasVisibleFields =
    visibleFields.has('samplingEnabled') ||
    visibleFields.has('samplePrompts') ||
    visibleFields.has('sampleEveryEpochs') ||
    visibleFields.has('sampleEverySteps') ||
    visibleFields.has('sampleSteps') ||
    visibleFields.has('seed') ||
    visibleFields.has('guidanceScale') ||
    visibleFields.has('noiseScheduler');

  if (!hasVisibleFields) return null;

  return (
    <CollapsibleSection
      title="Sampling"
      headerExtra={
        hiddenChangesCount ? (
          <span className="text-xs text-amber-500/70">
            {hiddenChangesCount} hidden{' '}
            {hiddenChangesCount === 1 ? 'setting' : 'settings'} customised
          </span>
        ) : undefined
      }
      headerActions={(expanded) =>
        samplingEnabled && expanded ? (
          <SectionResetButton onClick={() => onReset('sampling')} />
        ) : undefined
      }
    >
      <div className="space-y-3">
        {/* Enable Sampling */}
        {visibleFields.has('samplingEnabled' satisfies keyof FormState) && (
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={samplingEnabled}
              onChange={(e) =>
                onFieldChange('samplingEnabled', e.target.checked)
              }
              className="accent-sky-500"
            />
            <span className="text-xs font-medium text-(--foreground)/70">
              Generate sample images during training
            </span>
          </label>
        )}

        {samplingEnabled && (
          <>
            {/* Sample Prompts — array of editable items */}
            {visibleFields.has('samplePrompts' satisfies keyof FormState) && (
              <div>
                <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
                  Sample Prompts
                </label>
                <div className="space-y-1.5">
                  {samplePrompts.map((prompt, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={prompt}
                        onChange={(e) => onSetPrompt(i, e.target.value)}
                        placeholder="e.g. a woman with red hair, sitting at a cafe"
                        className="flex-1 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm text-(--foreground) placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
                      />
                      {samplePrompts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemovePrompt(i)}
                          className="cursor-pointer rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                          title="Remove prompt"
                        >
                          <XIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={onAddPrompt}
                  className="mt-1.5 flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                >
                  <PlusIcon className="h-3 w-3" />
                  Add prompt
                </button>
              </div>
            )}

            {/* Sample Frequency */}
            {(visibleFields.has(
              'sampleEveryEpochs' satisfies keyof FormState,
            ) ||
              visibleFields.has(
                'sampleEverySteps' satisfies keyof FormState,
              )) && (
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <label className="text-xs font-medium text-(--foreground)/70">
                    Generate Samples Every
                  </label>
                  <div className="flex rounded border border-(--border-subtle) text-xs">
                    <button
                      type="button"
                      onClick={() => onFieldChange('sampleMode', 'epochs')}
                      className={`cursor-pointer px-2 py-0.5 ${
                        sampleMode === 'epochs'
                          ? 'bg-sky-500 text-white dark:bg-sky-700'
                          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      Epochs
                    </button>
                    <button
                      type="button"
                      onClick={() => onFieldChange('sampleMode', 'steps')}
                      className={`cursor-pointer px-2 py-0.5 ${
                        sampleMode === 'steps'
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
                  value={activeValue}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (val > 0) onFieldChange(activeField, val);
                  }}
                  className="w-32 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm text-(--foreground) tabular-nums focus:border-sky-500 focus:outline-none"
                />
              </div>
            )}

            {/* Sample Steps */}
            {visibleFields.has('sampleSteps' satisfies keyof FormState) && (
              <div>
                <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
                  Sample Steps
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={sampleSteps}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (val > 0) onFieldChange('sampleSteps', val);
                  }}
                  className="w-20 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm text-(--foreground) tabular-nums focus:border-sky-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Inference steps when generating sample images
                </p>
              </div>
            )}

            {/* Guidance Scale */}
            {visibleFields.has('guidanceScale' satisfies keyof FormState) && (
              <div>
                <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
                  Guidance Scale
                </label>
                <input
                  type="text"
                  value={guidanceScale}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0)
                      onFieldChange('guidanceScale', val);
                  }}
                  className="w-20 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm text-(--foreground) tabular-nums focus:border-sky-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Classifier-free guidance strength for sampling
                </p>
              </div>
            )}

            {/* Noise Scheduler */}
            {visibleFields.has('noiseScheduler' satisfies keyof FormState) && (
              <div>
                <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
                  Noise Scheduler
                </label>
                <input
                  type="text"
                  value={noiseScheduler}
                  onChange={(e) =>
                    onFieldChange('noiseScheduler', e.target.value)
                  }
                  className="w-40 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm text-(--foreground) focus:border-sky-500 focus:outline-none"
                />
              </div>
            )}
          </>
        )}

        {/* Seed — always visible regardless of samplingEnabled */}
        {visibleFields.has('seed' satisfies keyof FormState) && (
          <div>
            <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
              Seed
            </label>
            <input
              type="number"
              min={-1}
              value={seed}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= -1) onFieldChange('seed', val);
              }}
              className="w-32 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm text-(--foreground) tabular-nums focus:border-sky-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-400">
              -1 for random, or a fixed number for reproducibility
            </p>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};

export const SamplingSection = memo(SamplingSectionComponent);
