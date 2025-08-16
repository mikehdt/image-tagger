import fs from 'node:fs';
import path from 'node:path';

import { NextRequest, NextResponse } from 'next/server';

import { getImageMimeType } from '@/app/constants';

// Server-side config reading function
const getServerConfig = () => {
  try {
    const configPath = path.join(process.cwd(), 'config.json');
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      return {
        projectsFolder: config.projectsFolder || 'public/assets',
        infoFolder: config.infoFolder || '_info',
      };
    }
  } catch (error) {
    console.warn('Failed to read server config:', error);
  }

  // Return defaults if config reading fails
  return {
    projectsFolder: 'public/assets',
    infoFolder: '_info',
  };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    // Await params before using its properties
    const { path: pathSegments } = await params;

    // Get parameters from query params - support both old (projectPath) and new (projectName) formats
    const searchParams = request.nextUrl.searchParams;
    const projectPath = searchParams.get('projectPath');
    const projectName = searchParams.get('projectName');

    let fullProjectPath: string;

    if (projectName) {
      // New format: reconstruct full path from project name and config
      const config = getServerConfig();
      fullProjectPath = path.join(config.projectsFolder, projectName);
    } else if (projectPath) {
      // Legacy format: use the full path directly
      fullProjectPath = projectPath;
    } else {
      return new NextResponse('Project name or path required', { status: 400 });
    }

    // Reconstruct the file path for regular assets
    const imagePath = path.join(fullProjectPath, ...pathSegments);

    // Security check: ensure the path is within allowed directories
    const resolvedPath = path.resolve(imagePath);
    const resolvedBasePath = path.resolve(fullProjectPath);

    if (!resolvedPath.startsWith(resolvedBasePath)) {
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
