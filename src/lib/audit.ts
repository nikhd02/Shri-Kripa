/**
 * src/lib/audit.ts
 * Audit logging helper for administrative actions.
 * Never logs passwords, secrets, or sensitive tokens.
 */

import { db } from '@/lib/db';

export interface LogActionParams {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  detail?: string | Record<string, unknown> | null;
}

export async function logAdminAction({
  userId,
  action,
  entity,
  entityId,
  detail,
}: LogActionParams): Promise<void> {
  try {
    const detailString =
      typeof detail === 'object' && detail !== null
        ? JSON.stringify(detail)
        : (detail ?? null);

    await db.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        detail: detailString,
      },
    });
  } catch (error) {
    // Non-blocking: Audit log failure should be recorded in console but not break business flow
    console.error('Failed to create audit log:', error);
  }
}
