import { PlayIcon } from 'lucide-react';
import { memo, useCallback } from 'react';

import { Button } from '@/app/components/shared/button';

import { AdvancedSection } from '../sections/advanced-section';
import { DatasetSection } from '../sections/dataset-section';
import { ModelSection } from '../sections/model-section';
import { NetworkSection } from '../sections/network-section';
import { SavingSection } from '../sections/saving-section';
import { TrainingSection } from '../sections/training-section';
import { useTrainingConfigForm } from './use-training-config-form';

type TrainingConfigFormProps = {
  onStartTraining?: (config: Record<string, unknown>) => void;
};

const TrainingConfigFormComponent = ({
  onStartTraining,
}: TrainingConfigFormProps) => {
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
  } = useTrainingConfigForm();

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
      batchSize: state.batchSize,
      networkType: state.networkType,
      networkDim: state.networkDim,
      networkAlpha: state.networkAlpha,
      scheduler: state.scheduler,
      warmupSteps: state.warmupSteps,
      gradientAccumulationSteps: state.gradientAccumulationSteps,
      mixedPrecision: state.mixedPrecision,
      resolution: state.resolution,
      saveEveryNEpochs: state.saveEveryNEpochs,
      sampleEveryNSteps: state.sampleEveryNSteps,
      samplePrompts: state.samplePrompts
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    });
  }, [state, currentModel, calculatedSteps, onStartTraining]);

  const canStart =
    state.outputName.trim() !== '' && datasetStats.totalImages > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <ModelSection
        modelId={state.modelId}
        outputName={state.outputName}
        onModelChange={setModel}
        onOutputNameChange={(name) => setField('outputName', name)}
        currentModel={currentModel}
      />

      <DatasetSection
        datasets={state.datasets}
        totalImages={datasetStats.totalImages}
        totalEffective={datasetStats.totalEffective}
        onRemoveDataset={removeDataset}
        onSetFolderRepeats={setFolderRepeats}
      />

      <TrainingSection
        durationMode={state.durationMode}
        epochs={state.epochs}
        steps={state.steps}
        learningRate={state.learningRate}
        optimizer={state.optimizer}
        batchSize={state.batchSize}
        calculatedSteps={calculatedSteps}
        calculatedEpochs={calculatedEpochs}
        totalEffective={datasetStats.totalEffective}
        hasChanges={sectionHasChanges.training}
        defaults={defaults}
        onFieldChange={setField}
        onReset={resetSection}
      />

      <NetworkSection
        networkType={state.networkType}
        networkDim={state.networkDim}
        networkAlpha={state.networkAlpha}
        hasChanges={sectionHasChanges.network}
        onFieldChange={setField}
        onReset={resetSection}
      />

      <AdvancedSection
        scheduler={state.scheduler}
        warmupSteps={state.warmupSteps}
        gradientAccumulationSteps={state.gradientAccumulationSteps}
        mixedPrecision={state.mixedPrecision}
        resolution={state.resolution}
        batchSize={state.batchSize}
        hasChanges={sectionHasChanges.advanced}
        defaults={defaults}
        onFieldChange={setField}
        onReset={resetSection}
      />

      <SavingSection
        saveEveryNEpochs={state.saveEveryNEpochs}
        sampleEveryNSteps={state.sampleEveryNSteps}
        samplePrompts={state.samplePrompts}
        hasChanges={sectionHasChanges.saving}
        onFieldChange={setField}
        onReset={resetSection}
      />

      {/* Start */}
      <div className="pt-2">
        <Button
          size="mediumWide"
          onClick={handleStart}
          disabled={!canStart}
        >
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
