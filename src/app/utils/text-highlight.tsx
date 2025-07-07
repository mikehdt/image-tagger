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
