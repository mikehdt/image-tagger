import { Checkbox } from '@/app/components/shared/checkbox';
import { ClassFilterMode } from '@/app/store/filters';

import {
  type SectionConfig,
  useVisibilityControl,
} from './use-visibility-control';

const CLASS_MODES = [
  ClassFilterMode.ANY,
  ClassFilterMode.ALL,
  ClassFilterMode.INVERSE,
] as const;

const CLASS_MODE_LABELS: Record<ClassFilterMode, string> = {
  [ClassFilterMode.OFF]: 'Off',
  [ClassFilterMode.ANY]: 'Any',
  [ClassFilterMode.ALL]: 'All',
  [ClassFilterMode.INVERSE]: 'Inverse',
};

const ClassModeSection = ({
  section,
  onSetMode,
}: {
  section: SectionConfig;
  onSetMode: (classKey: SectionConfig['key'], mode: ClassFilterMode) => void;
}) => {
  if (!section.available) {
    return (
      <div className="px-3 py-2">
        <div className="mb-1 text-xs font-medium text-(--foreground)">
          {section.label}
        </div>
        <div className="text-xs text-(--unselected-text)">
          {section.emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-(--foreground)">
          {section.label}
        </span>
        <span className="text-xs text-(--unselected-text) tabular-nums">
          {section.count}
        </span>
      </div>
      <div className="flex gap-1">
        {CLASS_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onSetMode(section.key, mode)}
            className={`cursor-pointer rounded px-2 py-0.5 text-xs transition-colors ${
              section.mode === mode
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            {CLASS_MODE_LABELS[mode]}
          </button>
        ))}
      </div>
    </div>
  );
};

export const VisibilityPanel = () => {
  const {
    sections,
    visibility,
    selectedAssetsCount,
    hasTaglessAssets,
    handleSetClassMode,
    handleToggleScopeTagless,
    handleToggleScopeSelected,
    handleToggleModified,
  } = useVisibilityControl();

  return (
    <>
      {/* Scope section */}
      <div className="border-b border-slate-200 py-1 dark:border-slate-700">
        <div className="px-3 py-1 text-xs font-medium tracking-wider text-(--unselected-text) uppercase">
          Scope
        </div>
        <div className="px-3 py-1">
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
      </div>

      {/* Class filter sections */}
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {sections.map((section) => (
          <ClassModeSection
            key={section.key}
            section={section}
            onSetMode={handleSetClassMode}
          />
        ))}
      </div>

      {/* Modified */}
      <div className="border-t border-slate-200 py-1 dark:border-slate-700">
        <div className="px-3 py-1">
          <Checkbox
            isSelected={visibility.showModified}
            onChange={handleToggleModified}
            label="Modified only"
            size="small"
          />
        </div>
      </div>
    </>
  );
};
