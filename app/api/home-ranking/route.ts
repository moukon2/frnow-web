import { NextResponse } from "next/server";
import { FRNOW_API_BASE } from "@/lib/config";

type RawItem = Record<string, unknown>;

type HomeRankingRow = {
  rank: number;
  symbol: string;
  exchange: string;
  fr: number;
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

function extractRows(payload: unknown): RawItem[] {
  if (!payload || typeof payload !== "object") return [];

  const p = payload as Record<string, unknown>;
  if (Array.isArray(p.rows)) return p.rows as RawItem[];
  if (Array.isArray(p.items)) return p.items as RawItem[];
  if (Array.isArray(p.data)) return p.data as RawItem[];
  return [];
}

export async function GET() {
  try {
    const res = await fetch(`${FRNOW_API_BASE}/api/current`, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream API error: ${res.status}` },
        { status: 502 }
      );
    }

    const payload: unknown = await res.json();
    const rawRows = extractRows(payload);

    const rows = rawRows
      .map((item, index) => {
        const symbol =
          pickString(item.symbol) ||
          pickString(item.name);

        const exchange =
          pickString(item.exchange) ||
          pickString(item.ex);

        const fr =
          pickNumber(item.fr_percent) ??
          pickNumber(item.fr) ??
          pickNumber(item.funding_rate) ??
          pickNumber(item.fundingRate) ??
          pickNumber(item.rate);

        if (!symbol || !exchange || fr === null) return null;

        return {
          rank: index + 1,
          symbol,
          exchange,
          fr,
        };
      })
      .filter(
        (
          v
        ): v is {
          rank: number;
          symbol: string;
          exchange: string;
          fr: number;
        } => v !== null
      )
      .slice(0, 5);

    return NextResponse.json({ rows });
  } catch (error) {
    console.error("home-ranking route error:", error);
    return NextResponse.json(
      { error: "Failed to load home ranking" },
      { status: 500 }
    );
  }
}