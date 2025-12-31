/**
 * API Route: GET /api/auto-tagger/models
 * Returns list of available models and their installation status
 */

import { NextResponse } from 'next/server';

import {
  getAllModels,
  getAllProviders,
  getModelTotalSize,
} from '@/app/services/auto-tagger';
import { checkModelStatus } from '@/app/services/auto-tagger/model-manager';

export async function GET() {
  try {
    const providers = getAllProviders().map((provider) => ({
      id: provider.id,
      name: provider.name,
      description: provider.description,
    }));

    const models = getAllModels().map((model) => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      description: model.description,
      isDefault: model.isDefault,
      totalSize: getModelTotalSize(model),
      status: checkModelStatus(model),
    }));

    return NextResponse.json({ providers, models });
  } catch (error) {
    console.error('Failed to get models:', error);
    return NextResponse.json(
      { error: 'Failed to get models' },
      { status: 500 },
    );
  }
}
