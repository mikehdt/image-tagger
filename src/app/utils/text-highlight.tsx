import React from 'react';

/**
 * Highlights matching segments of text by wrapping them in bold tags
 * @param text - The text to highlight
 * @param searchQuery - The search query to highlight
 * @returns JSX with highlighted segments
 */
export const highlightText = (
  text: string,
  searchQuery: string,
): React.ReactNode => {
  if (!searchQuery || !searchQuery.trim()) {
    return text;
  }

  const query = searchQuery.trim().toLowerCase();
  const lowerText = text.toLowerCase();

  // Find all matches (case-insensitive)
  const matches: { start: number; end: number }[] = [];
  let index = 0;

  while (index < lowerText.length) {
    const matchIndex = lowerText.indexOf(query, index);
    if (matchIndex === -1) break;

    matches.push({
      start: matchIndex,
      end: matchIndex + query.length,
    });

    index = matchIndex + 1; // Allow overlapping matches
  }

  if (matches.length === 0) {
    return text;
  }

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);

  // Merge overlapping matches
  const mergedMatches: { start: number; end: number }[] = [];
  let currentMatch = matches[0];

  for (let i = 1; i < matches.length; i++) {
    const match = matches[i];
    if (match.start <= currentMatch.end) {
      // Overlapping or adjacent, merge them
      currentMatch.end = Math.max(currentMatch.end, match.end);
    } else {
      // No overlap, save current and start new one
      mergedMatches.push(currentMatch);
      currentMatch = match;
    }
  }
  mergedMatches.push(currentMatch);

  // Build the highlighted text
  const parts: React.ReactNode[] = [];
  let lastEnd = 0;

  mergedMatches.forEach((match, index) => {
    // Add text before this match
    if (match.start > lastEnd) {
      parts.push(text.slice(lastEnd, match.start));
    }

    // Add highlighted match
    parts.push(
      <strong key={index} className="font-bold">
        {text.slice(match.start, match.end)}
      </strong>,
    );

    lastEnd = match.end;
  });

  // Add remaining text
  if (lastEnd < text.length) {
    parts.push(text.slice(lastEnd));
  }

  return <>{parts}</>;
};
