import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ForbiddenError } from "@/lib/rbac";
import { UnauthorizedError } from "@/lib/tenant";

// ─────────────────────────────────────────────────────────────────────────────
// Consistent JSON responses + error handling for Route Handlers.
// Wrap a handler with `route(...)` and just throw typed errors inside.
// ─────────────────────────────────────────────────────────────────────────────

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function created(data: unknown) {
  return NextResponse.json({ data }, { status: 201 });
}

export function err(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

export function route<C>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof UnauthorizedError) return err(e.message, 401);
      if (e instanceof ForbiddenError) return err(e.message, 403);
      if (e instanceof ZodError) return err("Validation failed", 400, { issues: e.flatten() });
      console.error("[api] unhandled error", e);
      return err("Internal server error", 500);
    }
  };
}

/** Best-effort client IP from common proxy headers. */
export function clientIp(req: Request): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null
  );
}
