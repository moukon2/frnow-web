"use client";

import { useEffect, useMemo, useState } from "react";
import RankingTable, { type RankingRow } from "@/components/RankingTable";
import ExchangeFilter from "@/components/ExchangeFilter";
import PlanGateCard from "@/components/access/PlanGateCard";
import SpreadRankingTable from "@/components/SpreadRankingTable";
import DoiRankingTable, { type DoiRow } from "@/components/DoiRankingTable";
import Link from "next/link";

type ApiResponse = {
  rows?: Array<Record<string, unknown>>;
  pro?: boolean;
  error?: string;
  message?: string;
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
type ViewState =
  | "loading"
  | "ready"
  | "unauthenticated"
  | "forbidden"
  | "error";

type RankingMode = "standard" | "spread" | "doi";

const ALL_EXCHANGES = ["binance", "bybit", "bitget", "mexc", "bingx"];

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

function ToolbarLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
      {children}
    </div>
  );
}

export default function AppRankingPage() {
  const [mode, setMode] = useState<RankingMode>("standard");
  const [selected, setSelected] = useState<string[]>([
    "binance",
    "bybit",
    "bitget",
    "mexc",
    "bingx",
  ]);
  const [spreadSelected, setSpreadSelected] = useState<string[]>([
    "binance",
    "bybit",
  ]);
  const [doiWindow, setDoiWindow] = useState<"1m" | "5m">("5m");
  const [doiSort, setDoiSort] = useState<"doi" | "combined">("doi");

  const [rows, setRows] = useState<RankingRow[]>([]);
  const [spreadRows, setSpreadRows] = useState<SpreadRow[]>([]);
  const [doiRows, setDoiRows] = useState<DoiRow[]>([]);
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
          setDoiRows([]);
          setViewState("unauthenticated");
          return;
        }

        if (res.status === 403) {
          setRows([]);
          setSpreadRows([]);
          setDoiRows([]);
          setViewState("forbidden");
          return;
        }

        if (!res.ok) {
          throw new Error(json.error || json.message || `HTTP ${res.status}`);
        }

        const nextRows = normalizeRows(Array.isArray(json.rows) ? json.rows : []);
        setRows(nextRows);
        setSpreadRows([]);
        setDoiRows([]);
      } else if (mode === "spread") {
        if (spreadSelected.length !== 2) {
          setRows([]);
          setSpreadRows([]);
          setDoiRows([]);
          setViewState("ready");
          return;
        }

        const res = await fetch(
          `/api/pro-spread-ranking?ex=${encodeURIComponent(spreadExParam)}`,
          {
            cache: "no-store",
            credentials: "include",
          },
        );

        const json = await res.json().catch(() => ({}));

        if (res.status === 401) {
          setRows([]);
          setSpreadRows([]);
          setDoiRows([]);
          setViewState("unauthenticated");
          return;
        }

        if (res.status === 403) {
          setRows([]);
          setSpreadRows([]);
          setDoiRows([]);
          setViewState("forbidden");
          return;
        }

        if (!res.ok) {
          throw new Error(json.error || json.message || `HTTP ${res.status}`);
        }

        setSpreadRows(Array.isArray(json.rows) ? json.rows : []);
        setRows([]);
        setDoiRows([]);
      } else {
        const res = await fetch(
          `/api/pro-doi-ranking?ex=${encodeURIComponent(exParam)}&window=${doiWindow}&sort=${doiSort}`,
          {
            cache: "no-store",
            credentials: "include",
          },
        );

        const json = await res.json().catch(() => ({}));

        if (res.status === 401) {
          setRows([]);
          setSpreadRows([]);
          setDoiRows([]);
          setViewState("unauthenticated");
          return;
        }

        if (res.status === 403) {
          setRows([]);
          setSpreadRows([]);
          setDoiRows([]);
          setViewState("forbidden");
          return;
        }

        if (!res.ok) {
          throw new Error(json.error || json.message || `HTTP ${res.status}`);
        }

        setDoiRows(Array.isArray(json.rows) ? json.rows : []);
        setRows([]);
        setSpreadRows([]);
      }

      setLastUpdated(new Date());
      setViewState("ready");
    } catch (e) {
      console.error("APP_RANKING_LOAD_FAIL", e);
      setRows([]);
      setSpreadRows([]);
      setDoiRows([]);
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
  }, [mode, exParam, spreadExParam, doiWindow, doiSort]);

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
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
              Pro Ranking
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Ranking
            </h1>
            <p className="mt-1 text-sm text-white/55">
              Standard / Spread / ΔOI
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-white/55">
            <span>Updated {updatedLabel}</span>

            <Link href="/app/billing" className="btn-secondary-soft">
              Billing
            </Link>

            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshState === "refreshing"}
              className="btn-primary-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshState === "refreshing" ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {viewState === "loading" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/70">
            読み込み中...
          </div>
        )}

        {viewState === "unauthenticated" && (
          <PlanGateCard
            variant="login"
            planName="Pro"
            publicHref="/ranking"
            loginHref="/login"
            pricingHref="/pricing"
          />
        )}

        {viewState === "forbidden" && (
          <PlanGateCard
            variant="upgrade"
            planName="Pro"
            publicHref="/ranking"
            pricingHref="/pricing"
          />
        )}

        {viewState === "error" && (
          <PlanGateCard
            variant="error"
            planName="Pro"
            publicHref="/ranking"
            loginHref="/login"
            pricingHref="/pricing"
            description={error || "ランキングの取得に失敗しました。"}
          />
        )}

        {viewState === "ready" && (
          <>
            <section className="mb-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <div className="grid gap-4 xl:grid-cols-[auto_1fr_auto_auto] xl:items-start">
                <div>
                  <ToolbarLabel>Mode</ToolbarLabel>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
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
                      type="button"
                      onClick={() => setMode("spread")}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                        mode === "spread"
                          ? "bg-cyan-400 text-slate-950"
                          : "border border-white/10 bg-black/20 text-white/70 hover:bg-white/[0.06]"
                      }`}
                    >
                      Spread
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode("doi")}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                        mode === "doi"
                          ? "bg-cyan-400 text-slate-950"
                          : "border border-white/10 bg-black/20 text-white/70 hover:bg-white/[0.06]"
                      }`}
                    >
                      ΔOI
                    </button>
                  </div>
                </div>

                {(mode === "standard" || mode === "doi") && (
                  <div>
                    <ToolbarLabel>Exchanges</ToolbarLabel>
                    <ExchangeFilter selected={selected} onChange={setSelected} />
                  </div>
                )}

                {mode === "spread" && (
                  <div>
                    <ToolbarLabel>Spread</ToolbarLabel>
                    <div className="flex flex-wrap gap-2">
                      {ALL_EXCHANGES.map((exchange) => {
                        const index = spreadSelected.indexOf(exchange);
                        const active = index !== -1;

                        return (
                          <button
                            key={exchange}
                            type="button"
                            onClick={() => toggleSpreadExchange(exchange)}
                            className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                              active
                                ? "border-cyan-400 bg-cyan-400/10 text-cyan-200"
                                : "border-white/10 bg-black/20 text-white/70 hover:bg-white/[0.06]"
                            }`}
                          >
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-xs">
                              {active ? index + 1 : ""}
                            </span>
                            {exchange.toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {mode === "doi" && (
                  <>
                    <div>
                      <ToolbarLabel>Window</ToolbarLabel>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setDoiWindow("1m")}
                          className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                            doiWindow === "1m"
                              ? "bg-cyan-400 text-slate-950"
                              : "border border-white/10 bg-black/20 text-white/70 hover:bg-white/[0.06]"
                          }`}
                        >
                          1m
                        </button>

                        <button
                          type="button"
                          onClick={() => setDoiWindow("5m")}
                          className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                            doiWindow === "5m"
                              ? "bg-cyan-400 text-slate-950"
                              : "border border-white/10 bg-black/20 text-white/70 hover:bg-white/[0.06]"
                          }`}
                        >
                          5m
                        </button>
                      </div>
                    </div>

                    <div>
                      <ToolbarLabel>Sort</ToolbarLabel>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setDoiSort("doi")}
                          className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                            doiSort === "doi"
                              ? "bg-cyan-400 text-slate-950"
                              : "border border-white/10 bg-black/20 text-white/70 hover:bg-white/[0.06]"
                          }`}
                        >
                          ΔOI
                        </button>

                        <button
                          type="button"
                          onClick={() => setDoiSort("combined")}
                          className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                            doiSort === "combined"
                              ? "bg-cyan-400 text-slate-950"
                              : "border border-white/10 bg-black/20 text-white/70 hover:bg-white/[0.06]"
                          }`}
                        >
                          ΔOI + FR
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            <div className="mb-4 text-sm text-white/55">
              {mode === "standard" &&
                `FR / ${selected.map((v) => v.toUpperCase()).join(", ")}`}
              {mode === "spread" &&
                (spreadSelected.length === 2
                  ? `Spread / ${spreadSelected[0].toUpperCase()} vs ${spreadSelected[1].toUpperCase()}`
                  : "Spread")}
              {mode === "doi" &&
                `ΔOI ${doiWindow} / ${doiSort === "doi" ? "ΔOI順" : "ΔOI+FR順"} / ${selected
                  .map((v) => v.toUpperCase())
                  .join(", ")}`}
            </div>

            {mode === "standard" && <RankingTable data={rows} />}
            {mode === "spread" && <SpreadRankingTable data={spreadRows} />}
            {mode === "doi" && <DoiRankingTable data={doiRows} />}
          </>
        )}
      </div>
    </main>
  );
}