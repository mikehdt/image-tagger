import { Button } from '@/app/components/shared/button';
import { Checkbox } from '@/app/components/shared/checkbox';
import { Dropdown, DropdownItem } from '@/app/components/shared/dropdown';
import { MultiTagInput } from '@/app/components/shared/multi-tag-input';
import { RadioGroup } from '@/app/components/shared/radio-group';
import type { TaggerOptions, TagInsertMode } from '@/app/services/auto-tagger';

type AutoTaggerSettingsProps = {
  options: TaggerOptions;
  unselectOnComplete: boolean;
  selectedModelId: string | null;
  modelItems: DropdownItem<string>[];
  insertModeOptions: { value: TagInsertMode; label: string }[];
  selectedAssetsCount: number;
  error: string | null;
  onModelChange: (modelId: string) => void;
  onOptionChange: <K extends keyof TaggerOptions>(
    key: K,
    value: TaggerOptions[K],
  ) => void;
  onUnselectOnCompleteChange: () => void;
  onClose: () => void;
  onStartTagging: () => void;
};

export function AutoTaggerSettings({
  options,
  unselectOnComplete,
  selectedModelId,
  modelItems,
  insertModeOptions,
  selectedAssetsCount,
  error,
  onModelChange,
  onOptionChange,
  onUnselectOnCompleteChange,
  onClose,
  onStartTagging,
}: AutoTaggerSettingsProps) {
  return (
    <>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Configure tagging options for {selectedAssetsCount} selected image
        {selectedAssetsCount !== 1 ? 's' : ''}.
      </p>

      {error && (
        <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Model selection */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-400">
          Model
        </label>
        <Dropdown
          items={modelItems}
          selectedValue={selectedModelId || ''}
          onChange={onModelChange}
        />
      </div>

      {/* Thresholds */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-400">
            General Threshold: {options.generalThreshold.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={options.generalThreshold}
            onChange={(e) =>
              onOptionChange('generalThreshold', parseFloat(e.target.value))
            }
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-400">
            Character Threshold: {options.characterThreshold.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={options.characterThreshold}
            onChange={(e) =>
              onOptionChange('characterThreshold', parseFloat(e.target.value))
            }
            className="w-full"
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-wrap gap-4">
        <Checkbox
          isSelected={options.includeCharacterTags}
          onChange={() =>
            onOptionChange(
              'includeCharacterTags',
              !options.includeCharacterTags,
            )
          }
          label="Include character tags"
          size="small"
        />
        <Checkbox
          isSelected={options.includeRatingTags}
          onChange={() =>
            onOptionChange('includeRatingTags', !options.includeRatingTags)
          }
          label="Include rating tags"
          size="small"
        />
        <Checkbox
          isSelected={options.removeUnderscore}
          onChange={() =>
            onOptionChange('removeUnderscore', !options.removeUnderscore)
          }
          label="Replace underscores with spaces"
          size="small"
        />
      </div>

      {/* Tag insert mode */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-400">
          New tags
        </label>
        <RadioGroup
          name="tagInsertMode"
          options={insertModeOptions}
          value={options.tagInsertMode}
          onChange={(mode) => onOptionChange('tagInsertMode', mode)}
          size="small"
        />
      </div>

      {/* Include tags */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-400">
          Always Include Tags
        </label>
        <MultiTagInput
          tags={options.includeTags}
          onTagsChange={(tags) => onOptionChange('includeTags', tags)}
          placeholder="Tags to always add..."
          className="bg-white"
        />
      </div>

      {/* Exclude tags */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-400">
          Exclude Tags
        </label>
        <MultiTagInput
          tags={options.excludeTags}
          onTagsChange={(tags) => onOptionChange('excludeTags', tags)}
          placeholder="Tags to never add..."
          className="bg-white"
        />
      </div>

      {/* Post-tagging options */}
      <div className="mt-2">
        <Checkbox
          isSelected={unselectOnComplete}
          onChange={onUnselectOnCompleteChange}
          label="Deselect tagged assets once complete"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={onClose} color="slate" size="medium">
          Cancel
        </Button>
        <Button
          onClick={onStartTagging}
          color="indigo"
          size="medium"
          disabled={!selectedModelId || selectedAssetsCount === 0}
        >
          Start Tagging
        </Button>
      </div>
    </>
  );
}
