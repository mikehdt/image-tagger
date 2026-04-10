/**
 * Persistence for download jobs across page refreshes.
 *
 * All download jobs (including completed) are persisted so the
 * activity panel shows history until the user explicitly clears it.
 * Training jobs are not persisted here — the sidecar survives
 * independently and state is restored via WebSocket reconnection.
 */

import type { DownloadJob, Job } from './types';

const STORAGE_KEY = 'img-tagger:download-jobs';

/**
 * Save current download jobs to sessionStorage.
 * Called by middleware whenever the jobs state changes.
 */
export function persistDownloadJobs(jobs: Record<string, Job>): void {
  try {
    const downloadJobs = Object.values(jobs).filter(
      (j): j is DownloadJob => j.type === 'download',
    );

    if (downloadJobs.length === 0) {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(downloadJobs));
    }
  } catch {
    // sessionStorage may be unavailable (SSR, private browsing)
  }
}

/**
 * Load persisted download jobs from sessionStorage.
 * Any job that was 'running' is marked as 'interrupted' since
 * the SSE stream was lost on refresh.
 */
export function loadPersistedDownloads(): DownloadJob[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
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
