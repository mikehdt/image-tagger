/**
 * Model Registry
 * Central registry of all available tagger providers and models
 */

import { wd14Provider } from './providers/wd14';
import type { TaggerModel, TaggerProvider } from './types';

// Register all providers here
const providers: TaggerProvider[] = [
  wd14Provider,
  // Future: blip2Provider, etc.
];

/**
 * Get all registered providers
 */
export function getAllProviders(): TaggerProvider[] {
  return providers;
}

/**
 * Get a model by its ID (searches across all providers)
 */
export function getModel(modelId: string): TaggerModel | undefined {
  for (const provider of providers) {
    const model = provider.models.find((m) => m.id === modelId);
    if (model) return model;
  }
  return undefined;
}

/**
 * Get all models from all providers as a flat list
 */
export function getAllModels(): TaggerModel[] {
  return providers.flatMap((p) => p.models);
}

/**
 * Calculate total download size for a model
 */
export function getModelTotalSize(model: TaggerModel): number {
  return model.files.reduce((sum, file) => sum + file.size, 0);
}
