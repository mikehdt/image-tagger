import { InfoIcon, TriangleAlertIcon } from 'lucide-react';
import { useMemo } from 'react';

import { Checkbox } from '@/app/components/shared/checkbox';
import { FormTitle } from '@/app/components/shared/form-title/form-title';
import { SectionDivider } from '@/app/components/shared/section-divider/section-divider';
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

const formatCategoryList = (categories: string[]) => {
  if (categories.length === 0) return '';
  if (categories.length === 1) return categories[0];
  return (
    categories.slice(0, -1).join(', ') +
    ', or ' +
    categories[categories.length - 1]
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

  const tagSection = sections.find((s) => s.key === 'tags');
  const hasTagSelections = tagSection && tagSection.count > 0;

  return (
    <>
      {/* Scope section */}
      <div className="flex flex-col gap-3 px-3 py-3">
        <FormTitle as="span" size="xs">
          Scope
        </FormTitle>

        <div className="flex items-center justify-between gap-1.5">
          <Checkbox
            isSelected={visibility.scopeTagless}
            disabled={!hasTaglessAssets}
            onChange={handleToggleScopeTagless}
            label="Tagless only"
          />
          {hasTagSelections && hasTaglessAssets ? (
            <span title="Tag filters are ignored while Tagless is active — tagless assets have no tags to match against">
              <TriangleAlertIcon
                className={`h-5 w-5 shrink-0 ${visibility.scopeTagless ? 'text-amber-500' : 'text-slate-400'}`}
              />
            </span>
          ) : null}
        </div>

        <Checkbox
          isSelected={visibility.scopeSelected}
          disabled={selectedAssetsCount === 0}
          onChange={handleToggleScopeSelected}
          label="Show selected assets only"
        />

        <Checkbox
          isSelected={visibility.showModified}
          disabled={!hasModifiedAssets}
          onChange={handleToggleModified}
          label="Show modified assets only"
        />
      </div>

      {/* Class filter sections */}
      {sections.map((section) => (
        <ClassModeSection
          key={section.key}
          section={section}
          onSetMode={handleSetClassMode}
          disabled={section.key === 'tags' && visibility.scopeTagless}
        />
      ))}

      <EmptyHint sections={sections} />
    </>
  );
};

const ClassModeSection = ({
  section,
  onSetMode,
  disabled = false,
}: {
  section: SectionConfig;
  onSetMode: (classKey: SectionConfig['key'], mode: ClassFilterMode) => void;
  disabled?: boolean;
}) => {
  if (!section.available) return null;

  return (
    <>
      <SectionDivider
        icon={section.icon}
        color={section.color}
        className="my-2"
      >
        <span className="font-semibold">{section.label}</span>{' '}
        <span className="tabular-nums">{section.count}</span>
      </SectionDivider>

      <div className="mb-4 px-3">
        <SegmentedControl
          options={CLASS_MODES}
          value={section.mode}
          onChange={(mode) => onSetMode(section.key, mode)}
          disabled={disabled}
        />
      </div>
    </>
  );
};

const EmptyHint = ({ sections }: { sections: SectionConfig[] }) => {
  const emptyCategories = useMemo(
    () => sections.filter((s) => !s.available).map((s) => s.emptyCategory),
    [sections],
  );

  return emptyCategories.length ? (
    <>
      <div className="mt-2 h-px bg-slate-200 shadow-2xs shadow-white dark:bg-slate-500 dark:shadow-slate-800" />

      <p className="flex cursor-default px-3 py-3 text-xs text-slate-400 dark:text-slate-500">
        <InfoIcon className="h-5 w-5" />
        <span className="ml-2 flex-1">
          Select a {formatCategoryList(emptyCategories)} to filter the assets
          list by them.
        </span>
      </p>
    </>
  ) : null;
};
