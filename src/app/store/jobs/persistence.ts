/**
 * Persistence for download jobs across browser sessions.
 *
 * Uses localStorage so jobs survive closing the browser overnight.
 * All download jobs (including completed) are persisted so the
 * activity panel shows history until the user explicitly clears it.
 * Training jobs are not persisted here — the sidecar survives
 * independently and state is restored via WebSocket reconnection.
 */

import type { DownloadJob, Job } from './types';

const STORAGE_KEY = 'img-tagger:download-jobs';

/**
 * Save current download jobs to localStorage.
 * Called by middleware whenever the jobs state changes.
 */
export function persistDownloadJobs(jobs: Record<string, Job>): void {
  try {
    const downloadJobs = Object.values(jobs).filter(
      (j): j is DownloadJob => j.type === 'download',
    );

    if (downloadJobs.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(downloadJobs));
    }
  } catch {
    // localStorage may be unavailable (SSR, private browsing)
  }
}

/**
 * Load persisted download jobs from localStorage.
 * Any job that was 'running' is marked as 'interrupted' since
 * the SSE stream was lost when the page closed.
 */
export function loadPersistedDownloads(): DownloadJob[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const jobs: DownloadJob[] = JSON.parse(raw);

    return jobs.map((job) => {
      if (job.status === 'running') {
        return {
          ...job,
          status: 'interrupted' as const,
          error: 'Download interrupted — click Retry to continue',
        };
      }
      return job;
    });
  } catch {
    return [];
  }
}
