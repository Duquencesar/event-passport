import { createServerFn } from "@tanstack/react-start";
import { classifyLumaTicket, isPrimaryAccessTag } from "@/lib/luma-ticket-classification";
import { db as supabaseAdmin } from "./db";

export const importPeople = createServerFn({ method: "POST" })
  .inputValidator(
    (
      input: {
        rows: Array<{
          name: string;
          email: string;
          ticket_type: string;
          event_name: string;
          tag?: string;
          event_id?: string;
        }>;
        default_tag?: string;
      },
    ) => input,
  )
  .handler(async ({ data }) => {
    let created = 0;
    let updated = 0;
    let registrations = 0;

    for (const row of data.rows) {
      const email = row.email.toLowerCase().trim();
      const name = row.name.trim();

      const ticketClassification = classifyLumaTicket(row.ticket_type || "");
      const explicitTag = isPrimaryAccessTag(row.tag) ? row.tag : null;
      const defaultTag = isPrimaryAccessTag(data.default_tag) ? data.default_tag : null;
      const tag = explicitTag || ticketClassification.tag || defaultTag;

      const { data: existing } = await supabaseAdmin
        .from("people")
        .select("id, tag")
        .eq("email", email)
        .maybeSingle();

      let personId: string;

      if (existing) {
        personId = existing.id;
        const shouldPreservePrimaryTag = isPrimaryAccessTag(existing.tag) && ticketClassification.accessClass !== "primary" && !explicitTag;
        const nextTag = shouldPreservePrimaryTag ? existing.tag : tag || existing.tag || null;
        if (shouldPreservePrimaryTag) {
          console.log("Importação Luma: mantendo tag principal da planilha", {
            person_id: personId,
            existing_tag: existing.tag,
            incoming_ticket: row.ticket_type,
            incoming_ticket_class: ticketClassification.accessClass,
            incoming_tag: tag,
            reason: "Pessoa já possui acesso principal indicado pela planilha; ticket recebido não é de acesso principal.",
          });
        }
        await supabaseAdmin
          .from("people")
          .update({ name, tag: nextTag })
          .eq("id", personId);
        updated++;
      } else {
        const { data: newPerson, error } = await supabaseAdmin
          .from("people")
          .insert({ name, email, tag: tag || null })
          .select("id")
          .single();
        if (error) continue;
        personId = newPerson.id;
        created++;
      }

      await supabaseAdmin.from("registrations").insert({
        person_id: personId,
        event_name: row.event_name,
        ticket_type: row.ticket_type,
        source: "luma",
        event_id: row.event_id || null,
      });
      registrations++;
    }

    return { created, updated, registrations };
  });
