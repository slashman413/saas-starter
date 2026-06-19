import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Role } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Tenant resolution. Given the authenticated session, resolve the user's
// membership in a target organization (by slug, or their first/default org).
// Every API handler should call requireMembership() to enforce tenant isolation.
// ─────────────────────────────────────────────────────────────────────────────

export type TenantContext = {
  userId: string;
  organizationId: string;
  role: Role;
};

export class UnauthorizedError extends Error {
  constructor(msg = "Unauthorized") {
    super(msg);
    this.name = "UnauthorizedError";
  }
}

/** Resolve the current user id from the Auth.js session. */
export async function requireUser(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return session.user.id;
}

/**
 * Resolve membership for the current user in a given org (by slug).
 * If no slug is provided, falls back to the user's most recently joined org.
 * Throws UnauthorizedError if the user is not a member.
 */
export async function requireMembership(orgSlug?: string): Promise<TenantContext> {
  const userId = await requireUser();

  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      ...(orgSlug ? { organization: { slug: orgSlug } } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: { organizationId: true, role: true },
  });

  if (!membership) throw new UnauthorizedError("Not a member of this organization");

  return { userId, organizationId: membership.organizationId, role: membership.role };
}
