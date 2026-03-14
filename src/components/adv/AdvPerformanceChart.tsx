"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type PerformancePoint = {
  ts: number;
  cum_ret_bps?: number;
  drawdown_bps?: number;
};

function fmtTs(ts: number): string {
  if (!Number.isFinite(ts)) return "--";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

function fmtBps(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "--";
  return `${n > 0 ? "+" : ""}${n.toFixed(1)} bps`;
}

const tooltipFormatter = (value: unknown, name: unknown): [string, string] => {
  return [fmtBps(value), String(name)];
};

const tooltipLabelFormatter = (label: unknown): string => {
  return fmtTs(Number(label));
};

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-white/10 bg-black/20 p-8 text-sm text-white/50">
      {message}
    </div>
  );
}

export function AdvEquityChart({
  data,
  height = 340,
}: {
  data: PerformancePoint[];
  height?: number;
}) {
  const rows = data
    .filter((p) => Number.isFinite(Number(p.ts)))
    .map((p) => ({
      ts: Number(p.ts),
      cum_ret_bps: Number(p.cum_ret_bps ?? 0),
    }));

  if (!rows.length) {
    return <EmptyChart message="累積リターン表示に必要なデータがまだありません。" />;
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
          <XAxis
            dataKey="ts"
            tickFormatter={(v) => fmtTs(Number(v))}
            minTickGap={32}
            stroke="rgba(255,255,255,0.35)"
          />
          <YAxis
            tickFormatter={(v) => fmtBps(v)}
            stroke="rgba(255,255,255,0.35)"
            width={84}
          />
          <Tooltip
            formatter={tooltipFormatter}
            labelFormatter={tooltipLabelFormatter}
            contentStyle={{
              background: "rgba(10,10,10,0.95)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 16,
            }}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.18)" />
          <Line
            type="monotone"
            dataKey="cum_ret_bps"
            name="Cumulative ret"
            stroke="rgba(34,211,238,0.95)"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdvDrawdownChart({
  data,
  height = 340,
}: {
  data: PerformancePoint[];
  height?: number;
}) {
  const rows = data
    .filter((p) => Number.isFinite(Number(p.ts)))
    .map((p) => ({
      ts: Number(p.ts),
      drawdown_bps: Number(p.drawdown_bps ?? 0),
    }));

  if (!rows.length) {
    return <EmptyChart message="ドローダウン表示に必要なデータがまだありません。" />;
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
          <XAxis
            dataKey="ts"
            tickFormatter={(v) => fmtTs(Number(v))}
            minTickGap={32}
            stroke="rgba(255,255,255,0.35)"
          />
          <YAxis
            tickFormatter={(v) => fmtBps(v)}
            stroke="rgba(255,255,255,0.35)"
            width={84}
          />
          <Tooltip
            formatter={tooltipFormatter}
            labelFormatter={tooltipLabelFormatter}
            contentStyle={{
              background: "rgba(10,10,10,0.95)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 16,
            }}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.18)" />
          <Line
            type="monotone"
            dataKey="drawdown_bps"
            name="Drawdown"
            stroke="rgba(248,113,113,0.95)"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}