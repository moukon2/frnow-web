"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import RankingTable, { type RankingRow } from "@/components/RankingTable";
import ExchangeFilter from "@/components/ExchangeFilter";

type ApiResponse = {
  rows?: Array<Record<string, unknown>>;
  available_exchanges?: string[];
  selected_exchanges?: string[];
  pro?: boolean;
  error?: string;
  message?: string;
};

type RefreshState = "idle" | "refreshing";
type ViewState = "loading" | "ready" | "error";

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

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
        {eyebrow}
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
        {title}
      </h1>
      <p className="mt-4 text-sm leading-7 text-white/65 md:text-base">
        {description}
      </p>
    </div>
  );
}

function InfoCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-white/65">{body}</p>
    </div>
  );
}

export default function PublicRankingPage() {
  const [selected, setSelected] = useState<string[]>([
    "binance",
    "bybit",
    "bitget",
    "mexc",
    "bingx",
  ]);
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [refreshState, setRefreshState] = useState<RefreshState>("idle");
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const exParam = useMemo(() => selected.join(","), [selected]);

  async function load(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshState("refreshing");
      } else {
        setViewState("loading");
      }

      setError("");

      const res = await fetch(`/api/fr-ranking?ex=${encodeURIComponent(exParam)}`, {
        cache: "no-store",
      });

      let json: ApiResponse = {};
      try {
        json = await res.json();
      } catch {
        json = {};
      }

      if (!res.ok) {
        throw new Error(json.error || json.message || `HTTP ${res.status}`);
      }

      const nextRows = normalizeRows(Array.isArray(json.rows) ? json.rows : []);
      setRows(nextRows);
      setLastUpdated(new Date());
      setViewState("ready");
    } catch (e) {
      console.error("PUBLIC_RANKING_LOAD_FAIL", e);
      setRows([]);
      setError("公開ランキングの取得に失敗しました。");
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
  }, [exParam]);

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
    <main className="bg-black text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <SectionTitle
            eyebrow="Public Ranking"
            title="Funding Rate の偏りを、公開ランキングで確認"
            description="FRNow の公開ランキングでは、Funding Rate の偏りが強い銘柄を一覧で確認できます。Binance、Bybit、Bitget、MEXC、BingX の先物データを対象に、どの取引所で過熱や偏りが出ているかを見やすく整理しています。"
          />

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="inline-flex items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
            >
              Pro / Advance を見る
            </Link>
            <Link
              href="/adv"
              className="inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              ADV紹介を見る
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-2 text-xs text-white/45">
            {[
              "Binance",
              "Bybit",
              "Bitget",
              "MEXC",
              "BingX",
              "Public ranking",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white/85">
                Filter Exchanges
              </div>
              <div className="mt-2 text-sm text-white/55">
                公開版でも対応取引所の Funding Rate を横断して確認できます。
              </div>
            </div>

            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshState === "refreshing"}
              className="rounded-2xl border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshState === "refreshing" ? "Refreshing..." : "Refresh now"}
            </button>
          </div>

          <div className="mt-6">
            <ExchangeFilter selected={selected} onChange={setSelected} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white/55">
            <span>Last updated: {updatedLabel}</span>
            <span>Selected: {selected.map((v) => v.toUpperCase()).join(", ")}</span>
          </div>
        </div>

        <div className="mt-6">
          {viewState === "loading" && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-white/70">
              読み込み中...
            </div>
          )}

          {viewState === "error" && (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-red-200">
              {error || "エラーが発生しました。"}
            </div>
          )}

          {viewState === "ready" && <RankingTable data={rows} />}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <InfoCard
            title="公開版でできること"
            body="Funding Rate の偏りが強い銘柄を一覧で確認し、市場の過熱感や需給の偏りをざっくり掴めます。"
          />
          <InfoCard
            title="Pro で広がること"
            body="会員向けランキング、取引所フィルタ、spread ranking を使って、複数取引所の比較をより深く見られます。"
          />
          <InfoCard
            title="Advance で見られること"
            body="ADV signals と performance dashboard により、FR+OI の挙動やシグナル履歴まで継続的に確認できます。"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="overflow-hidden rounded-[36px] border border-cyan-400/15 bg-[linear-gradient(135deg,rgba(34,211,238,0.10),rgba(255,255,255,0.03))] p-8 md:p-10">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
              Upgrade
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              ランキングをもっと深く見るなら、
              <br />
              Pro / Advance へ
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/65 md:text-base">
              公開版は入口として使いやすくしています。より深い比較や ADV シグナルまで見たい場合は、
              Pro / Advance に進む構成です。
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className="inline-flex items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15"
              >
                料金プランを見る
              </Link>
              <Link
                href="/app/ranking"
                className="inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                会員ページを見る
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}