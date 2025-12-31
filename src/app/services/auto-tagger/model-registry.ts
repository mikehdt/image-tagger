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
 * Get a provider by ID
 */
export function getProvider(providerId: string): TaggerProvider | undefined {
  return providers.find((p) => p.id === providerId);
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
 * Get the default model (first model marked as default, or first model overall)
 */
export function getDefaultModel(): TaggerModel {
  for (const provider of providers) {
    const defaultModel = provider.models.find((m) => m.isDefault);
    if (defaultModel) return defaultModel;
  }
  // Fallback to first model of first provider
  return providers[0].models[0];
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

/**
 * Format bytes as human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
