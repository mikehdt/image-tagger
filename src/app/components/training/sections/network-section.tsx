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

type NetworkSectionProps = {
  networkType: 'lora' | 'locon' | 'lokr';
  networkDim: number;
  networkAlpha: number;
  hasChanges: boolean;
  onFieldChange: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  onReset: (section: SectionName) => void;
};

const NETWORK_TYPE_ITEMS: DropdownItem<string>[] = [
  { value: 'lora', label: 'LoRA' },
  { value: 'locon', label: 'LoCoN' },
  { value: 'lokr', label: 'LoKr' },
];

const NetworkSectionComponent = ({
  networkType,
  networkDim,
  networkAlpha,
  hasChanges,
  onFieldChange,
  onReset,
}: NetworkSectionProps) => {
  return (
    <CollapsibleSection
      title="Network"
      hasChanges={hasChanges}
      onReset={() => onReset('network')}
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
            Type
          </label>
          <Dropdown
            items={NETWORK_TYPE_ITEMS}
            selectedValue={networkType}
            onChange={(val) => onFieldChange('networkType', val as FormState['networkType'])}
            aria-label="Network type"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
              Rank (dim)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={128}
                step={1}
                value={networkDim}
                onChange={(e) =>
                  onFieldChange('networkDim', parseInt(e.target.value, 10))
                }
                className="flex-1"
              />
              <input
                type="number"
                min={1}
                max={128}
                value={networkDim}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val > 0 && val <= 128) onFieldChange('networkDim', val);
                }}
                className="w-16 rounded border border-(--border-subtle) bg-(--surface) px-2 py-1 text-center text-sm tabular-nums text-(--foreground) focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
              Alpha
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={128}
                step={1}
                value={networkAlpha}
                onChange={(e) =>
                  onFieldChange('networkAlpha', parseInt(e.target.value, 10))
                }
                className="flex-1"
              />
              <input
                type="number"
                min={1}
                max={128}
                value={networkAlpha}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val > 0 && val <= 128)
                    onFieldChange('networkAlpha', val);
                }}
                className="w-16 rounded border border-(--border-subtle) bg-(--surface) px-2 py-1 text-center text-sm tabular-nums text-(--foreground) focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Higher rank = more expressive, but uses more VRAM and can overfit
        </p>
      </div>
    </CollapsibleSection>
  );
};

export const NetworkSection = memo(NetworkSectionComponent);
