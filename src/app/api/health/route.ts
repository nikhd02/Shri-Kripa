/**
 * src/app/api/health/route.ts
 * Health check & database connection diagnostic endpoint.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rawDbUrl = process.env.DATABASE_URL;
  const hasDbUrl = Boolean(rawDbUrl && rawDbUrl.trim().length > 0);
  let dbUrlMasked = 'NOT_SET';

  if (hasDbUrl) {
    try {
      const url = new URL(rawDbUrl!);
      dbUrlMasked = `${url.protocol}//${url.username}:****@${url.host}${url.pathname}`;
    } catch {
      dbUrlMasked = 'INVALID_URL_FORMAT';
    }
  }

  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasDatabaseUrl: hasDbUrl,
    databaseUrlMasked: dbUrlMasked,
  };

  if (!hasDbUrl) {
    return NextResponse.json(
      {
        status: 'error',
        message:
          'DATABASE_URL environment variable is missing on Vercel. Please add DATABASE_URL in Vercel Project Settings -> Environment Variables.',
        diagnostics,
      },
      { status: 500 }
    );
  }

  try {
    const start = Date.now();
    const [categoriesCount, itemsCount] = await Promise.all([
      db.category.count(),
      db.menuItem.count(),
    ]);
    const durationMs = Date.now() - start;

    return NextResponse.json({
      status: 'ok',
      durationMs,
      categoriesCount,
      itemsCount,
      diagnostics,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorCode = (error as { code?: string })?.code;

    return NextResponse.json(
      {
        status: 'db_connection_error',
        code: errorCode || 'UNKNOWN',
        message: errorMsg,
        diagnostics,
        hint:
          'If this fails on Vercel: 1) Ensure DATABASE_URL is added to Vercel Settings -> Environment Variables. 2) In your cPanel hosting under "Remote MySQL", add "%" so external Vercel serverless IPs can connect. 3) Verify if the remote MySQL server allows external SSL or unencrypted connections.',
      },
      { status: 500 }
    );
  }
}
