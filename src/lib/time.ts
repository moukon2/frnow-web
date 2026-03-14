export function formatNextFR(nextFundingMs?: number | null): string {
  if (!nextFundingMs || Number.isNaN(Number(nextFundingMs))) return "--:--";

  const now = Date.now();
  const diff = Number(nextFundingMs) - now;

  if (diff <= 0) return "00:00";

  const totalMinutes = Math.floor(diff / 60000);
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;

  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}