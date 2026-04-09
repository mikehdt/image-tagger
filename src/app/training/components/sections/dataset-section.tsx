import {
  EyeIcon,
  EyeOffIcon,
  FolderIcon,
  FolderOpenIcon,
  PlusIcon,
  XIcon,
} from 'lucide-react';
import Image from 'next/image';
import { memo, useCallback, useMemo } from 'react';

import { CollapsibleSection } from '@/app/components/shared/collapsible-section';
import { ProjectPicker } from '../project-picker/project-picker';
import { SectionResetButton } from './section-reset-button';
import type {
  DatasetFolder,
  DatasetSource,
  FormState,
  SectionName,
} from '../training-config-form/use-training-config-form';

type DatasetSectionProps = {
  datasets: DatasetSource[];
  extraFolders: string[];
  totalImages: number;
  totalEffective: number;
  captionDropoutRate: number;
  captionShuffling: boolean;
  flipAugment: boolean;
  flipVAugment: boolean;
  hasChanges: boolean;
  visibleFields: Set<string>;
  hiddenChangesCount?: number;
  onAddDataset: (
    folderName: string,
    displayName: string,
    folders: DatasetFolder[],
    thumbnail?: string,
    thumbnailVersion?: number,
    dimensionHistogram?: Record<string, number>,
  ) => void;
  onRemoveDataset: (index: number) => void;
  onSetFolderRepeats: (
    datasetIndex: number,
    folderName: string,
    repeats: number | null,
  ) => void;
  onAddExtraFolder: (path: string) => void;
  onRemoveExtraFolder: (index: number) => void;
  onFieldChange: <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => void;
  onReset: (section: SectionName) => void;
};

const DatasetSectionComponent = ({
  datasets,
  extraFolders,
  totalImages,
  totalEffective,
  captionDropoutRate,
  captionShuffling,
  flipAugment,
  flipVAugment,
  hasChanges,
  visibleFields,
  hiddenChangesCount,
  onAddDataset,
  onRemoveDataset,
  onSetFolderRepeats,
  onAddExtraFolder,
  onRemoveExtraFolder,
  onFieldChange,
  onReset,
}: DatasetSectionProps) => {
  const excludeFolders = useMemo(
    () => datasets.map((ds) => ds.folderName),
    [datasets],
  );

  const handleBrowseFolder = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        title: 'Select image folder',
        mode: 'folder',
      });
      const res = await fetch(`/api/filesystem/browse?${params}`);
      const data = await res.json();
      if (data.path) {
        onAddExtraFolder(data.path);
      }
    } catch {
      // Dialog failed — ignore
    }
  }, [onAddExtraFolder]);

  return (
    <CollapsibleSection
      title="Dataset"
      headerExtra={
        <>
          {hasChanges && (
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
          )}
          {hiddenChangesCount ? (
            <span className="text-xs text-amber-500/70">
              {hiddenChangesCount} hidden{' '}
              {hiddenChangesCount === 1 ? 'setting' : 'settings'} customised
            </span>
          ) : undefined}
        </>
      }
      headerActions={(expanded) =>
        hasChanges && expanded ? (
          <SectionResetButton onClick={() => onReset('dataset')} />
        ) : undefined
      }
    >
      <div className="space-y-3">
        {datasets.length === 0 && extraFolders.length === 0 ? (
          <div className="rounded border border-dashed border-slate-300 px-4 py-6 text-center dark:border-slate-600">
            <p className="text-sm text-slate-400">
              No dataset sources added yet
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Add a tagging project
              {visibleFields.has('extraFolders' satisfies keyof FormState) &&
                ' or folder of images'}{' '}
              to begin
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <ProjectPicker
                onSelect={onAddDataset}
                excludeFolders={excludeFolders}
              >
                <PlusIcon className="mr-1 h-3.5 w-3.5" />
                Add Project
              </ProjectPicker>
              {visibleFields.has('extraFolders' satisfies keyof FormState) && (
                <button
                  type="button"
                  onClick={handleBrowseFolder}
                  className="flex cursor-pointer items-center gap-1 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm text-(--foreground)/70 transition-colors hover:bg-(--surface-hover) hover:text-(--foreground)"
                >
                  <FolderOpenIcon className="mr-1 h-3.5 w-3.5" />
                  Add Folder
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {datasets.map((ds, dsIndex) => (
              <div
                key={ds.folderName}
                className="rounded border border-(--border-subtle) bg-(--surface)/30 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {ds.thumbnail ? (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 dark:bg-slate-600">
                        <Image
                          src={`/tagging-projects/${ds.thumbnail}${ds.thumbnailVersion ? `?v=${ds.thumbnailVersion}` : ''}`}
                          alt={ds.projectName}
                          width={24}
                          height={24}
                          className="h-full w-full object-cover"
                        />
                      </span>
                    ) : (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-600">
                        <FolderIcon className="h-3.5 w-3.5 text-slate-400" />
                      </span>
                    )}
                    <span className="text-sm font-medium text-(--foreground)">
                      {ds.projectName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveDataset(dsIndex)}
                    className="cursor-pointer rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                    title="Remove dataset source"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {ds.folders.map((folder) => {
                    const effectiveRepeats =
                      folder.overrideRepeats ?? folder.detectedRepeats;
                    const isDisabled = effectiveRepeats === 0;
                    return (
                      <div
                        key={folder.name}
                        className={`flex items-center justify-between text-xs ${isDisabled ? 'opacity-40' : ''}`}
                      >
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <button
                            type="button"
                            onClick={() =>
                              onSetFolderRepeats(
                                dsIndex,
                                folder.name,
                                isDisabled ? null : 0,
                              )
                            }
                            className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            title={
                              isDisabled
                                ? 'Include in training'
                                : 'Exclude from training'
                            }
                          >
                            {isDisabled ? (
                              <EyeOffIcon className="h-3 w-3" />
                            ) : (
                              <EyeIcon className="h-3 w-3" />
                            )}
                          </button>
                          <span>{folder.name}</span>
                          <span className="text-slate-400">
                            ({folder.imageCount} images)
                          </span>
                        </div>
                        {!isDisabled && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">&times;</span>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={effectiveRepeats}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (val > 0) {
                                  onSetFolderRepeats(
                                    dsIndex,
                                    folder.name,
                                    val === folder.detectedRepeats ? null : val,
                                  );
                                }
                              }}
                              className="w-14 rounded border border-(--border-subtle) bg-(--surface) px-1.5 py-0.5 text-center text-xs text-(--foreground) tabular-nums focus:border-sky-500 focus:outline-none"
                            />
                            <span className="text-slate-400">repeats</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <ProjectPicker
                onSelect={onAddDataset}
                excludeFolders={excludeFolders}
                buttonSize="small"
                buttonVariant="ghost"
              >
                <PlusIcon className="mr-1 h-3 w-3" />
                Add Project
              </ProjectPicker>

              {visibleFields.has('extraFolders' satisfies keyof FormState) && (
                <button
                  type="button"
                  onClick={handleBrowseFolder}
                  className="flex cursor-pointer items-center gap-1 rounded border border-(--border-subtle) bg-(--surface) px-2 py-1 text-xs text-(--foreground)/70 transition-colors hover:bg-(--surface-hover) hover:text-(--foreground)"
                >
                  <FolderOpenIcon className="h-3 w-3" />
                  Add Folder
                </button>
              )}
            </div>
          </>
        )}

        {/* Extra folders (intermediate+) */}
        {visibleFields.has('extraFolders' satisfies keyof FormState) &&
          extraFolders.length > 0 && (
            <div className="space-y-1">
              <label className="block text-xs font-medium text-(--foreground)/70">
                Extra Folders
              </label>
              {extraFolders.map((folder, i) => (
                <div key={folder} className="flex items-center gap-1.5 text-xs">
                  <FolderIcon className="h-3 w-3 shrink-0 text-slate-400" />
                  <span
                    className="min-w-0 flex-1 truncate text-slate-500"
                    title={folder}
                  >
                    {folder}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveExtraFolder(i)}
                    className="cursor-pointer rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                    title="Remove folder"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

        {totalImages > 0 && (
          <div className="border-t border-(--border-subtle) pt-2 text-xs text-slate-500">
            <span className="font-medium tabular-nums">{totalImages}</span>{' '}
            images,{' '}
            <span className="font-medium tabular-nums">{totalEffective}</span>{' '}
            effective (with repeats)
          </div>
        )}

        {/* Caption Shuffling */}
        {visibleFields.has('captionShuffling' satisfies keyof FormState) && (
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={captionShuffling}
              onChange={(e) =>
                onFieldChange('captionShuffling', e.target.checked)
              }
              className="accent-sky-500"
            />
            <span className="text-xs font-medium text-(--foreground)/70">
              Caption Shuffling
            </span>
            <span className="text-xs text-slate-400">
              Randomise tag order during training
            </span>
          </label>
        )}

        {/* Flip H Augment */}
        {visibleFields.has('flipAugment' satisfies keyof FormState) && (
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={flipAugment}
              onChange={(e) => onFieldChange('flipAugment', e.target.checked)}
              className="accent-sky-500"
            />
            <span className="text-xs font-medium text-(--foreground)/70">
              Flip Horizontal
            </span>
            <span className="text-xs text-slate-400">
              Randomly flip images horizontally
            </span>
          </label>
        )}

        {/* Flip V Augment */}
        {visibleFields.has('flipVAugment' satisfies keyof FormState) && (
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={flipVAugment}
              onChange={(e) => onFieldChange('flipVAugment', e.target.checked)}
              className="accent-sky-500"
            />
            <span className="text-xs font-medium text-(--foreground)/70">
              Flip Vertical
            </span>
            <span className="text-xs text-slate-400">
              Randomly flip images vertically (unusual)
            </span>
          </label>
        )}

        {/* Caption Dropout Rate */}
        {visibleFields.has('captionDropoutRate' satisfies keyof FormState) && (
          <div>
            <label className="mb-1 block text-xs font-medium text-(--foreground)/70">
              Caption Dropout Rate
            </label>
            <input
              type="text"
              value={captionDropoutRate}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val >= 0 && val <= 1) {
                  onFieldChange('captionDropoutRate', val);
                }
              }}
              className="w-20 rounded border border-(--border-subtle) bg-(--surface) px-3 py-1.5 text-sm text-(--foreground) tabular-nums focus:border-sky-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-400">
              Probability of dropping captions during training (0 = disabled)
            </p>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};

export const DatasetSection = memo(DatasetSectionComponent);
