import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { route, ok, created, clientIp } from "@/lib/api";
import { requireMembership } from "@/lib/tenant";
import { assertCan } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { Role } from "@prisma/client";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(Role).default(Role.MEMBER),
});

// GET /api/members — list members + pending invitations of the current org.
export const GET = route(async () => {
  const { organizationId, role } = await requireMembership();
  assertCan(role, "member:read");

  const [members, invitations] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invitation.findMany({
      where: { organizationId },
      select: { id: true, email: true, role: true, expiresAt: true },
    }),
  ]);

  return ok({ members, invitations });
});

// POST /api/members — invite a user by email (creates a pending Invitation).
export const POST = route(async (req) => {
  const { organizationId, role, userId } = await requireMembership();
  assertCan(role, "member:invite");

  const body = inviteSchema.parse(await req.json());

  // Owners are the only ones who can mint another OWNER.
  if (body.role === Role.OWNER) assertCan(role, "org:delete");

  const token = randomBytes(24).toString("base64url");
  const invitation = await prisma.invitation.upsert({
    where: { email_organizationId: { email: body.email, organizationId } },
    create: {
      email: body.email,
      role: body.role,
      token,
      organizationId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    update: { role: body.role, token, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });

  await audit({
    organizationId,
    actorId: userId,
    action: "member.invite",
    targetType: "Invitation",
    targetId: invitation.id,
    metadata: { email: body.email, role: body.role },
    ip: clientIp(req),
  });

  // In production: email the invite link `/invite/${token}` here.
  return created({ id: invitation.id, email: invitation.email, role: invitation.role });
});
