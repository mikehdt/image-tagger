import { useCallback, useMemo, useReducer } from 'react';

import {
  getModelById,
  MODEL_DEFINITIONS,
  type ModelDefinition,
  type TrainingDefaults,
} from '@/app/services/training/models';

// --- Types ---

export type DatasetSource = {
  projectName: string;
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
  weightDecay: number;

  // LoRA Shape
  networkType: 'lora' | 'locon' | 'lokr';
  networkDim: number;
  networkAlpha: number;

  // Performance
  batchSize: number;
  resolution: number[];
  mixedPrecision: 'bf16' | 'fp16';
  gradientAccumulationSteps: number;
  gradientCheckpointing: boolean;
  cacheLatents: boolean;
  captionDropoutRate: number;

  // Sampling
  samplePrompts: string;
  sampleEveryNSteps: number;
  sampleSteps: number;
  seed: number;
  guidanceScale: number;
  noiseScheduler: string;

  // Saving
  saveEveryNEpochs: number;
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
  | { type: 'ADD_DATASET'; projectName: string; folders: DatasetFolder[] }
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
    samplePrompts: '',
    sampleEveryNSteps: defaults.sampleEveryNSteps,
    sampleSteps: defaults.sampleSteps,
    seed: defaults.seed,
    guidanceScale: defaults.guidanceScale,
    noiseScheduler: defaults.noiseScheduler,
    saveEveryNEpochs: defaults.saveEveryNEpochs,
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
            learningRate: defaults.learningRate,
            optimizer: defaults.optimizer,
            scheduler: defaults.scheduler,
            warmupSteps: defaults.warmupSteps,
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
            batchSize: defaults.batchSize,
            resolution: defaults.resolution,
            mixedPrecision: defaults.mixedPrecision,
            gradientAccumulationSteps: defaults.gradientAccumulationSteps,
            gradientCheckpointing: defaults.gradientCheckpointing,
            cacheLatents: defaults.cacheLatents,
            captionDropoutRate: defaults.captionDropoutRate,
          };
        case 'sampling':
          return {
            ...state,
            samplePrompts: '',
            sampleEveryNSteps: defaults.sampleEveryNSteps,
            sampleSteps: defaults.sampleSteps,
            seed: defaults.seed,
            guidanceScale: defaults.guidanceScale,
            noiseScheduler: defaults.noiseScheduler,
          };
        case 'saving':
          return {
            ...state,
            saveEveryNEpochs: defaults.saveEveryNEpochs,
          };
        default:
          return state;
      }
    }

    case 'RESET_ALL': {
      const defaults = getDefaults(state.modelId);
      return defaultsToFormState(defaults, state.modelId);
    }

    case 'ADD_DATASET':
      return {
        ...state,
        datasets: [
          ...state.datasets,
          { projectName: action.projectName, folders: action.folders },
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

  // Calculate effective dataset stats
  const datasetStats = useMemo(() => {
    let totalImages = 0;
    let totalEffective = 0;
    for (const ds of state.datasets) {
      for (const folder of ds.folders) {
        const repeats = folder.overrideRepeats ?? folder.detectedRepeats;
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
        state.warmupSteps !== defaults.warmupSteps ||
        state.weightDecay !== defaults.weightDecay,
      loraShape:
        state.networkDim !== defaults.networkDim ||
        state.networkAlpha !== defaults.networkAlpha ||
        state.networkType !== 'lora',
      performance:
        state.batchSize !== defaults.batchSize ||
        state.mixedPrecision !== defaults.mixedPrecision ||
        state.gradientAccumulationSteps !==
          defaults.gradientAccumulationSteps ||
        state.gradientCheckpointing !== defaults.gradientCheckpointing ||
        state.cacheLatents !== defaults.cacheLatents ||
        state.captionDropoutRate !== defaults.captionDropoutRate,
      sampling:
        state.sampleEveryNSteps !== defaults.sampleEveryNSteps ||
        state.sampleSteps !== defaults.sampleSteps ||
        state.seed !== defaults.seed ||
        state.guidanceScale !== defaults.guidanceScale ||
        state.noiseScheduler !== defaults.noiseScheduler ||
        state.samplePrompts !== '',
      saving: state.saveEveryNEpochs !== defaults.saveEveryNEpochs,
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
    (projectName: string, folders: DatasetFolder[]) => {
      dispatch({ type: 'ADD_DATASET', projectName, folders });
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
  };
}
