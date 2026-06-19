import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/tenant";
import { Card } from "@/components/ui";

const PLANS = [
  { id: "free", name: "Free", price: "$0", features: ["1 organization", "Up to 3 members", "Community support"] },
  { id: "pro", name: "Pro", price: "$29/mo", features: ["Unlimited projects", "10 members", "API access", "Audit logs"] },
  { id: "enterprise", name: "Enterprise", price: "Custom", features: ["SSO / SAML", "Unlimited members", "SLA", "Priority support"] },
];

export default async function BillingPage() {
  const { organizationId } = await requireMembership();
  const sub = await prisma.subscription.findUnique({ where: { organizationId } });
  const current = sub?.plan ?? "free";

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">Billing</h1>
      <p className="mt-1 text-sm text-gray-500">
        Current plan: <span className="font-medium text-gray-800">{current}</span> · status:{" "}
        <span className="font-medium">{sub?.status ?? "TRIALING"}</span>
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {PLANS.map((p) => (
          <Card key={p.id} className={`p-5 ${current === p.id ? "ring-2 ring-brand" : ""}`}>
            <p className="font-bold">{p.name}</p>
            <p className="mt-1 text-2xl font-black">{p.price}</p>
            <ul className="mt-3 space-y-1 text-sm text-gray-600">
              {p.features.map((f) => <li key={f}>✓ {f}</li>)}
            </ul>
            <button
              disabled={current === p.id}
              className="mt-4 w-full rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white disabled:bg-gray-200 disabled:text-gray-500"
            >
              {current === p.id ? "Current plan" : "Upgrade"}
            </button>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-xs text-gray-400">
        Checkout wires to Stripe — set STRIPE_SECRET_KEY and implement <code>createCheckoutSession()</code>.
        The webhook at <code>/api/billing/webhook</code> already updates subscription state.
      </p>
    </div>
  );
}
