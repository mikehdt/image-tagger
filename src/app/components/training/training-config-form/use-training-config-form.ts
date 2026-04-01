import { useCallback, useMemo, useReducer } from 'react';

import {
  getModelById,
  MODEL_DEFINITIONS,
  type ModelDefinition,
  type TrainingDefaults,
} from '@/app/services/training/models';

// --- Types ---

export type DatasetSource = {
  /** Display name (title or folder name) */
  projectName: string;
  /** Disk folder name — unique identifier */
  folderName: string;
  /** Thumbnail path for display (e.g. "projectname.png") */
  thumbnail?: string;
  thumbnailVersion?: number;
  /** Image dimension histogram, e.g. { "1920x1080": 15 } */
  dimensionHistogram?: Record<string, number>;
  folders: DatasetFolder[];
};

export type DatasetFolder = {
  name: string;
  imageCount: number;
  detectedRepeats: number;
  overrideRepeats: number | null; // null = use detected
};

export type DurationMode = 'epochs' | 'steps';

export type FormState = {
  // What to Train
  modelId: string;
  outputName: string;
  datasets: DatasetSource[];

  // Learning
  durationMode: DurationMode;
  epochs: number;
  steps: number;
  learningRate: number;
  optimizer: string;
  scheduler: string;
  warmupSteps: number;
  numRestarts: number;
  weightDecay: number;

  // LoRA Shape
  networkType: 'lora' | 'lokr';
  networkDim: number;
  networkAlpha: number;

  // Performance
  batchSize: number;
  resolution: number[];
  mixedPrecision: 'bf16' | 'fp16' | 'fp8';
  gradientAccumulationSteps: number;
  gradientCheckpointing: boolean;
  cacheLatents: boolean;
  captionDropoutRate: number;
  captionShuffling: boolean;
  flipAugment: boolean;

  // Sampling
  samplingEnabled: boolean;
  samplePrompts: string[];
  sampleMode: 'epochs' | 'steps';
  sampleEveryEpochs: number;
  sampleEverySteps: number;
  sampleSteps: number;
  seed: number;
  guidanceScale: number;
  noiseScheduler: string;

  // Saving
  saveEnabled: boolean;
  saveMode: 'epochs' | 'steps';
  saveEveryEpochs: number;
  saveEverySteps: number;
  saveFormat: 'fp16' | 'bf16' | 'fp32';
};

type FormAction =
  | {
      type: 'SET_FIELD';
      field: keyof FormState;
      value: FormState[keyof FormState];
    }
  | { type: 'SET_MODEL'; modelId: string }
  | { type: 'RESET_SECTION'; section: SectionName }
  | { type: 'RESET_ALL' }
  | { type: 'ADD_SAMPLE_PROMPT' }
  | { type: 'REMOVE_SAMPLE_PROMPT'; index: number }
  | { type: 'SET_SAMPLE_PROMPT'; index: number; value: string }
  | { type: 'ADD_DATASET'; folderName: string; displayName: string; thumbnail?: string; thumbnailVersion?: number; dimensionHistogram?: Record<string, number>; folders: DatasetFolder[] }
  | { type: 'REMOVE_DATASET'; index: number }
  | {
      type: 'SET_FOLDER_REPEATS';
      datasetIndex: number;
      folderName: string;
      repeats: number | null;
    };

export type SectionName =
  | 'whatToTrain'
  | 'learning'
  | 'loraShape'
  | 'performance'
  | 'sampling'
  | 'saving';

// --- Helpers ---

function defaultsToFormState(
  defaults: TrainingDefaults,
  modelId: string,
): FormState {
  return {
    modelId,
    outputName: '',
    datasets: [],
    durationMode: 'epochs',
    epochs: defaults.epochs,
    steps: defaults.steps,
    learningRate: defaults.learningRate,
    optimizer: defaults.optimizer,
    scheduler: defaults.scheduler,
    warmupSteps: defaults.warmupSteps,
    numRestarts: defaults.numRestarts,
    weightDecay: defaults.weightDecay,
    networkType: 'lora',
    networkDim: defaults.networkDim,
    networkAlpha: defaults.networkAlpha,
    batchSize: defaults.batchSize,
    resolution: defaults.resolution,
    mixedPrecision: defaults.mixedPrecision,
    gradientAccumulationSteps: defaults.gradientAccumulationSteps,
    gradientCheckpointing: defaults.gradientCheckpointing,
    cacheLatents: defaults.cacheLatents,
    captionDropoutRate: defaults.captionDropoutRate,
    captionShuffling: defaults.captionShuffling,
    flipAugment: defaults.flipAugment,
    samplingEnabled: false,
    samplePrompts: [''],
    sampleMode: 'steps',
    sampleEveryEpochs: 1,
    sampleEverySteps: defaults.sampleEvery,
    sampleSteps: defaults.sampleSteps,
    seed: defaults.seed,
    guidanceScale: defaults.guidanceScale,
    noiseScheduler: defaults.noiseScheduler,
    saveEnabled: false,
    saveMode: 'epochs',
    saveEveryEpochs: defaults.saveEvery,
    saveEverySteps: 250,
    saveFormat: defaults.saveFormat,
  };
}

function getDefaults(modelId: string): TrainingDefaults {
  const model = getModelById(modelId);
  return model?.defaults ?? MODEL_DEFINITIONS[0].defaults;
}

// --- Reducer ---

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };

    case 'SET_MODEL': {
      const defaults = getDefaults(action.modelId);
      return {
        ...defaultsToFormState(defaults, action.modelId),
        // Preserve user's dataset and output choices
        outputName: state.outputName,
        datasets: state.datasets,
        samplePrompts: state.samplePrompts,
      };
    }

    case 'RESET_SECTION': {
      const defaults = getDefaults(state.modelId);
      switch (action.section) {
        case 'learning':
          return {
            ...state,
            durationMode: 'epochs',
            epochs: defaults.epochs,
            steps: defaults.steps,
            batchSize: defaults.batchSize,
            learningRate: defaults.learningRate,
            optimizer: defaults.optimizer,
            scheduler: defaults.scheduler,
            warmupSteps: defaults.warmupSteps,
            numRestarts: defaults.numRestarts,
            weightDecay: defaults.weightDecay,
          };
        case 'loraShape':
          return {
            ...state,
            networkType: 'lora',
            networkDim: defaults.networkDim,
            networkAlpha: defaults.networkAlpha,
          };
        case 'performance':
          return {
            ...state,
            resolution: defaults.resolution,
            mixedPrecision: defaults.mixedPrecision,
            gradientAccumulationSteps: defaults.gradientAccumulationSteps,
            gradientCheckpointing: defaults.gradientCheckpointing,
            cacheLatents: defaults.cacheLatents,
            captionDropoutRate: defaults.captionDropoutRate,
            captionShuffling: defaults.captionShuffling,
            flipAugment: defaults.flipAugment,
          };
        case 'sampling':
          return {
            ...state,
            samplingEnabled: false,
            samplePrompts: [''],
            sampleMode: 'steps' as const,
            sampleEveryEpochs: 1,
            sampleEverySteps: defaults.sampleEvery,
            sampleSteps: defaults.sampleSteps,
            seed: defaults.seed,
            guidanceScale: defaults.guidanceScale,
            noiseScheduler: defaults.noiseScheduler,
          };
        case 'saving':
          return {
            ...state,
            saveEnabled: false,
            saveMode: 'epochs' as const,
            saveEveryEpochs: defaults.saveEvery,
            saveEverySteps: 250,
            saveFormat: defaults.saveFormat,
          };
        default:
          return state;
      }
    }

    case 'RESET_ALL': {
      const defaults = getDefaults(state.modelId);
      return defaultsToFormState(defaults, state.modelId);
    }

    case 'ADD_SAMPLE_PROMPT':
      return {
        ...state,
        samplePrompts: [...state.samplePrompts, ''],
      };

    case 'REMOVE_SAMPLE_PROMPT': {
      const prompts = state.samplePrompts.filter(
        (_, i) => i !== action.index,
      );
      return {
        ...state,
        samplePrompts: prompts.length === 0 ? [''] : prompts,
      };
    }

    case 'SET_SAMPLE_PROMPT': {
      const prompts = [...state.samplePrompts];
      prompts[action.index] = action.value;
      return { ...state, samplePrompts: prompts };
    }

    case 'ADD_DATASET':
      return {
        ...state,
        datasets: [
          ...state.datasets,
          {
            projectName: action.displayName,
            folderName: action.folderName,
            thumbnail: action.thumbnail,
            thumbnailVersion: action.thumbnailVersion,
            dimensionHistogram: action.dimensionHistogram,
            folders: action.folders,
          },
        ],
      };

    case 'REMOVE_DATASET':
      return {
        ...state,
        datasets: state.datasets.filter((_, i) => i !== action.index),
      };

    case 'SET_FOLDER_REPEATS': {
      const newDatasets = [...state.datasets];
      const ds = newDatasets[action.datasetIndex];
      if (ds) {
        newDatasets[action.datasetIndex] = {
          ...ds,
          folders: ds.folders.map((f) =>
            f.name === action.folderName
              ? { ...f, overrideRepeats: action.repeats }
              : f,
          ),
        };
      }
      return { ...state, datasets: newDatasets };
    }

    default:
      return state;
  }
}

// --- Hook ---

export function useTrainingConfigForm() {
  const initialModel = MODEL_DEFINITIONS[0];
  const [state, dispatch] = useReducer(
    formReducer,
    defaultsToFormState(initialModel.defaults, initialModel.id),
  );

  const currentModel = useMemo(
    () => getModelById(state.modelId),
    [state.modelId],
  );

  const defaults = useMemo(() => getDefaults(state.modelId), [state.modelId]);

  // Calculate effective dataset stats (folders with 0 repeats are excluded)
  const datasetStats = useMemo(() => {
    let totalImages = 0;
    let totalEffective = 0;
    for (const ds of state.datasets) {
      for (const folder of ds.folders) {
        const repeats = folder.overrideRepeats ?? folder.detectedRepeats;
        if (repeats === 0) continue;
        totalImages += folder.imageCount;
        totalEffective += folder.imageCount * repeats;
      }
    }
    return { totalImages, totalEffective };
  }, [state.datasets]);

  // Calculate steps from epochs or vice versa
  const calculatedSteps = useMemo(() => {
    if (datasetStats.totalEffective === 0) return 0;
    if (state.durationMode === 'epochs') {
      return Math.ceil(
        (datasetStats.totalEffective * state.epochs) / state.batchSize,
      );
    }
    return state.steps;
  }, [
    state.durationMode,
    state.epochs,
    state.steps,
    state.batchSize,
    datasetStats.totalEffective,
  ]);

  const calculatedEpochs = useMemo(() => {
    if (datasetStats.totalEffective === 0) return 0;
    if (state.durationMode === 'steps') {
      return Math.floor(
        (state.steps * state.batchSize) / datasetStats.totalEffective,
      );
    }
    return state.epochs;
  }, [
    state.durationMode,
    state.epochs,
    state.steps,
    state.batchSize,
    datasetStats.totalEffective,
  ]);

  // Check which sections have been modified from defaults
  const sectionHasChanges = useMemo(
    () => ({
      whatToTrain: false, // Model/dataset selection is always intentional
      learning:
        state.learningRate !== defaults.learningRate ||
        state.optimizer !== defaults.optimizer ||
        state.scheduler !== defaults.scheduler ||
        state.epochs !== defaults.epochs ||
        state.batchSize !== defaults.batchSize ||
        state.warmupSteps !== defaults.warmupSteps ||
        state.numRestarts !== defaults.numRestarts ||
        state.weightDecay !== defaults.weightDecay,
      loraShape:
        state.networkDim !== defaults.networkDim ||
        state.networkAlpha !== defaults.networkAlpha ||
        state.networkType !== 'lora',
      performance:
        state.mixedPrecision !== defaults.mixedPrecision ||
        state.gradientAccumulationSteps !==
          defaults.gradientAccumulationSteps ||
        state.gradientCheckpointing !== defaults.gradientCheckpointing ||
        state.cacheLatents !== defaults.cacheLatents ||
        state.captionDropoutRate !== defaults.captionDropoutRate ||
        state.captionShuffling !== defaults.captionShuffling ||
        state.flipAugment !== defaults.flipAugment,
      sampling: false, // Sampling is opt-in, not compared to defaults
      saving: false, // Saving is opt-in, not compared to defaults
    }),
    [state, defaults],
  );

  // Actions
  const setField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      dispatch({ type: 'SET_FIELD', field, value });
    },
    [],
  );

  const setModel = useCallback((modelId: string) => {
    dispatch({ type: 'SET_MODEL', modelId });
  }, []);

  const resetSection = useCallback((section: SectionName) => {
    dispatch({ type: 'RESET_SECTION', section });
  }, []);

  const resetAll = useCallback(() => {
    dispatch({ type: 'RESET_ALL' });
  }, []);

  const addDataset = useCallback(
    (
      folderName: string,
      displayName: string,
      folders: DatasetFolder[],
      thumbnail?: string,
      thumbnailVersion?: number,
      dimensionHistogram?: Record<string, number>,
    ) => {
      dispatch({
        type: 'ADD_DATASET',
        folderName,
        displayName,
        folders,
        thumbnail,
        thumbnailVersion,
        dimensionHistogram,
      });
    },
    [],
  );

  const removeDataset = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_DATASET', index });
  }, []);

  const setFolderRepeats = useCallback(
    (datasetIndex: number, folderName: string, repeats: number | null) => {
      dispatch({
        type: 'SET_FOLDER_REPEATS',
        datasetIndex,
        folderName,
        repeats,
      });
    },
    [],
  );

  const addSamplePrompt = useCallback(() => {
    dispatch({ type: 'ADD_SAMPLE_PROMPT' });
  }, []);

  const removeSamplePrompt = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_SAMPLE_PROMPT', index });
  }, []);

  const setSamplePrompt = useCallback((index: number, value: string) => {
    dispatch({ type: 'SET_SAMPLE_PROMPT', index, value });
  }, []);

  return {
    state,
    currentModel: currentModel as ModelDefinition,
    defaults,
    datasetStats,
    calculatedSteps,
    calculatedEpochs,
    sectionHasChanges,
    setField,
    setModel,
    resetSection,
    resetAll,
    addDataset,
    removeDataset,
    setFolderRepeats,
    addSamplePrompt,
    removeSamplePrompt,
    setSamplePrompt,
  };
}
