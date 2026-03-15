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

function formatCountdown(nextFundingMs?: number | null) {
  if (!nextFundingMs || !Number.isFinite(nextFundingMs)) return "--";

  const diffMs = nextFundingMs - Date.now();
  if (diffMs <= 0) return "00:00";

  const totalMin = Math.floor(diffMs / 60000);
  const hh = String(Math.floor(totalMin / 60)).padStart(2, "0");
  const mm = String(totalMin % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function SpreadRankingTable({ data }: { data: SpreadRow[] }) {
  if (!data.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-white/55">
        表示できる Spread データがありません。
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
      <div className="grid grid-cols-[56px_1.2fr_120px_120px_120px_90px] gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
        <div>Rank</div>
        <div>Symbol</div>
        <div className="text-right">FR1</div>
        <div className="text-right">FR2</div>
        <div className="text-right">Spread</div>
        <div className="text-right">Next</div>
      </div>

      <div className="divide-y divide-white/10">
        {data.map((row) => (
          <div
            key={`${row.rank}-${row.symbol}-${row.exchange1}-${row.exchange2}`}
            className="grid grid-cols-[56px_1.2fr_120px_120px_120px_90px] gap-3 px-4 py-3 text-sm"
          >
            <div className="font-semibold text-white/70">{row.rank}</div>
            <div className="font-medium text-white">{row.symbol}</div>
            <div className="text-right text-white/70">
              {row.fr1 > 0 ? "+" : ""}
              {row.fr1.toFixed(4)}%
            </div>
            <div className="text-right text-white/70">
              {row.fr2 > 0 ? "+" : ""}
              {row.fr2.toFixed(4)}%
            </div>
            <div className="text-right font-semibold text-cyan-300">
              {row.spread > 0 ? "+" : ""}
              {row.spread.toFixed(4)}%
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