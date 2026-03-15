import { Webhooks } from "@polar-sh/nextjs";

const FRNOW_API_BASE = process.env.FRNOW_API_BASE || "https://api.frnow.io";
const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN || "";
const PRO_PRODUCT_ID = process.env.POLAR_PRO_PRODUCT_ID || "";
const ADV_PRODUCT_ID = process.env.POLAR_ADV_PRODUCT_ID || "";

type BillingPlan = "public" | "pro" | "advance";

type UnknownRecord = Record<string, unknown>;

function asObj(v: unknown): UnknownRecord {
  return v && typeof v === "object" ? (v as UnknownRecord) : {};
}

function asStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function asMs(v: unknown): number | null {
  if (v === null || v === undefined) return null;

  if (typeof v === "number" && Number.isFinite(v)) {
    return v > 10_000_000_000 ? Math.trunc(v) : Math.trunc(v * 1000);
  }

  const s = String(v).trim();
  if (!s) return null;

  const n = Number(s);
  if (Number.isFinite(n)) {
    return n > 10_000_000_000 ? Math.trunc(n) : Math.trunc(n * 1000);
  }

  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
}

function pick(...values: unknown[]): unknown {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

function resolvePlanFromProductId(productId: unknown): BillingPlan {
  const pid = asStr(productId);
  if (!pid) return "public";
  if (pid === ADV_PRODUCT_ID) return "advance";
  if (pid === PRO_PRODUCT_ID) return "pro";
  return "public";
}

function extractUserId(data: UnknownRecord): string | null {
  return asStr(
    pick(
      data.metadata && asObj(data.metadata).user_id,
      data.customer && asObj(data.customer).external_id,
      data.customer && asObj(data.customer).external_customer_id,
      data.external_customer_id,
      data.customer_external_id,
      data.checkout && asObj(data.checkout).metadata
        ? asObj(asObj(data.checkout).metadata).user_id
        : null,
      data.order && asObj(data.order).metadata
        ? asObj(asObj(data.order).metadata).user_id
        : null,
    ),
  );
}

function extractProductId(data: UnknownRecord): string | null {
  const direct = asStr(
    pick(data.product_id, asObj(data.product).id, data.subscription_product_id),
  );
  if (direct) return direct;

  const products = Array.isArray(data.products) ? data.products : [];
  if (products.length > 0) {
    const first = asObj(products[0]);
    return asStr(pick(first.id, first.product_id, asObj(first.product).id));
  }

  return null;
}

function extractCustomerId(data: UnknownRecord): string | null {
  return asStr(pick(data.customer_id, asObj(data.customer).id));
}

function extractSubscriptionId(data: UnknownRecord): string | null {
  return asStr(pick(data.subscription_id, data.id, asObj(data.subscription).id));
}

function extractCurrentPeriodEndMs(data: UnknownRecord): number | null {
  return asMs(
    pick(data.current_period_end, data.current_period_end_at, data.ends_at),
  );
}

type BillingUpdatePayload = {
  userId: string;
  plan?: BillingPlan;
  billing_status?: string | null;
  current_period_end_ms?: number | null;
  customer_id?: string | null;
  subscription_id?: string | null;
};

async function callBillingUpdate(input: BillingUpdatePayload) {
  if (!INTERNAL_API_TOKEN) {
    throw new Error("INTERNAL_API_TOKEN is missing");
  }

  const res = await fetch(`${FRNOW_API_BASE}/internal/billing/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${INTERNAL_API_TOKEN}`,
    },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`billing_update_failed: ${res.status} ${text}`);
  }
}

function buildPayload(
  eventType: string,
  data: UnknownRecord,
): BillingUpdatePayload | null {
  const userId = extractUserId(data);
  if (!userId) return null;

  const productId = extractProductId(data);
  const resolvedPlan = resolvePlanFromProductId(productId);
  const customer_id = extractCustomerId(data);
  const subscription_id = extractSubscriptionId(data);
  const current_period_end_ms = extractCurrentPeriodEndMs(data);

  if (eventType === "subscription.active") {
    return {
      userId,
      plan: resolvedPlan,
      billing_status: "active",
      current_period_end_ms,
      customer_id,
      subscription_id,
    };
  }

  if (eventType === "subscription.updated") {
    return {
      userId,
      plan: resolvedPlan,
      billing_status: asStr(data.status) || "active",
      current_period_end_ms,
      customer_id,
      subscription_id,
    };
  }

  if (eventType === "subscription.canceled") {
    return {
      userId,
      plan: resolvedPlan,
      billing_status: "canceled",
      current_period_end_ms,
      customer_id,
      subscription_id,
    };
  }

  if (eventType === "subscription.revoked") {
    return {
      userId,
      plan: "public",
      billing_status: "revoked",
      current_period_end_ms: 0,
      customer_id,
      subscription_id,
    };
  }

  if (eventType === "order.created") {
    return {
      userId,
      plan: resolvedPlan === "public" ? undefined : resolvedPlan,
      billing_status: asStr(data.status) || "pending",
      customer_id,
      subscription_id,
    };
  }

  return null;
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    const root = asObj(payload);
    const eventType = asStr(root.type) || "";
    const data = asObj(root.data);

    const prepared = buildPayload(eventType, data);

    console.log("POLAR_WEBHOOK_RECEIVED", {
      eventType,
      eventId: asStr(root.id),
      userId: prepared?.userId ?? null,
      plan: prepared?.plan ?? null,
      billing_status: prepared?.billing_status ?? null,
      customer_id: prepared?.customer_id ?? null,
      subscription_id: prepared?.subscription_id ?? null,
      current_period_end_ms: prepared?.current_period_end_ms ?? null,
      product_id: extractProductId(data),
    });

    if (!prepared) {
      if (
        eventType === "subscription.active" ||
        eventType === "subscription.updated" ||
        eventType === "subscription.canceled" ||
        eventType === "subscription.revoked" ||
        eventType === "order.created"
      ) {
        console.warn("POLAR_WEBHOOK_SKIP_NO_USER_ID", {
          eventType,
          dataId: asStr(data.id),
        });
        return;
      }

      console.log("POLAR_WEBHOOK_IGNORED", { eventType });
      return;
    }

    await callBillingUpdate(prepared);

    console.log("POLAR_WEBHOOK_BILLING_UPDATE_OK", {
      eventType,
      userId: prepared.userId,
      plan: prepared.plan ?? null,
      billing_status: prepared.billing_status ?? null,
    });
  },
});