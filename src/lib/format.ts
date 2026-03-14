export function formatJstDateTime(value?: number | null): string {
  if (!value || !Number.isFinite(Number(value))) return "-";

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(Number(value)));
}

export function formatHeldMin(heldMs?: number | null): string {
  if (!heldMs || !Number.isFinite(Number(heldMs))) return "-";
  const min = Math.round(Number(heldMs) / 60000);
  return `${min}m`;
}