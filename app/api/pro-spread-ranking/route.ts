import { NextRequest, NextResponse } from "next/server";
import { getApiBase, getBackendToken } from "@/lib/server-auth";

type RawRow = Record<string, unknown>;

type SpreadRow = {
  rank: number;
  symbol: string;
  exchange1: string;
  exchange2: string;
  fr1: number;
  fr2: number;
  spread: number;
  absSpread: number;
  direction: string;
  nextFundingMs?: number | null;
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

function parseEx(raw: string | null): string[] {
  return String(raw || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i);
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

export async function GET(request: NextRequest) {
  try {
    const token = await getBackendToken();

    if (!token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const selected = parseEx(request.nextUrl.searchParams.get("ex"));

    if (selected.length !== 2) {
      return NextResponse.json(
        { error: "exactly_two_exchanges_required" },
        { status: 400 }
      );
    }

    const [exchange1, exchange2] = selected;

    const upstreamUrl = new URL("/api/current", getApiBase());
    upstreamUrl.searchParams.set("ex", `${exchange1},${exchange2}`);

    const upstream = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
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

    const bySymbol = new Map<
      string,
      {
        [key: string]: { fr: number; nextFundingMs: number | null };
      }
    >();

    for (const row of rows) {
      const symbol = pickString(row.symbol) || pickString(row.name);
      const ex = (pickString(row.exchange) || pickString(row.ex)).toLowerCase();
      const fr = readFr(row);

      if (!symbol || !ex || fr === null) continue;
      if (ex !== exchange1 && ex !== exchange2) continue;

      const nextFundingMs = readNextFundingMs(row);

      if (!bySymbol.has(symbol)) {
        bySymbol.set(symbol, {});
      }

      bySymbol.get(symbol)![ex] = {
        fr,
        nextFundingMs,
      };
    }

    const spreadRows: SpreadRow[] = [];

    for (const [symbol, item] of bySymbol.entries()) {
      const a = item[exchange1];
      const b = item[exchange2];

      if (!a || !b) continue;

      const spread = a.fr - b.fr;
      const absSpread = Math.abs(spread);

      spreadRows.push({
        rank: 0,
        symbol,
        exchange1,
        exchange2,
        fr1: a.fr,
        fr2: b.fr,
        spread,
        absSpread,
        direction:
          spread > 0
            ? `${exchange1}>${exchange2}`
            : spread < 0
            ? `${exchange1}<${exchange2}`
            : "equal",
        nextFundingMs: a.nextFundingMs ?? b.nextFundingMs ?? null,
      });
    }

    spreadRows.sort((a, b) => b.absSpread - a.absSpread);

    const ranked = spreadRows.map((row, index) => ({
      ...row,
      rank: index + 1,
    }));

    return NextResponse.json(
      {
        rows: ranked,
        exchange1,
        exchange2,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("PRO_SPREAD_RANKING_PROXY_ERROR", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}