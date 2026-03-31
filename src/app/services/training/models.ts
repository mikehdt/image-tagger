/**
 * Model definitions and default hyperparameters for training.
 * This is the single source of truth for what models are available
 * and what their sensible defaults are.
 */

export type ModelArchitecture = 'flux' | 'sdxl' | 'zimage' | 'wan' | 'ltx';

export type ModelDefinition = {
  id: string;
  name: string;
  architecture: ModelArchitecture;
  description: string;
  provider: 'ai-toolkit' | 'kohya';
  defaults: TrainingDefaults;
  /** Optional training tips displayed below the model description */
  tips?: string[];
  /** Fields that are irrelevant for this model (auto-set, not configurable) */
  hiddenFields?: (keyof TrainingDefaults)[];
};

export type TrainingDefaults = {
  steps: number;
  epochs: number;
  learningRate: number;
  optimizer: string;
  scheduler: string;
  warmupSteps: number;
  batchSize: number;
  networkDim: number;
  networkAlpha: number;
  resolution: number[];
  mixedPrecision: 'bf16' | 'fp16';
  gradientAccumulationSteps: number;
  gradientCheckpointing: boolean;
  cacheLatents: boolean;
  weightDecay: number;
  captionDropoutRate: number;
  seed: number;
  saveEveryNEpochs: number;
  sampleEveryNSteps: number;
  noiseScheduler: string;
  guidanceScale: number;
  sampleSteps: number;
};

export const MODEL_DEFINITIONS: ModelDefinition[] = [
  {
    id: 'flux2',
    name: 'Flux.2',
    architecture: 'flux',
    description: 'Latest generation, improved quality and coherence',
    provider: 'ai-toolkit',
    tips: [
      'Constant scheduler with 1e-4 LR works well for most LoRAs',
      'Multi-resolution training (512/768/1024) improves flexibility',
    ],
    hiddenFields: ['noiseScheduler'],
    defaults: {
      steps: 2000,
      epochs: 20,
      learningRate: 1e-4,
      optimizer: 'adamw8bit',
      scheduler: 'constant',
      warmupSteps: 0,
      batchSize: 1,
      networkDim: 16,
      networkAlpha: 16,
      resolution: [512, 768, 1024],
      mixedPrecision: 'bf16',
      gradientAccumulationSteps: 1,
      gradientCheckpointing: true,
      cacheLatents: true,
      weightDecay: 0,
      captionDropoutRate: 0,
      seed: -1,
      saveEveryNEpochs: 1,
      sampleEveryNSteps: 250,
      noiseScheduler: 'flowmatch',
      guidanceScale: 4,
      sampleSteps: 20,
    },
  },
  {
    id: 'flux-dev',
    name: 'Flux.1 Dev',
    architecture: 'flux',
    description: 'Best for photorealistic styles and characters',
    provider: 'ai-toolkit',
    tips: [
      'Constant scheduler with 1e-4 LR is reliable for most use cases',
      'Rank 16 is a good starting point; increase for complex subjects',
    ],
    hiddenFields: ['noiseScheduler'],
    defaults: {
      steps: 2000,
      epochs: 20,
      learningRate: 1e-4,
      optimizer: 'adamw8bit',
      scheduler: 'constant',
      warmupSteps: 0,
      batchSize: 1,
      networkDim: 16,
      networkAlpha: 16,
      resolution: [512, 768, 1024],
      mixedPrecision: 'bf16',
      gradientAccumulationSteps: 1,
      gradientCheckpointing: true,
      cacheLatents: true,
      weightDecay: 0,
      captionDropoutRate: 0,
      seed: -1,
      saveEveryNEpochs: 1,
      sampleEveryNSteps: 250,
      noiseScheduler: 'flowmatch',
      guidanceScale: 4,
      sampleSteps: 20,
    },
  },
  {
    id: 'flux-schnell',
    name: 'Flux.1 Schnell',
    architecture: 'flux',
    description: 'Fast generation, fewer steps needed',
    provider: 'ai-toolkit',
    tips: [
      'Needs fewer training steps than Flux.1 Dev',
      'Uses unconditioned generation (guidance scale 1.0)',
    ],
    hiddenFields: ['noiseScheduler'],
    defaults: {
      steps: 1500,
      epochs: 15,
      learningRate: 1e-4,
      optimizer: 'adamw8bit',
      scheduler: 'constant',
      warmupSteps: 0,
      batchSize: 1,
      networkDim: 16,
      networkAlpha: 16,
      resolution: [512, 768, 1024],
      mixedPrecision: 'bf16',
      gradientAccumulationSteps: 1,
      gradientCheckpointing: true,
      cacheLatents: true,
      weightDecay: 0,
      captionDropoutRate: 0,
      seed: -1,
      saveEveryNEpochs: 1,
      sampleEveryNSteps: 250,
      noiseScheduler: 'flowmatch',
      guidanceScale: 1,
      sampleSteps: 4,
    },
  },
  {
    id: 'sdxl',
    name: 'Stable Diffusion XL',
    architecture: 'sdxl',
    description: 'Mature ecosystem, wide compatibility',
    provider: 'kohya',
    tips: [
      'Cosine scheduler recommended for fine-tuning',
      'Only supports 1024px resolution',
      'Lower alpha (8) helps prevent overfitting',
    ],
    hiddenFields: ['resolution'],
    defaults: {
      steps: 3000,
      epochs: 20,
      learningRate: 1e-4,
      optimizer: 'adamw8bit',
      scheduler: 'cosine',
      warmupSteps: 0,
      batchSize: 1,
      networkDim: 16,
      networkAlpha: 8,
      resolution: [1024],
      mixedPrecision: 'bf16',
      gradientAccumulationSteps: 1,
      gradientCheckpointing: true,
      cacheLatents: true,
      weightDecay: 0,
      captionDropoutRate: 0,
      seed: -1,
      saveEveryNEpochs: 1,
      sampleEveryNSteps: 500,
      noiseScheduler: 'ddpm',
      guidanceScale: 7,
      sampleSteps: 25,
    },
  },
  {
    id: 'zimage-turbo',
    name: 'Z-Image Turbo',
    architecture: 'zimage',
    description: 'Fast, high-quality image generation',
    provider: 'ai-toolkit',
    tips: ['Fewer sample steps needed (8) due to turbo architecture'],
    hiddenFields: ['noiseScheduler'],
    defaults: {
      steps: 2000,
      epochs: 20,
      learningRate: 1e-4,
      optimizer: 'adamw8bit',
      scheduler: 'constant',
      warmupSteps: 0,
      batchSize: 1,
      networkDim: 16,
      networkAlpha: 16,
      resolution: [512, 768, 1024],
      mixedPrecision: 'bf16',
      gradientAccumulationSteps: 1,
      gradientCheckpointing: true,
      cacheLatents: true,
      weightDecay: 0,
      captionDropoutRate: 0,
      seed: -1,
      saveEveryNEpochs: 1,
      sampleEveryNSteps: 250,
      noiseScheduler: 'flowmatch',
      guidanceScale: 4,
      sampleSteps: 8,
    },
  },
  {
    id: 'wan22-14b',
    name: 'Wan 2.2 14B',
    architecture: 'wan',
    description: 'Video/image generation, last open-weights release',
    provider: 'ai-toolkit',
    tips: [
      'Higher rank (32) and learning rate (2e-4) suit this larger model',
      'Supports image-only training via single-frame clips',
    ],
    hiddenFields: ['noiseScheduler'],
    defaults: {
      steps: 2000,
      epochs: 20,
      learningRate: 2e-4,
      optimizer: 'adamw8bit',
      scheduler: 'constant',
      warmupSteps: 0,
      batchSize: 1,
      networkDim: 32,
      networkAlpha: 16,
      resolution: [512, 768],
      mixedPrecision: 'bf16',
      gradientAccumulationSteps: 1,
      gradientCheckpointing: true,
      cacheLatents: true,
      weightDecay: 0,
      captionDropoutRate: 0,
      seed: -1,
      saveEveryNEpochs: 1,
      sampleEveryNSteps: 500,
      noiseScheduler: 'flowmatch',
      guidanceScale: 4,
      sampleSteps: 20,
    },
  },
  {
    id: 'ltx2',
    name: 'LTX-Video 2',
    architecture: 'ltx',
    description: 'Actively evolving open video model',
    provider: 'ai-toolkit',
    tips: [
      'Higher rank (32) recommended for video model capacity',
      'Supports image-only training via single-frame clips',
    ],
    hiddenFields: ['noiseScheduler'],
    defaults: {
      steps: 2000,
      epochs: 20,
      learningRate: 1e-4,
      optimizer: 'adamw8bit',
      scheduler: 'constant',
      warmupSteps: 0,
      batchSize: 1,
      networkDim: 32,
      networkAlpha: 16,
      resolution: [512, 768],
      mixedPrecision: 'bf16',
      gradientAccumulationSteps: 1,
      gradientCheckpointing: true,
      cacheLatents: true,
      weightDecay: 0,
      captionDropoutRate: 0,
      seed: -1,
      saveEveryNEpochs: 1,
      sampleEveryNSteps: 500,
      noiseScheduler: 'flowmatch',
      guidanceScale: 4,
      sampleSteps: 20,
    },
  },
];

export const ARCHITECTURE_LABELS: Record<ModelArchitecture, string> = {
  flux: 'Flux',
  sdxl: 'Stable Diffusion',
  zimage: 'Z-Image',
  wan: 'Wan',
  ltx: 'LTX-Video',
};

export const OPTIMIZER_OPTIONS = [
  {
    group: 'Recommended',
    items: [
      {
        value: 'adamw8bit',
        label: 'AdamW 8-bit',
        hint: 'Good balance of speed and VRAM',
      },
    ],
  },
  {
    group: 'Memory-efficient',
    items: [
      { value: 'adafactor', label: 'Adafactor', hint: 'Lower VRAM usage' },
      {
        value: 'prodigy',
        label: 'Prodigy',
        hint: 'Auto-adjusts learning rate',
      },
    ],
  },
  {
    group: 'Advanced',
    items: [
      { value: 'adamw', label: 'AdamW', hint: 'Standard, more VRAM' },
      { value: 'lion', label: 'Lion', hint: 'Fast convergence' },
      {
        value: 'dadaptation',
        label: 'DAdaptation',
        hint: 'Auto-adjusts learning rate',
      },
    ],
  },
];

export type SchedulerOption = {
  value: string;
  label: string;
  hint: string;
  /** Normalised values 0-1 for the sparkline, 16 points */
  curve: number[];
};

export const SCHEDULER_OPTIONS: SchedulerOption[] = [
  {
    value: 'constant',
    label: 'Constant',
    hint: 'Flat — simple and predictable',
    curve: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  },
  {
    value: 'constant_with_warmup',
    label: 'Constant + Warmup',
    hint: 'Ramp up then flat — good with Prodigy',
    curve: [0.05, 0.15, 0.35, 0.6, 0.85, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  },
  {
    value: 'cosine',
    label: 'Cosine (no restarts)',
    hint: 'Gentle decay — most popular for fine-tuning',
    curve: [
      1, 0.98, 0.93, 0.85, 0.75, 0.63, 0.5, 0.37, 0.25, 0.17, 0.1, 0.06, 0.03,
      0.01, 0.005, 0.002,
    ],
  },
  {
    value: 'cosine_with_restarts',
    label: 'Cosine + Restarts',
    hint: 'Waves — good for longer training',
    curve: [
      1, 0.75, 0.35, 0.05, 0.35, 0.75, 1, 0.75, 0.35, 0.05, 0.35, 0.75, 1, 0.75,
      0.35, 0.05,
    ],
  },
  {
    value: 'linear',
    label: 'Linear',
    hint: 'Steady decrease',
    curve: [
      1, 0.93, 0.87, 0.8, 0.73, 0.67, 0.6, 0.53, 0.47, 0.4, 0.33, 0.27, 0.2,
      0.13, 0.07, 0.01,
    ],
  },
];

export function getModelById(id: string): ModelDefinition | undefined {
  return MODEL_DEFINITIONS.find((m) => m.id === id);
}

export function getModelsByArchitecture(): {
  architecture: ModelArchitecture;
  label: string;
  models: ModelDefinition[];
}[] {
  const groups = new Map<ModelArchitecture, ModelDefinition[]>();
  for (const model of MODEL_DEFINITIONS) {
    const existing = groups.get(model.architecture) ?? [];
    existing.push(model);
    groups.set(model.architecture, existing);
  }
  return Array.from(groups.entries()).map(([arch, models]) => ({
    architecture: arch,
    label: ARCHITECTURE_LABELS[arch],
    models,
  }));
}
