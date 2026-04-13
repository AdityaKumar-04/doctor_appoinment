import { createClient } from "@supabase/supabase-js";

// Note: This client uses the complete Service Role Key to bypass RLS policies.
// IT MUST ONLY BE USED ON THE SERVER SIDE. DO NOT EXPOSE THIS IN THE FRONTEND.
export const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
