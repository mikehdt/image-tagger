import { NextResponse } from 'next/server';

import {
  ensureSidecar,
  getSidecarStatus,
} from '@/app/services/training/sidecar-manager';

/**
 * GET /api/training/sidecar — Check sidecar status without starting it.
 */
export async function GET() {
  const status = getSidecarStatus();
  return NextResponse.json(status);
}

/**
 * POST /api/training/sidecar — Ensure the sidecar is running (start if needed).
 */
export async function POST() {
  const result = await ensureSidecar();
  const httpStatus = result.status === 'ready' ? 200 : 503;
  return NextResponse.json(result, { status: httpStatus });
}
