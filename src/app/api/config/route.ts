import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

// Configuration interface
interface AppConfig {
  batchSize?: number;
  projectsFolder?: string;
  infoFolder?: string;
}

export async function GET() {
  try {
    const configPath = path.join(process.cwd(), 'config.json');

    if (fs.existsSync(configPath)) {
      const configFile = fs.readFileSync(configPath, 'utf8');
      const config: AppConfig = JSON.parse(configFile);
      return NextResponse.json(config);
    }

    // Return empty config if file doesn't exist
    return NextResponse.json({});
  } catch (error) {
    console.warn('Failed to load config.json:', error);
    return NextResponse.json({}, { status: 500 });
  }
}
