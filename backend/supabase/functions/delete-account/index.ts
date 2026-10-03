import { createClient } from "npm:@supabase/supabase-js@2";
import { consumeRateLimit } from "../_shared/rate-limit.ts";

const allowedOrigins = new Set([
  "https://getsemani-manifest.vercel.app",
  "https://getsemani-two.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
]);

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "null",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(
  request: Request,
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");
  if (origin && !allowedOrigins.has(origin))
    return json(request, { error: "Origem não permitida." }, 403);
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(request) });
  }
  if (request.method !== "POST") return json(request, { error: "Método não permitido." }, 405);

  const authorization = request.headers.get("Authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return json(request, { error: "Sessão não encontrada." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(request, { error: "Função não configurada." }, 500);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error: authError } = await authClient.auth.getUser(token);
  if (authError || !data.user) return json(request, { error: "Sessão inválida." }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  try {
    const limit = await consumeRateLimit(adminClient, "delete-account", data.user.id, 5, 3600);
    if (!limit.allowed) {
      return json(request, { error: "Muitas tentativas. Tente novamente mais tarde." }, 429, {
        "Retry-After": String(limit.retryAfter),
      });
    }
  } catch (error) {
    // Rate limiting is an additional abuse-control layer. A database/RPC
    // outage must not prevent an authenticated user from deleting their account.
    // Log the complete error so the limiter can be repaired separately.
    console.error("delete-account rate limit unavailable; continuing", error);
  }

  // Revoga os refresh tokens de todas as sessões/dispositivos antes de remover o usuário.
  await adminClient.auth.admin.signOut(token, "global");
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(data.user.id, false);
  if (deleteError) return json(request, { error: "Não foi possível excluir a conta." }, 500);

  return json(request, { deleted: true });
});
