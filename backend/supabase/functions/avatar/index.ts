import { createClient } from "npm:@supabase/supabase-js@2";
import { consumeRateLimit } from "../_shared/rate-limit.ts";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedOrigins = new Set([
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
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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

function base64Url(value: Uint8Array | string) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToBytes(pem: string) {
  const normalized = pem.replace(/\\n/g, "\n");
  const base64 = normalized.replace(
    /-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,
    "",
  );
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

async function googleAccessToken(clientEmail: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/devstorage.read_write",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToBytes(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const assertion = `${unsigned}.${base64Url(new Uint8Array(signature))}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.access_token) throw new Error("Falha ao autenticar no Google Cloud.");
  return String(result.access_token);
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");
  if (origin && !allowedOrigins.has(origin))
    return json(request, { error: "Origem não permitida." }, 403);
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  if (request.method !== "GET" && request.method !== "POST" && request.method !== "DELETE") {
    return json(request, { error: "Método não permitido." }, 405);
  }

  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json(request, { error: "Sessão não encontrada." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const bucket = Deno.env.get("GCS_BUCKET_NAME");
  const clientEmail = Deno.env.get("GCS_CLIENT_EMAIL");
  const privateKey = Deno.env.get("GCS_PRIVATE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !bucket || !clientEmail || !privateKey) {
    return json(request, { error: "Função de avatar não configurada." }, 500);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return json(request, { error: "Sessão inválida." }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  if (request.method !== "GET") {
    try {
      const limit = await consumeRateLimit(adminClient, "avatar", data.user.id, 10, 600);
      if (!limit.allowed) {
        return json(
          request,
          { error: "Muitas alterações de foto. Tente novamente mais tarde." },
          429,
          { "Retry-After": String(limit.retryAfter) },
        );
      }
    } catch (error) {
      console.error("avatar rate limit failed", error instanceof Error ? error.name : "unknown");
      return json(request, { error: "Serviço temporariamente indisponível." }, 503);
    }
  }

  try {
    const objectName = `avatars/${data.user.id}/profile`;
    const encodedObject = encodeURIComponent(objectName);
    const publicUrl = `https://storage.googleapis.com/${encodeURIComponent(bucket)}/${objectName}`;

    if (request.method === "GET") {
      const url = `${publicUrl}?v=${Date.now()}`;
      const { error: updateError } = await adminClient
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", data.user.id)
        .eq("avatar_url", "private");
      if (updateError) throw updateError;
      return json(request, { url, userId: data.user.id });
    }

    const accessToken = await googleAccessToken(clientEmail, privateKey);

    if (request.method === "DELETE") {
      const response = await fetch(
        `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodedObject}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!response.ok && response.status !== 404)
        throw new Error("Falha ao excluir no Cloud Storage.");
      return json(request, { removed: true, userId: data.user.id });
    }

    const contentType = request.headers.get("content-type")?.split(";")[0] || "";
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (!ALLOWED_TYPES.has(contentType)) {
      return json(request, { error: "Formato inválido. Use JPG, PNG ou WebP." }, 415);
    }
    if (contentLength > MAX_BYTES) return json(request, { error: "A foto excede 5 MB." }, 413);
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > MAX_BYTES) return json(request, { error: "A foto excede 5 MB." }, 413);

    const upload = await fetch(
      `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucket)}/o?uploadType=media&name=${encodedObject}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": contentType },
        body: bytes,
      },
    );
    if (!upload.ok) throw new Error(`Cloud Storage recusou o envio (${upload.status}).`);
    return json(request, { url: `${publicUrl}?v=${Date.now()}`, userId: data.user.id });
  } catch (error) {
    console.error("avatar operation failed", error instanceof Error ? error.name : "unknown");
    return json(request, { error: "Não foi possível processar a foto." }, 500);
  }
});
