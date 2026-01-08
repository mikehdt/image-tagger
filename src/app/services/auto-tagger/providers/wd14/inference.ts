/**
 * WD14 ONNX Inference
 * Runs inference using onnxruntime-node
 */

import fs from 'fs';
import * as ort from 'onnxruntime-node';
import path from 'path';

import { getModelFilePath } from '../../model-manager';
import type {
  TaggerModel,
  TaggerOptions,
  TaggerOutput,
  TagResult,
} from '../../types';
import { IMAGE_SIZE, preprocessImage } from './preprocessing';

// Cache for loaded sessions to avoid reloading
const sessionCache = new Map<string, ort.InferenceSession>();

// Cache for tag labels
const tagLabelCache = new Map<string, TagLabels>();

type TagLabels = {
  names: string[];
  ratingIndices: number[];
  generalIndices: number[];
  characterIndices: number[];
};

/**
 * Parse the selected_tags.csv file to get tag labels and category indices
 */
async function loadTagLabels(model: TaggerModel): Promise<TagLabels> {
  const cached = tagLabelCache.get(model.id);
  if (cached) return cached;

  const csvPath = getModelFilePath(model, 'selected_tags.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.trim().split('\n');

  // Skip header row
  // The model output index corresponds to the row order in the CSV (0-indexed, after header)
  // tag_id column is NOT the model output index - it's just a reference ID
  const names: string[] = [];
  const ratingIndices: number[] = [];
  const generalIndices: number[] = [];
  const characterIndices: number[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 3) {
      // Model output index is (row number - 1) since we skip header
      const modelIndex = i - 1;
      const name = parts[1];
      const category = parseInt(parts[2], 10);

      // Store name at the model output index
      names[modelIndex] = name;

      // Categories: 0 = general, 4 = character, 9 = rating
      switch (category) {
        case 0:
          generalIndices.push(modelIndex);
          break;
        case 4:
          characterIndices.push(modelIndex);
          break;
        case 9:
          ratingIndices.push(modelIndex);
          break;
      }
    }
  }

  const labels: TagLabels = {
    names,
    ratingIndices,
    generalIndices,
    characterIndices,
  };
  tagLabelCache.set(model.id, labels);
  return labels;
}

/**
 * Get or create an ONNX inference session for a model
 */
async function getSession(model: TaggerModel): Promise<ort.InferenceSession> {
  const cached = sessionCache.get(model.id);
  if (cached) return cached;

  const modelPath = getModelFilePath(model, 'model.onnx');

  if (!fs.existsSync(modelPath)) {
    throw new Error(`Model file not found: ${modelPath}`);
  }

  const session = await ort.InferenceSession.create(modelPath, {
    executionProviders: ['cpu'], // Could add 'cuda' or 'dml' for GPU
  });

  sessionCache.set(model.id, session);
  return session;
}

/**
 * Run inference on a single image
 */
export async function tagImage(
  model: TaggerModel,
  imagePath: string,
  options: TaggerOptions,
): Promise<TaggerOutput> {
  const session = await getSession(model);
  const labels = await loadTagLabels(model);

  // Preprocess image
  const imageData = await preprocessImage(imagePath);

  // Create input tensor - NHWC format [1, 448, 448, 3]
  const inputTensor = new ort.Tensor('float32', imageData, [
    1,
    IMAGE_SIZE,
    IMAGE_SIZE,
    3,
  ]);

  // Get input name from model
  const inputName = session.inputNames[0];

  // Run inference
  const results = await session.run({ [inputName]: inputTensor });

  // Get output tensor
  const outputName = session.outputNames[0];
  const output = results[outputName];
  const probabilities = output.data as Float32Array;

  // Process results by category
  const rating = processRating(probabilities, labels);
  const general = processGeneral(probabilities, labels, options);
  const character = processCharacter(probabilities, labels, options);

  return { rating, general, character };
}

/**
 * Process rating tags (first 4 indices typically)
 */
function processRating(
  probabilities: Float32Array,
  labels: TagLabels,
): TagResult[] {
  const results: TagResult[] = [];

  for (const idx of labels.ratingIndices) {
    if (idx < probabilities.length) {
      results.push({
        tag: labels.names[idx],
        confidence: probabilities[idx],
      });
    }
  }

  // Sort by confidence descending
  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Process general tags with threshold
 */
function processGeneral(
  probabilities: Float32Array,
  labels: TagLabels,
  options: TaggerOptions,
): TagResult[] {
  const results: TagResult[] = [];
  const excludeSet = new Set(options.excludeTags || []);

  for (const idx of labels.generalIndices) {
    if (
      idx < probabilities.length &&
      probabilities[idx] >= options.generalThreshold
    ) {
      let tag = labels.names[idx];

      if (options.removeUnderscore) {
        tag = tag.replace(/_/g, ' ');
      }

      if (!excludeSet.has(tag)) {
        results.push({
          tag,
          confidence: probabilities[idx],
        });
      }
    }
  }

  // Sort by confidence descending
  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Process character tags with threshold
 */
function processCharacter(
  probabilities: Float32Array,
  labels: TagLabels,
  options: TaggerOptions,
): TagResult[] {
  const results: TagResult[] = [];
  const excludeSet = new Set(options.excludeTags || []);

  for (const idx of labels.characterIndices) {
    if (
      idx < probabilities.length &&
      probabilities[idx] >= options.characterThreshold
    ) {
      let tag = labels.names[idx];

      if (options.removeUnderscore) {
        tag = tag.replace(/_/g, ' ');
      }

      if (!excludeSet.has(tag)) {
        results.push({
          tag,
          confidence: probabilities[idx],
        });
      }
    }
  }

  // Sort by confidence descending
  return results.sort((a, b) => b.confidence - a.confidence);
}
