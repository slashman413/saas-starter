import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireMembership, UnauthorizedError } from "@/lib/tenant";

const nav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/projects", label: "Projects" },
  { href: "/settings/members", label: "Members" },
  { href: "/settings/api-keys", label: "API keys" },
  { href: "/settings/billing", label: "Billing" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let ctx;
  try {
    ctx = await requireMembership();
  } catch (e) {
    if (e instanceof UnauthorizedError) redirect("/login");
    throw e;
  }

  const org = await prisma.organization.findUnique({
    where: { id: ctx.organizationId },
    select: { name: true, slug: true },
  });

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      {/* Mobile top bar (below sm): brand + horizontally scrollable nav */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white sm:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-bold text-brand">◆ SaaS Starter</p>
          <p className="truncate text-xs text-gray-500">
            {org?.name} · {ctx.role}
          </p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Desktop sidebar (sm and up) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-gray-200 bg-white p-4 sm:flex">
        <div className="px-2 py-3">
          <p className="text-sm font-bold text-brand">◆ SaaS Starter</p>
          <p className="mt-1 truncate text-xs text-gray-500">{org?.name}</p>
        </div>
        <nav className="mt-4 space-y-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto px-3 pt-4 text-xs text-gray-400">
          Role: <span className="font-medium text-gray-600">{ctx.role}</span>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50 p-6 sm:p-10">{children}</main>
    </div>
  );
}
