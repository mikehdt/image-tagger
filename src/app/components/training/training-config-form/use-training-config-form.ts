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
  // Model
  modelId: string;

  // Output
  outputName: string;

  // Dataset
  datasets: DatasetSource[];

  // Training
  durationMode: DurationMode;
  epochs: number;
  steps: number;
  learningRate: number;
  optimizer: string;
  batchSize: number;

  // Network
  networkType: 'lora' | 'locon' | 'lokr';
  networkDim: number;
  networkAlpha: number;

  // Advanced
  scheduler: string;
  warmupSteps: number;
  gradientAccumulationSteps: number;
  mixedPrecision: 'bf16' | 'fp16';
  resolution: number[];

  // Saving & Samples
  saveEveryNEpochs: number;
  sampleEveryNSteps: number;
  samplePrompts: string;
};

type FormAction =
  | { type: 'SET_FIELD'; field: keyof FormState; value: FormState[keyof FormState] }
  | { type: 'SET_MODEL'; modelId: string }
  | { type: 'RESET_SECTION'; section: SectionName }
  | { type: 'RESET_ALL' }
  | { type: 'ADD_DATASET'; projectName: string; folders: DatasetFolder[] }
  | { type: 'REMOVE_DATASET'; index: number }
  | { type: 'SET_FOLDER_REPEATS'; datasetIndex: number; folderName: string; repeats: number | null };

export type SectionName =
  | 'model'
  | 'dataset'
  | 'training'
  | 'network'
  | 'advanced'
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
    batchSize: defaults.batchSize,
    networkType: 'lora',
    networkDim: defaults.networkDim,
    networkAlpha: defaults.networkAlpha,
    scheduler: defaults.scheduler,
    warmupSteps: defaults.warmupSteps,
    gradientAccumulationSteps: defaults.gradientAccumulationSteps,
    mixedPrecision: defaults.mixedPrecision,
    resolution: defaults.resolution,
    saveEveryNEpochs: defaults.saveEveryNEpochs,
    sampleEveryNSteps: defaults.sampleEveryNSteps,
    samplePrompts: '',
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
        case 'training':
          return {
            ...state,
            epochs: defaults.epochs,
            steps: defaults.steps,
            learningRate: defaults.learningRate,
            optimizer: defaults.optimizer,
            batchSize: defaults.batchSize,
          };
        case 'network':
          return {
            ...state,
            networkType: 'lora',
            networkDim: defaults.networkDim,
            networkAlpha: defaults.networkAlpha,
          };
        case 'advanced':
          return {
            ...state,
            scheduler: defaults.scheduler,
            warmupSteps: defaults.warmupSteps,
            gradientAccumulationSteps: defaults.gradientAccumulationSteps,
            mixedPrecision: defaults.mixedPrecision,
            resolution: defaults.resolution,
          };
        case 'saving':
          return {
            ...state,
            saveEveryNEpochs: defaults.saveEveryNEpochs,
            sampleEveryNSteps: defaults.sampleEveryNSteps,
            samplePrompts: '',
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
      model: false, // Model selection is always intentional
      dataset: false, // Dataset selection is always intentional
      training:
        state.learningRate !== defaults.learningRate ||
        state.optimizer !== defaults.optimizer ||
        state.batchSize !== defaults.batchSize ||
        state.epochs !== defaults.epochs,
      network:
        state.networkDim !== defaults.networkDim ||
        state.networkAlpha !== defaults.networkAlpha ||
        state.networkType !== 'lora',
      advanced:
        state.scheduler !== defaults.scheduler ||
        state.warmupSteps !== defaults.warmupSteps ||
        state.gradientAccumulationSteps !==
          defaults.gradientAccumulationSteps ||
        state.mixedPrecision !== defaults.mixedPrecision,
      saving:
        state.saveEveryNEpochs !== defaults.saveEveryNEpochs ||
        state.sampleEveryNSteps !== defaults.sampleEveryNSteps ||
        state.samplePrompts !== '',
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
      dispatch({ type: 'SET_FOLDER_REPEATS', datasetIndex, folderName, repeats });
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
