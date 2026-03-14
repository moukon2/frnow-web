import { NextResponse } from "next/server";
import { getApiBase, getBackendToken } from "@/lib/server-auth";

type Plan = "public" | "pro" | "advance";

type MeResponse = {
  loggedIn: boolean;
  plan: Plan;
  id?: string;
  email?: string | null;
  billing_status?: string | null;
  current_period_end_ms?: number | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  user?: {
    id?: string;
    email?: string | null;
    plan?: string | null;
    billing_status?: string | null;
    current_period_end_ms?: number | null;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
  };
};

function normalizePlan(raw: unknown): Plan {
  const p = String(raw || "").trim().toLowerCase();
  if (p === "advance" || p === "adv") return "advance";
  if (p === "pro") return "pro";
  return "public";
}

function safeString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function safeNumber(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET() {
  try {
    const token = await getBackendToken();

    if (!token) {
      return NextResponse.json<MeResponse>({
        loggedIn: false,
        plan: "public",
      });
    }

    if (process.env.DEV_AUTH_BYPASS === "1") {
      const devPlan = normalizePlan(process.env.DEV_AUTH_PLAN || "advance");

      return NextResponse.json<MeResponse>({
        loggedIn: true,
        plan: devPlan,
        id: "dev-user",
        email: "dev@example.com",
        billing_status: devPlan === "public" ? null : "active",
        current_period_end_ms: null,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        user: {
          id: "dev-user",
          email: "dev@example.com",
          plan: devPlan,
          billing_status: devPlan === "public" ? null : "active",
          current_period_end_ms: null,
          stripe_customer_id: null,
          stripe_subscription_id: null,
        },
      });
    }

    const upstream = await fetch(`${getApiBase()}/api/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (upstream.status === 401) {
      return NextResponse.json<MeResponse>({
        loggedIn: false,
        plan: "public",
      });
    }

    if (!upstream.ok) {
      return NextResponse.json<MeResponse>({
        loggedIn: false,
        plan: "public",
      });
    }

    const data = await upstream.json().catch(() => null);

    const rawUser = data?.user ?? {};
    const plan = normalizePlan(rawUser?.plan ?? data?.plan);

    const id = safeString(rawUser?.id);
    const email = safeString(rawUser?.email);
    const billing_status = safeString(rawUser?.billing_status);
    const current_period_end_ms = safeNumber(rawUser?.current_period_end_ms);
    const stripe_customer_id = safeString(rawUser?.stripe_customer_id);
    const stripe_subscription_id = safeString(rawUser?.stripe_subscription_id);

    return NextResponse.json<MeResponse>({
      loggedIn: true,
      plan,
      id: id ?? undefined,
      email,
      billing_status,
      current_period_end_ms,
      stripe_customer_id,
      stripe_subscription_id,
      user: {
        id: id ?? undefined,
        email,
        plan,
        billing_status,
        current_period_end_ms,
        stripe_customer_id,
        stripe_subscription_id,
      },
    });
  } catch (error) {
    console.error("ME_ROUTE_ERROR", error);

    return NextResponse.json<MeResponse>({
      loggedIn: false,
      plan: "public",
    });
  }
}