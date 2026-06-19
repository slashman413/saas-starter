import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { route, ok, created, clientIp } from "@/lib/api";
import { requireMembership } from "@/lib/tenant";
import { assertCan } from "@/lib/rbac";
import { audit } from "@/lib/audit";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
});

// GET /api/projects — list projects in the current org (paginated).
export const GET = route(async (req) => {
  const { organizationId, role } = await requireMembership();
  assertCan(role, "project:read");

  const url = new URL(req.url);
  const take = Math.min(Number(url.searchParams.get("limit")) || 20, 100);
  const cursor = url.searchParams.get("cursor") || undefined;

  const projects = await prisma.project.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = projects.length > take;
  const items = hasMore ? projects.slice(0, take) : projects;
  return ok({ items, nextCursor: hasMore ? items[items.length - 1].id : null });
});

// POST /api/projects — create a project in the current org.
export const POST = route(async (req) => {
  const { organizationId, role, userId } = await requireMembership();
  assertCan(role, "project:write");

  const body = createSchema.parse(await req.json());
  const project = await prisma.project.create({
    data: {
      name: body.name,
      description: body.description,
      organizationId,
      createdById: userId,
    },
  });

  await audit({
    organizationId,
    actorId: userId,
    action: "project.create",
    targetType: "Project",
    targetId: project.id,
    metadata: { name: project.name },
    ip: clientIp(req),
  });

  return created(project);
});
