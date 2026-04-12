/**
 * Client-side download starter.
 *
 * Creates a download job, registers an AbortController, streams SSE
 * progress, and dispatches Redux actions. Used by both the model
 * manager modal and the activity panel's resume handler.
 */

import type { AppDispatch } from '@/app/store';
import {
  addJob,
  completeDownload,
  failDownload,
  updateDownloadProgress,
  updateJobStatus,
} from '@/app/store/jobs';
import { setModelStatus } from '@/app/store/model-manager';

import {
  registerDownloadController,
  removeDownloadController,
} from './download-controllers';

type StartDownloadOpts = {
  modelId: string;
  modelName: string;
  variantId?: string;
  dispatch: AppDispatch;
};

/**
 * Start a model download and stream progress to Redux.
 * Returns the job ID for the created download job.
 */
export async function startModelDownload({
  modelId,
  modelName,
  variantId,
  dispatch,
}: StartDownloadOpts): Promise<string> {
  const suffix = variantId ? `-${variantId}` : '';
  const jobId = `dl-${Date.now()}-${modelId}${suffix}`;

  dispatch(
    addJob({
      id: jobId,
      type: 'download',
      status: 'running',
      createdAt: Date.now(),
      startedAt: Date.now(),
      completedAt: null,
      error: null,
      modelId,
      modelName,
      targetDir: '',
      progress: null,
    }),
  );
  dispatch(setModelStatus({ modelId, status: 'downloading' }));

  const controller = registerDownloadController(jobId);

  try {
    const res = await fetch('/api/model-manager/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId, variantId }),
      signal: controller.signal,
    });

    if (!res.ok || !res.body) throw new Error('Failed to start download');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      for (const line of decoder.decode(value).split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const data = JSON.parse(line.slice(6));

        if (data.status === 'error') {
          dispatch(failDownload({ id: jobId, error: data.error }));
          dispatch(setModelStatus({ modelId, status: 'error' }));
          removeDownloadController(jobId);
          return jobId;
        }

        if (data.status === 'ready') {
          dispatch(completeDownload(jobId));
          dispatch(setModelStatus({ modelId, status: 'ready' }));
          removeDownloadController(jobId);
          return jobId;
        }

        dispatch(
          updateDownloadProgress({
            id: jobId,
            progress: {
              bytesDownloaded: data.bytesDownloaded,
              totalBytes: data.totalBytes,
              currentFile: data.currentFile,
              fileIndex: data.fileIndex,
              totalFiles: data.totalFiles,
            },
          }),
        );
      }
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      dispatch(
        updateJobStatus({
          id: jobId,
          status: 'cancelled',
          error: 'Download cancelled',
        }),
      );
      dispatch(setModelStatus({ modelId, status: 'not_installed' }));
    } else {
      const msg = err instanceof Error ? err.message : 'Download failed';
      dispatch(failDownload({ id: jobId, error: msg }));
      dispatch(setModelStatus({ modelId, status: 'error' }));
    }
    removeDownloadController(jobId);
  }

  return jobId;
}
