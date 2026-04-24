export type PrimaryAccessTag = "Arquiteto" | "Explorer";

export type LumaTicketClassification = {
  accessClass: "primary" | "timed" | "event" | "unknown";
  tag: PrimaryAccessTag | null;
};

function normalizeTicket(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isPrimaryAccessTag(tag: string | null | undefined): tag is PrimaryAccessTag {
  return tag === "Arquiteto" || tag === "Explorer";
}

export function classifyLumaTicket(ticketName: string): LumaTicketClassification {
  const ticket = normalizeTicket(ticketName || "");
  if (ticket.includes("architect") || ticket.includes("arquiteto")) {
    return { accessClass: "primary", tag: "Arquiteto" };
  }
  if (ticket.includes("explorer")) {
    return { accessClass: "primary", tag: "Explorer" };
  }
  if (ticket.includes("day pass") || ticket.includes("day-pass") || ticket.includes("weekly") || ticket.includes("semanal")) {
    return { accessClass: "timed", tag: null };
  }
  if (ticket.includes("standard") || ticket.includes("conference") || ticket.includes("workshop") || ticket.includes("cafe") || ticket.includes("guest pass")) {
    return { accessClass: "event", tag: null };
  }
  return { accessClass: "unknown", tag: null };
}