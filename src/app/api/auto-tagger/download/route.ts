/**
 * API Route: POST /api/auto-tagger/download
 * Downloads a model with streaming progress updates
 *
 * Uses Server-Sent Events (SSE) to stream download progress to the client
 */

import { NextRequest } from 'next/server';

import { getModel } from '@/app/services/auto-tagger';
import { downloadModel } from '@/app/services/auto-tagger/model-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId } = body;

    if (!modelId) {
      return new Response(JSON.stringify({ error: 'modelId is required' }), {
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

    // Create a readable stream for SSE
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const progress of downloadModel(model)) {
            const data = JSON.stringify(progress);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));

            // If error or complete, close the stream
            if (progress.status === 'error' || progress.status === 'ready') {
              controller.close();
              return;
            }
          }
        } catch (error) {
          const errorData = JSON.stringify({
            modelId,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            bytesDownloaded: 0,
            totalBytes: 0,
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
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
    console.error('Download error:', error);
    return new Response(JSON.stringify({ error: 'Failed to start download' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
