import { NextResponse } from "next/server";
import { getApiBase, getBackendToken } from "@/lib/server-auth";

function getPolarBase(): string {
  const server = (process.env.POLAR_SERVER || "production").toLowerCase();
  return server === "sandbox"
    ? "https://sandbox-api.polar.sh/v1"
    : "https://api.polar.sh/v1";
}

export async function POST() {
  try {
    const token = await getBackendToken();
    if (!token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const oat = process.env.POLAR_ACCESS_TOKEN;
    if (!oat) {
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
      return NextResponse.json({ error: "me_fetch_failed" }, { status: 500 });
    }

    const me = await meRes.json().catch(() => null);
    const user = me?.user ?? {};
    const userId = user?.id ? String(user.id) : "";

    if (!userId) {
      return NextResponse.json({ error: "user_id_missing" }, { status: 400 });
    }

    const polarRes = await fetch(`${getPolarBase()}/customer-sessions/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${oat}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        external_customer_id: userId,
      }),
      cache: "no-store",
    });

    const data = await polarRes.json().catch(() => null);

    if (!polarRes.ok) {
      console.error("POLAR_PORTAL_SESSION_FAIL", data);
      return NextResponse.json(
        { error: "customer_session_failed", detail: data },
        { status: 500 },
      );
    }

    const url =
      data?.customer_portal_url ??
      data?.data?.customer_portal_url ??
      data?.data?.attributes?.customer_portal_url ??
      null;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "portal_url_missing" }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("POLAR_PORTAL_ROUTE_ERROR", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}