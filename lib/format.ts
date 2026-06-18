/** Formatting helpers shared across screens. */

export function fmtCurrency(n: number | string | null | undefined): string {
  const v = Number(n ?? 0);
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function fmtMoney(n: number | string | null | undefined): string {
  const v = Number(n ?? 0);
  return `$${v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function fmtCents(cents: number | string | null | undefined): string {
  return fmtCurrency(Number(cents ?? 0) / 100);
}

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fmtDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(date);
}

export function initials(
  first?: string | null,
  last?: string | null,
  fallback = "?"
): string {
  const a = (first ?? "").trim();
  const b = (last ?? "").trim();
  const out = `${a.charAt(0)}${b.charAt(0)}`.toUpperCase();
  return out || fallback;
}

export function titleCase(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
