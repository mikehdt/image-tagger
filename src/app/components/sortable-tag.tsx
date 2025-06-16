import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { memo, type SyntheticEvent, useEffect, useRef, useState } from 'react';

import { Tag } from './tag';

// Adding a debug mode flag - set to true to enable visual debugging
const DEBUG_MODE = false;

type SortableTagProps = {
  id: string;
  tagName: string;
  tagState: number; // Changed to number to support bitwise flags
  count: number;
  highlight: boolean;
  fade: boolean;
  onToggleTag: (e: SyntheticEvent, tagName: string) => void;
  onDeleteTag: (e: SyntheticEvent, tagName: string) => void;
  onEditTag?: (oldTagName: string, newTagName: string) => void;
  onEditValueChange?: (tagName: string, value: string) => void;
  isDuplicate?: boolean;
};

const SortableTag = ({
  id,
  tagName,
  tagState,
  count,
  highlight,
  fade,
  onToggleTag,
  onDeleteTag,
  onEditTag,
  onEditValueChange,
  isDuplicate = false,
}: SortableTagProps) => {
  // State to track debug info
  const [debugInfo, setDebugInfo] = useState({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  });

  // Track whether the tag is currently being edited
  const [isEditing, setIsEditing] = useState(false);

  // This will be used to disable drag when editing

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    over,
    active,
  } = useSortable({
    id,
    // Use custom animation settings optimized for flex-wrap layout
    animateLayoutChanges: ({
      isSorting,
      isDragging,
      wasDragging,
      index,
      newIndex,
    }) => {
      // Only animate when not dragging and we have a new position after sorting
      if (!isDragging && wasDragging && isSorting && index !== newIndex) {
        return true;
      }
      return false;
    },
    // Customize transition for smoother animations with variable-width items
    transition: {
      duration: 200, // milliseconds
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)', // Smooth easing function
    },
  });

  // Create our own ref to measure the element
  const elementRef = useRef<HTMLDivElement | null>(null);

  // Update measurements on mount and when transforms change
  useEffect(() => {
    // Function to update position and size information
    const updateDebugInfo = () => {
      if (DEBUG_MODE && elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        setDebugInfo({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          x: Math.round(rect.left),
          y: Math.round(rect.top),
        });
      }
    };

    // Set up a mutation observer to track size/position changes
    if (DEBUG_MODE && elementRef.current) {
      const observer = new MutationObserver(updateDebugInfo);
      observer.observe(elementRef.current, {
        attributes: true,
        childList: false,
        subtree: false,
      });

      // Also update periodically during drag
      const interval = setInterval(updateDebugInfo, 100);

      return () => {
        observer.disconnect();
        clearInterval(interval);
      };
    }
  }, [transform, transition]);

  // Combined ref function that sets both our tracking ref and dnd-kit's ref
  const setRefs = (element: HTMLDivElement | null) => {
    elementRef.current = element;
    setNodeRef(element);
  };

  // Debug classes to show how elements are interacting
  const getDebugClasses = () => {
    if (!DEBUG_MODE) return '';

    let classes = 'relative ';

    // Item being dragged
    if (isDragging) {
      classes += 'outline outline-2 outline-red-500 ';
    }

    // Item being hovered over (potential drop target)
    if (over && over.id === id && active && active.id !== id) {
      classes += 'outline outline-2 outline-green-500 ';
    }

    return classes;
  };

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 0, // Higher z-index while dragging
    touchAction: 'none' as const, // Disable browser handling of touch gestures
    // Add will-change to improve rendering performance during animations
    willChange: transition ? 'transform' : undefined,
  };

  // Handler for when edit state changes
  const handleEditStateChange = (editing: boolean) => {
    setIsEditing(editing);
    // When editing starts, set an empty value to trigger fading
    // When editing ends, reset the edit value
    if (onEditValueChange) {
      if (editing) {
        onEditValueChange(tagName, tagName); // Pass current tag name to start with
      } else {
        onEditValueChange(tagName, ''); // Clear on finish
      }
    }
  };

  // Handler for tracking edit input value
  const handleEditValueChange = (value: string) => {
    if (onEditValueChange) {
      onEditValueChange(tagName, value);
    }
  };

  return (
    <div
      ref={setRefs}
      style={style}
      // Don't apply drag attributes or listeners when editing or faded
      {...(isEditing || fade ? {} : attributes)}
      {...(isEditing || fade ? {} : listeners)}
      className={`touch-none ${fade ? 'pointer-events-none' : ''} ${getDebugClasses()}`}
      data-tag-name={tagName}
    >
      <Tag
        tagName={tagName}
        tagState={tagState}
        count={count}
        highlight={highlight}
        fade={fade}
        onToggleTag={onToggleTag}
        onDeleteTag={onDeleteTag}
        onEditTag={onEditTag}
        isDraggable={!isEditing}
        onEditStateChange={handleEditStateChange}
        onEditValueChange={handleEditValueChange}
        isDuplicate={isDuplicate}
      />
      {/* Debug overlay showing width and position */}
      {DEBUG_MODE && (
        <div className="pointer-events-none absolute top-0 left-0 z-50 text-xs text-white">
          <div className="rounded bg-black/70 px-1">
            {debugInfo.width}×{debugInfo.height}
            <br />
            {debugInfo.x},{debugInfo.y}
            {active && active.id === id && ' 🔄'}
          </div>
        </div>
      )}
    </div>
  );
};

// Custom equality function for SortableTag - ensure we re-render when props change
const areSortableTagsEqual = (
  prevProps: SortableTagProps,
  nextProps: SortableTagProps,
) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.tagName === nextProps.tagName &&
    prevProps.tagState === nextProps.tagState &&
    prevProps.count === nextProps.count &&
    prevProps.highlight === nextProps.highlight &&
    prevProps.fade === nextProps.fade
    // Functions references should be stable from parent with useCallback
  );
};

// Skip memoization when in debug mode to ensure updates are visible
const MemoizedSortableTag = DEBUG_MODE
  ? SortableTag
  : memo(SortableTag, areSortableTagsEqual);

// For backward compatibility
export { MemoizedSortableTag as SortableTag };
