import { memo, useMemo } from 'react';

import {
  Dropdown,
  type DropdownItem,
} from '@/app/components/shared/dropdown';
import {
  getModelsByArchitecture,
  type ModelDefinition,
} from '@/app/services/training/models';

import { CollapsibleSection } from '../collapsible-section';

type ModelSectionProps = {
  modelId: string;
  outputName: string;
  onModelChange: (modelId: string) => void;
  onOutputNameChange: (name: string) => void;
  currentModel: ModelDefinition;
};

const ModelSectionComponent = ({
  modelId,
  outputName,
  onModelChange,
  onOutputNameChange,
  currentModel,
}: ModelSectionProps) => {
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
    <CollapsibleSection title="Model & Output">
      <div className="space-y-3">
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
            {currentModel.description} · Backend: {currentModel.provider}
          </p>
        </div>

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
      </div>
    </CollapsibleSection>
  );
};

export const ModelSection = memo(ModelSectionComponent);
