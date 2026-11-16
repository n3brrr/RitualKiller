// Deletes the caller's account (right to erasure, GDPR art. 17).
//
// Removing the auth user cascades to public.profiles and every row the user
// owns. Requires the SUPABASE_SERVICE_ROLE_KEY secret, which never leaves the
// server.
import { corsHeaders, getAdminClient, getCaller, json } from "../_shared/auth.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const caller = await getCaller(request);
  if (!caller) return json({ error: "unauthorized" }, 401);

  const { error } = await getAdminClient().auth.admin.deleteUser(caller.user.id);
  if (error) return json({ error: "delete_failed" }, 500);

  return json({ deleted: true });
});
