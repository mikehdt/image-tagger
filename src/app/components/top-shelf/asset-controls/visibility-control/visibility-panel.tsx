import { Checkbox } from '@/app/components/shared/checkbox';
import { SegmentedControl } from '@/app/components/shared/segmented-control/segmented-control';
import { ClassFilterMode } from '@/app/store/filters';

import {
  type SectionConfig,
  useVisibilityControl,
} from './use-visibility-control';

const CLASS_MODES: Array<{ value: ClassFilterMode; label: string }> = [
  { value: ClassFilterMode.OFF, label: 'Off' },
  { value: ClassFilterMode.ANY, label: 'Any' },
  { value: ClassFilterMode.ALL, label: 'All' },
  { value: ClassFilterMode.INVERSE, label: 'Inverse' },
];

const ClassModeSection = ({
  section,
  onSetMode,
}: {
  section: SectionConfig;
  onSetMode: (classKey: SectionConfig['key'], mode: ClassFilterMode) => void;
}) => {
  if (!section.available) {
    return (
      <>
        <div className="flex cursor-default items-center gap-2 py-1.5">
          <span className="h-px flex-1 bg-slate-200 shadow-2xs shadow-white dark:bg-slate-500 dark:shadow-slate-800" />
          <span className="flex items-center gap-1 text-xs text-slate-400 text-shadow-white text-shadow-xs dark:text-shadow-slate-900">
            {section.label}
          </span>
          <span className="h-px flex-1 bg-slate-200 shadow-2xs shadow-white dark:bg-slate-500 dark:shadow-stone-800" />
        </div>
        <div className="px-3 py-2 text-(--unselected-text)">
          {section.emptyMessage}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex cursor-default items-center gap-2 py-1.5">
        <span className="h-px flex-1 bg-slate-200 shadow-2xs shadow-white dark:bg-slate-500 dark:shadow-slate-800" />
        <span className="flex items-center gap-1 text-xs text-slate-400 text-shadow-white text-shadow-xs dark:text-shadow-slate-900">
          {section.label}
        </span>
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-400 px-1 text-xs text-white tabular-nums dark:bg-slate-600">
          {section.count}
        </span>
        <span className="h-px flex-1 bg-slate-200 shadow-2xs shadow-white dark:bg-slate-500 dark:shadow-stone-800" />
      </div>

      <div className="px-3 py-2">
        <SegmentedControl
          options={CLASS_MODES}
          value={section.mode}
          onChange={(mode) => onSetMode(section.key, mode)}
        ></SegmentedControl>
      </div>
    </>
  );
};

export const VisibilityPanel = () => {
  const {
    sections,
    visibility,
    selectedAssetsCount,
    hasTaglessAssets,
    hasModifiedAssets,
    handleSetClassMode,
    handleToggleScopeTagless,
    handleToggleScopeSelected,
    handleToggleModified,
  } = useVisibilityControl();

  return (
    <>
      <div className="py-2">
        {/* Scope section */}
        <div className="px-3 pb-2 text-xs font-medium tracking-wider text-(--unselected-text) uppercase">
          Scope
        </div>
        <div className="px-3 pb-1">
          <Checkbox
            isSelected={visibility.scopeTagless}
            disabled={!hasTaglessAssets}
            onChange={handleToggleScopeTagless}
            label="Tagless only"
            size="small"
          />
        </div>
        <div className="px-3 py-1">
          <Checkbox
            isSelected={visibility.scopeSelected}
            disabled={selectedAssetsCount === 0}
            onChange={handleToggleScopeSelected}
            label="Selected only"
            size="small"
          />
        </div>
        <div className="px-3 pt-1">
          <Checkbox
            isSelected={visibility.showModified}
            disabled={!hasModifiedAssets}
            onChange={handleToggleModified}
            label="Modified only"
            size="small"
          />
        </div>
      </div>

      {/* Class filter sections */}
      {sections.map((section) => (
        <ClassModeSection
          key={section.key}
          section={section}
          onSetMode={handleSetClassMode}
        />
      ))}
    </>
  );
};
