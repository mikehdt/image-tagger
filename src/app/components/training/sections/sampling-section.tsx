import { memo } from 'react';

import { CollapsibleSection } from '../collapsible-section';
import type {
  FormState,
  SectionName,
} from '../training-config-form/use-training-config-form';

type SamplingSectionProps = {
  samplePrompts: string;
  sampleEveryNSteps: number;
  sampleSteps: number;
  seed: number;
  guidanceScale: number;
  noiseScheduler: string;
  hasChanges: boolean;
  visibleFields: Set<string>;
  hiddenChangesCount?: number;
  onFieldChange: <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => void;
  onReset: (section: SectionName) => void;
};

const SamplingSectionComponent = ({
  samplePrompts,
  sampleEveryNSteps,
  sampleSteps,
  seed,
  guidanceScale,
  noiseScheduler,
  hasChanges,
  visibleFields,
  hiddenChangesCount,
  onFieldChange,
  onReset,
}: SamplingSectionProps) => {
  const hasVisibleFields =
    visibleFields.has('samplePrompts') ||
    visibleFields.has('sampleEveryNSteps') ||
    visibleFields.has('sampleSteps') ||
    visibleFields.has('seed') ||
    visibleFields.has('guidanceScale') ||
    visibleFields.has('noiseScheduler');

  if (!hasVisibleFields) return null;

  return (
    <CollapsibleSection
      title="Sampling"
      hasChanges={hasChanges}
      onReset={() => onReset('sampling')}
      hiddenChangesCount={hiddenChangesCount}
    >
      <div className="space-y-3">
        {/* Sample Prompts */}
        {visibleFields.has('samplePrompts' satisfies keyof FormState) && (
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
        )}

        {/* Sample Frequency — only when prompts are set */}
        {visibleFields.has('sampleEveryNSteps' satisfies keyof FormState) &&
          samplePrompts.trim() && (
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

        {/* Seed */}
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
              -1 for random seed, or a fixed number for reproducibility
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
              onChange={(e) => onFieldChange('noiseScheduler', e.target.value)}
              className="w-40 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm text-(--foreground) focus:border-sky-500 focus:outline-none"
            />
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};

export const SamplingSection = memo(SamplingSectionComponent);
