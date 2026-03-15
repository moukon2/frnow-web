import { NextRequest, NextResponse } from "next/server";
import {
  getApiBase,
  getBackendToken,
  getSessionUser,
  hasRequiredPlan,
} from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  try {
    const token = await getBackendToken();
    if (!token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const sessionUser = await getSessionUser();
    if (!sessionUser.loggedIn) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (!hasRequiredPlan(sessionUser.plan, "advance")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const period = request.nextUrl.searchParams.get("period");
    const exchange = request.nextUrl.searchParams.get("exchange");
    const side = request.nextUrl.searchParams.get("side");
    const limit = request.nextUrl.searchParams.get("limit") || "50";

    const url = new URL("/api/pro/adv-performance", getApiBase());

    if (period) url.searchParams.set("period", period);
    if (exchange) url.searchParams.set("exchange", exchange);
    if (side) url.searchParams.set("side", side);
    if (limit) url.searchParams.set("limit", limit);

    const upstream = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const text = await upstream.text();

    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") ||
          "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PRO_ADV_PERFORMANCE_PROXY_ERROR", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}