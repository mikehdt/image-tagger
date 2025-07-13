import fs from 'node:fs';
import path from 'node:path';

import { NextRequest, NextResponse } from 'next/server';

import { getImageMimeType } from '@/app/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    // Await params before using its properties
    const { path: pathSegments } = await params;

    // Get the project path from query params
    const searchParams = request.nextUrl.searchParams;
    const projectPath = searchParams.get('projectPath');

    if (!projectPath) {
      return new NextResponse('Project path required', { status: 400 });
    }

    // Reconstruct the file path
    const imagePath = path.join(projectPath, ...pathSegments);

    // Security check: ensure the path is within allowed directories
    const resolvedPath = path.resolve(imagePath);
    const resolvedProjectPath = path.resolve(projectPath);

    if (!resolvedPath.startsWith(resolvedProjectPath)) {
      return new NextResponse('Access denied', { status: 403 });
    }

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return new NextResponse('Image not found', { status: 404 });
    }

    // Get file stats for content length
    const stats = fs.statSync(resolvedPath);

    // Determine content type based on file extension
    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = getImageMimeType(ext);

    // Read and return the file
    const fileBuffer = fs.readFileSync(resolvedPath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
