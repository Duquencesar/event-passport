import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

/**
 * Client-side middleware that attaches the Supabase auth token
 * to server function requests so that requireSupabaseAuth can validate it.
 */
export const withAuthHeaders = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    if (typeof window === "undefined") {
      return next();
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return next({
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
    }
    return next();
  });
