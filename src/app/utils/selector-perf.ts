/**
 * Selector performance tracking utility.
 * Measures execution time and call frequency of Redux selectors.
 *
 * Usage:
 *   import { wrapSelector, getSelectorStats } from '@/app/utils/selector-perf';
 *
 *   // Wrap a selector:
 *   export const selectAllTags = wrapSelector('selectAllTags', createSelector(...));
 *
 *   // View stats in console:
 *   getSelectorStats();
 *
 * Set ENABLED = true to enable tracking.
 */

const ENABLED = false;

type SelectorStats = {
  calls: number;
  cacheHits: number;
  cacheMisses: number;
  totalMs: number;
  avgMs: number;
  maxMs: number;
  lastResult: unknown;
};

const stats: Record<string, SelectorStats> = {};

/**
 * Wrap a selector to track its performance
 */
export function wrapSelector<T extends (...args: never[]) => unknown>(
  name: string,
  selector: T,
): T {
  if (!ENABLED) return selector;

  if (!stats[name]) {
    stats[name] = {
      calls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalMs: 0,
      avgMs: 0,
      maxMs: 0,
      lastResult: undefined,
    };
  }

  const wrapped = ((...args: Parameters<T>) => {
    const entry = stats[name];
    entry.calls++;

    const start = performance.now();
    const result = selector(...args);
    const elapsed = performance.now() - start;

    // Check if result changed (cache miss) or same (cache hit)
    if (result === entry.lastResult) {
      entry.cacheHits++;
    } else {
      entry.cacheMisses++;
      entry.lastResult = result;
    }

    entry.totalMs += elapsed;
    entry.avgMs = entry.totalMs / entry.calls;
    entry.maxMs = Math.max(entry.maxMs, elapsed);

    return result;
  }) as T;

  return wrapped;
}

/**
 * Get current stats for all tracked selectors
 */
export function getSelectorStats(): void {
  if (!ENABLED) {
    console.log('Selector perf tracking is disabled');
    return;
  }

  console.log('%c[Selector Performance]', 'color: #10b981; font-weight: bold');

  const display = Object.entries(stats)
    .sort((a, b) => b[1].totalMs - a[1].totalMs)
    .map(([name, s]) => ({
      name,
      calls: s.calls,
      cacheHits: s.cacheHits,
      cacheMisses: s.cacheMisses,
      hitRate: s.calls > 0 ? `${((s.cacheHits / s.calls) * 100).toFixed(1)}%` : '-',
      totalMs: s.totalMs.toFixed(2),
      avgMs: s.avgMs.toFixed(3),
      maxMs: s.maxMs.toFixed(3),
    }));

  console.table(display);
}

/**
 * Reset all stats
 */
export function resetSelectorStats(): void {
  Object.keys(stats).forEach((k) => delete stats[k]);
  console.log('Selector stats reset');
}

/**
 * Get raw stats object for programmatic access
 */
export function getRawSelectorStats(): Record<string, SelectorStats> {
  return { ...stats };
}

// Expose to window for easy console access
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).selectorPerf = {
    getStats: getSelectorStats,
    reset: resetSelectorStats,
    getRaw: getRawSelectorStats,
  };
}
