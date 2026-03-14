"use client";

import { useEffect, useState } from "react";

type HomeRankingRow = {
  rank: number;
  symbol: string;
  exchange: string;
  fr: number;
};

function frClass(fr: number): string {
  if (fr > 0) return "text-red-300";
  if (fr < 0) return "text-sky-300";
  return "text-white";
}

export default function HomeRankingPreview() {
  const [rows, setRows] = useState<HomeRankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setError("");

        const res = await fetch("/api/home-ranking", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();

        if (mounted) {
          setRows(Array.isArray(json?.rows) ? json.rows : []);
        }
      } catch (e) {
        console.error(e);
        if (mounted) {
          setError("ランキングを取得できませんでした。");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();
  }, []);

  return (
    <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6">
      <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/50">Live Ranking Preview</div>
          <div className="text-xs text-cyan-300">Top 5</div>
        </div>

        {loading && (
          <div className="mt-5 text-sm text-white/60">Loading...</div>
        )}

        {!loading && error && (
          <div className="mt-5 text-sm text-red-300">{error}</div>
        )}

        {!loading && !error && (
          <div className="mt-5 space-y-3">
            {rows.map((row) => (
              <div
                key={`${row.rank}:${row.exchange}:${row.symbol}`}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 text-sm text-white/50">{row.rank}</div>
                  <div className="font-mono text-white">{row.symbol}</div>
                  <div className="text-xs uppercase text-white/40">
                    {row.exchange}
                  </div>
                </div>

                <div className={`font-semibold ${frClass(row.fr)}`}>
                  {row.fr > 0 ? "+" : ""}
                  {row.fr.toFixed(4)}%
                </div>
              </div>
            ))}

            {rows.length === 0 && (
              <div className="text-sm text-white/50">No ranking data.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}