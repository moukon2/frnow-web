export type AdvTradeRow = {
  id?: string | number;
  exchange?: string | null;
  symbol?: string | null;
  side?: string | null;
  opened_at_ms?: number | null;
  closed_at_ms?: number | null;
  hold_min?: number | null;
  ret_bps?: number | null;
  close_reason?: string | null;
};

function fmtDateTime(ms?: number | null) {
  if (!ms || !Number.isFinite(ms)) return "--";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(ms));
}

function fmtHoldMin(v?: number | null) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "--";
  return `${Math.round(v)}m`;
}

function fmtBps(v?: number | null) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "--";
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}`;
}

function exchangeBadge(exchange?: string | null) {
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

function sideBadge(side?: string | null) {
  const s = String(side || "").toLowerCase();
  if (s === "long") {
    return "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
  }
  if (s === "short") {
    return "border-red-400/20 bg-red-400/10 text-red-200";
  }
  return "border-white/10 bg-white/[0.04] text-white/70";
}

function retClass(v?: number | null) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "text-white/70";
  if (v > 0) return "text-cyan-300";
  if (v < 0) return "text-red-300";
  return "text-white/80";
}

export default function AdvRealtimeTradesTable({
  data,
}: {
  data: AdvTradeRow[];
}) {
  if (!data.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-white/55">
        表示できるトレードがありません。
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
      <div className="grid grid-cols-[120px_1.1fr_90px_120px_120px_80px_110px_1fr] gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
        <div>Exchange</div>
        <div>Symbol</div>
        <div>Side</div>
        <div>Open</div>
        <div>Close</div>
        <div className="text-right">Hold</div>
        <div className="text-right">Ret</div>
        <div>Reason</div>
      </div>

      <div className="divide-y divide-white/10">
        {data.map((row, idx) => {
          const key =
            row.id ??
            `${row.exchange ?? ""}-${row.symbol ?? ""}-${row.opened_at_ms ?? ""}-${idx}`;

          return (
            <div
              key={key}
              className="grid grid-cols-[120px_1.1fr_90px_120px_120px_80px_110px_1fr] gap-3 px-4 py-3 text-sm"
            >
              <div>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${exchangeBadge(
                    row.exchange,
                  )}`}
                >
                  {row.exchange || "--"}
                </span>
              </div>

              <div className="min-w-0">
                <div className="truncate font-medium text-white">
                  {row.symbol || "--"}
                </div>
              </div>

              <div>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${sideBadge(
                    row.side,
                  )}`}
                >
                  {row.side || "--"}
                </span>
              </div>

              <div className="text-white/70">{fmtDateTime(row.opened_at_ms)}</div>
              <div className="text-white/70">{fmtDateTime(row.closed_at_ms)}</div>

              <div className="text-right text-white/70">
                {fmtHoldMin(row.hold_min)}
              </div>

              <div className={`text-right font-semibold ${retClass(row.ret_bps)}`}>
                {fmtBps(row.ret_bps)} bps
              </div>

              <div className="truncate text-white/65">
                {row.close_reason || "--"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}