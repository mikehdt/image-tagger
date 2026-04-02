import { memo, useMemo } from 'react';

import { Dropdown, type DropdownItem } from '@/app/components/shared/dropdown';
import {
  getModelsByArchitecture,
  type ModelDefinition,
} from '@/app/services/training/models';

import { CollapsibleSection } from '../collapsible-section';
import type { FormState } from '../training-config-form/use-training-config-form';

type WhatToTrainSectionProps = {
  modelId: string;
  onModelChange: (modelId: string) => void;
  currentModel: ModelDefinition;
  visibleFields: Set<string>;
  hiddenChangesCount?: number;
};

const WhatToTrainSectionComponent = ({
  modelId,
  onModelChange,
  currentModel,
  visibleFields,
  hiddenChangesCount,
}: WhatToTrainSectionProps) => {
  const modelGroups = useMemo(() => {
    return getModelsByArchitecture().map((group) => ({
      groupLabel: group.label,
      items: group.models.map(
        (m) =>
          ({
            value: m.id,
            label: (
              <div className="flex flex-col">
                <span>{m.name}</span>
                <span className="text-xs text-slate-400">{m.description}</span>
              </div>
            ),
          }) satisfies DropdownItem<string>,
      ),
    }));
  }, []);

  return (
    <CollapsibleSection title="Model" hiddenChangesCount={hiddenChangesCount}>
      <div className="space-y-3">
        {visibleFields.has('modelId' satisfies keyof FormState) && (
          <div>
            <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
              Base Model
            </label>
            <Dropdown
              items={modelGroups}
              selectedValue={modelId}
              onChange={onModelChange}
              selectedValueRenderer={() => (
                <span className="text-sm">{currentModel.name}</span>
              )}
              aria-label="Select base model"
            />
            <p className="mt-1 text-xs text-slate-400">
              {currentModel.description}
            </p>
            {currentModel.tips && currentModel.tips.length > 0 && (
              <ul className="mt-1.5 space-y-0.5">
                {currentModel.tips.map((tip) => (
                  <li key={tip} className="text-xs text-slate-400/80">
                    {tip}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Backend — single-item Dropdown renders as static label */}
        <div>
          <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
            Backend
          </label>
          <Dropdown
            items={[
              {
                value: currentModel.provider,
                label:
                  currentModel.provider === 'kohya'
                    ? 'Kohya (sd-scripts)'
                    : 'ai-toolkit',
              },
            ]}
            selectedValue={currentModel.provider}
            onChange={() => {}}
            aria-label="Training backend"
          />
        </div>
      </div>
    </CollapsibleSection>
  );
};

export const WhatToTrainSection = memo(WhatToTrainSectionComponent);
