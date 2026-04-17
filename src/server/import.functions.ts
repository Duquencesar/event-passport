import { createServerFn } from "@tanstack/react-start";
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

      const ticketLower = row.ticket_type?.toLowerCase() || "";
      const derivedTag = row.tag ||
        (ticketLower.includes("architect") ? "Arquiteto"
        : ticketLower.includes("explorer") ? "Explorer"
        : null);
      const tag = derivedTag || data.default_tag || null;

      const { data: existing } = await supabaseAdmin
        .from("people")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      let personId: string;

      if (existing) {
        personId = existing.id;
        await supabaseAdmin
          .from("people")
          .update({ name, tag: tag || null })
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
