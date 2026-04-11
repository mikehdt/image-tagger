import { DownloadIcon, FolderOpenIcon } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';

import { Button } from '@/app/components/shared/button';
import { CollapsibleSection } from '@/app/components/shared/collapsible-section';
import { Input } from '@/app/components/shared/input/input';
import { InputTray } from '@/app/components/shared/input-tray/input-tray';
import { Dropdown, type DropdownItem } from '@/app/components/shared/dropdown';
import {
  type ExpertiseTier,
  isTierAtLeast,
} from '@/app/services/training/field-registry';
import {
  getModelsByArchitecture,
  type ModelComponentType,
  type ModelDefinition,
} from '@/app/services/training/models';
import { useAppDispatch } from '@/app/store/hooks';
import { openModelManagerModal } from '@/app/store/model-manager';

import type {
  AppModelDefaults,
  FormState,
  ModelPaths,
} from '../training-config-form/use-training-config-form';

const MODEL_FILE_FILTER = 'safetensors,ckpt,bin,pt,pth';

type WhatToTrainSectionProps = {
  modelId: string;
  modelPaths: ModelPaths;
  appModelDefaults: AppModelDefaults;
  onModelChange: (modelId: string) => void;
  onModelPathChange: (component: ModelComponentType, path: string) => void;
  currentModel: ModelDefinition;
  visibleFields: Set<string>;
  viewMode: ExpertiseTier;
  hiddenChangesCount?: number;
};

const WhatToTrainSectionComponent = ({
  modelId,
  modelPaths,
  appModelDefaults,
  onModelChange,
  onModelPathChange,
  currentModel,
  visibleFields,
  viewMode,
  hiddenChangesCount,
}: WhatToTrainSectionProps) => {
  const dispatch = useAppDispatch();

  const handleOpenModelManager = useCallback(() => {
    dispatch(openModelManagerModal('training'));
  }, [dispatch]);

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

  const modelDefaults = appModelDefaults[currentModel.id];

  // Component tier logic:
  //   checkpoint → always simple (user commonly changes this)
  //   other required → simple if no app default, intermediate if pre-filled
  //   optional → always intermediate
  const visibleComponents = useMemo(
    () =>
      currentModel.components.filter((c) => {
        if (c.type === 'checkpoint') return true;
        if (!c.required) return isTierAtLeast(viewMode, 'intermediate');
        const hasAppDefault = !!modelDefaults?.[c.type];
        return isTierAtLeast(
          viewMode,
          hasAppDefault ? 'intermediate' : 'simple',
        );
      }),
    [currentModel.components, viewMode, modelDefaults],
  );

  const handlePathChange = useCallback(
    (component: ModelComponentType) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onModelPathChange(component, e.target.value);
      },
    [onModelPathChange],
  );

  const handleBrowse = useCallback(
    async (component: ModelComponentType, label: string) => {
      try {
        const params = new URLSearchParams({
          title: `Select ${label}`,
          filter: MODEL_FILE_FILTER,
        });
        const res = await fetch(`/api/filesystem/browse?${params}`);
        const data = await res.json();
        if (data.path) {
          onModelPathChange(component, data.path);
        }
      } catch {
        // Dialog failed to open — user can still type the path manually
      }
    },
    [onModelPathChange],
  );

  return (
    <CollapsibleSection
      title="Model"
      headerExtra={
        hiddenChangesCount ? (
          <span className="text-xs text-amber-500/70">
            {hiddenChangesCount} hidden{' '}
            {hiddenChangesCount === 1 ? 'setting' : 'settings'} customised
          </span>
        ) : undefined
      }
    >
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

        {/* Model component paths */}
        {visibleFields.has('modelPaths' satisfies keyof FormState) &&
          visibleComponents.map((component) => (
            <div key={component.type}>
              <label className="mb-1 flex items-baseline gap-1.5 text-xs font-medium text-(--foreground)/70">
                {component.label}
                {!component.required && (
                  <span className="font-normal text-slate-400">(optional)</span>
                )}
              </label>
              <InputTray size="md">
                <Input
                  type="text"
                  value={modelPaths[component.type] ?? ''}
                  onChange={handlePathChange(component.type)}
                  placeholder={`Path to ${component.label.toLowerCase()}…`}
                  className="min-w-0 flex-1"
                />
                <Button
                  onClick={() => handleBrowse(component.type, component.label)}
                  variant="ghost"
                  size="smallSquare"
                  title="Browse…"
                >
                  <FolderOpenIcon />
                </Button>
                <Button
                  onClick={handleOpenModelManager}
                  variant="ghost"
                  size="smallSquare"
                  title="Download from Model Manager…"
                >
                  <DownloadIcon />
                </Button>
              </InputTray>
              {component.hint && (
                <p className="mt-0.5 text-xs text-slate-400">
                  {component.hint}
                </p>
              )}
            </div>
          ))}

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
