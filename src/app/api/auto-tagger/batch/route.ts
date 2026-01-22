/**
 * API Route: POST /api/auto-tagger/batch
 * Tag multiple images with streaming progress updates via SSE
 */

import fs from 'fs';
import { NextRequest } from 'next/server';
import path from 'path';

import type { TaggerOptions, TagResult } from '@/app/services/auto-tagger';
import { DEFAULT_TAGGER_OPTIONS, getModel } from '@/app/services/auto-tagger';
import { checkModelStatus } from '@/app/services/auto-tagger/model-manager';
import { tagImage } from '@/app/services/auto-tagger/providers/wd14/inference';

// Server-side config reading function
const getServerConfig = () => {
  try {
    const configPath = path.join(process.cwd(), 'config.json');
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      return {
        projectsFolder: config.projectsFolder || 'public/assets',
      };
    }
  } catch (error) {
    console.warn('Failed to read server config:', error);
  }
  return {
    projectsFolder: 'public/assets',
  };
};

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
    const {
      modelId,
      projectPath: rawProjectPath,
      assets,
      options: userOptions,
    } = body;

    // Resolve to absolute path
    // The projectPath from client could be:
    // 1. An absolute path (e.g., "C:\images\project")
    // 2. A path relative to cwd (e.g., "public/assets/project")
    // 3. Just the project folder name if config uses an absolute projectsFolder
    let projectPath: string;
    if (path.isAbsolute(rawProjectPath)) {
      projectPath = rawProjectPath;
    } else {
      // Check if the path exists as-is (relative to cwd)
      const resolvedPath = path.resolve(rawProjectPath);
      if (fs.existsSync(resolvedPath)) {
        projectPath = resolvedPath;
      } else {
        // Try with the configured projects folder
        const config = getServerConfig();
        projectPath = path.resolve(
          path.join(config.projectsFolder, rawProjectPath),
        );
      }
    }

    // Validation
    if (!modelId) {
      return new Response(JSON.stringify({ error: 'modelId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!rawProjectPath) {
      return new Response(
        JSON.stringify({ error: 'projectPath is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      return new Response(
        JSON.stringify({ error: 'assets array is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
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
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          );
        };

        try {
          for (let i = 0; i < assets.length; i++) {
            const asset = assets[i];
            const imagePath = path.join(
              projectPath,
              `${asset.fileId}.${asset.fileExtension}`,
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

              // Sort by confidence descending and extract tag names
              allTags.sort((a, b) => b.confidence - a.confidence);
              let tagNames = allTags.map((t) => t.tag);

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
            error:
              err instanceof Error ? err.message : 'Batch processing failed',
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
