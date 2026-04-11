import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

// Configuration interface
interface AppConfig {
  batchSize?: number;
  projectsFolder?: string;
  infoFolder?: string;
  modelsFolder?: string;
}

function getConfigPath() {
  return path.join(process.cwd(), 'config.json');
}

function readConfig(): Record<string, unknown> {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) return {};
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

export async function GET() {
  try {
    const config = readConfig() as AppConfig;
    return NextResponse.json(config);
  } catch (error) {
    console.warn('Failed to load config.json:', error);
    return NextResponse.json({}, { status: 500 });
  }
}

/** POST — update top-level config fields (currently only projectsFolder). */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<AppConfig>;
    const config = readConfig();

    if (body.projectsFolder !== undefined) {
      const folder = body.projectsFolder.trim();

      if (!folder) {
        return NextResponse.json(
          { error: 'Projects folder path cannot be empty' },
          { status: 400 },
        );
      }

      // Verify the folder exists on disk
      if (!fs.existsSync(folder)) {
        return NextResponse.json(
          { error: `Folder does not exist: ${folder}` },
          { status: 400 },
        );
      }

      config.projectsFolder = folder;
    }

    fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), 'utf8');
    return NextResponse.json(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
