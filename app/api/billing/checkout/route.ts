import { NextRequest, NextResponse } from "next/server";
import { getApiBase, getBackendToken } from "@/lib/server-auth";

type CheckoutPlan = "pro" | "advance";

function getPolarBase(): string {
  const server = (process.env.POLAR_SERVER || "production").toLowerCase();
  return server === "sandbox"
    ? "https://sandbox-api.polar.sh/v1"
    : "https://api.polar.sh/v1";
}

function normalizePlan(input: unknown): CheckoutPlan | null {
  const plan = String(input || "").trim().toLowerCase();
  if (plan === "pro") return "pro";
  if (plan === "advance" || plan === "adv") return "advance";
  return null;
}

function getProductId(plan: CheckoutPlan): string {
  if (plan === "pro") {
    const id = process.env.POLAR_PRO_PRODUCT_ID;
    if (!id) {
      throw new Error("POLAR_PRO_PRODUCT_ID is missing");
    }
    return id;
  }

  const id = process.env.POLAR_ADV_PRODUCT_ID;
  if (!id) {
    throw new Error("POLAR_ADV_PRODUCT_ID is missing");
  }
  return id;
}

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3010"
  ).replace(/\/+$/, "");
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: NextRequest) {
  try {
    const token = await getBackendToken();
    if (!token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const plan = normalizePlan(body?.plan);
    if (!plan) {
      return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
    }

    const polarToken = process.env.POLAR_ACCESS_TOKEN;
    if (!polarToken) {
      console.error("BILLING_CHECKOUT_ENV_MISSING", {
        missing: "POLAR_ACCESS_TOKEN",
      });
      return NextResponse.json({ error: "polar_env_missing" }, { status: 500 });
    }

    const meRes = await fetch(`${getApiBase()}/api/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!meRes.ok) {
      const text = await meRes.text().catch(() => "");
      console.error("BILLING_CHECKOUT_ME_FETCH_FAIL", {
        status: meRes.status,
        body: text,
      });
      return NextResponse.json({ error: "me_fetch_failed" }, { status: 500 });
    }

    const me = await meRes.json().catch(() => null);
    const user = me?.user ?? me ?? {};
    const userId = safeString(user?.id);
    const email = safeString(user?.email);

    if (!userId) {
      console.error("BILLING_CHECKOUT_USER_ID_MISSING", { me });
      return NextResponse.json({ error: "user_id_missing" }, { status: 400 });
    }

    const productId = getProductId(plan);
    const siteUrl = getSiteUrl();

    const payload = {
      products: [productId],
      success_url: `${siteUrl}/app/billing?checkout=success&plan=${plan}`,
      external_customer_id: userId,
      customer_email: email || undefined,
      metadata: {
        user_id: userId,
        plan,
      },
    };

    const polarRes = await fetch(`${getPolarBase()}/checkouts/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${polarToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await polarRes.json().catch(() => null);

    if (!polarRes.ok) {
      console.error("POLAR_CHECKOUT_CREATE_FAIL", {
        status: polarRes.status,
        plan,
        userId,
        payload,
        response: data,
      });
      return NextResponse.json(
        { error: "checkout_create_failed", detail: data },
        { status: 500 },
      );
    }

    const url =
      data?.url ??
      data?.data?.url ??
      data?.data?.attributes?.url ??
      data?.data?.attributes?.checkout_url ??
      null;

    if (!url || typeof url !== "string") {
      console.error("POLAR_CHECKOUT_URL_MISSING", {
        plan,
        userId,
        response: data,
      });
      return NextResponse.json(
        { error: "checkout_url_missing" },
        { status: 500 },
      );
    }

    console.log("POLAR_CHECKOUT_CREATED", {
      plan,
      userId,
      productId,
      hasEmail: Boolean(email),
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("BILLING_CHECKOUT_ROUTE_ERROR", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}