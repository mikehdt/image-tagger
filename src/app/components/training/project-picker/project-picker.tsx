'use client';

import { FolderIcon, Loader2Icon } from 'lucide-react';
import Image from 'next/image';
import React, { memo } from 'react';

import { Button } from '@/app/components/shared/button';
import { Popup } from '@/app/components/shared/popup';

import type { DatasetFolder } from '../training-config-form/use-training-config-form';
import { useProjectPicker } from './use-project-picker';

type ProjectPickerProps = {
  onSelect: (
    folderName: string,
    displayName: string,
    folders: DatasetFolder[],
    thumbnail?: string,
    thumbnailVersion?: number,
    dimensionHistogram?: Record<string, number>,
  ) => void;
  excludeFolders: string[];
  children: React.ReactNode;
  buttonSize?: 'small' | 'medium';
  buttonVariant?: 'default' | 'ghost';
};

const ProjectPickerComponent = ({
  onSelect,
  excludeFolders,
  children,
  buttonSize = 'medium',
  buttonVariant = 'default',
}: ProjectPickerProps) => {
  const {
    triggerRef,
    popupId,
    projects,
    loading,
    selectingFolder,
    open,
    selectProject,
  } = useProjectPicker({ excludeFolders, onSelect });

  return (
    <>
      <Button
        ref={triggerRef}
        size={buttonSize}
        variant={buttonVariant}
        onClick={open}
      >
        {children}
      </Button>

      <Popup
        id={popupId}
        position="bottom-left"
        triggerRef={triggerRef}
        className="w-72 rounded-md border border-slate-200 bg-white shadow-md shadow-slate-600/50 dark:border-slate-600 dark:bg-slate-800 dark:shadow-slate-950/50"
      >
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2Icon className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : projects.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-slate-400">
            No projects found
          </div>
        ) : (
          <div className="py-1">
            {projects.map((project) => {
              const isExcluded = excludeFolders.includes(project.name);
              const isSelecting = selectingFolder === project.name;
              const thumbnailSrc = project.thumbnail
                ? `/tagging-projects/${project.thumbnail}${project.thumbnailVersion ? `?v=${project.thumbnailVersion}` : ''}`
                : null;

              return (
                <button
                  key={project.name}
                  type="button"
                  disabled={isExcluded || isSelecting}
                  onClick={() => selectProject(project)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
                    isExcluded
                      ? 'cursor-not-allowed opacity-40'
                      : isSelecting
                        ? 'bg-sky-50 dark:bg-sky-900/30'
                        : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {/* Thumbnail or folder icon */}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 dark:bg-slate-600">
                    {thumbnailSrc ? (
                      <Image
                        src={thumbnailSrc}
                        alt={project.title || project.name}
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FolderIcon className="h-4 w-4 text-slate-400" />
                    )}
                  </span>

                  {/* Project info */}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-(--foreground)">
                      {project.title || project.name}
                    </div>
                    {project.title && project.title !== project.name && (
                      <div className="truncate text-xs text-slate-400">
                        {project.name}
                      </div>
                    )}
                  </div>

                  {/* Image count or status */}
                  <span className="shrink-0 text-xs text-slate-400 tabular-nums">
                    {isSelecting ? (
                      <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                    ) : isExcluded ? (
                      'Added'
                    ) : (
                      `${project.imageCount ?? 0}`
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Popup>
    </>
  );
};

export const ProjectPicker = memo(ProjectPickerComponent);
