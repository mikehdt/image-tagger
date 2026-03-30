import { NextResponse } from 'next/server';

import { ensureSidecar } from '@/app/services/training/sidecar-manager';

/**
 * POST /api/training/cancel — Cancel the active training job.
 */
export async function POST() {
  const sidecar = await ensureSidecar();
  if (sidecar.status !== 'ready') {
    return NextResponse.json(
      { error: `Sidecar not ready: ${sidecar.error}` },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(`http://127.0.0.1:${sidecar.port}/jobs/cancel`, {
      method: 'POST',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to cancel training: ${error}` },
      { status: 500 },
    );
  }
}
