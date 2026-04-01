import { memo } from 'react';

import {
  Dropdown,
  type DropdownItem,
} from '@/app/components/shared/dropdown';

import { CollapsibleSection } from '../collapsible-section';
import type {
  FormState,
  SectionName,
} from '../training-config-form/use-training-config-form';

type SavingSectionProps = {
  outputName: string;
  saveEnabled: boolean;
  saveMode: 'epochs' | 'steps';
  saveEveryEpochs: number;
  saveEverySteps: number;
  saveFormat: 'fp16' | 'bf16' | 'fp32';
  visibleFields: Set<string>;
  hiddenChangesCount?: number;
  onFieldChange: <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => void;
  onOutputNameChange: (name: string) => void;
  onReset: (section: SectionName) => void;
};

const SAVE_FORMAT_ITEMS: DropdownItem<string>[] = [
  { value: 'fp16', label: 'float16 (most compatible)' },
  { value: 'bf16', label: 'bfloat16' },
  { value: 'fp32', label: 'float32 (largest)' },
];

const SavingSectionComponent = ({
  outputName,
  saveEnabled,
  saveMode,
  saveEveryEpochs,
  saveEverySteps,
  saveFormat,
  visibleFields,
  hiddenChangesCount,
  onFieldChange,
  onOutputNameChange,
  onReset,
}: SavingSectionProps) => {
  const hasVisibleFields =
    visibleFields.has('saveEveryEpochs') ||
    visibleFields.has('saveEverySteps') ||
    visibleFields.has('outputName') ||
    visibleFields.has('saveFormat');

  if (!hasVisibleFields) return null;

  const activeField =
    saveMode === 'epochs' ? 'saveEveryEpochs' : 'saveEverySteps';
  const activeValue =
    saveMode === 'epochs' ? saveEveryEpochs : saveEverySteps;

  return (
    <CollapsibleSection
      title="Saving"
      onReset={() => onReset('saving')}
      hiddenChangesCount={hiddenChangesCount}
    >
      <div className="space-y-3">
        {/* Output Name */}
        {visibleFields.has('outputName' satisfies keyof FormState) && (
          <div>
            <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
              Output Name
            </label>
            <input
              type="text"
              value={outputName}
              onChange={(e) => onOutputNameChange(e.target.value)}
              placeholder="my-lora"
              className="w-full rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm text-(--foreground) placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
            />
          </div>
        )}

        {/* Save Format */}
        {visibleFields.has('saveFormat' satisfies keyof FormState) && (
          <div>
            <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
              Output Precision
            </label>
            <Dropdown
              items={SAVE_FORMAT_ITEMS}
              selectedValue={saveFormat}
              onChange={(val) =>
                onFieldChange('saveFormat', val as FormState['saveFormat'])
              }
              aria-label="Save format"
            />
            <p className="mt-1 text-xs text-slate-400">
              Precision of the saved .safetensors file
            </p>
          </div>
        )}

        {/* Save Checkpoints */}
        {(visibleFields.has('saveEveryEpochs' satisfies keyof FormState) ||
          visibleFields.has('saveEverySteps' satisfies keyof FormState)) && (
          <>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={saveEnabled}
                onChange={(e) =>
                  onFieldChange('saveEnabled', e.target.checked)
                }
                className="accent-sky-500"
              />
              <span className="text-xs font-medium text-(--foreground)/70">
                Save checkpoints during training
              </span>
            </label>

            {saveEnabled && (
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <label className="text-xs font-medium text-(--foreground)/70">
                    Save Every
                  </label>
                  <div className="flex rounded border border-(--border-subtle) text-xs">
                    <button
                      type="button"
                      onClick={() => onFieldChange('saveMode', 'epochs')}
                      className={`cursor-pointer px-2 py-0.5 ${
                        saveMode === 'epochs'
                          ? 'bg-sky-500 text-white dark:bg-sky-700'
                          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      Epochs
                    </button>
                    <button
                      type="button"
                      onClick={() => onFieldChange('saveMode', 'steps')}
                      className={`cursor-pointer px-2 py-0.5 ${
                        saveMode === 'steps'
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
                  className="w-20 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm text-(--foreground) tabular-nums focus:border-sky-500 focus:outline-none"
                />
              </div>
            )}
          </>
        )}
      </div>
    </CollapsibleSection>
  );
};

export const SavingSection = memo(SavingSectionComponent);
