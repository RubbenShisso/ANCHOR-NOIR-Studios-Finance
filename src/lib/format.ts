const zar = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const zarCompact = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export const formatZAR = (value: number) => zar.format(value);
export const formatZARCompact = (value: number) => zarCompact.format(value);

const dateFmt = new Intl.DateTimeFormat("en-ZA", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export const formatDate = (iso: string | null) =>
  iso ? dateFmt.format(new Date(`${iso}T00:00:00Z`)) : "—";

const monthFmt = new Intl.DateTimeFormat("en-ZA", { month: "short", year: "2-digit", timeZone: "UTC" });

// "2026-10" -> "Oct 26"
export const formatMonth = (key: string) => monthFmt.format(new Date(`${key}-01T00:00:00Z`));

// Today's date in South Africa as YYYY-MM-DD (the server may run in UTC).
const saDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg" });
export const todayISO = () => saDate.format(new Date());

export const monthKey = (iso: string) => iso.slice(0, 7);

// The last `count` month keys, oldest first, ending with the current month.
export function lastMonths(count: number): string[] {
  const [year, month] = todayISO().split("-").map(Number);
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month - 1 - i, 1));
    keys.push(d.toISOString().slice(0, 7));
  }
  return keys;
}

// Database numeric columns arrive as strings; normalise to numbers.
export const num = (value: number | string | null | undefined) => Number(value ?? 0);
