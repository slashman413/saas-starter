import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { route, ok, created, clientIp } from "@/lib/api";
import { requireMembership } from "@/lib/tenant";
import { assertCan } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { generateApiKey } from "@/lib/api-auth";

const createSchema = z.object({ name: z.string().min(1).max(80) });

// GET /api/api-keys — list keys (never returns the plaintext).
export const GET = route(async () => {
  const { organizationId, role } = await requireMembership();
  assertCan(role, "apikey:read");

  const keys = await prisma.apiKey.findMany({
    where: { organizationId, revokedAt: null },
    select: { id: true, name: true, prefix: true, lastUsedAt: true, createdAt: true, expiresAt: true },
    orderBy: { createdAt: "desc" },
  });
  return ok(keys);
});

// POST /api/api-keys — create a key. The plaintext is returned ONCE.
export const POST = route(async (req) => {
  const { organizationId, role, userId } = await requireMembership();
  assertCan(role, "apikey:manage");

  const { name } = createSchema.parse(await req.json());
  const { plaintext, hashedKey, prefix } = generateApiKey();

  const key = await prisma.apiKey.create({
    data: { name, hashedKey, prefix, organizationId },
    select: { id: true, name: true, prefix: true, createdAt: true },
  });

  await audit({
    organizationId,
    actorId: userId,
    action: "apikey.create",
    targetType: "ApiKey",
    targetId: key.id,
    metadata: { name },
    ip: clientIp(req),
  });

  // `key` (plaintext) is only ever shown here — store it now, it cannot be retrieved later.
  return created({ ...key, key: plaintext });
});
