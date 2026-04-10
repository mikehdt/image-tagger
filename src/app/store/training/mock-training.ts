/**
 * Mock training job for UI development.
 * Simulates progress ticks without touching the GPU or sidecar.
 */

import type { AppDispatch } from '../index';
import { addJob, openPanel, removeJob, updateTrainingProgress } from '../jobs';

let mockInterval: ReturnType<typeof setInterval> | null = null;

export function startMockTraining(
  config: Record<string, unknown>,
): (dispatch: AppDispatch) => void {
  return (dispatch) => {
    // Clean up any previous mock
    if (mockInterval) clearInterval(mockInterval);

    const jobId = `mock-${Date.now()}`;
    const totalSteps = (config.steps as number) || 500;
    const outputName = (config.outputName as string) || 'mock-lora';
    const baseLr = (config.learningRate as number) || 1e-4;

    dispatch(
      addJob({
        id: jobId,
        type: 'training',
        status: 'running',
        createdAt: Date.now(),
        startedAt: Date.now(),
        completedAt: null,
        error: null,
        config: {
          projectPath: '',
          provider: (config.provider as 'ai-toolkit' | 'kohya') ?? 'ai-toolkit',
          baseModel: (config.modelId as string) ?? 'flux-dev',
          modelPaths: (config.modelPaths as Record<string, string>) ?? {},
          outputPath: '',
          outputName,
          datasets: [],
          hyperparameters: {
            learningRate: baseLr,
            epochs: (config.epochs as number) ?? 20,
            batchSize: (config.batchSize as number) ?? 1,
            resolution: 1024,
            networkDim: (config.networkDim as number) ?? 16,
            networkAlpha: (config.networkAlpha as number) ?? 16,
            optimizer: (config.optimizer as string) ?? 'adamw8bit',
            scheduler: (config.scheduler as string) ?? 'constant',
            warmupSteps: (config.warmupSteps as number) ?? 0,
            saveEveryNEpochs: 1,
            sampleEveryNSteps: 250,
            gradientAccumulationSteps: 1,
            mixedPrecision: 'bf16',
            extra: {},
          },
          samplePrompts: [],
        },
        progress: null,
      }),
    );

    dispatch(openPanel());

    const startedAt = Date.now();
    let step = 0;
    mockInterval = setInterval(() => {
      step += Math.ceil(totalSteps / 50); // ~50 ticks to complete
      if (step >= totalSteps) step = totalSteps;

      // Simulate loss decreasing with noise
      const progress = step / totalSteps;
      const baseLoss = 0.15 - progress * 0.08;
      const loss = baseLoss + (Math.random() - 0.5) * 0.02;
      const lr = baseLr * (1 - progress * 0.3); // gentle decay for visual interest

      dispatch(
        updateTrainingProgress({
          id: jobId,
          progress: {
            jobId,
            status: step >= totalSteps ? 'completed' : 'training',
            startedAt,
            completedAt: step >= totalSteps ? Date.now() : null,
            currentStep: step,
            totalSteps,
            currentEpoch: Math.floor(progress * 20) + 1,
            totalEpochs: 20,
            loss: parseFloat(loss.toFixed(4)),
            learningRate: parseFloat(lr.toPrecision(3)),
            etaSeconds:
              step < totalSteps
                ? Math.round(((totalSteps - step) / (totalSteps / 50)) * 0.2)
                : 0,
            sampleImagePaths: [],
            logLines: [],
            error: null,
          },
        }),
      );

      if (step >= totalSteps && mockInterval) {
        clearInterval(mockInterval);
        mockInterval = null;
      }
    }, 200);
  };
}

export function cancelMockTraining(
  jobId?: string,
): (dispatch: AppDispatch) => void {
  return (dispatch) => {
    if (mockInterval) {
      clearInterval(mockInterval);
      mockInterval = null;
    }
    if (jobId) {
      dispatch(removeJob(jobId));
    }
  };
}
