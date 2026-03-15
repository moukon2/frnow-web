export type DoiRow = {
  rank: number;
  symbol: string;
  exchange: string;
  doi: number;
  absDoi: number;
  direction: string;
  fr?: number | null;
  absFr?: number;
  combinedScore?: number;
  nextFundingMs?: number | null;
};

function formatCountdown(nextFundingMs?: number | null) {
  if (!nextFundingMs || !Number.isFinite(nextFundingMs)) return "--";

  const diffMs = nextFundingMs - Date.now();
  if (diffMs <= 0) return "00:00";

  const totalMin = Math.floor(diffMs / 60000);
  const hh = String(Math.floor(totalMin / 60)).padStart(2, "0");
  const mm = String(totalMin % 60).padStart(2, "0");
  return `${hh}:${mm}`;
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

export default function DoiRankingTable({ data }: { data: DoiRow[] }) {
  if (!data.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-white/55">
        表示できる ΔOI データがありません。
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
      <div className="grid grid-cols-[56px_1.3fr_130px_120px_110px_90px] gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
        <div>Rank</div>
        <div>Symbol</div>
        <div>Exchange</div>
        <div className="text-right">ΔOI</div>
        <div className="text-right">FR</div>
        <div className="text-right">Next</div>
      </div>

      <div className="divide-y divide-white/10">
        {data.map((row) => (
          <div
            key={`${row.rank}-${row.symbol}-${row.exchange}`}
            className="grid grid-cols-[56px_1.3fr_130px_120px_110px_90px] gap-3 px-4 py-3 text-sm"
          >
            <div className="font-semibold text-white/70">{row.rank}</div>

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
                row.doi > 0
                  ? "text-cyan-300"
                  : row.doi < 0
                    ? "text-rose-300"
                    : "text-white/70"
              }`}
            >
              {row.doi > 0 ? "+" : ""}
              {row.doi.toFixed(3)}%
            </div>

            <div className="text-right text-white/70">
              {typeof row.fr === "number"
                ? `${row.fr > 0 ? "+" : ""}${row.fr.toFixed(4)}%`
                : "--"}
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