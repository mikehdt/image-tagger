import React, { Fragment } from 'react';

/**
 * Highlights matching segments of text by wrapping them in bold tags
 * @param text - The text to highlight
 * @param searchQuery - The search query to highlight
 * @param normalize - Optional function to normalize text for matching (applied to both text and query)
 * @returns Array of React elements with highlighted matches
 */
export const highlightText = (
  text: string,
  searchQuery: string,
  normalize?: (text: string) => string,
): React.ReactNode => {
  if (!searchQuery || searchQuery.trim() === '') {
    return text;
  }

  const query = searchQuery.trim();

  // Apply normalization if provided
  const normalizedQuery = normalize
    ? normalize(query.toLowerCase())
    : query.toLowerCase();
  const normalizedText = normalize
    ? normalize(text.toLowerCase())
    : text.toLowerCase();

  // If no matches, return text
  if (!normalizedText.includes(normalizedQuery)) {
    return text;
  }

  const result = [];
  let lastIndex = 0;

  // Find all occurrences of the search term
  let index = normalizedText.indexOf(normalizedQuery);

  while (index !== -1) {
    // Add the text before the match
    if (index > lastIndex) {
      result.push(
        <Fragment key={`text-${lastIndex}`}>
          {text.substring(lastIndex, index)}
        </Fragment>,
      );
    }

    // Add the highlighted match
    result.push(
      <span key={`match-${index}`} className="font-bold">
        {text.substring(index, index + query.length)}
      </span>,
    );

    lastIndex = index + query.length;
    index = normalizedText.indexOf(normalizedQuery, lastIndex);
  }

  // Add any remaining text
  if (lastIndex < text.length) {
    result.push(
      <Fragment key={`text-${lastIndex}`}>
        {text.substring(lastIndex)}
      </Fragment>,
    );
  }

  return result;
};

/**
 * Highlights matching segments of text for multiple patterns
 * @param text - The text to highlight
 * @param patterns - Array of patterns to highlight (case-insensitive)
 * @returns Array of React elements with highlighted matches
 */
export const highlightPatterns = (
  text: string,
  patterns: string[],
): React.ReactNode => {
  if (!patterns || patterns.length === 0) {
    return text;
  }

  const normalizedText = text.toLowerCase();

  // Find all match ranges
  const ranges: Array<{ start: number; end: number }> = [];

  for (const pattern of patterns) {
    if (!pattern) continue;
    let index = normalizedText.indexOf(pattern);
    while (index !== -1) {
      ranges.push({ start: index, end: index + pattern.length });
      index = normalizedText.indexOf(pattern, index + 1);
    }
  }

  // If no matches, return text
  if (ranges.length === 0) {
    return text;
  }

  // Sort by start position
  ranges.sort((a, b) => a.start - b.start);

  // Merge overlapping ranges
  const mergedRanges: Array<{ start: number; end: number }> = [];
  for (const range of ranges) {
    const last = mergedRanges[mergedRanges.length - 1];
    if (last && range.start <= last.end) {
      // Overlapping or adjacent - extend the previous range
      last.end = Math.max(last.end, range.end);
    } else {
      mergedRanges.push({ ...range });
    }
  }

  // Build result with highlighted segments
  const result: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const range of mergedRanges) {
    // Add text before the match
    if (range.start > lastIndex) {
      result.push(
        <Fragment key={`text-${lastIndex}`}>
          {text.substring(lastIndex, range.start)}
        </Fragment>,
      );
    }

    // Add the highlighted match
    result.push(
      <span key={`match-${range.start}`} className="font-bold">
        {text.substring(range.start, range.end)}
      </span>,
    );

    lastIndex = range.end;
  }

  // Add any remaining text
  if (lastIndex < text.length) {
    result.push(
      <Fragment key={`text-${lastIndex}`}>
        {text.substring(lastIndex)}
      </Fragment>,
    );
  }

  return result;
};
