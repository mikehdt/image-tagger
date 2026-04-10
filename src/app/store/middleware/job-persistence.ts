/**
 * Middleware for the jobs slice:
 * - Persists download jobs to sessionStorage on every change
 * - Auto-opens the activity panel when a new job is added
 */

import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';

import type { RootState } from '../index';
import { addJob, openPanel } from '../jobs';
import { persistDownloadJobs } from '../jobs/persistence';

export const jobPersistenceMiddleware = createListenerMiddleware();

// Persist download jobs to sessionStorage on any jobs/ action
jobPersistenceMiddleware.startListening({
  predicate: (action) =>
    typeof action.type === 'string' && action.type.startsWith('jobs/'),
  effect: (_action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    persistDownloadJobs(state.jobs.jobs);
  },
});

// Auto-open the activity panel when a new job is added
jobPersistenceMiddleware.startListening({
  matcher: isAnyOf(addJob),
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(openPanel());
  },
});
