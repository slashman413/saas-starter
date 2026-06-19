import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { route, ok, err, clientIp } from "@/lib/api";
import { requireMembership } from "@/lib/tenant";
import { assertCan } from "@/lib/rbac";
import { audit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(["active", "archived"]).optional(),
});

// Always scope by organizationId so one tenant can never touch another's rows.
async function getOwned(id: string, organizationId: string) {
  return prisma.project.findFirst({ where: { id, organizationId } });
}

export const GET = route<Params>(async (_req, { params }) => {
  const { id } = await params;
  const { organizationId, role } = await requireMembership();
  assertCan(role, "project:read");

  const project = await getOwned(id, organizationId);
  if (!project) return err("Not found", 404);
  return ok(project);
});

export const PATCH = route<Params>(async (req, { params }) => {
  const { id } = await params;
  const { organizationId, role, userId } = await requireMembership();
  assertCan(role, "project:write");

  if (!(await getOwned(id, organizationId))) return err("Not found", 404);

  const body = patchSchema.parse(await req.json());
  const project = await prisma.project.update({ where: { id }, data: body });

  await audit({
    organizationId,
    actorId: userId,
    action: "project.update",
    targetType: "Project",
    targetId: id,
    metadata: body,
    ip: clientIp(req),
  });
  return ok(project);
});

export const DELETE = route<Params>(async (req, { params }) => {
  const { id } = await params;
  const { organizationId, role, userId } = await requireMembership();
  assertCan(role, "project:delete");

  if (!(await getOwned(id, organizationId))) return err("Not found", 404);

  await prisma.project.delete({ where: { id } });
  await audit({
    organizationId,
    actorId: userId,
    action: "project.delete",
    targetType: "Project",
    targetId: id,
    ip: clientIp(req),
  });
  return ok({ id, deleted: true });
});
