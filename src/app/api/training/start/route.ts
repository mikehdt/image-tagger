import { NextResponse } from 'next/server';

import { ensureSidecar } from '@/app/services/training/sidecar-manager';

/**
 * POST /api/training/start — Start a training job via the Python sidecar.
 */
export async function POST(request: Request) {
  // Ensure sidecar is running
  const sidecar = await ensureSidecar();
  if (sidecar.status !== 'ready') {
    return NextResponse.json(
      { error: `Sidecar not ready: ${sidecar.error}` },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const res = await fetch(`http://127.0.0.1:${sidecar.port}/jobs/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to start training: ${error}` },
      { status: 500 },
    );
  }
}
