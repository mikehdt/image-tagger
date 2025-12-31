/**
 * API Route: POST /api/auto-tagger/tag
 * Tag one or more images using a specified model
 */

import { NextRequest, NextResponse } from 'next/server';

import type { TaggerOptions } from '@/app/services/auto-tagger';
import { DEFAULT_TAGGER_OPTIONS, getModel } from '@/app/services/auto-tagger';
import { checkModelStatus } from '@/app/services/auto-tagger/model-manager';
import { tagImage } from '@/app/services/auto-tagger/providers/wd14/inference';

type TagRequest = {
  modelId: string;
  imagePaths: string[];
  options?: Partial<TaggerOptions>;
};

export async function POST(request: NextRequest) {
  try {
    const body: TagRequest = await request.json();
    const { modelId, imagePaths, options: userOptions } = body;

    if (!modelId) {
      return NextResponse.json(
        { error: 'modelId is required' },
        { status: 400 },
      );
    }

    if (!imagePaths || !Array.isArray(imagePaths) || imagePaths.length === 0) {
      return NextResponse.json(
        { error: 'imagePaths array is required' },
        { status: 400 },
      );
    }

    const model = getModel(modelId);
    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    const status = checkModelStatus(model);
    if (status !== 'ready') {
      return NextResponse.json(
        { error: 'Model is not installed', status },
        { status: 400 },
      );
    }

    const options: TaggerOptions = {
      ...DEFAULT_TAGGER_OPTIONS,
      ...userOptions,
    };

    // Process images
    const results: {
      imagePath: string;
      success: boolean;
      tags?: { general: string[]; character: string[]; rating: string };
      error?: string;
    }[] = [];

    for (const imagePath of imagePaths) {
      try {
        const output = await tagImage(model, imagePath, options);

        // Extract just the tag names (sorted by confidence already)
        const generalTags = output.general.map((t) => t.tag);
        const characterTags = output.character.map((t) => t.tag);
        const topRating = output.rating[0]?.tag || 'unknown';

        results.push({
          imagePath,
          success: true,
          tags: {
            general: generalTags,
            character: characterTags,
            rating: topRating,
          },
        });
      } catch (error) {
        results.push({
          imagePath,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Tagging error:', error);
    return NextResponse.json(
      { error: 'Failed to process images' },
      { status: 500 },
    );
  }
}
