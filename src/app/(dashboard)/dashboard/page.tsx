import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/tenant";

export default async function DashboardPage() {
  const { organizationId } = await requireMembership();

  const [projects, members, recent] = await Promise.all([
    prisma.project.count({ where: { organizationId } }),
    prisma.membership.count({ where: { organizationId } }),
    prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { actor: { select: { name: true, email: true } } },
    }),
  ]);

  const stats = [
    { label: "Projects", value: projects },
    { label: "Members", value: members },
    { label: "Audit events", value: recent.length },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="mt-1 text-3xl font-black">{s.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-bold">Recent activity</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {recent.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recent.map((log) => (
              <li key={log.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span>
                  <span className="font-medium">{log.actor?.name ?? log.actor?.email ?? "System"}</span>{" "}
                  <span className="text-gray-500">{log.action}</span>
                </span>
                <span className="text-xs text-gray-400">{log.createdAt.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
