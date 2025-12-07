/**
 * Lightweight render tracking utility for diagnosing React re-render patterns.
 * Tracks memo checks, memo hits (saved renders), actual renders, and timing.
 *
 * Usage:
 *   import { track } from '@/app/utils/render-tracker';
 *
 *   // At start of component:
 *   track('ComponentName', 'render');
 *
 *   // Before return statement:
 *   track('ComponentName', 'render-end');
 *
 *   // In memo comparison function:
 *   track('ComponentName', 'memo-check');
 *   if (propsAreEqual) track('ComponentName', 'memo-hit');
 *
 * Output is batched to console.table at end of each frame.
 * Set ENABLED = false to disable all tracking.
 */

const ENABLED = true;

type CountEntry = {
  memoChecks: number;
  memoHits: number;
  renders: number;
  totalMs: number;
  avgMs: string;
  ratio: string;
};

const counts: Record<string, CountEntry> = {};
const renderStarts: Record<string, number> = {};
let frameId: number | null = null;

export const track = (
  component: string,
  type: 'memo-check' | 'memo-hit' | 'render' | 'render-end',
) => {
  if (!ENABLED) return;

  if (!counts[component]) {
    counts[component] = {
      memoChecks: 0,
      memoHits: 0,
      renders: 0,
      totalMs: 0,
      avgMs: '-',
      ratio: '-',
    };
  }

  const entry = counts[component];

  if (type === 'memo-check') {
    entry.memoChecks++;
  } else if (type === 'memo-hit') {
    entry.memoHits++;
  } else if (type === 'render') {
    entry.renders++;
    renderStarts[component] = performance.now();
  } else if (type === 'render-end') {
    if (renderStarts[component]) {
      entry.totalMs += performance.now() - renderStarts[component];
      entry.avgMs = (entry.totalMs / entry.renders).toFixed(3);
    }
  }

  // Update ratio
  if (entry.memoChecks > 0) {
    const pct = ((entry.memoHits / entry.memoChecks) * 100).toFixed(1);
    entry.ratio = `${pct}%`;
  }

  // Batch output to end of frame
  if (!frameId) {
    frameId = requestAnimationFrame(() => {
      console.log('%c[Render Tracker]', 'color: #8b5cf6; font-weight: bold');
      const display = Object.fromEntries(
        Object.entries(counts).map(([k, v]) => [
          k,
          {
            renders: v.renders,
            memoChecks: v.memoChecks,
            memoHits: v.memoHits,
            ratio: v.ratio,
            totalMs: v.totalMs.toFixed(2),
            avgMs: v.avgMs,
          },
        ]),
      );
      console.table(display);

      // Reset for next interaction
      Object.keys(counts).forEach((k) => {
        counts[k] = {
          memoChecks: 0,
          memoHits: 0,
          renders: 0,
          totalMs: 0,
          avgMs: '-',
          ratio: '-',
        };
      });
      Object.keys(renderStarts).forEach((k) => delete renderStarts[k]);
      frameId = null;
    });
  }
};

/** Reset all counts manually */
export const resetTracker = () => {
  Object.keys(counts).forEach((k) => delete counts[k]);
  Object.keys(renderStarts).forEach((k) => delete renderStarts[k]);
  if (frameId) {
    cancelAnimationFrame(frameId);
    frameId = null;
  }
};
