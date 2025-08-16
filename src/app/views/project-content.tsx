import { CheckIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { memo, useEffect, useRef } from 'react';

type Project = {
  name: string;
  title?: string;
  color?: 'slate' | 'rose' | 'amber' | 'emerald' | 'sky' | 'indigo' | 'stone';
  imageCount?: number;
};

type ProjectContentProps = {
  project: Project;
  isEditing: boolean;
  editTitle: string;
  editColor: Project['color'];
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onTitleChange: (title: string) => void;
  onColorChange: (color: Project['color']) => void;
};

const colors: {
  value: Project['color'];
  label: string;
  class: string;
  activeClass: string;
}[] = [
  {
    value: 'slate',
    label: 'Gray',
    class: 'border-slate-400 bg-slate-200 hover:bg-slate-500',
    activeClass: 'border-slate-800 bg-slate-500 shadow-slate-500',
  },
  {
    value: 'rose',
    label: 'Rose',
    class: 'border-rose-400 bg-rose-200 hover:bg-rose-500',
    activeClass: 'border-rose-800 bg-rose-500 shadow-rose-500',
  },
  {
    value: 'amber',
    label: 'Amber',
    class: 'border-amber-400 bg-amber-200 hover:bg-amber-500',
    activeClass: 'border-amber-800 bg-amber-500 shadow-amber-500',
  },
  {
    value: 'emerald',
    label: 'Emerald',
    class: 'border-emerald-400 bg-emerald-200 hover:bg-emerald-500',
    activeClass: 'border-emerald-800 bg-emerald-500 shadow-emerald-500',
  },
  {
    value: 'sky',
    label: 'Sky',
    class: 'border-sky-400 bg-sky-200 hover:bg-sky-500',
    activeClass: 'border-sky-800 bg-sky-500 shadow-sky-500',
  },
  {
    value: 'indigo',
    label: 'Indigo',
    class: 'border-indigo-400 bg-indigo-200 hover:bg-indigo-500',
    activeClass: 'border-indigo-800 bg-indigo-500 shadow-indigo-500',
  },
  {
    value: 'stone',
    label: 'Stone',
    class: 'border-stone-400 bg-stone-200 hover:bg-stone-500',
    activeClass: 'border-stone-800 bg-stone-500 shadow-stone-500',
  },
];

const ProjectContentComponent = ({
  project,
  isEditing,
  editTitle,
  editColor,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onTitleChange,
  onColorChange,
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
            className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Project title"
          />

          {/* Color picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">Colour:</span>
            <div className="flex gap-1">
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
          </div>
        </div>

        {/* Save/Cancel buttons */}
        <div className="ml-2 flex items-center gap-1">
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSaveEdit();
            }}
            className="cursor-pointer rounded border border-emerald-300/0 p-1 text-emerald-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
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
            className="cursor-pointer rounded border border-rose-300/0 p-1 text-rose-600 transition-colors hover:border-rose-300 hover:bg-red-50"
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
      <div className="flex flex-wrap font-medium text-slate-900">
        <span className="w-full truncate">{project.title || project.name}</span>
        <span className="w-full text-xs text-black/40">{project.name}</span>
      </div>

      <div className="relative flex items-center">
        {project.imageCount !== undefined && (
          <div className="text-sm text-slate-500 tabular-nums transition-transform duration-200 group-hover:-translate-x-8">
            {project.imageCount} images
          </div>
        )}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onStartEdit();
          }}
          className="absolute right-0 cursor-pointer rounded border border-slate-300/0 p-1 text-slate-400 opacity-0 transition-colors duration-200 group-hover:opacity-100 hover:border-slate-300 hover:bg-white hover:text-slate-600"
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
