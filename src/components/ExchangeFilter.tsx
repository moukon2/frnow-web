type Props = {
  selected: string[];
  onChange: (next: string[]) => void;
};

const EXCHANGES = ["binance", "bybit", "bitget", "mexc", "bingx"];

export default function ExchangeFilter({ selected, onChange }: Props) {
  function toggleExchange(ex: string) {
    const exists = selected.includes(ex);
    const next = exists ? selected.filter((v) => v !== ex) : [...selected, ex];
    if (next.length === 0) return;
    onChange(next);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {EXCHANGES.map((ex) => {
        const checked = selected.includes(ex);

        return (
          <button
            key={ex}
            type="button"
            onClick={() => toggleExchange(ex)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
              checked
                ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-200"
                : "border-white/10 bg-black/20 text-white/65 hover:bg-white/[0.06]"
            }`}
          >
            <span
              className={`inline-flex h-4 w-4 items-center justify-center rounded border text-[10px] leading-none ${
                checked
                  ? "border-cyan-300 bg-cyan-300 text-black"
                  : "border-white/20 text-transparent"
              }`}
            >
              ✓
            </span>
            <span className="capitalize">{ex}</span>
          </button>
        );
      })}
    </div>
  );
}