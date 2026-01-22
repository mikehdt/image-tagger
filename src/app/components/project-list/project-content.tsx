import { CheckIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { memo, useEffect, useRef } from 'react';

import { Checkbox } from '@/app/components/shared/checkbox';

import type { Project, ProjectColor } from './types';

type ProjectContentProps = {
  project: Project;
  isEditing: boolean;
  editTitle: string;
  editColor: ProjectColor | undefined;
  editHidden?: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onTitleChange: (title: string) => void;
  onColorChange: (color: ProjectColor | undefined) => void;
  onHiddenChange?: (hidden: boolean) => void;
};

const colors: {
  value: ProjectColor;
  label: string;
  class: string;
  activeClass: string;
}[] = [
  {
    value: 'slate',
    label: 'Grey',
    class:
      'border-slate-400 bg-slate-100 hover:bg-slate-500 dark:border-slate-700 dark:bg-slate-800',
    activeClass:
      'border-slate-800 bg-slate-500 shadow-slate-500 dark:border-slate-200',
  },
  {
    value: 'rose',
    label: 'Rose',
    class:
      'border-rose-400 bg-rose-100 hover:bg-rose-500 dark:border-rose-800 dark:bg-rose-900',
    activeClass:
      'border-rose-800 bg-rose-500 shadow-rose-500 dark:border-rose-200',
  },
  {
    value: 'amber',
    label: 'Amber',
    class:
      'border-amber-400 bg-amber-100 hover:bg-amber-500 dark:border-amber-800 dark:bg-amber-900',
    activeClass:
      'border-amber-800 bg-amber-500 shadow-amber-500 dark:border-amber-200',
  },
  {
    value: 'teal',
    label: 'teal',
    class:
      'border-teal-400 bg-teal-100 hover:bg-teal-500 dark:border-teal-700 dark:bg-teal-800',
    activeClass:
      'border-teal-800 bg-teal-500 shadow-teal-500 dark:border-teal-200',
  },
  {
    value: 'sky',
    label: 'Sky',
    class:
      'border-sky-400 bg-sky-100 hover:bg-sky-500 dark:border-sky-700 dark:bg-sky-800',
    activeClass: 'border-sky-700 bg-sky-500 shadow-sky-500 dark:border-sky-200',
  },
  {
    value: 'indigo',
    label: 'Indigo',
    class:
      'border-indigo-400 bg-indigo-100 hover:bg-indigo-500 dark:border-indigo-600 dark:bg-indigo-700',
    activeClass:
      'border-indigo-800 bg-indigo-500 shadow-indigo-500 dark:border-indigo-200',
  },
  {
    value: 'stone',
    label: 'Stone',
    class:
      'border-stone-400 bg-stone-100 hover:bg-stone-500 dark:border-stone-500 dark:bg-stone-600',
    activeClass:
      'border-stone-800 bg-stone-500 shadow-stone-500 dark:border-stone-200',
  },
];

const ProjectContentComponent = ({
  project,
  isEditing,
  editTitle,
  editColor,
  editHidden,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onTitleChange,
  onColorChange,
  onHiddenChange,
}: ProjectContentProps) => {
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSaveEdit();
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  if (isEditing) {
    return (
      <div className="flex min-w-0 flex-1 items-center justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* Title input */}
          <input
            ref={titleInputRef}
            type="text"
            value={editTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-500 dark:bg-slate-600 dark:text-slate-100 dark:placeholder-slate-400"
            placeholder="Project title"
          />

          {/* Color picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-300">
              Colour:
            </span>
            <div className="mr-auto flex gap-1">
              {colors.map((color) => (
                <div
                  key={color.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    onColorChange(color.value);
                  }}
                  className={`h-4 w-4 cursor-pointer rounded-full border transition-colors ${
                    editColor === color.value
                      ? `shadow-xs ${color.activeClass}`
                      : color.class
                  }`}
                  title={color.label}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onColorChange(color.value);
                    }
                  }}
                />
              ))}
            </div>

            <Checkbox
              isSelected={editHidden || false}
              onChange={() => onHiddenChange?.(!editHidden)}
              ariaLabel="Hide project from list"
              label="Hide"
              size="small"
            />
          </div>
        </div>

        {/* Save/Cancel buttons */}
        <div className="ml-2 flex items-center gap-1">
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSaveEdit();
            }}
            className="cursor-pointer rounded border border-teal-300/0 p-1 text-teal-600 transition-colors hover:border-teal-300 hover:bg-teal-50 dark:text-teal-400 dark:hover:border-teal-500 dark:hover:bg-teal-900/50"
            title="Save changes"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onSaveEdit();
              }
            }}
          >
            <CheckIcon className="h-4 w-4" />
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onCancelEdit();
            }}
            className="cursor-pointer rounded border border-rose-300/0 p-1 text-rose-600 transition-colors hover:border-rose-300 hover:bg-red-50 dark:text-rose-400 dark:hover:border-rose-500 dark:hover:bg-rose-900/50"
            title="Cancel"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onCancelEdit();
              }
            }}
          >
            <XMarkIcon className="h-4 w-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 items-center justify-between">
      <div className="flex flex-wrap font-medium text-slate-900 dark:text-slate-100">
        <span className="w-full truncate">{project.title || project.name}</span>
        <span className="w-full text-xs text-black/40 dark:text-white/40">
          {project.name}
        </span>
      </div>

      <div className="relative flex items-center">
        {project.imageCount !== undefined && (
          <div className="text-sm text-slate-500 tabular-nums transition-transform duration-200 group-hover:-translate-x-8 dark:text-slate-300">
            {project.imageCount} images
          </div>
        )}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onStartEdit();
          }}
          className="absolute right-0 cursor-pointer rounded border border-slate-300/0 p-1 text-slate-400 opacity-0 transition-colors duration-200 group-hover:opacity-100 hover:border-slate-300 hover:bg-white hover:text-slate-600 dark:text-slate-300 dark:hover:border-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
          title="Edit project"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onStartEdit();
            }
          }}
        >
          <PencilIcon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};

export const ProjectContent = memo(ProjectContentComponent);
