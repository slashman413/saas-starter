import { prisma } from "@/lib/prisma";
import { err } from "@/lib/api";
import { SubscriptionStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Stripe webhook (skeleton). To activate:
//   1. npm i stripe
//   2. set STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET
//   3. uncomment the signature-verification block below.
// Until then it parses the JSON body so you can test the state machine locally.
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  trialing: SubscriptionStatus.TRIALING,
  active: SubscriptionStatus.ACTIVE,
  past_due: SubscriptionStatus.PAST_DUE,
  unpaid: SubscriptionStatus.PAST_DUE,
  canceled: SubscriptionStatus.CANCELED,
};

export async function POST(req: Request) {
  const payload = await req.text();

  // --- Production: verify the signature ---
  // import Stripe from "stripe";
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const sig = req.headers.get("stripe-signature")!;
  // let event;
  // try { event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET!); }
  // catch { return err("Invalid signature", 400); }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return err("Invalid payload", 400);
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as {
        id?: string;
        customer?: string;
        status?: string;
        current_period_end?: number;
        items?: { data?: { price?: { lookup_key?: string } }[] };
      };
      if (sub.customer) {
        await prisma.subscription.updateMany({
          where: { stripeCustomerId: sub.customer },
          data: {
            stripeSubscriptionId: sub.id,
            status: STATUS_MAP[sub.status ?? ""] ?? SubscriptionStatus.ACTIVE,
            plan: sub.items?.data?.[0]?.price?.lookup_key ?? undefined,
            currentPeriodEnd: sub.current_period_end
              ? new Date(sub.current_period_end * 1000)
              : undefined,
          },
        });
      }
      break;
    }
    default:
      // ignore unhandled event types
      break;
  }

  return Response.json({ received: true });
}
