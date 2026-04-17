/**
 * Lógica centralizada de validação de acesso por data.
 *
 * Regras:
 * - Arquiteto / Explorer (tag): acesso total, qualquer dia.
 * - Day Pass: válido APENAS no dia exato de `day_pass_date`.
 * - Weekly Pass: válido por 7 dias a partir de `week_pass_start_date` (inclusive).
 * - Inscrição em evento (Luma): válida no dia do evento.
 */

import { getCurrentBrasiliaDateKeySync } from "./brasilia-time";

export type RegistrationLike = {
  ticket_type: string;
  day_pass_date: string | null;
  week_pass_start_date?: string | null;
  event_id?: string | null;
  event_name?: string;
};

/** Adiciona N dias a uma data ISO YYYY-MM-DD e retorna outra ISO. */
function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days, 12));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

export function isDayPassValidToday(
  reg: RegistrationLike,
  todayKey: string = getCurrentBrasiliaDateKeySync(),
): boolean {
  return !!reg.day_pass_date && reg.day_pass_date === todayKey;
}

export function isWeeklyPassValidToday(
  reg: RegistrationLike,
  todayKey: string = getCurrentBrasiliaDateKeySync(),
): boolean {
  if (!reg.week_pass_start_date) return false;
  const endKey = addDays(reg.week_pass_start_date, 6); // 7 dias inclusive
  return todayKey >= reg.week_pass_start_date && todayKey <= endKey;
}

/** Conjunto de tags que dão acesso total, todo dia. */
export const FULL_ACCESS_TAGS = new Set(["Arquiteto", "Explorer"]);

export function hasFullAccessTag(tag: string | null | undefined): boolean {
  return !!tag && FULL_ACCESS_TAGS.has(tag);
}

/** Verifica se a pessoa tem QUALQUER acesso válido para hoje. */
export function hasValidAccessToday(
  tag: string | null | undefined,
  registrations: RegistrationLike[],
  todayKey: string = getCurrentBrasiliaDateKeySync(),
): boolean {
  if (hasFullAccessTag(tag)) return true;
  return registrations.some(
    (r) => isDayPassValidToday(r, todayKey) || isWeeklyPassValidToday(r, todayKey),
  );
}
