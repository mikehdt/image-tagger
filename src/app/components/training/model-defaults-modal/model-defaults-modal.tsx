'use client';

import { FolderOpenIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/app/components/shared/button';
import { Modal } from '@/app/components/shared/modal';
import {
  ARCHITECTURE_LABELS,
  MODEL_DEFINITIONS,
  type ModelArchitecture,
  type ModelComponent,
  type ModelComponentType,
} from '@/app/services/training/models';

import type { AppModelDefaults } from '../training-config-form/use-training-config-form';

const MODEL_FILE_FILTER = 'safetensors,ckpt,bin,pt,pth';

type ModelDefaultsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (defaults: AppModelDefaults) => void;
};

/**
 * Get the unique component set for each architecture, deduplicating
 * across models within the same architecture.
 */
function getComponentsByArchitecture(): {
  architecture: ModelArchitecture;
  label: string;
  components: ModelComponent[];
}[] {
  const archMap = new Map<ModelArchitecture, Map<ModelComponentType, ModelComponent>>();

  for (const model of MODEL_DEFINITIONS) {
    if (!archMap.has(model.architecture)) {
      archMap.set(model.architecture, new Map());
    }
    const compMap = archMap.get(model.architecture)!;
    for (const comp of model.components) {
      if (!compMap.has(comp.type)) {
        compMap.set(comp.type, comp);
      }
    }
  }

  return Array.from(archMap.entries()).map(([arch, compMap]) => ({
    architecture: arch,
    label: ARCHITECTURE_LABELS[arch],
    components: Array.from(compMap.values()),
  }));
}

const ARCHITECTURE_COMPONENTS = getComponentsByArchitecture();

export function ModelDefaultsModal({
  isOpen,
  onClose,
  onSaved,
}: ModelDefaultsModalProps) {
  const [draft, setDraft] = useState<AppModelDefaults>({});
  const [saving, setSaving] = useState(false);

  // Load current defaults when modal opens
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/config/model-defaults')
      .then((r) => r.json())
      .then(setDraft)
      .catch(() => {});
  }, [isOpen]);

  const setPath = useCallback(
    (arch: ModelArchitecture, comp: ModelComponentType, value: string) => {
      setDraft((prev) => ({
        ...prev,
        [arch]: { ...prev[arch], [comp]: value },
      }));
    },
    [],
  );

  const handleBrowse = useCallback(
    async (arch: ModelArchitecture, comp: ModelComponentType, label: string) => {
      try {
        const params = new URLSearchParams({
          title: `Select ${label}`,
          filter: MODEL_FILE_FILTER,
        });
        const res = await fetch(`/api/filesystem/browse?${params}`);
        const data = await res.json();
        if (data.path) {
          setPath(arch, comp, data.path);
        }
      } catch {
        // Dialog failed — user can type manually
      }
    },
    [setPath],
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/config/model-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const saved = await res.json();
      onSaved(saved);
      onClose();
    } catch {
      // TODO: toast error
    } finally {
      setSaving(false);
    }
  }, [draft, onClose, onSaved]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl">
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-300">
            Default Model Paths
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Set default file paths for model components. These will be
            pre-filled when you start a new training run.
          </p>
        </div>

        <div className="flex max-h-[60vh] flex-col gap-5 overflow-y-auto pr-1">
          {ARCHITECTURE_COMPONENTS.map(({ architecture, label, components }) => (
            <div key={architecture}>
              <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
              </h3>
              <div className="space-y-2">
                {components.map((comp) => (
                  <div key={comp.type}>
                    <label className="mb-1 flex items-baseline gap-1.5 text-xs font-medium text-(--foreground)/70">
                      {comp.label}
                      {!comp.required && (
                        <span className="font-normal text-slate-400">
                          (optional)
                        </span>
                      )}
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={draft[architecture]?.[comp.type] ?? ''}
                        onChange={(e) =>
                          setPath(architecture, comp.type, e.target.value)
                        }
                        placeholder={`Path to ${comp.label.toLowerCase()}…`}
                        className="min-w-0 flex-1 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm text-(--foreground) placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleBrowse(architecture, comp.type, comp.label)
                        }
                        className="flex shrink-0 items-center rounded border border-(--border-subtle) bg-(--surface) px-2.5 text-(--foreground)/60 hover:bg-(--surface-hover) hover:text-(--foreground)"
                        title="Browse…"
                      >
                        <FolderOpenIcon className="h-4 w-4" />
                      </button>
                    </div>
                    {comp.hint && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        {comp.hint}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-(--border-subtle) pt-3">
          <Button onClick={onClose} color="slate" size="medium">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            color="indigo"
            size="medium"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Defaults'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
