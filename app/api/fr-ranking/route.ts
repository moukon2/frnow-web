import { NextResponse } from "next/server";
import { FRNOW_API_BASE } from "@/lib/config";

type RawItem = Record<string, unknown>;

type RankingRow = {
  rank: number;
  symbol: string;
  exchange: string;
  fr: number;
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

function normalizeItem(item: RawItem, index: number): RankingRow | null {
  const symbol =
    pickString(item.symbol) ||
    pickString(item.base) ||
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

  const nextFundingMs =
    pickNumber(item.next_funding_at_ms) ??
    pickNumber(item.nextFundingMs) ??
    pickNumber(item.next_funding_ms) ??
    pickNumber(item.nextFundingTime) ??
    pickNumber(item.next_funding_time);

  if (!symbol || !exchange || fr === null) return null;

  return {
    rank: index + 1,
    symbol,
    exchange,
    fr,
    nextFundingMs,
  };
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

    const normalized = rawRows
      .map((item, index) => normalizeItem(item, index))
      .filter((v): v is RankingRow => v !== null)
      .map((row, index) => ({
        ...row,
        rank: index + 1,
      }));

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("fr-ranking route error:", error);

    return NextResponse.json(
      { error: "Failed to load FR ranking" },
      { status: 500 }
    );
  }
}