import fs from 'node:fs';
import path from 'node:path';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectName: string }> },
) {
  try {
    const { projectName } = await params;
    const { featured } = await request.json();

    if (typeof featured !== 'boolean') {
      return new NextResponse('Featured must be a boolean', { status: 400 });
    }

    const projectsDir = path.join(process.cwd(), 'public', 'projects');
    const configPath = path.join(projectsDir, `${projectName}.json`);

    // Ensure the projects directory exists
    if (!fs.existsSync(projectsDir)) {
      fs.mkdirSync(projectsDir, { recursive: true });
    }

    let config = {};

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

    // Update the featured status
    const updatedConfig = {
      ...config,
      featured,
    };

    // If featured is false and this is the only property, we could optionally remove the file
    // But for simplicity, we'll just keep it with featured: false
    if (!featured && Object.keys(updatedConfig).length === 1) {
      // If the only property is featured: false, remove the file
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
      }
    } else {
      // Write the updated config
      fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
    }

    return NextResponse.json({ success: true, featured });
  } catch (error) {
    console.error('Error updating project featured status:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
