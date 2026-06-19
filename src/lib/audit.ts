import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Audit logging. Fire-and-forget; never let an audit failure break the request.
// ─────────────────────────────────────────────────────────────────────────────

export type AuditEntry = {
  organizationId: string;
  actorId?: string | null;
  action: string; // e.g. "project.create"
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
};

export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: entry.organizationId,
        actorId: entry.actorId ?? null,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        metadata: entry.metadata,
        ip: entry.ip ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] failed to write log", entry.action, err);
  }
}
