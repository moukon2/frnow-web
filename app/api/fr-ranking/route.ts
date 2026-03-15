import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.FRNOW_API_BASE || "https://api.frnow.io";
const ALLOWED_EXCHANGES = ["binance", "bybit", "bitget", "mexc", "bingx"];

function parseEx(raw: string | null): string[] {
  return String(raw || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .filter((v) => ALLOWED_EXCHANGES.includes(v));
}

export async function GET(request: NextRequest) {
  try {
    const selected = parseEx(request.nextUrl.searchParams.get("ex"));

    const url = new URL("/api/current", API_BASE);

    if (selected.length > 0) {
      url.searchParams.set("ex", selected.join(","));
    }

    const upstream = await fetch(url.toString(), {
      method: "GET",
      headers: {
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
    console.error("FR_RANKING_PROXY_ERROR", error);
    return NextResponse.json({ rows: [], error: "internal_error" }, { status: 500 });
  }
}