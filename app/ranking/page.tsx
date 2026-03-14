"use client";

import { useEffect, useMemo, useState } from "react";
import RankingTable, { RankingRow } from "@/components/RankingTable";

type RefreshState = "idle" | "refreshing";

export default function RankingPage() {
  const [data, setData] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshState, setRefreshState] = useState<RefreshState>("idle");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function load(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshState("refreshing");
      } else {
        setLoading(true);
      }

      setError("");

      const res = await fetch("/api/fr-ranking", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
      setError("ランキングの取得に失敗しました。");
    } finally {
      setLoading(false);
      window.setTimeout(() => {
        setRefreshState("idle");
      }, 250);
    }
  }

  useEffect(() => {
    load(false);

    const timer = setInterval(() => {
      load(true);
    }, 60_000);

    return () => clearInterval(timer);
  }, []);

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
    <main className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">
            Public Ranking
          </div>
          <h1 className="mt-3 text-4xl font-bold">Funding Rate Ranking</h1>
          <p className="mt-4 text-white/70">
            全取引所 mix の Funding Rate ランキングです。Free では上位20件、
            通貨名は上位3件のみ表示されます。Next は次回FR更新までの残り時間です。
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
          <div>Last updated</div>
          <div className="mt-1 font-medium text-white">{updatedLabel}</div>
        </div>
      </div>

      {loading && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white/70">
          読み込み中...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="mb-4 flex items-center justify-between text-sm">
            <div className="text-white/50">
              1分ごとに自動更新されます
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

          <RankingTable
            data={data}
            fading={refreshState === "refreshing"}
          />

          <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
            全銘柄表示と取引所フィルターは Pro で利用可能です。
          </div>
        </>
      )}
    </main>
  );
}