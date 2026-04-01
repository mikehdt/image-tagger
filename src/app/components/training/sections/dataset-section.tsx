import { EyeIcon, EyeOffIcon, FolderIcon, PlusIcon, XIcon } from 'lucide-react';
import Image from 'next/image';
import { memo, useMemo } from 'react';

import { CollapsibleSection } from '../collapsible-section';
import { ProjectPicker } from '../project-picker/project-picker';
import type {
  DatasetFolder,
  DatasetSource,
} from '../training-config-form/use-training-config-form';

type DatasetSectionProps = {
  datasets: DatasetSource[];
  totalImages: number;
  totalEffective: number;
  onAddDataset: (
    folderName: string,
    displayName: string,
    folders: DatasetFolder[],
    thumbnail?: string,
    thumbnailVersion?: number,
  ) => void;
  onRemoveDataset: (index: number) => void;
  onSetFolderRepeats: (
    datasetIndex: number,
    folderName: string,
    repeats: number | null,
  ) => void;
};

const DatasetSectionComponent = ({
  datasets,
  totalImages,
  totalEffective,
  onAddDataset,
  onRemoveDataset,
  onSetFolderRepeats,
}: DatasetSectionProps) => {
  const excludeFolders = useMemo(
    () => datasets.map((ds) => ds.folderName),
    [datasets],
  );

  return (
    <CollapsibleSection title="Dataset">
      <div className="space-y-3">
        {datasets.length === 0 ? (
          <div className="rounded border border-dashed border-slate-300 px-4 py-6 text-center dark:border-slate-600">
            <p className="text-sm text-slate-400">
              No dataset sources added yet
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Add a tagging project as a dataset source to begin
            </p>
            <div className="mt-3 inline-block">
              <ProjectPicker
                onSelect={onAddDataset}
                excludeFolders={excludeFolders}
              >
                <PlusIcon className="mr-1 h-3.5 w-3.5" />
                Add Project Source
              </ProjectPicker>
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

            <ProjectPicker
              onSelect={onAddDataset}
              excludeFolders={excludeFolders}
              buttonSize="small"
              buttonVariant="ghost"
            >
              <PlusIcon className="mr-1 h-3 w-3" />
              Add Another Source
            </ProjectPicker>
          </>
        )}

        {totalImages > 0 && (
          <div className="border-t border-(--border-subtle) pt-2 text-xs text-slate-500">
            <span className="font-medium tabular-nums">{totalImages}</span>{' '}
            images,{' '}
            <span className="font-medium tabular-nums">{totalEffective}</span>{' '}
            effective (with repeats)
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};

export const DatasetSection = memo(DatasetSectionComponent);
