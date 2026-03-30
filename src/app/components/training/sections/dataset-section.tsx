import { FolderIcon, PlusIcon, XIcon } from 'lucide-react';
import { memo } from 'react';

import { Button } from '@/app/components/shared/button';

import { CollapsibleSection } from '../collapsible-section';
import type { DatasetSource } from '../training-config-form/use-training-config-form';

type DatasetSectionProps = {
  datasets: DatasetSource[];
  totalImages: number;
  totalEffective: number;
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
  onRemoveDataset,
  onSetFolderRepeats,
}: DatasetSectionProps) => {
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
            <Button
              size="medium"
              className="mt-3"
              onClick={() => {
                // TODO: Open project picker
              }}
            >
              <PlusIcon className="mr-1 h-3.5 w-3.5" />
              Add Project Source
            </Button>
          </div>
        ) : (
          <>
            {datasets.map((ds, dsIndex) => (
              <div
                key={ds.projectName}
                className="rounded border border-(--border-subtle) bg-(--surface)/30 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-(--foreground)">
                    {ds.projectName}
                  </span>
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
                    return (
                      <div
                        key={folder.name}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <FolderIcon className="h-3 w-3" />
                          <span>{folder.name}</span>
                          <span className="text-slate-400">
                            ({folder.imageCount} images)
                          </span>
                        </div>
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
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <Button
              size="small"
              variant="ghost"
              onClick={() => {
                // TODO: Open project picker
              }}
            >
              <PlusIcon className="mr-1 h-3 w-3" />
              Add Another Source
            </Button>
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
