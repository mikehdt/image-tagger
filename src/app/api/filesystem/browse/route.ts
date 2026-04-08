import { execFile } from 'child_process';
import { NextResponse } from 'next/server';

type BrowseResult =
  | { path: string; cancelled?: never }
  | { path?: never; cancelled: true };

/**
 * Opens a native OS file dialog and returns the selected path.
 *
 * Query params:
 *   title  — dialog title (optional)
 *   filter — file extension filter, e.g. "safetensors,ckpt,bin" (optional)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') ?? 'Select file';
  const filter = searchParams.get('filter') ?? '';

  try {
    const result = await openFileDialog(title, filter);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function openFileDialog(
  title: string,
  filter: string,
): Promise<BrowseResult> {
  switch (process.platform) {
    case 'win32':
      return openWindows(title, filter);
    case 'darwin':
      return openMacOS(title, filter);
    default:
      return openLinux(title, filter);
  }
}

// --- Windows: PowerShell OpenFileDialog ---

function openWindows(
  title: string,
  filter: string,
): Promise<BrowseResult> {
  const filterString = buildWindowsFilter(filter);
  // -Sta is required for WinForms dialogs
  const script = [
    'Add-Type -AssemblyName System.Windows.Forms',
    '$d = New-Object System.Windows.Forms.OpenFileDialog',
    `$d.Title = '${escapePS(title)}'`,
    `$d.Filter = '${escapePS(filterString)}'`,
    'if ($d.ShowDialog() -eq "OK") { $d.FileName } else { "" }',
  ].join('; ');

  return new Promise((resolve, reject) => {
    execFile(
      'powershell',
      ['-NoProfile', '-Sta', '-Command', script],
      { timeout: 120_000 },
      (error, stdout) => {
        if (error) return reject(error);
        const selected = stdout.trim();
        resolve(selected ? { path: selected } : { cancelled: true });
      },
    );
  });
}

function buildWindowsFilter(filter: string): string {
  if (!filter) return 'All files (*.*)|*.*';
  const exts = filter.split(',').map((e) => e.trim());
  const pattern = exts.map((e) => `*.${e}`).join(';');
  return `Model files (${pattern})|${pattern}|All files (*.*)|*.*`;
}

function escapePS(s: string): string {
  return s.replace(/'/g, "''");
}

// --- macOS: osascript AppleScript ---

function openMacOS(
  title: string,
  filter: string,
): Promise<BrowseResult> {
  const typeClause = filter
    ? ` of type {${filter
        .split(',')
        .map((e) => `"${e.trim()}"`)
        .join(', ')}}`
    : '';

  const script = `choose file with prompt "${escapeAS(title)}"${typeClause}`;

  return new Promise((resolve, reject) => {
    execFile(
      'osascript',
      ['-e', script],
      { timeout: 120_000 },
      (error, stdout) => {
        // Error code 1 = user cancelled
        if (error && 'code' in error && error.code === 1) {
          return resolve({ cancelled: true });
        }
        if (error) return reject(error);
        // osascript returns "alias Macintosh HD:Users:..." — convert to POSIX
        const aliasPath = stdout.trim();
        const posix = aliasPath
          .replace(/^alias /, '')
          .replace(/:/g, '/')
          .replace(/^([^/])/, '/$1');
        resolve(posix ? { path: posix } : { cancelled: true });
      },
    );
  });
}

function escapeAS(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// --- Linux: zenity, with kdialog fallback ---

function openLinux(
  title: string,
  filter: string,
): Promise<BrowseResult> {
  return openZenity(title, filter).catch(() =>
    openKDialog(title, filter),
  );
}

function openZenity(
  title: string,
  filter: string,
): Promise<BrowseResult> {
  const args = ['--file-selection', `--title=${title}`];
  if (filter) {
    const pattern = filter
      .split(',')
      .map((e) => `*.${e.trim()}`)
      .join(' ');
    args.push(`--file-filter=Model files | ${pattern}`, '--file-filter=All files | *');
  }

  return new Promise((resolve, reject) => {
    execFile('zenity', args, { timeout: 120_000 }, (error, stdout) => {
      // zenity exit code 1 = cancelled, 5 = timeout/dismissed
      if (error && 'code' in error && (error.code === 1 || error.code === 5)) {
        return resolve({ cancelled: true });
      }
      if (error) return reject(error);
      const selected = stdout.trim();
      resolve(selected ? { path: selected } : { cancelled: true });
    });
  });
}

function openKDialog(
  title: string,
  filter: string,
): Promise<BrowseResult> {
  const filterArg = filter
    ? filter
        .split(',')
        .map((e) => `*.${e.trim()}`)
        .join(' ')
    : '*';
  const args = ['--getopenfilename', '.', filterArg, '--title', title];

  return new Promise((resolve, reject) => {
    execFile('kdialog', args, { timeout: 120_000 }, (error, stdout) => {
      if (error && 'code' in error && error.code === 1) {
        return resolve({ cancelled: true });
      }
      if (error) return reject(error);
      const selected = stdout.trim();
      resolve(selected ? { path: selected } : { cancelled: true });
    });
  });
}
