import Link from "next/link";
import { Button } from "@/components/ui";

const features = [
  ["🔐", "Authentication", "Email/password + OAuth via Auth.js, JWT sessions."],
  ["🏢", "Multi-tenancy", "Organizations, memberships, tenant-scoped data."],
  ["🛡️", "RBAC", "Owner / Admin / Member roles with a permission matrix."],
  ["💳", "Billing-ready", "Subscription model + Stripe webhook skeleton."],
  ["🔑", "API keys", "Hashed keys + a versioned public API (/api/v1)."],
  ["📝", "Audit logs", "Who did what, scoped per organization."],
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <nav className="flex items-center justify-between">
        <span className="text-lg font-bold text-brand">◆ SaaS Starter</span>
        <div className="flex gap-2">
          <Link href="/login"><Button variant="ghost">Log in</Button></Link>
          <Link href="/register"><Button>Get started</Button></Link>
        </div>
      </nav>

      <section className="py-20 text-center">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          Ship your SaaS, <span className="text-brand">not the boilerplate.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          A production-ready multi-tenant foundation: auth, organizations, RBAC, billing,
          API keys and audit logs — built with Next.js 15, Prisma & Auth.js.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/register"><Button className="px-6 py-3 text-base">Create your workspace</Button></Link>
          <Link href="/dashboard"><Button variant="ghost" className="px-6 py-3 text-base">View dashboard →</Button></Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(([icon, title, desc]) => (
          <div key={title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-2xl">{icon}</div>
            <h3 className="mt-3 font-bold">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
