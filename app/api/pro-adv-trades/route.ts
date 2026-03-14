import { NextRequest, NextResponse } from "next/server";
import { getApiBase, getBackendToken } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  try {
    const token = await getBackendToken();

    if (!token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const limit = request.nextUrl.searchParams.get("limit") || "30";
    const url = new URL("/api/pro/adv-trades", getApiBase());
    url.searchParams.set("limit", limit);

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
          upstream.headers.get("Content-Type") || "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PRO_ADV_TRADES_PROXY_ERROR", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}