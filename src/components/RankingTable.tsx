import ExchangeBadge from "@/components/ExchangeBadge";
import { formatNextFR } from "@/lib/time";

export type RankingRow = {
  rank: number;
  symbol: string;
  exchange: string;
  fr: number;
  nextFundingMs?: number | null;
};

type Props = {
  data: RankingRow[];
  fading?: boolean;
};

function frClass(fr: number): string {
  if (fr > 0) return "text-red-300";
  if (fr < 0) return "text-sky-300";
  return "text-white";
}

export default function RankingTable({ data, fading = false }: Props) {
  return (
    <div
      className={`overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.03] transition-opacity duration-500 ${
        fading ? "opacity-40" : "opacity-100"
      }`}
    >
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-white/60">
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Symbol</th>
            <th className="px-4 py-3">Exchange</th>
            <th className="px-4 py-3">FR</th>
            <th className="px-4 py-3">Next</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row) => (
            <tr
              key={`${row.exchange}:${row.symbol}:${row.rank}`}
              className="border-b border-white/5 transition-colors duration-300 hover:bg-white/[0.03]"
            >
              <td className="px-4 py-3 font-medium">{row.rank}</td>
              <td className="px-4 py-3 font-mono">{row.symbol}</td>
              <td className="px-4 py-3">
                <ExchangeBadge exchange={row.exchange} />
              </td>
              <td className={`px-4 py-3 font-semibold ${frClass(row.fr)}`}>
                {row.fr > 0 ? "+" : ""}
                {row.fr.toFixed(4)}%
              </td>
              <td className="px-4 py-3">{formatNextFR(row.nextFundingMs)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}