const BRASILIA_TIME_ZONE = "America/Sao_Paulo";

function extractDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BRASILIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return { year, month, day };
}

export function formatBrasiliaDateKey(date: Date) {
  const { year, month, day } = extractDateParts(date);
  return `${year}-${month}-${day}`;
}

export function getCurrentBrasiliaDateKeySync() {
  return formatBrasiliaDateKey(new Date());
}

/** Async version — kept for API compatibility, now just wraps the sync version */
export async function getBrasiliaTodayKey() {
  return getCurrentBrasiliaDateKeySync();
}

export function shiftBrasiliaDateKeyByDays(baseDateKey: string, days: number) {
  const [year, month, day] = baseDateKey.split("-").map(Number);
  const shiftedDate = new Date(Date.UTC(year, month - 1, day + days, 12));
  return formatBrasiliaDateKey(shiftedDate);
}

export function formatBrasiliaTime(dateLike: string | Date, locale = "pt-BR") {
  const date = typeof dateLike === "string" ? new Date(dateLike) : dateLike;

  return new Intl.DateTimeFormat(locale, {
    timeZone: BRASILIA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatBrasiliaLongDate(dateLike: string | Date, locale = "pt-BR") {
  const date = typeof dateLike === "string" ? new Date(dateLike) : dateLike;

  return new Intl.DateTimeFormat(locale, {
    timeZone: BRASILIA_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export { BRASILIA_TIME_ZONE };
