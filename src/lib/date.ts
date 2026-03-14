export function formatJstTime(value?: number | string | null): string {
  if (value === null || value === undefined || value === "") return "-";

  let ms: number | null = null;

  if (typeof value === "number" && Number.isFinite(value)) {
    ms = value > 1_000_000_000_000 ? value : value * 1000;
  } else if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) {
      ms = n > 1_000_000_000_000 ? n : n * 1000;
    } else {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) ms = d.getTime();
    }
  }

  if (!ms) return "-";

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(ms));
}