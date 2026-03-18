import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.FRNOW_API_BASE || "https://api.frnow.io";
const ALLOWED_EXCHANGES = ["binance", "bybit", "bitget", "mexc", "bingx"];

type RawRow = Record<string, unknown>;

type DoiPreviewRow = {
  rank: number;
  symbol: string;
  exchange: string;
  doi: number;
  absDoi: number;
  direction: "up" | "down" | "flat";
  fr?: number | null;
  nextFundingMs?: number | null;
};

function parseEx(raw: string | null): string[] {
  return String(raw || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .filter((v) => ALLOWED_EXCHANGES.includes(v));
}

function pickNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) {
    return Number(v);
  }
  return null;
}

function pickString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function normalizeRows(json: unknown): RawRow[] {
  if (Array.isArray(json)) return json as RawRow[];
  if (json && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj.rows)) return obj.rows as RawRow[];
    if (Array.isArray(obj.items)) return obj.items as RawRow[];
    if (Array.isArray(obj.data)) return obj.data as RawRow[];
  }
  return [];
}

function readFr(row: RawRow): number | null {
  return (
    pickNumber(row.fr_percent) ??
    pickNumber(row.fr) ??
    pickNumber(row.funding_rate) ??
    pickNumber(row.fundingRate) ??
    pickNumber(row.rate)
  );
}

function readNextFundingMs(row: RawRow): number | null {
  return (
    pickNumber(row.next_funding_at_ms) ??
    pickNumber(row.nextFundingMs) ??
    pickNumber(row.next_funding_ms) ??
    pickNumber(row.nextFundingTime) ??
    pickNumber(row.next_funding_time)
  );
}

function readDoi(row: RawRow, window: "1m" | "5m"): number | null {
  if (window === "1m") {
    return (
      pickNumber(row.doi1_percent) ??
      pickNumber(row.doi1) ??
      pickNumber(row.oi1_percent) ??
      pickNumber(row.oi1)
    );
  }

  return (
    pickNumber(row.doi5_percent) ??
    pickNumber(row.doi5) ??
    pickNumber(row.oi5_percent) ??
    pickNumber(row.oi5)
  );
}

export async function GET(request: NextRequest) {
  try {
    const ex = parseEx(request.nextUrl.searchParams.get("ex"));
    const windowParam = (request.nextUrl.searchParams.get("window") || "5m")
      .trim()
      .toLowerCase();
    const limitParam = Number(request.nextUrl.searchParams.get("limit") || 3);

    const window: "1m" | "5m" = windowParam === "1m" ? "1m" : "5m";
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(20, limitParam)) : 3;

    const upstreamUrl = new URL("/api/current", API_BASE);
    if (ex.length > 0) {
      upstreamUrl.searchParams.set("ex", ex.join(","));
    }

    const upstream = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const text = await upstream.text();

    if (!upstream.ok) {
      return new NextResponse(text, {
        status: upstream.status,
        headers: {
          "Content-Type":
            upstream.headers.get("Content-Type") ||
            "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    const payload = text ? JSON.parse(text) : null;
    const rows = normalizeRows(payload);

    const doiRows: DoiPreviewRow[] = [];

    for (const row of rows) {
      const symbol = pickString(row.symbol) || pickString(row.name);
      const exchange = (pickString(row.exchange) || pickString(row.ex)).toLowerCase();
      const doi = readDoi(row, window);

      if (!symbol || !exchange || doi === null) continue;

      doiRows.push({
        rank: 0,
        symbol,
        exchange,
        doi,
        absDoi: Math.abs(doi),
        direction: doi > 0 ? "up" : doi < 0 ? "down" : "flat",
        fr: readFr(row),
        nextFundingMs: readNextFundingMs(row),
      });
    }

    doiRows.sort((a, b) => {
      if (b.absDoi !== a.absDoi) return b.absDoi - a.absDoi;
      return Math.abs(b.fr ?? 0) - Math.abs(a.fr ?? 0);
    });

    const ranked = doiRows.slice(0, limit).map((row, index) => ({
      ...row,
      rank: index + 1,
    }));

    return NextResponse.json(
      {
        rows: ranked,
        window,
        limit,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("PUBLIC_DOI_PREVIEW_PROXY_ERROR", error);
    return NextResponse.json({ rows: [], error: "internal_error" }, { status: 500 });
  }
}
