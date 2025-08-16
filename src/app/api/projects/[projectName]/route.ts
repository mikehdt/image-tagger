import fs from 'node:fs';
import path from 'node:path';

import { NextRequest, NextResponse } from 'next/server';

type ProjectConfig = {
  title?: string;
  color?: 'slate' | 'rose' | 'amber' | 'emerald' | 'sky' | 'indigo' | 'stone';
  thumbnail?: boolean;
  featured?: boolean;
  hidden?: boolean;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectName: string }> },
) {
  try {
    const { projectName } = await params;
    const updates: Partial<ProjectConfig> = await request.json();

    // Validate the updates
    if (updates.title !== undefined && typeof updates.title !== 'string') {
      return new NextResponse('Title must be a string', { status: 400 });
    }

    if (updates.color !== undefined) {
      const validColors = [
        'slate',
        'rose',
        'amber',
        'emerald',
        'sky',
        'indigo',
        'stone',
      ];
      if (!validColors.includes(updates.color)) {
        return new NextResponse('Invalid color value', { status: 400 });
      }
    }

    const projectsDir = path.join(process.cwd(), 'public', 'projects');
    const configPath = path.join(projectsDir, `${projectName}.json`);

    // Ensure the projects directory exists
    if (!fs.existsSync(projectsDir)) {
      fs.mkdirSync(projectsDir, { recursive: true });
    }

    let config: ProjectConfig = {};

    // Read existing config if it exists
    if (fs.existsSync(configPath)) {
      try {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        config = JSON.parse(configContent);
      } catch (error) {
        console.error(
          `Error reading existing config for ${projectName}:`,
          error,
        );
        // Continue with empty config if parsing fails
      }
    }

    // Update the config with new values
    const updatedConfig = {
      ...config,
      ...updates,
    };

    // Remove undefined values and empty strings
    Object.keys(updatedConfig).forEach((key) => {
      const value = updatedConfig[key as keyof ProjectConfig];
      if (value === undefined || value === '') {
        delete updatedConfig[key as keyof ProjectConfig];
      }
    });

    // If config is empty, remove the file
    if (Object.keys(updatedConfig).length === 0) {
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
      }
    } else {
      // Write the updated config
      fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
    }

    return NextResponse.json({ success: true, config: updatedConfig });
  } catch (error) {
    console.error('Error updating project config:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
