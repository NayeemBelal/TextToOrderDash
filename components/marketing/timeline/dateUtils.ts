import { type TimelinePeriod } from "@/lib/timelineApi";

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Local-date [start, end] (inclusive) containing `anchor`, matching the backend's period_bounds. */
export function periodBounds(period: TimelinePeriod, anchor: Date): [Date, Date] {
  if (period === "day") return [anchor, anchor];
  if (period === "week") {
    const dow = (anchor.getDay() + 6) % 7; // Monday = 0
    const start = new Date(anchor);
    start.setDate(anchor.getDate() - dow);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return [start, end];
  }
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  return [start, end];
}

export function shiftAnchor(period: TimelinePeriod, anchor: Date, dir: 1 | -1): Date {
  const next = new Date(anchor);
  if (period === "day") next.setDate(anchor.getDate() + dir);
  else if (period === "week") next.setDate(anchor.getDate() + 7 * dir);
  else next.setMonth(anchor.getMonth() + dir);
  return next;
}

export function formatPeriodLabel(period: TimelinePeriod, anchor: Date): string {
  const [start, end] = periodBounds(period, anchor);
  if (period === "day") {
    return anchor.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  }
  if (period === "week") {
    const sameMonth = start.getMonth() === end.getMonth();
    const startLabel = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endLabel = end.toLocaleDateString("en-US", sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" });
    return `${startLabel} – ${endLabel}`;
  }
  return anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Absolute expiry moment: "Today, 11:00 PM" / "Tomorrow, 11:00 PM" / "Jul 25, 11:00 PM". */
export function formatExpiryDateTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(d) - startOfDay(now)) / 86_400_000);

  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (dayDiff === 0) return `Today, ${time}`;
  if (dayDiff === 1) return `Tomorrow, ${time}`;
  if (dayDiff === -1) return `Yesterday, ${time}`;
  const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${dateLabel}, ${time}`;
}

export function relativeFuture(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.floor((then - Date.now()) / 1000);
  if (secs <= 0) return "today";
  if (secs < 3600) return `in ${Math.ceil(secs / 60)}m`;
  if (secs < 86400) return `in ${Math.ceil(secs / 3600)}h`;
  return `in ${Math.ceil(secs / 86400)}d`;
}
