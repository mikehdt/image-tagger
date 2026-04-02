import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { highlightTriggerPhrases } from '@/app/utils/text-highlight';

type CaptionEditorProps = {
  captionText: string;
  triggerPhrases: string[];
  onTextChange: (text: string) => void;
};

const CaptionEditorComponent = ({
  captionText,
  triggerPhrases,
  onTextChange,
}: CaptionEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = captionText.trim()
    ? captionText.trim().split(/\s+/).length
    : 0;

  // Auto-grow the textarea to fit its content
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight + 2}px`;
  }, []);

  // Adjust height on mount, text changes, and parent resize
  useEffect(() => {
    if (!isEditing) return;
    adjustHeight();

    const parent = textareaRef.current?.parentElement;
    if (!parent) return;

    const observer = new ResizeObserver(() => adjustHeight());
    observer.observe(parent);
    return () => observer.disconnect();
  }, [isEditing, adjustHeight]);

  // Also adjust when text changes from external source (e.g. undo)
  useEffect(() => {
    if (isEditing) adjustHeight();
  }, [isEditing, captionText, adjustHeight]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onTextChange(e.target.value);
    },
    [onTextChange],
  );

  const handleBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  return (
    <div
      className="flex h-full w-full cursor-text flex-col"
      onClick={handleClick}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={captionText}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full resize-none rounded border border-amber-300 bg-transparent p-2 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-300 dark:border-amber-600 dark:focus:border-amber-500 dark:focus:ring-amber-600"
          autoFocus
          rows={1}
        />
      ) : (
        <div className="rounded border border-slate-200 bg-transparent p-2 transition-colors dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800">
          {captionText ? (
            highlightTriggerPhrases(captionText, triggerPhrases)
          ) : (
            <span className="text-slate-400 dark:text-slate-600">
              Click to add caption...
            </span>
          )}
        </div>
      )}

      <span className="mt-2 border border-transparent px-2 text-right text-xs text-slate-400 tabular-nums dark:text-slate-500">
        {wordCount} {wordCount === 1 ? 'word' : 'words'}
      </span>
    </div>
  );
};

export const CaptionEditor = memo(CaptionEditorComponent);
