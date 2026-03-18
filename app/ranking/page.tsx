"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ExchangeFilter from "@/components/ExchangeFilter";

type Plan = "public" | "pro" | "advance";
type RankingMode = "fr" | "spread" | "doi1" | "doi5";
type ViewState = "loading" | "ready" | "error";

const ALL_EXCHANGES = ["binance", "bybit", "bitget", "mexc", "bingx"] as const;

type MeResponse = {
  loggedIn?: boolean;
  plan?: Plan;
};

type RawApi = {
  rows?: Array<Record<string, unknown>>;
  error?: string;
  message?: string;
};

type FrRow = {
  symbol: string;
  exchange: string;
  fr: number | null;
  nextFundingMs?: number | null;
};

type DoiRow = {
  symbol: string;
  exchange: string;
  doi: number | null;
};

type SpreadRow = {
  symbol: string;
  spread: number | null;
};

type UnifiedRow = {
  symbol: string;
  exchange: string;
  fr: number | null;
  spread: number | null;
  doi1: number | null;
  doi5: number | null;
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

function readRows(json: unknown): Array<Record<string, unknown>> {
  if (!json || typeof json !== "object") return [];
  const obj = json as Record<string, unknown>;
  if (Array.isArray(obj.rows)) return obj.rows as Array<Record<string, unknown>>;
  if (Array.isArray(obj.items)) return obj.items as Array<Record<string, unknown>>;
  if (Array.isArray(obj.data)) return obj.data as Array<Record<string, unknown>>;
  return [];
}

function normalizeFrRows(rows: Array<Record<string, unknown>>): FrRow[] {
  const out: FrRow[] = [];

  for (const item of rows) {
    const symbol = pickString(item.symbol) || pickString(item.name);
    const exchange = (pickString(item.exchange) || pickString(item.ex)).toLowerCase();

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

    if (!symbol || !exchange) continue;

    out.push({
      symbol,
      exchange,
      fr,
      nextFundingMs,
    });
  }

  return out;
}

function normalizeDoiRows(
  rows: Array<Record<string, unknown>>,
  window: "1m" | "5m",
): DoiRow[] {
  const out: DoiRow[] = [];

  for (const item of rows) {
    const symbol = pickString(item.symbol) || pickString(item.name);
    const exchange = (pickString(item.exchange) || pickString(item.ex)).toLowerCase();

    let doi: number | null = null;

    if (window === "1m") {
      doi =
        pickNumber(item.doi1_percent) ??
        pickNumber(item.doi1) ??
        pickNumber(item.oi1_percent) ??
        pickNumber(item.oi1) ??
        pickNumber(item.delta_oi_1m) ??
        pickNumber(item.deltaOi1m);
    } else {
      doi =
        pickNumber(item.doi5_percent) ??
        pickNumber(item.doi5) ??
        pickNumber(item.oi5_percent) ??
        pickNumber(item.oi5) ??
        pickNumber(item.delta_oi_5m) ??
        pickNumber(item.deltaOi5m);
    }

    doi = doi ?? pickNumber(item.doi_percent) ?? pickNumber(item.doi);

    if (!symbol || !exchange || doi === null) continue;

    out.push({
      symbol,
      exchange,
      doi,
    });
  }

  return out;
}

function normalizePublicSpreadRows(rows: Array<Record<string, unknown>>): SpreadRow[] {
  const out: SpreadRow[] = [];

  for (const item of rows) {
    const symbol = pickString(item.symbol) || pickString(item.name);
    const spread =
      pickNumber(item.spread_percent) ??
      pickNumber(item.spread) ??
      pickNumber(item.diff) ??
      pickNumber(item.value);

    if (!symbol) continue;

    out.push({
      symbol,
      spread,
    });
  }

  return out;
}

function mergeRows(
  frRows: FrRow[],
  doi1Rows: DoiRow[],
  doi5Rows: DoiRow[],
  spreadRows: SpreadRow[],
): UnifiedRow[] {
  const doi1Map = new Map<string, number | null>();
  const doi5Map = new Map<string, number | null>();
  const spreadMap = new Map<string, number | null>();

  for (const row of doi1Rows) {
    doi1Map.set(`${row.symbol}::${row.exchange}`, row.doi);
  }

  for (const row of doi5Rows) {
    doi5Map.set(`${row.symbol}::${row.exchange}`, row.doi);
  }

  for (const row of spreadRows) {
    spreadMap.set(row.symbol, row.spread);
  }

  return frRows.map((row) => ({
    symbol: row.symbol,
    exchange: row.exchange,
    fr: row.fr,
    spread: spreadMap.get(row.symbol) ?? null,
    doi1: doi1Map.get(`${row.symbol}::${row.exchange}`) ?? null,
    doi5: doi5Map.get(`${row.symbol}::${row.exchange}`) ?? null,
    nextFundingMs: row.nextFundingMs ?? null,
  }));
}

function getMetricValue(row: UnifiedRow, mode: RankingMode): number {
  switch (mode) {
    case "spread":
      return Math.abs(row.spread ?? 0);
    case "doi1":
      return Math.abs(row.doi1 ?? 0);
    case "doi5":
      return Math.abs(row.doi5 ?? 0);
    case "fr":
    default:
      return Math.abs(row.fr ?? 0);
  }
}

function exchangeBadge(exchange: string) {
  const ex = String(exchange || "").toLowerCase();

  if (ex === "binance") {
    return "border-yellow-400/20 bg-yellow-400/10 text-yellow-200";
  }
  if (ex === "bybit") {
    return "border-orange-400/20 bg-orange-400/10 text-orange-200";
  }
  if (ex === "bitget") {
    return "border-blue-400/20 bg-blue-400/10 text-blue-200";
  }
  if (ex === "mexc") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  }
  if (ex === "bingx") {
    return "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
  }
  return "border-white/10 bg-white/[0.04] text-white/70";
}

function formatPct(value: number | null, digits = 4) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function formatCountdown(nextFundingMs?: number | null) {
  if (!nextFundingMs || !Number.isFinite(nextFundingMs)) return "--";

  const diffMs = nextFundingMs - Date.now();
  if (diffMs <= 0) return "00:00";

  const totalMin = Math.floor(diffMs / 60000);
  const hh = String(Math.floor(totalMin / 60)).padStart(2, "0");
  const mm = String(totalMin % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function ToolbarLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
      {children}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? "btn-primary-soft" : "btn-secondary-soft"}
    >
      {children}
    </button>
  );
}

function RankingGrid({
  rows,
  mode,
}: {
  rows: UnifiedRow[];
  mode: RankingMode;
}) {
  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-white/55">
        表示できるランキングデータがありません。
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
      <div className="grid grid-cols-[68px_minmax(0,1.4fr)_120px_120px_120px_120px_120px_90px] gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
        <div>Rank</div>
        <div>Symbol</div>
        <div>Exchange</div>

        <div className={mode === "fr" ? "text-right text-cyan-300" : "text-right"}>
          FR
        </div>

        <div className={mode === "doi1" ? "text-right text-cyan-300" : "text-right"}>
          ΔOI1
        </div>

        <div className={mode === "doi5" ? "text-right text-cyan-300" : "text-right"}>
          ΔOI5
        </div>

        <div className={mode === "spread" ? "text-right text-cyan-300" : "text-right"}>
          Spread
        </div>

        <div className="text-right">Next</div>
      </div>

      <div className="divide-y divide-white/10">
        {rows.map((row, index) => (
          <div
            key={`${row.symbol}-${row.exchange}-${index}`}
            className="grid grid-cols-[68px_minmax(0,1.4fr)_120px_120px_120px_120px_120px_90px] gap-3 px-4 py-3 text-sm"
          >
            <div className="font-semibold text-white/70">{index + 1}</div>

            <div className="min-w-0">
              <div className="truncate font-medium text-white">{row.symbol}</div>
            </div>

            <div>
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${exchangeBadge(
                  row.exchange,
                )}`}
              >
                {row.exchange}
              </span>
            </div>

            <div
              className={`text-right font-semibold ${
                mode === "fr"
                  ? (row.fr ?? 0) > 0
                    ? "text-cyan-300"
                    : (row.fr ?? 0) < 0
                      ? "text-rose-300"
                      : "text-white/70"
                  : "text-white/80"
              }`}
            >
              {formatPct(row.fr)}
            </div>

            <div
              className={`text-right font-semibold ${
                mode === "doi1"
                  ? (row.doi1 ?? 0) > 0
                    ? "text-cyan-300"
                    : (row.doi1 ?? 0) < 0
                      ? "text-rose-300"
                      : "text-white/70"
                  : "text-white/75"
              }`}
            >
              {formatPct(row.doi1, 3)}
            </div>

            <div
              className={`text-right font-semibold ${
                mode === "doi5"
                  ? (row.doi5 ?? 0) > 0
                    ? "text-cyan-300"
                    : (row.doi5 ?? 0) < 0
                      ? "text-rose-300"
                      : "text-white/70"
                  : "text-white/75"
              }`}
            >
              {formatPct(row.doi5, 3)}
            </div>

            <div
              className={`text-right font-semibold ${
                mode === "spread"
                  ? (row.spread ?? 0) > 0
                    ? "text-cyan-300"
                    : (row.spread ?? 0) < 0
                      ? "text-rose-300"
                      : "text-white/70"
                  : "text-white/80"
              }`}
            >
              {formatPct(row.spread)}
            </div>

            <div className="text-right text-white/60">
              {formatCountdown(row.nextFundingMs)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function fetchJson(url: string): Promise<RawApi> {
  const res = await fetch(url, {
    cache: "no-store",
    credentials: "include",
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error((json as RawApi).error || (json as RawApi).message || `HTTP ${res.status}`);
  }

  return json as RawApi;
}

async function fetchOptionalJson(url: string): Promise<RawApi> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      credentials: "include",
    });

    if (!res.ok) return { rows: [] };

    const json = await res.json().catch(() => ({}));
    return json as RawApi;
  } catch {
    return { rows: [] };
  }
}

async function fetchMemberSpread(selectedPair: string[]): Promise<SpreadRow[]> {
  if (selectedPair.length !== 2) return [];

  const [a, b] = selectedPair;

  const json = await fetchOptionalJson(
    `/api/pro-spread-ranking?ex=${encodeURIComponent(`${a},${b}`)}`,
  );

  const rows = readRows(json);
  const out: SpreadRow[] = [];

  for (const item of rows) {
    const symbol = pickString(item.symbol) || pickString(item.name);

    const rawSpread =
      pickNumber(item.spread_percent) ??
      pickNumber(item.spread) ??
      pickNumber(item.diff) ??
      pickNumber(item.absSpread);

    if (!symbol || rawSpread === null || !Number.isFinite(rawSpread)) continue;

    out.push({
      symbol,
      spread: rawSpread,
    });
  }

  return out;
}

export default function RankingPage() {
  const [plan, setPlan] = useState<Plan>("public");
  const [mode, setMode] = useState<RankingMode>("fr");
  const [selected, setSelected] = useState<string[]>([...ALL_EXCHANGES]);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [spreadSelected, setSpreadSelected] = useState<string[]>(["binance", "bybit"]);
  const [rawRows, setRawRows] = useState<UnifiedRow[]>([]);
  const [viewState, setViewState] = useState<ViewState>("loading");

  const isMember = plan === "pro" || plan === "advance";
  const exParam = useMemo(() => selected.join(","), [selected]);
  const spreadPairKey = useMemo(() => spreadSelected.join(","), [spreadSelected]);

  function toggleSpreadExchange(ex: string) {
    setSpreadSelected((prev) => {
      const idx = prev.indexOf(ex);

      // 選択中を押したら外す
      if (idx !== -1) {
        const next = prev.filter((v) => v !== ex);

        // 0件にはしない
        if (next.length === 0) {
          return prev;
        }

        return next;
      }

      // 未選択を押したとき
      // 2件選択済みなら他は無反応
      if (prev.length >= 2) {
        return prev;
      }

      // 1件だけなら新しいものを2番目に追加
      return [...prev, ex];
    });
  }

  const rows = useMemo(() => {
    let copied = [...rawRows];

    if (mode === "spread") {
      const primaryExchange = spreadSelected[0];
      copied = copied.filter((row) => row.exchange === primaryExchange);
    }

    copied.sort((a, b) => {
      const av = getMetricValue(a, mode);
      const bv = getMetricValue(b, mode);

      if (bv !== av) return bv - av;
      return Math.abs(b.fr ?? 0) - Math.abs(a.fr ?? 0);
    });

    if (plan === "public") {
      return copied.slice(0, 3);
    }

    return copied;
  }, [rawRows, plan, mode, spreadSelected]);

  async function load(isRefresh = false, nextPlan?: Plan) {
    const currentPlan = nextPlan ?? plan;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setViewState("loading");
      }

      setError("");

      if (currentPlan === "public") {
        const [frJson, doi1Json, doi5Json, spreadRows] = await Promise.all([
          fetchJson(`/api/fr-ranking?ex=${encodeURIComponent(exParam)}`),
          fetchOptionalJson(`/api/public-doi-preview?window=1m&ex=${encodeURIComponent(exParam)}`),
          fetchOptionalJson(`/api/public-doi-preview?window=5m&ex=${encodeURIComponent(exParam)}`),
          fetchOptionalJson(
            `/api/public-spread-preview?ex=${encodeURIComponent(spreadSelected.join(","))}`,
          ),
        ]);

        const frRows = normalizeFrRows(readRows(frJson));
        const doi1Rows = normalizeDoiRows(readRows(doi1Json), "1m");
        const doi5Rows = normalizeDoiRows(readRows(doi5Json), "5m");
        const spreadRowsNormalized = normalizePublicSpreadRows(readRows(spreadRows));

        const merged = mergeRows(frRows, doi1Rows, doi5Rows, spreadRowsNormalized);
        setRawRows(merged);

      } else {
        const [currentJson, spreadRows] = await Promise.all([
          fetchJson(`/api/current?ex=${encodeURIComponent(exParam)}`),
          fetchMemberSpread(spreadSelected),
        ]);

        const rowsRaw = readRows(currentJson);
        console.log("RANKING_PLAN", currentPlan);
        console.log("CURRENT_ROWS_RAW", rowsRaw.slice(0, 5));

        const unified: UnifiedRow[] = rowsRaw
          .map((r) => ({
            symbol: pickString(r.symbol),
            exchange: pickString(r.exchange).toLowerCase(),
            fr:
              pickNumber(r.fr_percent) ??
              pickNumber(r.fr) ??
              pickNumber(r.funding_rate) ??
              pickNumber(r.fundingRate) ??
              pickNumber(r.rate),
            spread: null,
            doi1:
              pickNumber(r.doi1_percent) ??
              pickNumber(r.doi1) ??
              pickNumber(r.oi1_percent) ??
              pickNumber(r.oi1),
            doi5:
              pickNumber(r.doi5_percent) ??
              pickNumber(r.doi5) ??
              pickNumber(r.oi5_percent) ??
              pickNumber(r.oi5),
            nextFundingMs:
              pickNumber(r.next_funding_at_ms) ??
              pickNumber(r.nextFundingMs) ??
              pickNumber(r.next_funding_ms) ??
              pickNumber(r.nextFundingTime) ??
              pickNumber(r.next_funding_time),
          }))
          .filter((row) => row.symbol && row.exchange);
        
        console.log("CURRENT_UNIFIED", unified.slice(0, 5));  

        const spreadMap = new Map<string, number | null>();
        for (const row of spreadRows) {
          spreadMap.set(row.symbol, row.spread);
        }

        const merged: UnifiedRow[] = unified.map((row) => ({
          ...row,
          spread: spreadMap.get(row.symbol) ?? null,
        }));

        setRawRows(merged);
      }

      setLastUpdated(new Date());
      setViewState("ready");
    } catch (e) {
      console.error("RANKING_PAGE_LOAD_FAIL", e);
      setRawRows([]);
      setError("ランキングの取得に失敗しました。");
      setViewState("error");
    } finally {
      window.setTimeout(() => setRefreshing(false), 250);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", {
          cache: "no-store",
          credentials: "include",
        });
        const json: MeResponse = await res.json().catch(() => ({}));
        const nextPlan =
          json.plan === "pro" || json.plan === "advance" ? json.plan : "public";

        setPlan(nextPlan);
        await load(false, nextPlan);
      } catch {
        setPlan("public");
        await load(false, "public");
      }
    })();
  }, []);

  useEffect(() => {
    if (plan === "public") return;

    load(false, plan);

    const timer = setInterval(() => {
      load(true, plan);
    }, 60_000);

    return () => clearInterval(timer);
  }, [plan, exParam, spreadPairKey]);

  const updatedLabel = useMemo(() => {
    if (!lastUpdated) return "--:--:--";
    return new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(lastUpdated);
  }, [lastUpdated]);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="page-shell">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
              {isMember ? "Pro Ranking" : "Public Ranking"}
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Ranking
            </h1>
            <p className="mt-1 text-sm text-white/55">
              FR / Spread / ΔOI
              {mode === "spread"
                ? ` · ${spreadSelected[0]}${spreadSelected[1] ? ` / ${spreadSelected[1]}` : ""}`
                : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-white/55">
            <span>Updated {updatedLabel}</span>

            {isMember ? (
              <>
                <Link href="/app/billing" className="btn-secondary-soft">
                  Billing
                </Link>
                <button
                  type="button"
                  onClick={() => load(true, plan)}
                  disabled={refreshing}
                  className="btn-primary-soft disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </>
            ) : (
              <Link href="/pricing" className="btn-primary-soft">
                Unlock Pro
              </Link>
            )}
          </div>
        </div>

        {(
          <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex flex-wrap items-end gap-6">

              <div className="shrink-0">
                <ToolbarLabel>Mode</ToolbarLabel>
                <div className="flex flex-wrap gap-2">
                  <ModeButton active={mode === "fr"} onClick={() => setMode("fr")}>
                    FR
                  </ModeButton>
                  <ModeButton active={mode === "spread"} onClick={() => setMode("spread")}>
                    Spread
                  </ModeButton>
                  <ModeButton active={mode === "doi1"} onClick={() => setMode("doi1")}>
                    ΔOI1
                  </ModeButton>
                  <ModeButton active={mode === "doi5"} onClick={() => setMode("doi5")}>
                    ΔOI5
                  </ModeButton>
                </div>
              </div>

              {isMember && (
                <div className="min-w-[420px] flex-1">
                  <ToolbarLabel>Exchanges</ToolbarLabel>
                  <ExchangeFilter selected={selected} onChange={setSelected} />
                </div>
              )}

              <div className="min-w-[360px]">
                <ToolbarLabel>Spread Exchanges</ToolbarLabel>

                <div className="flex flex-wrap gap-2">
                  {ALL_EXCHANGES.map((ex) => {
                    const idx = spreadSelected.indexOf(ex);
                    const active = idx !== -1;

                    return (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => toggleSpreadExchange(ex)}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                          active
                            ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-200"
                            : "border-white/10 bg-black/20 text-white/65 hover:bg-white/[0.06]"
                        }`}
                      >
                        <span
                          className={`inline-flex h-4 min-w-4 items-center justify-center rounded text-[10px] leading-none ${
                            active
                              ? "bg-cyan-300 px-1 font-bold text-black"
                              : "border border-white/20 text-transparent"
                          }`}
                        >
                          {active ? idx + 1 : ""}
                        </span>
                        <span className="capitalize">{ex}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {!isMember && (
          <div className="mb-6 rounded-3xl border border-cyan-400/15 bg-cyan-400/[0.06] p-4 text-sm text-cyan-100/85">
            公開版では各モードの上位3件のみ表示しています。Exchange の詳細設定とフルランキングは Pro / Advance で利用できます。
          </div>
        )}

        {viewState === "loading" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-white/70">
            読み込み中...
          </div>
        )}

        {viewState === "error" && (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-red-200">
            {error}
          </div>
        )}

        {viewState === "ready" && <RankingGrid rows={rows} mode={mode} />}
      </div>
    </main>
  );
}