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
    const epochs = (config.epochs as number) ?? 20;

    // Determine checkpoint step positions from save config
    const saveEnabled = (config.saveEnabled as boolean) ?? false;
    const saveMode = (config.saveMode as string) ?? 'epochs';
    const saveEveryEpochs = (config.saveEveryEpochs as number) ?? 1;
    const saveEverySteps = (config.saveEverySteps as number) ?? 100;
    const stepsPerEpoch = epochs > 0 ? Math.ceil(totalSteps / epochs) : totalSteps;

    const checkpointPositions: number[] = [];
    if (saveEnabled) {
      if (saveMode === 'epochs' && saveEveryEpochs > 0) {
        for (let e = saveEveryEpochs; e <= epochs; e += saveEveryEpochs) {
          checkpointPositions.push(Math.min(e * stepsPerEpoch, totalSteps));
        }
      } else if (saveMode === 'steps' && saveEverySteps > 0) {
        for (let s = saveEverySteps; s <= totalSteps; s += saveEverySteps) {
          checkpointPositions.push(s);
        }
      }
    }

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
            saveEveryNEpochs: saveEveryEpochs,
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
            checkpointSteps: checkpointPositions.filter((s) => s <= step),
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
