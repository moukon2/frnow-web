import { NextResponse } from "next/server";
import { FRNOW_API_BASE } from "@/lib/config";
import { formatJstTime } from "@/lib/date";

type RawItem = Record<string, unknown>;

type AdvRow = {
  timeLabel: string;
  exchange: string;
  symbol: string;
  side: string;
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
  if (Array.isArray(payload)) return payload as RawItem[];

  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    if (Array.isArray(p.rows)) return p.rows as RawItem[];
    if (Array.isArray(p.items)) return p.items as RawItem[];
    if (Array.isArray(p.data)) return p.data as RawItem[];
    if (Array.isArray(p.events)) return p.events as RawItem[];
  }

  return [];
}

function normalizeItem(item: RawItem): AdvRow | null {
  const ts =
    pickNumber(item.ts_ms) ??
    pickNumber(item.opened_at_ms) ??
    pickNumber(item.time_ms) ??
    pickNumber(item.ts) ??
    pickString(item.time);

  const exchange =
    pickString(item.exchange) ||
    pickString(item.ex);

  const symbol =
    pickString(item.symbol) ||
    pickString(item.name);

  const side =
    pickString(item.side) ||
    pickString(item.direction);

  if (!exchange && !symbol && !side) return null;

  return {
    timeLabel: formatJstTime(ts),
    exchange: exchange || "-",
    symbol: symbol || "-",
    side: side || "-",
  };
}

export async function GET() {
  try {
    const [statsRes, rowsRes] = await Promise.all([
      fetch(`${FRNOW_API_BASE}/api/adv-stats`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      }),
      fetch(`${FRNOW_API_BASE}/api/advance`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      }),
    ]);

    if (!statsRes.ok) {
      return NextResponse.json(
        { error: `Upstream stats API error: ${statsRes.status}` },
        { status: 502 }
      );
    }

    if (!rowsRes.ok) {
      return NextResponse.json(
        { error: `Upstream advance API error: ${rowsRes.status}` },
        { status: 502 }
      );
    }

    const statsPayload = (await statsRes.json()) as Record<string, unknown>;
    const rowsPayload: unknown = await rowsRes.json();

    const rawRows = extractRows(rowsPayload);
    const rows = rawRows
      .map(normalizeItem)
      .filter((v): v is AdvRow => v !== null)
      .slice(0, 12);

    return NextResponse.json({
      avgRetBps:
        typeof statsPayload.avg_ret_bps === "number"
          ? statsPayload.avg_ret_bps
          : statsPayload.avg_ret_bps === null
          ? null
          : Number.isFinite(Number(statsPayload.avg_ret_bps))
          ? Number(statsPayload.avg_ret_bps)
          : null,

      avgHoldMin:
        typeof statsPayload.avg_hold_min === "number"
          ? statsPayload.avg_hold_min
          : statsPayload.avg_hold_min === null
          ? null
          : Number.isFinite(Number(statsPayload.avg_hold_min))
          ? Number(statsPayload.avg_hold_min)
          : null,

      trades:
        typeof statsPayload.trades === "number"
          ? statsPayload.trades
          : Number.isFinite(Number(statsPayload.trades))
          ? Number(statsPayload.trades)
          : 0,

      winRate:
        typeof statsPayload.win_rate === "number"
          ? statsPayload.win_rate
          : statsPayload.win_rate === null
          ? null
          : Number.isFinite(Number(statsPayload.win_rate))
          ? Number(statsPayload.win_rate)
          : null,

      rows,
    });
  } catch (error) {
    console.error("adv-public route error:", error);
    return NextResponse.json(
      { error: "Failed to load ADV public data" },
      { status: 500 }
    );
  }
}