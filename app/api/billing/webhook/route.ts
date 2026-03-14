import { Webhooks } from "@polar-sh/nextjs";

const FRNOW_API_BASE = process.env.FRNOW_API_BASE || "https://api.frnow.io";
const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN || "";
const PRO_PRODUCT_ID = process.env.POLAR_PRO_PRODUCT_ID || "";
const ADV_PRODUCT_ID = process.env.POLAR_ADV_PRODUCT_ID || "";

type BillingPlan = "public" | "pro" | "advance";

function asObj(v: unknown): Record<string, any> {
  return v && typeof v === "object" ? (v as Record<string, any>) : {};
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

function extractUserId(data: Record<string, any>): string | null {
  return asStr(
    pick(
      data.metadata?.user_id,
      data.customer?.external_id,
      data.customer?.external_customer_id,
      data.external_customer_id,
      data.customer_external_id,
      data.checkout?.metadata?.user_id,
      data.order?.metadata?.user_id,
    ),
  );
}

function extractProductId(data: Record<string, any>): string | null {
  const direct = asStr(
    pick(
      data.product_id,
      data.product?.id,
      data.subscription_product_id,
    ),
  );
  if (direct) return direct;

  const products = Array.isArray(data.products) ? data.products : [];
  if (products.length > 0) {
    const first = asObj(products[0]);
    return asStr(pick(first.id, first.product_id, first.product?.id));
  }

  return null;
}

function extractCustomerId(data: Record<string, any>): string | null {
  return asStr(
    pick(
      data.customer_id,
      data.customer?.id,
    ),
  );
}

function extractSubscriptionId(data: Record<string, any>): string | null {
  return asStr(
    pick(
      data.subscription_id,
      data.id,
      data.subscription?.id,
    ),
  );
}

function extractCurrentPeriodEndMs(data: Record<string, any>): number | null {
  return asMs(
    pick(
      data.current_period_end,
      data.current_period_end_at,
      data.ends_at,
    ),
  );
}

async function callBillingUpdate(input: {
  userId: string;
  plan?: BillingPlan;
  billing_status?: string | null;
  current_period_end_ms?: number | null;
  customer_id?: string | null;
  subscription_id?: string | null;
}) {
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

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    const root = asObj(payload);
    const eventType = asStr(root.type) || "";
    const data = asObj(root.data);

    // 1) subscription.active
    if (eventType === "subscription.active") {
      const userId = extractUserId(data);
      if (!userId) {
        console.warn("POLAR_WEBHOOK_SKIP_NO_USER_ID", eventType, data?.id);
        return;
      }

      await callBillingUpdate({
        userId,
        plan: resolvePlanFromProductId(extractProductId(data)),
        billing_status: "active",
        current_period_end_ms: extractCurrentPeriodEndMs(data),
        customer_id: extractCustomerId(data),
        subscription_id: extractSubscriptionId(data),
      });
      return;
    }

    // 2) subscription.updated
    if (eventType === "subscription.updated") {
      const userId = extractUserId(data);
      if (!userId) {
        console.warn("POLAR_WEBHOOK_SKIP_NO_USER_ID", eventType, data?.id);
        return;
      }

      await callBillingUpdate({
        userId,
        plan: resolvePlanFromProductId(extractProductId(data)),
        billing_status: asStr(data.status) || "active",
        current_period_end_ms: extractCurrentPeriodEndMs(data),
        customer_id: extractCustomerId(data),
        subscription_id: extractSubscriptionId(data),
      });
      return;
    }

    // 3) subscription.canceled
    // 即 public には落とさず、status と period_end だけ更新
    if (eventType === "subscription.canceled") {
      const userId = extractUserId(data);
      if (!userId) {
        console.warn("POLAR_WEBHOOK_SKIP_NO_USER_ID", eventType, data?.id);
        return;
      }

      await callBillingUpdate({
        userId,
        plan: resolvePlanFromProductId(extractProductId(data)),
        billing_status: "canceled",
        current_period_end_ms: extractCurrentPeriodEndMs(data),
        customer_id: extractCustomerId(data),
        subscription_id: extractSubscriptionId(data),
      });
      return;
    }

    // 4) subscription.revoked
    // ここで public へ落とす
    if (eventType === "subscription.revoked") {
      const userId = extractUserId(data);
      if (!userId) {
        console.warn("POLAR_WEBHOOK_SKIP_NO_USER_ID", eventType, data?.id);
        return;
      }

      await callBillingUpdate({
        userId,
        plan: "public",
        billing_status: "revoked",
        current_period_end_ms: 0,
        customer_id: extractCustomerId(data),
        subscription_id: extractSubscriptionId(data),
      });
      return;
    }

    // 5) order.created
    // 補助同期。product/customer/subscription を保存したい時だけ反映
    if (eventType === "order.created") {
      const userId = extractUserId(data);
      if (!userId) {
        console.warn("POLAR_WEBHOOK_SKIP_NO_USER_ID", eventType, data?.id);
        return;
      }

      const plan = resolvePlanFromProductId(extractProductId(data));
      await callBillingUpdate({
        userId,
        plan: plan === "public" ? undefined : plan,
        billing_status: asStr(data.status) || "pending",
        customer_id: extractCustomerId(data),
        subscription_id: extractSubscriptionId(data),
      });
      return;
    }

    console.log("POLAR_WEBHOOK_IGNORED", eventType);
  },
});