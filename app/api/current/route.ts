import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  "https://api.frnow.io";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const ex = url.searchParams.get("ex") || "";

    const upstream = new URL(`${API_BASE}/api/current`);
    if (ex) upstream.searchParams.set("ex", ex);

    const cookie = req.headers.get("cookie") || "";

    const res = await fetch(upstream.toString(), {
      method: "GET",
      headers: {
        cookie,
      },
      cache: "no-store",
    });

    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch (e) {
    console.error("API_CURRENT_PROXY_FAIL", e);
    return NextResponse.json(
      { error: "current_proxy_failed" },
      { status: 500 },
    );
  }
}