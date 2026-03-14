"use client";

import { useEffect, useMemo, useState } from "react";
import RankingTable, { type RankingRow } from "@/components/RankingTable";
import ExchangeFilter from "@/components/ExchangeFilter";
import PlanGateCard from "@/components/access/PlanGateCard";
import SpreadRankingTable from "@/components/SpreadRankingTable";

type ApiResponse = {
  rows?: Array<Record<string, unknown>>;
  pro?: boolean;
  error?: string;
};

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

type RefreshState = "idle" | "refreshing";
type ViewState = "loading" | "ready" | "unauthenticated" | "forbidden" | "error";
type RankingMode = "standard" | "spread";

const ALL_EXCHANGES = ["binance", "bybit", "bitget", "mexc"];

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

function isRankingRow(v: RankingRow | null): v is RankingRow {
  return v !== null;
}

function normalizeRows(rows: Array<Record<string, unknown>>): RankingRow[] {
  const mapped: Array<RankingRow | null> = rows.map((item, index) => {
    const symbol = pickString(item.symbol) || pickString(item.name);
    const exchange = pickString(item.exchange) || pickString(item.ex);

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
  });

  return mapped.filter(isRankingRow);
}

export default function AppRankingPage() {
  const [mode, setMode] = useState<RankingMode>("standard");

  const [selected, setSelected] = useState<string[]>([
    "binance",
    "bybit",
    "bitget",
    "mexc",
  ]);

  const [spreadSelected, setSpreadSelected] = useState<string[]>([
    "binance",
    "bybit",
  ]);

  const [rows, setRows] = useState<RankingRow[]>([]);
  const [spreadRows, setSpreadRows] = useState<SpreadRow[]>([]);

  const [viewState, setViewState] = useState<ViewState>("loading");
  const [error, setError] = useState("");
  const [refreshState, setRefreshState] = useState<RefreshState>("idle");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const exParam = useMemo(() => selected.join(","), [selected]);
  const spreadExParam = useMemo(() => spreadSelected.join(","), [spreadSelected]);

  function toggleSpreadExchange(exchange: string) {
    setSpreadSelected((prev) => {
      if (prev.includes(exchange)) {
        return prev.filter((v) => v !== exchange);
      }

      if (prev.length === 2) {
        return [prev[1], exchange];
      }

      return [...prev, exchange];
    });
  }

  async function load(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshState("refreshing");
      } else {
        setViewState("loading");
      }

      setError("");

      if (mode === "standard") {
        const res = await fetch(`/api/pro-ranking?ex=${encodeURIComponent(exParam)}`, {
          cache: "no-store",
          credentials: "include",
        });

        let json: ApiResponse = {};
        try {
          json = await res.json();
        } catch {
          json = {};
        }

        if (res.status === 401) {
          setRows([]);
          setSpreadRows([]);
          setViewState("unauthenticated");
          return;
        }

        if (res.status === 403) {
          setRows([]);
          setSpreadRows([]);
          setViewState("forbidden");
          return;
        }

        if (!res.ok) {
          throw new Error(json.error || `HTTP ${res.status}`);
        }

        const nextRows = normalizeRows(Array.isArray(json.rows) ? json.rows : []);
        setRows(nextRows);
        setSpreadRows([]);
      } else {
        if (spreadSelected.length !== 2) {
          setRows([]);
          setSpreadRows([]);
          setViewState("ready");
          return;
        }

        const res = await fetch(
          `/api/pro-spread-ranking?ex=${encodeURIComponent(spreadExParam)}`,
          {
            cache: "no-store",
            credentials: "include",
          }
        );

        const json = await res.json().catch(() => ({}));

        if (res.status === 401) {
          setRows([]);
          setSpreadRows([]);
          setViewState("unauthenticated");
          return;
        }

        if (res.status === 403) {
          setRows([]);
          setSpreadRows([]);
          setViewState("forbidden");
          return;
        }

        if (!res.ok) {
          throw new Error(json.error || `HTTP ${res.status}`);
        }

        setSpreadRows(Array.isArray(json.rows) ? json.rows : []);
        setRows([]);
      }

      setLastUpdated(new Date());
      setViewState("ready");
    } catch (e) {
      console.error(e);
      setRows([]);
      setSpreadRows([]);
      setError("ランキングの取得に失敗しました。");
      setViewState("error");
    } finally {
      window.setTimeout(() => setRefreshState("idle"), 250);
    }
  }

  useEffect(() => {
    load(false);

    const timer = setInterval(() => {
      load(true);
    }, 60_000);

    return () => clearInterval(timer);
  }, [mode, exParam, spreadExParam]);

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
    <main className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">
            Pro Ranking
          </div>
          <h1 className="mt-3 text-4xl font-bold">Funding Rate Ranking</h1>
          <p className="mt-4 text-white/70">
            Standard は通常ランキング、Spread は選択した2取引所間の FR 差ランキングです。
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
          <div>Last updated</div>
          <div className="mt-1 font-medium text-white">{updatedLabel}</div>
        </div>
      </div>

      {viewState === "ready" && (
        <>
          <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-3 text-sm text-white/60">Mode</div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setMode("standard")}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  mode === "standard"
                    ? "bg-cyan-400 text-slate-950"
                    : "border border-white/10 bg-black/20 text-white/70 hover:bg-white/[0.06]"
                }`}
              >
                Standard
              </button>

              <button
                onClick={() => setMode("spread")}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  mode === "spread"
                    ? "bg-cyan-400 text-slate-950"
                    : "border border-white/10 bg-black/20 text-white/70 hover:bg-white/[0.06]"
                }`}
              >
                Spread
              </button>
            </div>
          </div>

          {mode === "standard" && (
            <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-3 text-sm text-white/60">Filter Exchanges</div>
              <ExchangeFilter selected={selected} onChange={setSelected} />
            </div>
          )}

          {mode === "spread" && (
            <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-2 text-sm text-white/60">Select 2 exchanges</div>

              <div className="mb-4 text-xs text-white/40">
                選択した2取引所の Funding Rate spread をランキング表示します
              </div>

              <div className="flex flex-wrap gap-3">
                {ALL_EXCHANGES.map((exchange) => {
                  const index = spreadSelected.indexOf(exchange);
                  const active = index !== -1;

                  return (
                    <button
                      key={exchange}
                      onClick={() => toggleSpreadExchange(exchange)}
                      className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "border-cyan-400 bg-cyan-400/10 text-cyan-200"
                          : "border-white/10 bg-black/20 text-white/70 hover:bg-white/[0.06]"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                          active
                            ? "bg-cyan-400 text-black"
                            : "bg-white/10 text-white/40"
                        }`}
                      >
                        {active ? index + 1 : ""}
                      </span>

                      {exchange.toUpperCase()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 text-sm text-white/50">
                {spreadSelected.length === 2 ? (
                  <>
                    Spread:{" "}
                    <span className="font-semibold text-white">
                      {spreadSelected[0].toUpperCase()}
                    </span>
                    {" vs "}
                    <span className="font-semibold text-white">
                      {spreadSelected[1].toUpperCase()}
                    </span>
                  </>
                ) : (
                  "2つの取引所を選択してください"
                )}
              </div>
            </div>
          )}
        </>
      )}

      {viewState === "loading" && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white/70">
          読み込み中...
        </div>
      )}

      {viewState === "unauthenticated" && (
        <PlanGateCard
          variant="login"
          planName="Pro"
          publicHref="/ranking"
          loginHref="/login?next=/app/ranking"
        />
      )}

      {viewState === "forbidden" && (
        <PlanGateCard
          variant="upgrade"
          planName="Pro"
          publicHref="/ranking"
          loginHref="/login?next=/app/ranking"
        />
      )}

      {viewState === "error" && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            {error}
          </div>
          <PlanGateCard
            variant="error"
            planName="Pro"
            publicHref="/ranking"
            loginHref="/login?next=/app/ranking"
          />
        </div>
      )}

      {viewState === "ready" && (
        <>
          <div className="mb-4 flex items-center justify-between text-sm">
            <div className="text-white/50">
              {mode === "standard"
                ? `選択中: ${selected.map((v) => v.toUpperCase()).join(", ")}`
                : spreadSelected.length === 2
                ? `Spread: ${spreadSelected[0].toUpperCase()} vs ${spreadSelected[1].toUpperCase()}`
                : "Spread mode"}
            </div>

            <div
              className={`transition-all duration-300 ${
                refreshState === "refreshing"
                  ? "translate-y-0 opacity-100 text-cyan-300"
                  : "translate-y-1 opacity-0"
              }`}
            >
              Updating...
            </div>
          </div>

          {mode === "standard" ? (
            <RankingTable
              data={rows}
              fading={refreshState === "refreshing"}
            />
          ) : (
            <SpreadRankingTable
              data={spreadSelected.length === 2 ? spreadRows : []}
              fading={refreshState === "refreshing"}
            />
          )}
        </>
      )}
    </main>
  );
}