type Props = {
  exchange: string;
};

export default function ExchangeBadge({ exchange }: Props) {
  const ex = (exchange || "").toLowerCase();

  const classes: Record<string, string> = {
    binance: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    bybit: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    bitget: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    mexc: "bg-green-500/20 text-green-300 border-green-500/30",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        classes[ex] || "bg-white/10 text-white/80 border-white/15"
      }`}
    >
      {exchange}
    </span>
  );
}