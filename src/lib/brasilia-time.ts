const BRASILIA_TIME_ZONE = "America/Sao_Paulo";

/**
 * Brasília é UTC-3 (sem horário de verão desde 2019).
 * Calculamos manualmente para evitar dependência de dados ICU
 * que podem estar ausentes em runtimes serverless (Cloudflare Workers),
 * onde Intl.DateTimeFormat com timeZone:"America/Sao_Paulo" pode
 * silenciosamente cair pra UTC.
 */
const BRASILIA_OFFSET_MS = -3 * 60 * 60 * 1000;

function extractDateParts(date: Date) {
  const shifted = new Date(date.getTime() + BRASILIA_OFFSET_MS);
  const year = String(shifted.getUTCFullYear());
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
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
