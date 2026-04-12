/**
 * Server-side helpers for reading values from config.json.
 *
 * Server-only — do not import from client components.
 */

import fs from 'fs';
import path from 'path';

function getConfigPath(): string {
  return path.join(process.cwd(), 'config.json');
}

function readConfig(): Record<string, unknown> {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return {};
  }
}

/** Read the user's HuggingFace API token from disk, if set. */
export function getHfToken(): string | null {
  const config = readConfig();
  const token = config.hfToken;
  return typeof token === 'string' && token.trim() !== '' ? token : null;
}
