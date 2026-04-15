import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
        }>;
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

      // Auto-detect tag from ticket type
      const tag = row.tag ||
        (row.ticket_type?.toLowerCase().includes("architect") ? "Arquiteto" : null);

      // Upsert person
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

      // Create registration
      await supabaseAdmin.from("registrations").insert({
        person_id: personId,
        event_name: row.event_name,
        ticket_type: row.ticket_type,
        source: "luma",
      });
      registrations++;
    }

    return { created, updated, registrations };
  });
