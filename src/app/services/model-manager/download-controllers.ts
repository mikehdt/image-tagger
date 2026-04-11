/**
 * Tracks AbortControllers for active downloads.
 *
 * AbortControllers are not serializable and can't live in Redux.
 * This module provides a simple map for the UI to register and
 * abort in-progress downloads by job ID.
 */

const controllers = new Map<string, AbortController>();

/** Register a controller for a download job. */
export function registerDownloadController(jobId: string): AbortController {
  // Abort any existing controller for this job
  controllers.get(jobId)?.abort();

  const controller = new AbortController();
  controllers.set(jobId, controller);
  return controller;
}

/** Abort a download by job ID. */
export function abortDownload(jobId: string): void {
  const controller = controllers.get(jobId);
  if (controller) {
    controller.abort();
    controllers.delete(jobId);
  }
}

/** Clean up a controller after download completes or fails. */
export function removeDownloadController(jobId: string): void {
  controllers.delete(jobId);
}
