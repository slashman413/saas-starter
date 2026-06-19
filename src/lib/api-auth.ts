import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// API-key authentication for the public API (/api/v1/*).
// Keys are shown in plaintext only once; we persist a SHA-256 hash + a prefix.
// ─────────────────────────────────────────────────────────────────────────────

const KEY_PREFIX = "sk_live_";

export function generateApiKey(): { plaintext: string; hashedKey: string; prefix: string } {
  const raw = randomBytes(24).toString("base64url");
  const plaintext = `${KEY_PREFIX}${raw}`;
  return {
    plaintext,
    hashedKey: hashKey(plaintext),
    prefix: plaintext.slice(0, KEY_PREFIX.length + 6), // e.g. sk_live_Ab12Cd
  };
}

export function hashKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export type ApiContext = { organizationId: string; role: Role; apiKeyId: string };

/**
 * Authenticate a request via the `Authorization: Bearer <key>` header.
 * Returns the org context, or null if the key is missing/invalid/revoked/expired.
 * Updates lastUsedAt (best-effort). API keys act with ADMIN-equivalent scope.
 */
export async function authenticateApiKey(req: Request): Promise<ApiContext | null> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length).trim();
  if (!token.startsWith(KEY_PREFIX)) return null;

  const key = await prisma.apiKey.findUnique({
    where: { hashedKey: hashKey(token) },
    select: { id: true, organizationId: true, revokedAt: true, expiresAt: true },
  });

  if (!key || key.revokedAt) return null;
  if (key.expiresAt && key.expiresAt < new Date()) return null;

  prisma.apiKey
    .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return { organizationId: key.organizationId, role: Role.ADMIN, apiKeyId: key.id };
}
