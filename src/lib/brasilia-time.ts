const BRASILIA_TIME_ZONE = "America/Sao_Paulo";
const BRASILIA_CLOCK_URL = "https://worldtimeapi.org/api/timezone/America/Sao_Paulo";

type BrasiliaClockSource = "worldtimeapi" | "intl";

type BrasiliaClockSnapshot = {
  dateKey: string;
  nowIso: string;
  source: BrasiliaClockSource;
};

type WorldTimeApiResponse = {
  datetime?: string;
  utc_datetime?: string;
  unixtime?: number;
};

let clockCache: { expiresAt: number; value: BrasiliaClockSnapshot } | null = null;

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

function buildSnapshot(referenceDate: Date, source: BrasiliaClockSource): BrasiliaClockSnapshot {
  return {
    dateKey: formatBrasiliaDateKey(referenceDate),
    nowIso: referenceDate.toISOString(),
    source,
  };
}

export async function getBrasiliaClockSnapshot() {
  if (clockCache && clockCache.expiresAt > Date.now()) {
    return clockCache.value;
  }

  try {
    const response = await fetch(BRASILIA_CLOCK_URL, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Clock API returned ${response.status}`);
    }

    const payload = (await response.json()) as WorldTimeApiResponse;

    const referenceDate = typeof payload.unixtime === "number"
      ? new Date(payload.unixtime * 1000)
      : payload.datetime
        ? new Date(payload.datetime)
        : payload.utc_datetime
          ? new Date(payload.utc_datetime)
          : null;

    if (!referenceDate || Number.isNaN(referenceDate.getTime())) {
      throw new Error("Clock API returned an invalid datetime");
    }

    const snapshot = buildSnapshot(referenceDate, "worldtimeapi");
    clockCache = {
      value: snapshot,
      expiresAt: Date.now() + 60_000,
    };

    return snapshot;
  } catch (error) {
    console.warn("Brasília clock fallback in use:", error);

    const fallbackSnapshot = buildSnapshot(new Date(), "intl");
    clockCache = {
      value: fallbackSnapshot,
      expiresAt: Date.now() + 15_000,
    };

    return fallbackSnapshot;
  }
}

export async function getBrasiliaTodayKey() {
  const snapshot = await getBrasiliaClockSnapshot();
  return snapshot.dateKey;
}

export { BRASILIA_TIME_ZONE };
