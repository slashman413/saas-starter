import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, created, err } from "@/lib/api";
import { authenticateApiKey } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

// ─────────────────────────────────────────────────────────────────────────────
// Public API v1. Authenticated with an API key (Authorization: Bearer sk_live_...).
// This is the surface external integrations call — kept separate from the
// session-based dashboard API and excluded from auth middleware.
// ─────────────────────────────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
});

// GET /api/v1/projects
export async function GET(req: Request) {
  const ctx = await authenticateApiKey(req);
  if (!ctx) return err("Invalid or missing API key", 401);

  const projects = await prisma.project.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return ok(projects);
}

// POST /api/v1/projects
export async function POST(req: Request) {
  const ctx = await authenticateApiKey(req);
  if (!ctx) return err("Invalid or missing API key", 401);

  let body;
  try {
    body = createSchema.parse(await req.json());
  } catch {
    return err("Validation failed", 400);
  }

  const project = await prisma.project.create({
    data: {
      name: body.name,
      description: body.description,
      organizationId: ctx.organizationId,
      // System-created via API key; createdById uses a sentinel.
      createdById: "api-key:" + ctx.apiKeyId,
    },
  });

  await audit({
    organizationId: ctx.organizationId,
    action: "project.create",
    targetType: "Project",
    targetId: project.id,
    metadata: { via: "api", apiKeyId: ctx.apiKeyId },
  });

  return created(project);
}
