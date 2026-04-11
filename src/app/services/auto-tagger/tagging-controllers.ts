/**
 * Tracks AbortControllers for active tagging jobs.
 *
 * AbortControllers are not serializable and can't live in Redux.
 * This module provides a simple map for the UI and activity panel
 * to abort in-progress tagging jobs by job ID.
 */

const controllers = new Map<string, AbortController>();

/** Register a controller for a tagging job. */
export function registerTaggingController(jobId: string): AbortController {
  controllers.get(jobId)?.abort();

  const controller = new AbortController();
  controllers.set(jobId, controller);
  return controller;
}

/** Abort a tagging job by ID. */
export function abortTagging(jobId: string): void {
  const controller = controllers.get(jobId);
  if (controller) {
    controller.abort();
    controllers.delete(jobId);
  }
}

/** Clean up a controller after tagging completes or fails. */
export function removeTaggingController(jobId: string): void {
  controllers.delete(jobId);
}
