/**
 * API Route: POST /api/model-manager/resolve-repo
 *
 * Queries the HuggingFace API to list files in a repository.
 * Used for custom model downloads where the user provides a repo ID.
 */

import { NextRequest } from 'next/server';

import { getHfToken } from '@/app/services/config/server-config';

type HfFile = {
  rfilename: string;
  size: number;
  blobId: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoId } = body;

    if (!repoId || typeof repoId !== 'string') {
      return Response.json(
        { error: 'repoId is required (e.g. "black-forest-labs/FLUX.1-dev")' },
        { status: 400 },
      );
    }

    // Query HuggingFace API for repository file listing
    const hfToken = getHfToken();
    const response = await fetch(
      `https://huggingface.co/api/models/${encodeURIComponent(repoId)}`,
      {
        headers: {
          Accept: 'application/json',
          ...(hfToken ? { Authorization: `Bearer ${hfToken}` } : {}),
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return Response.json(
          { error: `Repository "${repoId}" not found on HuggingFace` },
          { status: 404 },
        );
      }
      if (response.status === 401 || response.status === 403) {
        return Response.json(
          {
            error: `Access denied. This repo may be gated — accept the license at https://huggingface.co/${repoId}`,
          },
          { status: 403 },
        );
      }
      throw new Error(`HuggingFace API returned ${response.status}`);
    }

    const data = await response.json();

    // Extract file listing — the siblings array contains all files
    const siblings: HfFile[] = data.siblings ?? [];

    // Filter to model files that users would want to download
    const modelExtensions = [
      '.safetensors',
      '.gguf',
      '.bin',
      '.pt',
      '.pth',
      '.onnx',
    ];
    const modelFiles = siblings
      .filter((f) =>
        modelExtensions.some((ext) => f.rfilename.toLowerCase().endsWith(ext)),
      )
      .map((f) => ({
        name: f.rfilename,
        size: f.size ?? 0,
      }))
      .sort((a, b) => b.size - a.size); // Largest first

    return Response.json({
      repoId,
      modelId: data.modelId ?? repoId,
      files: modelFiles,
      totalFiles: siblings.length,
      tags: data.tags ?? [],
      pipelineTag: data.pipeline_tag ?? null,
    });
  } catch (error) {
    console.error('Resolve repo error:', error);
    return Response.json(
      { error: 'Failed to query HuggingFace' },
      { status: 500 },
    );
  }
}
