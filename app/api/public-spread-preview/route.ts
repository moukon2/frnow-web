import { NextResponse } from "next/server";

const API_BASE = process.env.FRNOW_API_BASE || "https://api.frnow.io";
const EXCHANGES = ["binance", "bybit", "bitget", "mexc", "bingx"];

type RawRow = Record<string, unknown>;

type SpreadPreviewRow = {
  rank: number;
  symbol: string;
  exchange1: string;
  exchange2: string;
  spread: number;
  absSpread: number;
};

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

export async function GET() {
  try {
    const upstreamUrl = new URL("/api/current", API_BASE);
    upstreamUrl.searchParams.set("ex", EXCHANGES.join(","));

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

    const bySymbol = new Map<string, Array<{ exchange: string; fr: number }>>();

    for (const row of rows) {
      const symbol = pickString(row.symbol) || pickString(row.name);
      const exchange = (pickString(row.exchange) || pickString(row.ex)).toLowerCase();
      const fr = readFr(row);

      if (!symbol || !exchange || fr === null) continue;
      if (!EXCHANGES.includes(exchange)) continue;

      if (!bySymbol.has(symbol)) {
        bySymbol.set(symbol, []);
      }

      bySymbol.get(symbol)!.push({ exchange, fr });
    }

    const spreadRows: SpreadPreviewRow[] = [];

    for (const [symbol, exchanges] of bySymbol.entries()) {
      if (exchanges.length < 2) continue;

      let best: SpreadPreviewRow | null = null;

      for (let i = 0; i < exchanges.length; i += 1) {
        for (let j = i + 1; j < exchanges.length; j += 1) {
          const a = exchanges[i];
          const b = exchanges[j];
          const spread = a.fr - b.fr;
          const absSpread = Math.abs(spread);

          if (!best || absSpread > best.absSpread) {
            best = {
              rank: 0,
              symbol,
              exchange1: a.exchange,
              exchange2: b.exchange,
              spread,
              absSpread,
            };
          }
        }
      }

      if (best) {
        spreadRows.push(best);
      }
    }

    spreadRows.sort((a, b) => b.absSpread - a.absSpread);

    return NextResponse.json(
      {
        rows: spreadRows.slice(0, 3).map((row, index) => ({
          ...row,
          rank: index + 1,
        })),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("PUBLIC_SPREAD_PREVIEW_PROXY_ERROR", error);
    return NextResponse.json({ rows: [], error: "internal_error" }, { status: 500 });
  }
}
