import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const credentials = [
  [process.env.SECURITY_TEST_USER_A_EMAIL, process.env.SECURITY_TEST_USER_A_PASSWORD],
  [process.env.SECURITY_TEST_USER_B_EMAIL, process.env.SECURITY_TEST_USER_B_PASSWORD],
];

if (!url || !key || credentials.some(([email, password]) => !email || !password)) {
  console.log(
    "SKIP: defina VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY e SECURITY_TEST_USER_{A,B}_{EMAIL,PASSWORD}.",
  );
  process.exit(0);
}

const clients = credentials.map(() =>
  createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }),
);
const [a, b] = clients;
const sessions = await Promise.all(
  clients.map((client, index) =>
    client.auth.signInWithPassword({
      email: credentials[index][0],
      password: credentials[index][1],
    }),
  ),
);
sessions.forEach(({ data, error }, index) => {
  assert.ifError(error);
  assert.ok(data.user, `usuário ${index === 0 ? "A" : "B"} não autenticou`);
});

const marker = `security-test-${crypto.randomUUID()}`;
const { data: created, error: createError } = await a
  .from("manifestations")
  .insert({
    user_id: sessions[0].data.user.id,
    goal_id: marker,
    title: "Security test",
    content: "private A",
  })
  .select("id")
  .single();
assert.ifError(createError);

try {
  const { data: read, error: readError } = await b
    .from("manifestations")
    .select("id, content")
    .eq("id", created.id);
  assert.ifError(readError);
  assert.deepEqual(read, [], "B conseguiu ler dado de A");

  const { data: changed, error: updateError } = await b
    .from("manifestations")
    .update({ content: "tampered" })
    .eq("id", created.id)
    .select("id");
  assert.ifError(updateError);
  assert.deepEqual(changed, [], "B conseguiu alterar dado de A");

  const { data: removed, error: deleteError } = await b
    .from("manifestations")
    .delete()
    .eq("id", created.id)
    .select("id");
  assert.ifError(deleteError);
  assert.deepEqual(removed, [], "B conseguiu apagar dado de A");

  for (const token of [undefined, "adulterado", "eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjF9.invalid"]) {
    const response = await fetch(`${url}/rest/v1/manifestations?select=id`, {
      headers: { apikey: key, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    assert.ok(
      response.status === 401 || response.status === 403,
      `token inválido aceito: ${response.status}`,
    );
  }

  await a.auth.signOut();
  const { data: afterSwitch, error: switchError } = await b.from("manifestations").select("id");
  assert.ifError(switchError);
  assert.ok(!afterSwitch.some(({ id }) => id === created.id), "dado de A apareceu na sessão B");
  console.log("PASS: isolamento A/B, operações IDOR, tokens inválidos e troca de sessão.");
} finally {
  await a.auth.signInWithPassword({ email: credentials[0][0], password: credentials[0][1] });
  await a.from("manifestations").delete().eq("id", created.id);
  await Promise.all(clients.map((client) => client.auth.signOut()));
}
