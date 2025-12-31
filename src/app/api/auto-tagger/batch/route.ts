/**
 * API Route: POST /api/auto-tagger/batch
 * Tag multiple images with streaming progress updates via SSE
 */

import { NextRequest } from 'next/server';
import path from 'path';

import type { TaggerOptions, TagResult } from '@/app/services/auto-tagger';
import { DEFAULT_TAGGER_OPTIONS, getModel } from '@/app/services/auto-tagger';
import { checkModelStatus } from '@/app/services/auto-tagger/model-manager';
import { tagImage } from '@/app/services/auto-tagger/providers/wd14/inference';

type BatchTagRequest = {
  modelId: string;
  projectPath: string;
  assets: { fileId: string; fileExtension: string }[];
  options?: Partial<TaggerOptions>;
};

type BatchProgressEvent = {
  type: 'progress' | 'result' | 'complete' | 'error';
  current?: number;
  total?: number;
  fileId?: string;
  tags?: string[];
  error?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body: BatchTagRequest = await request.json();
    const { modelId, projectPath, assets, options: userOptions } = body;

    // Validation
    if (!modelId) {
      return new Response(JSON.stringify({ error: 'modelId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!projectPath) {
      return new Response(
        JSON.stringify({ error: 'projectPath is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      return new Response(JSON.stringify({ error: 'assets array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const model = getModel(modelId);
    if (!model) {
      return new Response(JSON.stringify({ error: 'Model not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const status = checkModelStatus(model);
    if (status !== 'ready') {
      return new Response(
        JSON.stringify({ error: 'Model is not installed', status }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const options: TaggerOptions = {
      ...DEFAULT_TAGGER_OPTIONS,
      ...userOptions,
    };

    // Create SSE stream
    const encoder = new TextEncoder();
    const total = assets.length;

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: BatchProgressEvent) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };

        try {
          for (let i = 0; i < assets.length; i++) {
            const asset = assets[i];
            const imagePath = path.join(
              projectPath,
              `${asset.fileId}${asset.fileExtension}`,
            );

            // Send progress update
            sendEvent({
              type: 'progress',
              current: i + 1,
              total,
              fileId: asset.fileId,
            });

            try {
              const output = await tagImage(model, imagePath, options);

              // Combine tags based on options
              const allTags: TagResult[] = [];

              // Always include general tags
              allTags.push(...output.general);

              // Include character tags if enabled
              if (options.includeCharacterTags) {
                allTags.push(...output.character);
              }

              // Include rating tags if enabled
              if (options.includeRatingTags && output.rating.length > 0) {
                // Just include the top rating
                allTags.push(output.rating[0]);
              }

              // Add includeTags (always-add tags) with high confidence
              const includedTags = (options.includeTags || []).map((tag) => ({
                tag,
                confidence: 1.0,
              }));
              allTags.push(...includedTags);

              // Sort and extract tag names based on insert mode
              let tagNames: string[];
              if (options.tagInsertMode === 'confidence') {
                // Sort by confidence descending
                allTags.sort((a, b) => b.confidence - a.confidence);
                tagNames = allTags.map((t) => t.tag);
              } else {
                // For prepend/append, keep model's confidence order
                tagNames = allTags.map((t) => t.tag);
              }

              // Remove duplicates while preserving order
              tagNames = [...new Set(tagNames)];

              sendEvent({
                type: 'result',
                fileId: asset.fileId,
                tags: tagNames,
              });
            } catch (err) {
              sendEvent({
                type: 'error',
                fileId: asset.fileId,
                error: err instanceof Error ? err.message : 'Unknown error',
              });
            }
          }

          // Send completion event
          sendEvent({ type: 'complete', total });
          controller.close();
        } catch (err) {
          sendEvent({
            type: 'error',
            error: err instanceof Error ? err.message : 'Batch processing failed',
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Batch tagging error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to start batch tagging' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
