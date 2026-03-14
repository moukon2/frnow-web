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

type Props = {
  data: SpreadRow[];
  fading?: boolean;
};

function fmtPct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(4)}%`;
}

function fmtNext(nextFundingMs?: number | null) {
  if (!nextFundingMs || !Number.isFinite(nextFundingMs)) return "--";

  const diff = Math.max(0, nextFundingMs - Date.now());
  const totalMin = Math.floor(diff / 1000 / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function SpreadRankingTable({ data, fading = false }: Props) {
  return (
    <div
      className={`overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-opacity duration-300 ${
        fading ? "opacity-70" : "opacity-100"
      }`}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-white/10 bg-white/[0.02] text-white/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">#</th>
              <th className="px-4 py-3 text-left font-medium">Symbol</th>
              <th className="px-4 py-3 text-left font-medium">FR 1</th>
              <th className="px-4 py-3 text-left font-medium">FR 2</th>
              <th className="px-4 py-3 text-left font-medium">Spread</th>
              <th className="px-4 py-3 text-left font-medium">Abs</th>
              <th className="px-4 py-3 text-left font-medium">Direction</th>
              <th className="px-4 py-3 text-left font-medium">Next</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-white/50"
                >
                  表示できるスプレッドがありません
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={`${row.symbol}-${row.exchange1}-${row.exchange2}`}
                  className="border-b border-white/5 text-white/80"
                >
                  <td className="px-4 py-3">{row.rank}</td>
                  <td className="px-4 py-3 font-medium text-white">{row.symbol}</td>
                  <td className="px-4 py-3">
                    <div className="text-white">{row.exchange1.toUpperCase()}</div>
                    <div className="text-white/60">{fmtPct(row.fr1)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white">{row.exchange2.toUpperCase()}</div>
                    <div className="text-white/60">{fmtPct(row.fr2)}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-cyan-300">
                    {fmtPct(row.spread)}
                  </td>
                  <td className="px-4 py-3">{fmtPct(row.absSpread)}</td>
                  <td className="px-4 py-3">{row.direction}</td>
                  <td className="px-4 py-3">{fmtNext(row.nextFundingMs)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}