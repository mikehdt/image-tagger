import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

import type { ModelComponentType } from '@/app/services/training/models';

/** Model defaults keyed by model ID (e.g. 'sdxl', 'noob-ai-xl'). */
export type AppModelDefaults = Record<
  string,
  Partial<Record<ModelComponentType, string>>
>;

function getConfigPath() {
  return path.join(process.cwd(), 'config.json');
}

function readConfig(): Record<string, unknown> {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) return {};
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

/** GET — return the current model defaults (or empty object). */
export async function GET() {
  try {
    const config = readConfig();
    const defaults = (config.modelDefaults ?? {}) as AppModelDefaults;
    return NextResponse.json(defaults);
  } catch (error) {
    console.warn('Failed to read model defaults:', error);
    return NextResponse.json({}, { status: 500 });
  }
}

/** POST — merge incoming model defaults into config.json. */
export async function POST(request: Request) {
  try {
    const incoming = (await request.json()) as AppModelDefaults;
    const config = readConfig();
    const existing = (config.modelDefaults ?? {}) as AppModelDefaults;

    // Merge per-model: incoming values overwrite, empty strings remove
    for (const [modelId, components] of Object.entries(incoming)) {
      const merged = { ...existing[modelId] };
      for (const [comp, value] of Object.entries(components ?? {})) {
        if (value) {
          merged[comp as ModelComponentType] = value;
        } else {
          delete merged[comp as ModelComponentType];
        }
      }
      // Remove model entry if empty
      if (Object.keys(merged).length > 0) {
        existing[modelId] = merged;
      } else {
        delete existing[modelId];
      }
    }

    config.modelDefaults = existing;
    fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), 'utf8');
    return NextResponse.json(existing);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
