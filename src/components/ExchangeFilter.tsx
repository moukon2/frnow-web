type Props = {
  selected: string[];
  onChange: (next: string[]) => void;
};

const EXCHANGES = ["binance", "bybit", "bitget", "mexc"];

export default function ExchangeFilter({ selected, onChange }: Props) {
  function toggleExchange(ex: string) {
    const exists = selected.includes(ex);
    const next = exists
      ? selected.filter((v) => v !== ex)
      : [...selected, ex];

    if (next.length === 0) return;
    onChange(next);
  }

  return (
    <div className="flex flex-wrap gap-3">
      {EXCHANGES.map((ex) => {
        const checked = selected.includes(ex);

        return (
          <label
            key={ex}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-2 text-sm transition ${
              checked
                ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100"
                : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggleExchange(ex)}
              className="h-4 w-4 accent-cyan-400"
            />
            <span className="capitalize">{ex}</span>
          </label>
        );
      })}
    </div>
  );
}