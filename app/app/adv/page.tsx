"use client";

import { useEffect, useMemo, useState } from "react";
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
type ViewState = "loading" | "ready" | "unauthenticated" | "forbidden" | "error";
type SideFilter = "all" | "long" | "short";
type PeriodFilter = "7d" | "30d" | "90d" | "all";

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

function HeroMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "cyan" | "red";
}) {
  const toneClass =
    tone === "cyan"
      ? "text-cyan-300"
      : tone === "red"
      ? "text-red-300"
      : "text-white";

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

function StatTile({
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
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">{label}</div>
      <div className={`mt-3 text-3xl font-semibold ${valueClassName}`}>{value}</div>
      {sub ? <div className="mt-2 text-xs text-white/40">{sub}</div> : null}
    </div>
  );
}

function BreakdownCards({
  title,
  rows,
  showProfitFactor = false,
}: {
  title: string;
  rows: BreakdownRow[];
  showProfitFactor?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="text-sm uppercase tracking-[0.16em] text-cyan-300">{title}</div>
          <div className="mt-1 text-sm text-white/50">フィルタ適用後の集計</div>
        </div>
        <div className="text-xs text-white/35">{rows.length} rows</div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/50">
          データがありません
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={`${title}-${row.key}`}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">{row.label}</div>
                  <div className="mt-1 text-xs text-white/40">{row.trades} trades</div>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80">
                    WR {fmtPct(row.win_rate)}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${badgeClassForBps(
                      row.avg_ret_bps,
                    )}`}
                  >
                    {fmtBps(row.avg_ret_bps)}
                  </span>
                  {showProfitFactor ? (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${badgeClassForPf(
                        row.profit_factor,
                      )}`}
                    >
                      PF {fmtNum(row.profit_factor, 2)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniLegend() {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-cyan-200">
        positive
      </span>
      <span className="rounded-full border border-red-400/20 bg-red-400/10 px-2.5 py-1 text-red-200">
        negative
      </span>
      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/70">
        neutral / unavailable
      </span>
    </div>
  );
}

export default function AppAdvPage() {
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [refreshState, setRefreshState] = useState<RefreshState>("idle");
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [period, setPeriod] = useState<PeriodFilter>("30d");
  const [exchangeFilter, setExchangeFilter] = useState<string>("all");
  const [sideFilter, setSideFilter] = useState<SideFilter>("all");

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
  const [byCloseReason, setByCloseReason] = useState<BreakdownRow[]>([]);
  const [recentTrades, setRecentTrades] = useState<AdvTradeRow[]>([]);

  const exchanges = useMemo(() => {
    const set = new Set<string>();
    for (const row of byExchange) {
      if (row.key) set.add(row.key);
    }
    return ["all", ...Array.from(set)];
  }, [byExchange]);

  async function load(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshState("refreshing");
      } else {
        setViewState("loading");
      }

      setError("");

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
      setByCloseReason(Array.isArray(json.by_close_reason) ? json.by_close_reason : []);
      setRecentTrades(Array.isArray(json.recent_trades) ? json.recent_trades : []);

      setLastUpdated(new Date());
      setViewState("ready");
    } catch (e) {
      console.error(e);
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

  const periodLabel = useMemo(() => {
    if (period === "7d") return "7D";
    if (period === "30d") return "30D";
    if (period === "90d") return "90D";
    return "ALL";
  }, [period]);

  const heroReturn =
    period === "7d"
      ? summary.ret_7d_bps
      : period === "30d"
      ? summary.ret_30d_bps
      : summary.avg_ret_bps;

  const heroReturnLabel =
    period === "7d"
      ? "7D Return"
      : period === "30d"
      ? "30D Return"
      : period === "90d"
      ? "90D Focus"
      : "Avg Ret";

  return (
    <main className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-8 rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-cyan-400/[0.05] p-6 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">Advance Only</div>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              ADV Performance Dashboard
            </h1>
            <p className="mt-4 text-white/70">
              FRNow Advance の記録済みシグナル実績を表示します。累積 ret_bps、
              ドローダウン、勝率、PF、直近のクローズ済みトレードを確認できます。
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white/70">
                Last updated: <span className="text-white">{updatedLabel}</span>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white/70">
                Auto refresh: <span className="text-white">10s</span>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white/70">
                View: <span className="text-white">{periodLabel}</span>
              </div>
              <div
                className={`rounded-full px-3 py-1.5 ${
                  refreshState === "refreshing"
                    ? "border border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
                    : "border border-white/10 bg-white/[0.04] text-white/60"
                }`}
              >
                {refreshState === "refreshing" ? "Updating..." : "Idle"}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-4 md:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-[0.16em] text-white/45">
                  Filters
                </div>
                <button
                  onClick={() => {
                    setPeriod("30d");
                    setExchangeFilter("all");
                    setSideFilter("all");
                  }}
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Reset
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-white/35">
                    Period
                  </label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                  >
                    <option value="7d">7D</option>
                    <option value="30d">30D</option>
                    <option value="90d">90D</option>
                    <option value="all">ALL</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-white/35">
                    Exchange
                  </label>
                  <select
                    value={exchangeFilter}
                    onChange={(e) => setExchangeFilter(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                  >
                    {exchanges.map((ex) => (
                      <option key={ex} value={ex}>
                        {ex === "all" ? "All Exchanges" : ex.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-white/35">
                    Side
                  </label>
                  <select
                    value={sideFilter}
                    onChange={(e) => setSideFilter(e.target.value as SideFilter)}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                  >
                    <option value="all">All Sides</option>
                    <option value="long">Long</option>
                    <option value="short">Short</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px] xl:max-w-[520px]">
            <HeroMetric
              label={heroReturnLabel}
              value={fmtBps(heroReturn)}
              tone={typeof heroReturn === "number" && heroReturn < 0 ? "red" : "cyan"}
            />
            <HeroMetric label="Win Rate" value={fmtPct(summary.win_rate)} tone="default" />
            <HeroMetric
              label="Profit Factor"
              value={fmtNum(summary.profit_factor, 2)}
              tone={
                typeof summary.profit_factor === "number" && summary.profit_factor < 1
                  ? "red"
                  : "cyan"
              }
            />
            <HeroMetric label="Trades" value={String(summary.total_trades)} tone="default" />
          </div>
        </div>
      </div>

      {viewState === "loading" && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white/70">
          読み込み中...
        </div>
      )}

      {viewState === "unauthenticated" && (
        <PlanGateCard
          variant="login"
          planName="Advance"
          publicHref="/adv"
          loginHref="/login?next=/app/adv"
        />
      )}

      {viewState === "forbidden" && (
        <PlanGateCard
          variant="upgrade"
          planName="Advance"
          publicHref="/adv"
          loginHref="/login?next=/app/adv"
        />
      )}

      {viewState === "error" && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            {error}
          </div>
          <PlanGateCard
            variant="error"
            planName="Advance"
            publicHref="/adv"
            loginHref="/login?next=/app/adv"
          />
        </div>
      )}

      {viewState === "ready" && (
        <>
          <div className="mb-8 grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <div className="text-sm uppercase tracking-[0.16em] text-cyan-300">
                    Cumulative Signal Return
                  </div>
                  <div className={`mt-2 text-3xl font-semibold ${toneClassForBps(heroReturn)}`}>
                    {fmtBps(heroReturn)}
                  </div>
                  <div className="mt-1 text-sm text-white/45">クローズ済み ret_bps ベース</div>
                </div>

                <button
                  onClick={() => load(true)}
                  disabled={refreshState === "refreshing"}
                  className="rounded-2xl border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {refreshState === "refreshing" ? "Refreshing..." : "Refresh now"}
                </button>
              </div>

              <AdvEquityChart data={equityCurve} height={340} />
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-4">
                <div className="text-sm uppercase tracking-[0.16em] text-cyan-300">Drawdown</div>
                <div className={`mt-2 text-3xl font-semibold ${toneClassForBps(summary.max_drawdown_bps)}`}>
                  {fmtBps(summary.max_drawdown_bps)}
                </div>
                <div className="mt-1 text-sm text-white/45">累積カーブに対する最大下振れ</div>
              </div>

              <AdvDrawdownChart data={drawdownCurve} height={340} />
            </div>
          </div>

          <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Win Rate"
              value={fmtPct(summary.win_rate)}
              sub="positive ret / total trades"
            />
            <StatTile
              label="Profit Factor"
              value={fmtNum(summary.profit_factor, 2)}
              sub="gross profit / gross loss"
              valueClassName={toneClassForPf(summary.profit_factor)}
            />
            <StatTile
              label="Avg Ret / Trade"
              value={fmtBps(summary.avg_ret_bps)}
              sub="平均 ret_bps"
              valueClassName={toneClassForBps(summary.avg_ret_bps)}
            />
            <StatTile
              label="Avg Hold"
              value={fmtMin(summary.avg_hold_min)}
              sub="平均保有時間"
            />
          </div>

          <div className="mb-8 grid gap-6 md:grid-cols-2">
            <StatTile
              label="Return 7D"
              value={fmtBps(summary.ret_7d_bps)}
              sub="直近7日"
              valueClassName={toneClassForBps(summary.ret_7d_bps)}
            />
            <StatTile
              label="Return 30D"
              value={fmtBps(summary.ret_30d_bps)}
              sub="直近30日"
              valueClassName={toneClassForBps(summary.ret_30d_bps)}
            />
          </div>

          <div className="mb-8 grid gap-6 xl:grid-cols-2">
            <BreakdownCards title="By Exchange" rows={byExchange} showProfitFactor />
            <BreakdownCards title="By Close Reason" rows={byCloseReason} />
          </div>

          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.16em] text-cyan-300">Outcome Log</div>
              <div className="mt-1 text-sm text-white/50">
                直近のクローズ済みトレード履歴です。現在のフィルタ条件が反映されます。
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 md:items-end">
              <div className="text-xs text-white/35">{recentTrades.length} rows</div>
              <MiniLegend />
            </div>
          </div>

          {recentTrades.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
              <div className="text-lg font-semibold text-white">表示できるトレードがありません</div>
              <div className="mt-2 text-sm text-white/50">
                フィルタ条件を変えるか、少し時間をおいて再度確認してください。
              </div>
            </div>
          ) : (
            <AdvRealtimeTradesTable
              data={recentTrades}
              fading={refreshState === "refreshing"}
            />
          )}

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/50">
            表示指標は記録済みシグナル結果ベースであり、口座連携された実現損益ではありません。
          </div>
        </>
      )}
    </main>
  );
}