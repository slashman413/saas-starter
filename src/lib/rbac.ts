import { Role } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Role-Based Access Control
// Define permissions as a flat string list, then map each role to its grants.
// Add new permissions here as the product grows — UI/API both read from this.
// ─────────────────────────────────────────────────────────────────────────────

export const PERMISSIONS = [
  "project:read",
  "project:write",
  "project:delete",
  "member:read",
  "member:invite",
  "member:remove",
  "member:role:update",
  "billing:read",
  "billing:manage",
  "apikey:read",
  "apikey:manage",
  "org:update",
  "org:delete",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [...PERMISSIONS], // everything
  ADMIN: [
    "project:read",
    "project:write",
    "project:delete",
    "member:read",
    "member:invite",
    "member:remove",
    "member:role:update",
    "billing:read",
    "apikey:read",
    "apikey:manage",
    "org:update",
  ],
  MEMBER: ["project:read", "project:write", "member:read", "billing:read"],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Throws a typed error usable by route handlers to return 403. */
export class ForbiddenError extends Error {
  constructor(public permission: Permission) {
    super(`Missing permission: ${permission}`);
    this.name = "ForbiddenError";
  }
}

export function assertCan(role: Role, permission: Permission): void {
  if (!can(role, permission)) throw new ForbiddenError(permission);
}
