import { NextResponse } from 'next/server';

import { ensureSidecar } from '@/app/services/training/sidecar-manager';

/**
 * GET /api/training/status — Get current training job status.
 */
export async function GET() {
  const sidecar = await ensureSidecar();
  if (sidecar.status !== 'ready') {
    return NextResponse.json(
      { active: false, sidecar_status: sidecar.status, error: sidecar.error },
      { status: 200 },
    );
  }

  try {
    const res = await fetch(`http://127.0.0.1:${sidecar.port}/jobs/status`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { active: false, error: `Failed to reach sidecar: ${error}` },
      { status: 200 },
    );
  }
}
