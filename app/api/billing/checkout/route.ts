import { NextRequest, NextResponse } from "next/server";
import { getApiBase, getBackendToken } from "@/lib/server-auth";

type CheckoutPlan = "pro" | "advance";

function getPolarBase(): string {
  const server = (process.env.POLAR_SERVER || "production").toLowerCase();
  return server === "sandbox"
    ? "https://sandbox-api.polar.sh/v1"
    : "https://api.polar.sh/v1";
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

export async function POST(req: NextRequest) {
  try {
    const token = await getBackendToken();

    if (!token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const plan = String(body?.plan || "").toLowerCase() as CheckoutPlan;

    if (plan !== "pro" && plan !== "advance") {
      return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
    }

    const polarToken = process.env.POLAR_ACCESS_TOKEN;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3010";

    if (!polarToken) {
      return NextResponse.json({ error: "polar_env_missing" }, { status: 500 });
    }

    // backend の /api/me から現在ユーザーを取得
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
      console.error("BILLING_CHECKOUT_ME_FETCH_FAIL", text);
      return NextResponse.json({ error: "me_fetch_failed" }, { status: 500 });
    }

    const me = await meRes.json().catch(() => null);
    const user = me?.user ?? {};

    const userId = user?.id ? String(user.id) : "";
    const email = user?.email ? String(user.email) : "";

    if (!userId) {
      return NextResponse.json({ error: "user_id_missing" }, { status: 400 });
    }

    const productId = getProductId(plan);

    const polarRes = await fetch(`${getPolarBase()}/checkouts/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${polarToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        products: [productId],
        success_url: `${siteUrl}/app/billing?checkout=success`,
        external_customer_id: userId,
        customer_email: email || undefined,
        metadata: {
          user_id: userId,
          plan,
        },
      }),
      cache: "no-store",
    });

    const data = await polarRes.json().catch(() => null);

    if (!polarRes.ok) {
      console.error("POLAR_CHECKOUT_CREATE_FAIL", data);
      return NextResponse.json(
        { error: "checkout_create_failed", detail: data },
        { status: 500 },
      );
    }

    const url =
      data?.url ??
      data?.data?.url ??
      data?.data?.attributes?.url ??
      null;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "checkout_url_missing" }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("BILLING_CHECKOUT_ROUTE_ERROR", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}