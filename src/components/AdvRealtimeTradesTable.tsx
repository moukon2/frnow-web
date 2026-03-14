import ExchangeBadge from "@/components/ExchangeBadge";
import { formatHeldMin, formatJstDateTime } from "@/lib/format";

export type AdvTradeRow = {
  exchange: string;
  symbol: string;
  side: string;
  opened_at_ms: number | null;
  closed_at_ms: number | null;
  ret_bps: number | null;
  held_ms: number | null;
  close_reason: string | null;
  entry_type: string | null;
  level: string | null;
};

type Props = {
  data: AdvTradeRow[];
  fading?: boolean;
};

function sideClass(side: string): string {
  const s = (side || "").toLowerCase();
  if (s === "long") return "text-green-300";
  if (s === "short") return "text-red-300";
  return "text-white/80";
}

function retClass(v: number | null): string {
  if (v === null) return "text-white";
  if (v > 0) return "text-green-300";
  if (v < 0) return "text-red-300";
  return "text-white";
}

function fmtBps(v: number | null): string {
  if (v === null) return "--";
  return `${v > 0 ? "+" : ""}${v.toFixed(1)} bps`;
}

export default function AdvRealtimeTradesTable({ data, fading = false }: Props) {
  return (
    <div
      className={`overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.03] transition-opacity duration-500 ${
        fading ? "opacity-40" : "opacity-100"
      }`}
    >
      <table className="w-full min-w-[1080px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-white/60">
            <th className="px-4 py-3">Closed</th>
            <th className="px-4 py-3">Exchange</th>
            <th className="px-4 py-3">Symbol</th>
            <th className="px-4 py-3">Side</th>
            <th className="px-4 py-3">ret</th>
            <th className="px-4 py-3">Hold</th>
            <th className="px-4 py-3">Reason</th>
            <th className="px-4 py-3">Entry</th>
            <th className="px-4 py-3">Level</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row, idx) => (
            <tr
              key={`${row.exchange}:${row.symbol}:${row.closed_at_ms}:${idx}`}
              className="border-b border-white/5 transition-colors duration-300 hover:bg-white/[0.03]"
            >
              <td className="px-4 py-3">{formatJstDateTime(row.closed_at_ms)}</td>
              <td className="px-4 py-3">
                <ExchangeBadge exchange={row.exchange} />
              </td>
              <td className="px-4 py-3 font-mono">{row.symbol}</td>
              <td className={`px-4 py-3 font-medium uppercase ${sideClass(row.side)}`}>
                {row.side || "-"}
              </td>
              <td className={`px-4 py-3 font-semibold ${retClass(row.ret_bps)}`}>
                {fmtBps(row.ret_bps)}
              </td>
              <td className="px-4 py-3">{formatHeldMin(row.held_ms)}</td>
              <td className="px-4 py-3">{row.close_reason || "-"}</td>
              <td className="px-4 py-3">{row.entry_type || "-"}</td>
              <td className="px-4 py-3">{row.level || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}