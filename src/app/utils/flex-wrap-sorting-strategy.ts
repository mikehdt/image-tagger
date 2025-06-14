/**
 * A custom sorting strategy for dnd-kit optimized for flex-wrap layouts with variable-width items.
 * This strategy improves upon rectSortingStrategy by accounting for row changes and flex-wrap behavior.
 */

import type { ClientRect } from '@dnd-kit/core';
import type { SortingStrategy } from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';

const ROW_SENSITIVITY = 5; // Pixels of overlap needed to consider items in the same row

/**
 * Determines if two rectangles are in the same row based on vertical position and overlap
 */
function areRectsInSameRow(rect1: ClientRect, rect2: ClientRect): boolean {
  const rect1Bottom = rect1.top + rect1.height;
  const rect2Bottom = rect2.top + rect2.height;

  // Check if there's sufficient vertical overlap between the rectangles
  const verticalOverlap =
    Math.min(rect1Bottom, rect2Bottom) - Math.max(rect1.top, rect2.top);

  return verticalOverlap >= ROW_SENSITIVITY;
}

/**
 * Groups rects by row, accounting for flex-wrap layout
 */
function groupRectsByRow(rects: ClientRect[]): ClientRect[][] {
  if (!rects || rects.length === 0) return [];

  // Sort rects by their top position first
  const sortedRects = [...rects].sort((a, b) => a.top - b.top);

  const rows: ClientRect[][] = [];
  let currentRow: ClientRect[] = [sortedRects[0]];

  for (let i = 1; i < sortedRects.length; i++) {
    const currentRect = sortedRects[i];
    const lastRectInCurrentRow = currentRow[currentRow.length - 1];

    if (areRectsInSameRow(currentRect, lastRectInCurrentRow)) {
      // This rect belongs to the current row
      currentRow.push(currentRect);
    } else {
      // This rect starts a new row
      rows.push([...currentRow]);
      currentRow = [currentRect];
    }
  }

  // Don't forget to add the last row
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  // Now sort each row by left position for correct horizontal ordering
  return rows.map((rowRects) => rowRects.sort((a, b) => a.left - b.left));
}

/**
 * A sorting strategy optimized for flex-wrap layouts with variable-width items.
 * This improves upon rectSortingStrategy by handling row changes more naturally
 * and accounting for reflow in the flex layout.
 */
export const flexWrapSortingStrategy: SortingStrategy = ({
  rects,
  activeIndex,
  overIndex,
  index,
}) => {
  if (!rects.length) {
    return null;
  }

  // Use array move to see where items would be after the shuffle
  const newRects = arrayMove(rects, activeIndex, overIndex);
  const oldRect = rects[index];
  const newRect = newRects[index];
  const activeRect = rects[activeIndex]; // The actual rect being dragged

  if (!newRect || !oldRect || !activeRect) {
    return null;
  }

  // Calculate the transform based on position changes
  const basicTransform = {
    x: newRect.left - oldRect.left,
    y: newRect.top - oldRect.top,
    scaleX: 1,
    scaleY: 1,
  };

  // When an item is replacing the dragged item's position (overIndex),
  // it should take on the width of the dragged item to create the proper drop zone
  if (index === overIndex) {
    basicTransform.scaleX = activeRect.width / oldRect.width;
  }

  // If this is the active item, we don't need any special handling
  if (index === activeIndex) {
    return basicTransform;
  }

  // Group rects by row to determine row changes
  const oldRows = groupRectsByRow(rects);
  const newRows = groupRectsByRow(newRects);

  // Find the row index for an item
  const getRowIndex = (rows: ClientRect[][], rect: ClientRect): number => {
    for (let i = 0; i < rows.length; i++) {
      if (
        rows[i].some(
          (r) =>
            areRectsInSameRow(r, rect) &&
            Math.abs(r.top - rect.top) < ROW_SENSITIVITY,
        )
      ) {
        return i;
      }
    }
    return -1;
  };

  // Check if the current item is changing rows
  const oldRowIndex = getRowIndex(oldRows, oldRect);
  const newRowIndex = getRowIndex(newRows, newRect);

  // Calculate exact horizontal position relative to its neighbors
  const getIdealPosition = (
    rowItems: ClientRect[],
    itemPos: ClientRect,
  ): number => {
    // Find this item's index in the row
    const itemIndex = rowItems.findIndex(
      (r) =>
        r.left === itemPos.left &&
        Math.abs(r.top - itemPos.top) < ROW_SENSITIVITY,
    );

    if (itemIndex === 0) {
      // First item in row - align with row start
      return rowItems[0].left;
    } else if (itemIndex > 0) {
      // Between items - position after previous item
      const prevItem = rowItems[itemIndex - 1];
      return prevItem.left + prevItem.width;
    }

    // Item not found or invalid index - use default
    return itemPos.left;
  };

  // Special handling for items changing rows or position
  if (oldRowIndex !== -1 && newRowIndex !== -1) {
    // If changing rows or position in the same row
    if (oldRowIndex !== newRowIndex || basicTransform.x !== 0) {
      // Get the target row
      const targetRow = newRows[newRowIndex];

      if (targetRow && targetRow.length > 0) {
        // Calculate the ideal position in this row
        const idealX = getIdealPosition(targetRow, newRect);

        // For the item that directly swaps with the active item, ensure its space
        // reflects the active item's width
        if (index === overIndex) {
          return {
            ...basicTransform,
            x: idealX - oldRect.left,
            // Scale to match the width of the dragged item
            scaleX: activeRect.width / oldRect.width,
          };
        }

        // Apply more accurate horizontal positioning for other items
        return {
          ...basicTransform,
          x: idealX - oldRect.left,
        };
      }
    }
  }

  // Default behavior - use standard transform
  return basicTransform;
};
