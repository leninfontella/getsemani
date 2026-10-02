import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

type RateLimitRow = {
  allowed: boolean;
  retry_after: number;
};

export async function consumeRateLimit(
  adminClient: SupabaseClient,
  endpoint: string,
  subjectId: string,
  maxRequests: number,
  windowSeconds: number,
) {
  const { data, error } = await adminClient.rpc("consume_edge_rate_limit", {
    p_endpoint: endpoint,
    p_subject_id: subjectId,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  });

  if (error) throw new Error("rate_limit_unavailable", { cause: error });
  const result = (data?.[0] ?? null) as RateLimitRow | null;
  if (!result) throw new Error("rate_limit_unavailable");
  return {
    allowed: result.allowed === true,
    retryAfter: Math.max(0, Number(result.retry_after) || 0),
  };
}
