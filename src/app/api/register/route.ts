import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { route, created, err, clientIp } from "@/lib/api";
import { audit } from "@/lib/audit";
import { Role, SubscriptionStatus } from "@prisma/client";

const schema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  orgName: z.string().min(1).max(80),
});

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "org"
  );
}

// POST /api/register — create user + their first organization (as OWNER).
export const POST = route(async (req) => {
  const body = schema.parse(await req.json());

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) return err("Email already registered", 409);

  const passwordHash = await bcrypt.hash(body.password, 12);

  // Ensure a unique slug.
  const base = slugify(body.orgName);
  let slug = base;
  for (let i = 1; await prisma.organization.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i}`;
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: body.name, email: body.email, passwordHash },
    });
    const org = await tx.organization.create({
      data: {
        name: body.orgName,
        slug,
        memberships: { create: { userId: user.id, role: Role.OWNER } },
        subscription: { create: { plan: "free", status: SubscriptionStatus.TRIALING } },
      },
    });
    return { user, org };
  });

  await audit({
    organizationId: result.org.id,
    actorId: result.user.id,
    action: "org.create",
    targetType: "Organization",
    targetId: result.org.id,
    ip: clientIp(req),
  });

  return created({ userId: result.user.id, organization: { id: result.org.id, slug: result.org.slug } });
});
