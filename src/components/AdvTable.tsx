import ExchangeBadge from "@/components/ExchangeBadge";

export type AdvRow = {
  timeLabel: string;
  exchange: string;
  symbol: string;
  side: string;
};

type Props = {
  data: AdvRow[];
};

function sideClass(side: string): string {
  const s = (side || "").toLowerCase();
  if (s === "long") return "text-green-300";
  if (s === "short") return "text-red-300";
  return "text-white/80";
}

export default function AdvTable({ data }: Props) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.03]">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-white/60">
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Exchange</th>
            <th className="px-4 py-3">Symbol</th>
            <th className="px-4 py-3">Side</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row, idx) => (
            <tr
              key={`${row.timeLabel}:${row.exchange}:${row.symbol}:${idx}`}
              className="border-b border-white/5"
            >
              <td className="px-4 py-3">{row.timeLabel}</td>
              <td className="px-4 py-3">
                <ExchangeBadge exchange={row.exchange} />
              </td>
              <td className="px-4 py-3 font-mono">{row.symbol}</td>
              <td className={`px-4 py-3 font-medium uppercase ${sideClass(row.side)}`}>
                {row.side || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}