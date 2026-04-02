import { PlayIcon } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';

import { Button } from '@/app/components/shared/button';
import {
  FIELD_REGISTRY,
  getVisibleFields,
} from '@/app/services/training/field-registry';

import { DatasetSection } from '../sections/dataset-section';
import { LearningSection } from '../sections/learning-section';
import { LoraShapeSection } from '../sections/lora-shape-section';
import { PerformanceSection } from '../sections/performance-section';
import { SamplingSection } from '../sections/sampling-section';
import { SavingSection } from '../sections/saving-section';
import { WhatToTrainSection } from '../sections/what-to-train-section';
import { useTrainingViewMode } from '../use-training-view-mode';
import {
  type SectionName,
  useTrainingConfigForm,
} from './use-training-config-form';

type TrainingConfigFormProps = {
  onStartTraining?: (config: Record<string, unknown>) => void;
};

const TrainingConfigFormComponent = ({
  onStartTraining,
}: TrainingConfigFormProps) => {
  const viewMode = useTrainingViewMode();

  const {
    state,
    currentModel,
    defaults,
    datasetStats,
    calculatedSteps,
    calculatedEpochs,
    sectionHasChanges,
    setField,
    setModel,
    resetSection,
    addDataset,
    removeDataset,
    setFolderRepeats,
    addSamplePrompt,
    removeSamplePrompt,
    setSamplePrompt,
  } = useTrainingConfigForm();

  const visibleFields = useMemo(() => {
    const fields = getVisibleFields(viewMode, state.modelId);
    // Warmup steps are only meaningful for schedulers that use them
    if (state.scheduler === 'constant') fields.delete('warmupSteps');
    // Restarts only apply to cosine_with_restarts
    if (state.scheduler !== 'cosine_with_restarts')
      fields.delete('numRestarts');
    return fields;
  }, [viewMode, state.modelId, state.scheduler]);

  // Compute hidden changes per section
  const hiddenChanges = useMemo(() => {
    const perSection: Partial<Record<SectionName, number>> = {};

    for (const [field, meta] of Object.entries(FIELD_REGISTRY)) {
      if (visibleFields.has(field)) continue;
      if (meta.defaultKey === null) continue;

      const currentValue = state[field as keyof typeof state];
      const defaultValue = defaults[meta.defaultKey];

      // Compare values (handle arrays for resolution)
      const isDifferent =
        Array.isArray(currentValue) && Array.isArray(defaultValue)
          ? JSON.stringify(currentValue) !== JSON.stringify(defaultValue)
          : currentValue !== defaultValue;

      if (isDifferent) {
        const section = meta.group as SectionName;
        perSection[section] = (perSection[section] ?? 0) + 1;
      }
    }

    return perSection;
  }, [state, defaults, visibleFields]);

  const handleStart = useCallback(() => {
    const effectiveSteps =
      state.durationMode === 'epochs' ? calculatedSteps : state.steps;

    onStartTraining?.({
      modelId: state.modelId,
      provider: currentModel.provider,
      outputName: state.outputName,
      datasets: state.datasets,
      steps: effectiveSteps,
      learningRate: state.learningRate,
      optimizer: state.optimizer,
      scheduler: state.scheduler,
      warmupSteps: state.warmupSteps,
      numRestarts: state.numRestarts,
      weightDecay: state.weightDecay,
      batchSize: state.batchSize,
      networkType: state.networkType,
      networkDim: state.networkDim,
      networkAlpha: state.networkAlpha,
      resolution: state.resolution,
      mixedPrecision: state.mixedPrecision,
      gradientAccumulationSteps: state.gradientAccumulationSteps,
      gradientCheckpointing: state.gradientCheckpointing,
      cacheLatents: state.cacheLatents,
      captionDropoutRate: state.captionDropoutRate,
      captionShuffling: state.captionShuffling,
      flipAugment: state.flipAugment,
      seed: state.seed,
      guidanceScale: state.guidanceScale,
      noiseScheduler: state.noiseScheduler,
      sampleSteps: state.sampleSteps,
      saveEnabled: state.saveEnabled,
      saveMode: state.saveMode,
      saveEveryEpochs: state.saveEveryEpochs,
      saveEverySteps: state.saveEverySteps,
      saveFormat: state.saveFormat,
      samplingEnabled: state.samplingEnabled,
      sampleMode: state.sampleMode,
      sampleEveryEpochs: state.sampleEveryEpochs,
      sampleEverySteps: state.sampleEverySteps,
      samplePrompts: state.samplePrompts.map((s) => s.trim()).filter(Boolean),
    });
  }, [state, currentModel, calculatedSteps, onStartTraining]);

  const canStart =
    state.outputName.trim() !== '' && datasetStats.totalImages > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <WhatToTrainSection
        modelId={state.modelId}
        onModelChange={setModel}
        currentModel={currentModel}
        visibleFields={visibleFields}
        hiddenChangesCount={hiddenChanges.whatToTrain}
      />

      <DatasetSection
        datasets={state.datasets}
        totalImages={datasetStats.totalImages}
        totalEffective={datasetStats.totalEffective}
        onAddDataset={addDataset}
        onRemoveDataset={removeDataset}
        onSetFolderRepeats={setFolderRepeats}
      />

      <LearningSection
        durationMode={state.durationMode}
        epochs={state.epochs}
        steps={state.steps}
        learningRate={state.learningRate}
        optimizer={state.optimizer}
        scheduler={state.scheduler}
        warmupSteps={state.warmupSteps}
        numRestarts={state.numRestarts}
        weightDecay={state.weightDecay}
        calculatedSteps={calculatedSteps}
        calculatedEpochs={calculatedEpochs}
        totalEffective={datasetStats.totalEffective}
        batchSize={state.batchSize}
        hasChanges={sectionHasChanges.learning}
        defaults={defaults}
        visibleFields={visibleFields}
        hiddenChangesCount={hiddenChanges.learning}
        viewMode={viewMode}
        onFieldChange={setField}
        onReset={resetSection}
      />

      <LoraShapeSection
        networkType={state.networkType}
        networkDim={state.networkDim}
        networkAlpha={state.networkAlpha}
        hasChanges={sectionHasChanges.loraShape}
        visibleFields={visibleFields}
        hiddenChangesCount={hiddenChanges.loraShape}
        onFieldChange={setField}
        onReset={resetSection}
      />

      <PerformanceSection
        batchSize={state.batchSize}
        resolution={state.resolution}
        availableResolutions={currentModel.availableResolutions}
        provider={currentModel.provider}
        datasets={state.datasets}
        mixedPrecision={state.mixedPrecision}
        gradientAccumulationSteps={state.gradientAccumulationSteps}
        gradientCheckpointing={state.gradientCheckpointing}
        cacheLatents={state.cacheLatents}
        captionDropoutRate={state.captionDropoutRate}
        captionShuffling={state.captionShuffling}
        flipAugment={state.flipAugment}
        hasChanges={sectionHasChanges.performance}
        visibleFields={visibleFields}
        hiddenChangesCount={hiddenChanges.performance}
        onFieldChange={setField}
        onReset={resetSection}
      />

      <SamplingSection
        samplingEnabled={state.samplingEnabled}
        samplePrompts={state.samplePrompts}
        sampleMode={state.sampleMode}
        sampleEveryEpochs={state.sampleEveryEpochs}
        sampleEverySteps={state.sampleEverySteps}
        sampleSteps={state.sampleSteps}
        seed={state.seed}
        guidanceScale={state.guidanceScale}
        noiseScheduler={state.noiseScheduler}
        visibleFields={visibleFields}
        hiddenChangesCount={hiddenChanges.sampling}
        onFieldChange={setField}
        onAddPrompt={addSamplePrompt}
        onRemovePrompt={removeSamplePrompt}
        onSetPrompt={setSamplePrompt}
        onReset={resetSection}
      />

      <SavingSection
        outputName={state.outputName}
        saveEnabled={state.saveEnabled}
        saveMode={state.saveMode}
        saveEveryEpochs={state.saveEveryEpochs}
        saveEverySteps={state.saveEverySteps}
        saveFormat={state.saveFormat}
        visibleFields={visibleFields}
        hiddenChangesCount={hiddenChanges.saving}
        onFieldChange={setField}
        onOutputNameChange={(name) => setField('outputName', name)}
        onReset={resetSection}
      />

      {/* Start */}
      <div className="pt-2">
        <Button size="mediumWide" onClick={handleStart} disabled={!canStart}>
          <PlayIcon className="mr-2 h-4 w-4" />
          Start Training
        </Button>

        {!canStart && (
          <p className="mt-2 text-xs text-slate-400">
            {!state.outputName.trim()
              ? 'Enter an output name to continue'
              : 'Add at least one dataset source to continue'}
          </p>
        )}
      </div>
    </div>
  );
};

export const TrainingConfigForm = memo(TrainingConfigFormComponent);
