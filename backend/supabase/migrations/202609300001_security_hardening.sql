-- Defesa em profundidade: RLS continua obrigatória inclusive para donos de tabela.
alter table public.profiles force row level security;
alter table public.manifestations force row level security;
alter table public.diaries force row level security;

-- O papel anônimo não deve acessar dados pessoais diretamente.
revoke all on table public.profiles from anon;
revoke all on table public.manifestations from anon;
revoke all on table public.diaries from anon;

-- URLs públicas antigas deixam de ser servidas pelo perfil; a imagem passa pelo proxy autenticado.
update public.profiles set avatar_url = 'private' where avatar_url is not null;

-- Limites server-side contra payloads abusivos e dados fora do domínio esperado.
alter table public.manifestations
  drop constraint if exists manifestations_content_length,
  add constraint manifestations_content_length check (char_length(content) between 1 and 10000),
  drop constraint if exists manifestations_goal_id_format,
  add constraint manifestations_goal_id_format
    check (goal_id ~ '^[a-z0-9-]{1,120}$');

alter table public.diaries
  drop constraint if exists diaries_content_length,
  add constraint diaries_content_length check (octet_length(content) <= 200000);

notify pgrst, 'reload schema';
