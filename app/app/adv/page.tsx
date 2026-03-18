"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PlanGateCard from "@/components/access/PlanGateCard";
import AdvRealtimeTradesTable, {
  type AdvTradeRow,
} from "@/components/AdvRealtimeTradesTable";
import {
  AdvDrawdownChart,
  AdvEquityChart,
  type PerformancePoint,
} from "@/components/adv/AdvPerformanceChart";

type Summary = {
  total_trades: number;
  win_rate: number | null;
  avg_ret_bps: number | null;
  profit_factor: number | null;
  avg_hold_min: number | null;
  max_drawdown_bps: number | null;
  ret_7d_bps: number | null;
  ret_30d_bps: number | null;
};

type BreakdownRow = {
  key: string;
  label: string;
  trades: number;
  win_rate: number | null;
  avg_ret_bps: number | null;
  profit_factor?: number | null;
};

type PerformanceApiResponse = {
  summary?: Summary;
  equity_curve?: PerformancePoint[];
  drawdown_curve?: PerformancePoint[];
  by_exchange?: BreakdownRow[];
  by_side?: BreakdownRow[];
  by_close_reason?: BreakdownRow[];
  recent_trades?: AdvTradeRow[];
  error?: string;
  message?: string;
};

type RefreshState = "idle" | "refreshing";
type ViewState =
  | "checking-plan"
  | "loading"
  | "ready"
  | "unauthenticated"
  | "forbidden"
  | "error";
type SideFilter = "all" | "long" | "short";
type PeriodFilter = "7d" | "30d" | "90d" | "all";
type Plan = "public" | "pro" | "advance";

type MeResponse = {
  loggedIn?: boolean;
  plan?: string | null;
  billing_status?: string | null;
  error?: string;
  message?: string;
};

function normalizePlan(plan: unknown): Plan {
  const p = String(plan || "").trim().toLowerCase();
  if (p === "advance" || p === "adv") return "advance";
  if (p === "pro") return "pro";
  return "public";
}

function fmtBps(v: number | null | undefined, digits = 1): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "--";
  return `${v > 0 ? "+" : ""}${v.toFixed(digits)} bps`;
}

function fmtPct(v: number | null | undefined, digits = 1): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "--";
  return `${v.toFixed(digits)}%`;
}

function fmtMin(v: number | null | undefined): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "--";
  return `${Math.round(v)}m`;
}

function fmtNum(v: number | null | undefined, digits = 2): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "--";
  return v.toFixed(digits);
}

function toneClassForBps(v: number | null | undefined): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "text-white";
  if (v > 0) return "text-cyan-300";
  if (v < 0) return "text-red-300";
  return "text-white";
}

function toneClassForPf(v: number | null | undefined): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "text-white";
  if (v >= 1.2) return "text-cyan-300";
  if (v >= 1.0) return "text-white";
  return "text-red-300";
}

function badgeClassForBps(v: number | null | undefined): string {
  if (typeof v !== "number" || !Number.isFinite(v)) {
    return "border border-white/10 bg-white/5 text-white/60";
  }
  if (v > 0) {
    return "border border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
  }
  if (v < 0) {
    return "border border-red-400/20 bg-red-400/10 text-red-200";
  }
  return "border border-white/10 bg-white/5 text-white/70";
}

function badgeClassForPf(v: number | null | undefined): string {
  if (typeof v !== "number" || !Number.isFinite(v)) {
    return "border border-white/10 bg-white/5 text-white/60";
  }
  if (v >= 1.2) {
    return "border border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
  }
  if (v >= 1.0) {
    return "border border-white/10 bg-white/5 text-white/80";
  }
  return "border border-red-400/20 bg-red-400/10 text-red-200";
}

function insightTone(v: number | null | undefined): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "text-white/75";
  if (v > 0) return "text-cyan-200";
  if (v < 0) return "text-red-200";
  return "text-white/80";
}

function MetricTile({
  label,
  value,
  sub,
  valueClassName = "text-white",
}: {
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${valueClassName}`}>{value}</div>
      {sub ? <div className="mt-1 text-xs text-white/50">{sub}</div> : null}
    </div>
  );
}

function InsightCard({
  title,
  body,
  tone = "text-white/80",
}: {
  title: string;
  body: string;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">{title}</div>
      <div className={`mt-2 text-sm leading-6 ${tone}`}>{body}</div>
    </div>
  );
}

function BreakdownCards({
  title,
  rows,
  showProfitFactor = false,
  gridClassName = "grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
}: {
  title: string;
  rows: BreakdownRow[];
  showProfitFactor?: boolean;
  gridClassName?: string;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <div className="text-xs text-white/45">{rows.length} rows</div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/55">
          データがありません
        </div>
      ) : (
        <div className={gridClassName}>
          {rows.map((row) => (
            <div
              key={`${title}-${row.key}`}
              className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <div className="min-w-0 text-[13px] font-semibold leading-5 text-white break-words">
                {row.label}
              </div>

              <div className="mt-1 text-xs text-white/45">{row.trades} trades</div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs ${badgeClassForBps(row.avg_ret_bps)}`}
                >
                  {fmtBps(row.avg_ret_bps)}
                </span>

                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75">
                  WR {fmtPct(row.win_rate)}
                </span>

                {showProfitFactor ? (
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${badgeClassForPf(
                      row.profit_factor,
                    )}`}
                  >
                    PF {fmtNum(row.profit_factor, 2)}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function AppAdvPage() {
  const [viewState, setViewState] = useState<ViewState>("checking-plan");
  const [refreshState, setRefreshState] = useState<RefreshState>("idle");
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [period, setPeriod] = useState<PeriodFilter>("30d");
  const [exchangeFilter, setExchangeFilter] = useState("all");
  const [sideFilter, setSideFilter] = useState<SideFilter>("all");
  const [plan, setPlan] = useState<Plan>("public");

  const [summary, setSummary] = useState<Summary>({
    total_trades: 0,
    win_rate: null,
    avg_ret_bps: null,
    profit_factor: null,
    avg_hold_min: null,
    max_drawdown_bps: null,
    ret_7d_bps: null,
    ret_30d_bps: null,
  });

  const [equityCurve, setEquityCurve] = useState<PerformancePoint[]>([]);
  const [drawdownCurve, setDrawdownCurve] = useState<PerformancePoint[]>([]);
  const [byExchange, setByExchange] = useState<BreakdownRow[]>([]);
  const [bySide, setBySide] = useState<BreakdownRow[]>([]);
  const [byCloseReason, setByCloseReason] = useState<BreakdownRow[]>([]);
  const [recentTrades, setRecentTrades] = useState<AdvTradeRow[]>([]);

  const exchanges = useMemo(() => {
    const set = new Set<string>();
    for (const row of byExchange) {
      if (row.key) set.add(row.key);
    }
    return ["all", ...Array.from(set)];
  }, [byExchange]);

  async function checkPlan(): Promise<"ok" | "unauthenticated" | "forbidden" | "error"> {
    try {
      const res = await fetch("/api/me", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const json: MeResponse = await res.json().catch(() => ({}));

      if (res.status === 401 || json.loggedIn === false) {
        setPlan("public");
        return "unauthenticated";
      }

      if (!res.ok) {
        throw new Error(json.error || json.message || `HTTP ${res.status}`);
      }

      const nextPlan = normalizePlan(json.plan);
      setPlan(nextPlan);

      if (nextPlan !== "advance") {
        return "forbidden";
      }

      return "ok";
    } catch (e) {
      console.error("APP_ADV_PLAN_CHECK_FAIL", e);
      return "error";
    }
  }

  async function load(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshState("refreshing");
      } else {
        setViewState("checking-plan");
      }

      setError("");

      const gate = await checkPlan();

      if (gate === "unauthenticated") {
        setViewState("unauthenticated");
        return;
      }

      if (gate === "forbidden") {
        setViewState("forbidden");
        return;
      }

      if (gate === "error") {
        throw new Error("plan_check_failed");
      }

      if (isRefresh) {
        setRefreshState("refreshing");
      } else {
        setViewState("loading");
      }

      const qs = new URLSearchParams();
      qs.set("period", period);
      qs.set("limit", "50");
      if (exchangeFilter !== "all") qs.set("exchange", exchangeFilter);
      if (sideFilter !== "all") qs.set("side", sideFilter);

      const res = await fetch(`/api/pro-adv-performance?${qs.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });

      let json: PerformanceApiResponse = {};
      try {
        json = await res.json();
      } catch {
        json = {};
      }

      if (res.status === 401) {
        setViewState("unauthenticated");
        return;
      }

      if (res.status === 403) {
        setViewState("forbidden");
        return;
      }

      if (!res.ok) {
        throw new Error(json.error || json.message || `HTTP ${res.status}`);
      }

      setSummary(
        json.summary ?? {
          total_trades: 0,
          win_rate: null,
          avg_ret_bps: null,
          profit_factor: null,
          avg_hold_min: null,
          max_drawdown_bps: null,
          ret_7d_bps: null,
          ret_30d_bps: null,
        },
      );
      setEquityCurve(Array.isArray(json.equity_curve) ? json.equity_curve : []);
      setDrawdownCurve(Array.isArray(json.drawdown_curve) ? json.drawdown_curve : []);
      setByExchange(Array.isArray(json.by_exchange) ? json.by_exchange : []);
      setBySide(Array.isArray(json.by_side) ? json.by_side : []);
      setByCloseReason(Array.isArray(json.by_close_reason) ? json.by_close_reason : []);
      setRecentTrades(Array.isArray(json.recent_trades) ? json.recent_trades : []);
      setLastUpdated(new Date());
      setViewState("ready");
    } catch (e) {
      console.error("APP_ADV_LOAD_FAIL", e);
      setError("ADV performance データの取得に失敗しました。");
      setViewState("error");
    } finally {
      window.setTimeout(() => setRefreshState("idle"), 250);
    }
  }

  useEffect(() => {
    load(false);
    const timer = setInterval(() => load(true), 10_000);
    return () => clearInterval(timer);
  }, [period, exchangeFilter, sideFilter]);

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

  const heroReturn =
    period === "7d"
      ? summary.ret_7d_bps
      : period === "30d"
        ? summary.ret_30d_bps
        : summary.avg_ret_bps;

  const bestExchange = useMemo(() => {
    return [...byExchange]
      .filter((row) => row.trades > 0)
      .sort((a, b) => (b.avg_ret_bps ?? -Infinity) - (a.avg_ret_bps ?? -Infinity))[0];
  }, [byExchange]);

  const mostUsedCloseReason = useMemo(() => {
    return [...byCloseReason].sort((a, b) => b.trades - a.trades)[0];
  }, [byCloseReason]);

  const bestSide = useMemo(() => {
    return [...bySide]
      .filter((row) => row.trades > 0)
      .sort((a, b) => (b.avg_ret_bps ?? -Infinity) - (a.avg_ret_bps ?? -Infinity))[0];
  }, [bySide]);

  const insightCards = useMemo(() => {
    return [
      {
        title: "Best Exchange",
        body: bestExchange
          ? `${bestExchange.label} が ${fmtBps(bestExchange.avg_ret_bps)} / WR ${fmtPct(bestExchange.win_rate)} / ${bestExchange.trades} trades`
          : "まだ比較できる取引所データがありません。",
        tone: insightTone(bestExchange?.avg_ret_bps),
      },
      {
        title: "Best Side",
        body: bestSide
          ? `${bestSide.label.toUpperCase()} が ${fmtBps(bestSide.avg_ret_bps)} / WR ${fmtPct(bestSide.win_rate)} / ${bestSide.trades} trades`
          : "LONG / SHORT の比較データがまだありません。",
        tone: insightTone(bestSide?.avg_ret_bps),
      },
      {
        title: "Main Close Reason",
        body: mostUsedCloseReason
          ? `${mostUsedCloseReason.label} が最多で ${mostUsedCloseReason.trades} trades。平均 ${fmtBps(mostUsedCloseReason.avg_ret_bps)}。`
          : "close reason の集計データがまだありません。",
        tone: insightTone(mostUsedCloseReason?.avg_ret_bps),
      },
    ];
  }, [bestExchange, bestSide, mostUsedCloseReason]);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-cyan-300/80">
              Advance Only
            </div>
            <h1 className="mt-1 text-2xl font-semibold md:text-3xl">ADV Stats Dashboard</h1>
            <p className="mt-1 text-sm text-white/55">
              記録済みシグナル実績・累積推移・直近アウトカムを確認
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-white/55">
            <span>Updated {updatedLabel}</span>
            <span className="badge-plan-adv">{plan === "advance" ? "ADV" : "PLAN"}</span>

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

        {(viewState === "checking-plan" || viewState === "loading") && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/70">
            読み込み中...
          </div>
        )}

        {viewState === "unauthenticated" && (
          <PlanGateCard
            variant="login"
            planName="Advance"
            publicHref="/adv"
            loginHref="/login"
            pricingHref="/pricing"
          />
        )}

        {viewState === "forbidden" && (
          <PlanGateCard
            variant="upgrade"
            planName="Advance"
            publicHref="/adv"
            pricingHref="/pricing"
          />
        )}

        {viewState === "error" && (
          <PlanGateCard
            variant="error"
            planName="Advance"
            publicHref="/adv"
            loginHref="/login"
            pricingHref="/pricing"
            description={error || "ADV performance データの取得に失敗しました。"}
          />
        )}

        {viewState === "ready" && (
          <>
            <section className="mb-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <div className="grid gap-4 xl:grid-cols-4">
                <label className="block">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    Period
                  </div>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
                  >
                    <option value="7d">7D</option>
                    <option value="30d">30D</option>
                    <option value="90d">90D</option>
                    <option value="all">ALL</option>
                  </select>
                </label>

                <label className="block">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    Exchange
                  </div>
                  <select
                    value={exchangeFilter}
                    onChange={(e) => setExchangeFilter(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
                  >
                    {exchanges.map((ex) => (
                      <option key={ex} value={ex}>
                        {ex === "all" ? "All Exchanges" : ex.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    Side
                  </div>
                  <select
                    value={sideFilter}
                    onChange={(e) => setSideFilter(e.target.value as SideFilter)}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
                  >
                    <option value="all">All</option>
                    <option value="long">Long</option>
                    <option value="short">Short</option>
                  </select>
                </label>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      setPeriod("30d");
                      setExchangeFilter("all");
                      setSideFilter("all");
                    }}
                    className="w-full rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </section>

            <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <MetricTile
                label={period === "7d" ? "7D Return" : period === "30d" ? "30D Return" : "Avg Ret"}
                value={fmtBps(heroReturn)}
                valueClassName={toneClassForBps(heroReturn)}
                sub="ret_bps based"
              />
              <MetricTile
                label="Drawdown"
                value={fmtBps(summary.max_drawdown_bps)}
                valueClassName={toneClassForBps(summary.max_drawdown_bps)}
                sub="max pullback"
              />
              <MetricTile
                label="Trades"
                value={String(summary.total_trades ?? 0)}
                sub="closed outcomes"
              />
              <MetricTile
                label="Win Rate"
                value={fmtPct(summary.win_rate)}
                valueClassName={toneClassForBps(
                  typeof summary.win_rate === "number" ? summary.win_rate - 50 : null,
                )}
                sub="positive ret_bps ratio"
              />
              <MetricTile
                label="PF"
                value={fmtNum(summary.profit_factor, 2)}
                valueClassName={toneClassForPf(summary.profit_factor)}
                sub="gross win / gross loss"
              />
              <MetricTile label="Avg Hold" value={fmtMin(summary.avg_hold_min)} sub="average hold time" />
            </div>

            <div className="mb-4 grid gap-3 xl:grid-cols-3">
              {insightCards.map((item) => (
                <InsightCard key={item.title} title={item.title} body={item.body} tone={item.tone} />
              ))}
            </div>

            <div className="mb-4 grid gap-4 xl:grid-cols-2">
              <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-3">
                  <h2 className="text-base font-semibold text-white">Cumulative Return</h2>
                  <p className="mt-1 text-xs text-white/45">ret_bps ベースの累積推移</p>
                </div>
                <AdvEquityChart data={equityCurve} />
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-3">
                  <h2 className="text-base font-semibold text-white">Drawdown</h2>
                  <p className="mt-1 text-xs text-white/45">ピークからの下振れ</p>
                </div>
                <AdvDrawdownChart data={drawdownCurve} />
              </section>
            </div>

            <div className="mb-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <BreakdownCards
                title="By Exchange"
                rows={byExchange}
                showProfitFactor
                gridClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
              />

              <BreakdownCards
                title="By Side"
                rows={bySide}
                showProfitFactor
                gridClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-2"
              />
            </div>

            <div className="mb-4">
              <BreakdownCards
                title="By Close Reason"
                rows={byCloseReason}
                showProfitFactor
                gridClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
              />
            </div>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-white">Outcome Log</h2>
                  <p className="mt-1 text-xs text-white/45">直近のクローズ済みトレード</p>
                </div>
                <div className="text-xs text-white/45">{recentTrades.length} rows</div>
              </div>

              {recentTrades.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-white">表示できるトレードがありません</div>
                  <div className="mt-2 text-sm text-white/55">
                    フィルタ条件を変えるか、少し時間をおいて再度確認してください。
                  </div>
                </div>
              ) : (
                <AdvRealtimeTradesTable data={recentTrades} />
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
