/**
 * Auto-Tagger Service
 * Main exports for the auto-tagger functionality
 *
 * NOTE: This file only exports types and client-safe utilities.
 * Server-side code (model-manager, providers) should be imported directly
 * in API routes where they are needed.
 */

// Types (safe for both client and server)
export type {
  AutoTaggerSettings,
  DownloadProgress,
  ModelFile,
  ModelStatus,
  TaggerModel,
  TaggerOptions,
  TaggerOutput,
  TaggerProvider,
  TagInsertMode,
  TagResult,
} from './types';
export { DEFAULT_TAGGER_OPTIONS } from './types';

// Model Registry (client-safe utilities - no fs operations)
export {
  formatBytes,
  getAllModels,
  getAllProviders,
  getDefaultModel,
  getModel,
  getModelTotalSize,
  getProvider,
} from './model-registry';

// NOTE: model-manager and providers use Node.js fs module and should only
// be imported in server-side code (API routes). Import them directly:
// import { checkModelStatus, ... } from '@/app/services/auto-tagger/model-manager';
// import { wd14Provider } from '@/app/services/auto-tagger/providers/wd14';
