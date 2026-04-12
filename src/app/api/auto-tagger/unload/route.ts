/**
 * API Route: POST /api/auto-tagger/unload
 * Tell the sidecar to release any cached VLM model from GPU/CPU memory.
 *
 * Fire-and-forget from the UI's perspective — the sidecar's /caption/unload
 * endpoint is idempotent and fast, so we just wait for it and return the
 * result. No job queue interaction; this is a direct passthrough.
 */

import { NextResponse } from 'next/server';

import { ensureSidecar } from '@/app/services/training/sidecar-manager';

export async function POST() {
  try {
    const sidecar = await ensureSidecar();
    if (sidecar.status !== 'ready') {
      return NextResponse.json(
        { error: sidecar.error ?? 'Sidecar not ready' },
        { status: 503 },
      );
    }

    const res = await fetch(`http://127.0.0.1:${sidecar.port}/caption/unload`, {
      method: 'POST',
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      return NextResponse.json(
        { error: body.error ?? `Sidecar returned ${res.status}` },
        { status: res.status },
      );
    }

    return NextResponse.json({ status: 'unloaded' });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to unload model';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
