'use client';

import { XMarkIcon } from '@heroicons/react/24/solid';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';

// Define a type for tag status
type TagStatus = {
  tag: string;
  status: 'all' | 'some' | 'none';
};

type MultiTagInputProps = {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  duplicateCheck?: (tag: string) => {
    isDuplicate: boolean;
    isAllDuplicates?: boolean;
    duplicateCount?: number;
    totalSelected?: number;
  };
  // Enhanced tag status: can mark tags as duplicate in "some" or "all" assets
  tagStatus?: TagStatus[];
  autoFocus?: boolean;
};

export const MultiTagInput = ({
  tags,
  onTagsChange,
  placeholder = 'Enter tags...',
  className = '',
  duplicateCheck,
  tagStatus = [],
  autoFocus = false,
}: MultiTagInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [hasFocus, setHasFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check for duplicates - only if the input value is not empty
  const duplicateInfo =
    duplicateCheck && inputValue
      ? duplicateCheck(inputValue)
      : { isDuplicate: false };
  const { isDuplicate } = duplicateInfo;

  // Move focus to the input when clicking anywhere in the container
  useEffect(() => {
    const container = containerRef.current;
    const handleContainerClick = (e: MouseEvent) => {
      // Only focus if clicking on the container itself, not on a tag
      if (
        e.target === container ||
        (e.target as HTMLElement).dataset?.container === 'true'
      ) {
        inputRef.current?.focus();
      }
    };

    if (container) {
      container.addEventListener('click', handleContainerClick);
    }

    return () => {
      if (container) {
        container.removeEventListener('click', handleContainerClick);
      }
    };
  }, []);

  const addTag = (tagText: string) => {
    const trimmedTag = tagText.trim();
    if (!trimmedTag || tags.includes(trimmedTag)) return;

    onTagsChange([...tags, trimmedTag]);
    setInputValue('');
  };

  const handleInputChange = (value: string) => {
    // If the input contains a comma, split and process the tags
    if (value.includes(',')) {
      const parts = value.split(',');
      const lastPart = parts.pop() || ''; // The part after the last comma becomes the new input

      // Add all complete tags (parts before the last comma)
      const newTags: string[] = [];
      parts.forEach((part) => {
        const trimmedPart = part.trim();
        if (trimmedPart && !tags.includes(trimmedPart)) {
          newTags.push(trimmedPart);
        }
      });

      // Update tags if we have new ones to add
      if (newTags.length > 0) {
        onTagsChange([...tags, ...newTags]);
      }

      // Set the remaining text as the input value
      setInputValue(lastPart);
    } else {
      setInputValue(value);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === 'Tab') && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove the last tag if Backspace is pressed on an empty input
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleInputBlur = () => {
    setHasFocus(false);
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex w-full cursor-text flex-wrap items-center rounded-2xl border px-1 py-1 inset-shadow-sm transition-colors focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 ${className} ${
        hasFocus ? 'border-sky-500' : 'border-slate-400'
      } ${isDuplicate ? 'border-amber-400 bg-amber-50 inset-shadow-amber-300' : 'inset-shadow-slate-300'}`}
      data-container="true"
    >
      {tags.map((tag) => {
        // Find the status for this tag
        const tagInfo = tagStatus.find((t) => t.tag === tag) || {
          tag,
          status: 'none',
        };
        const status = tagInfo.status;

        // Define style variants based on status
        const tagStyles = {
          none: 'border-slate-300 bg-slate-100 text-slate-800',
          some: 'border-amber-300 bg-amber-50 text-amber-800',
          all: 'border-rose-300 bg-rose-100 text-rose-800',
        };

        const buttonHoverStyles = {
          none: 'hover:bg-slate-300',
          some: 'hover:bg-amber-200',
          all: 'hover:bg-rose-300',
        };

        const iconStyles = {
          none: 'text-slate-600',
          some: 'text-amber-600',
          all: 'text-rose-600',
        };

        return (
          <div
            key={tag}
            className={`m-0.5 flex cursor-default items-center space-x-1 rounded-full border py-0.5 pr-1 pl-3 text-sm ${tagStyles[status]}`}
          >
            <span>{tag}</span>

            <button
              type="button"
              onClick={() => removeTag(tag)}
              className={`ml-1 cursor-pointer rounded-full p-0.5 transition-colors ${buttonHoverStyles[status]}`}
              aria-label={`Remove tag ${tag}`}
            >
              <XMarkIcon className={`h-4 w-4 ${iconStyles[status]}`} />
            </button>
          </div>
        );
      })}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setHasFocus(true)}
        onBlur={handleInputBlur}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="min-w-24 flex-grow basis-0 bg-transparent px-2 py-1 outline-none"
        autoFocus={autoFocus}
        data-container="true"
      />
    </div>
  );
};
