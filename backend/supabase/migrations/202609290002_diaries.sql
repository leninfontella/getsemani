-- Livro individual. Quando bloqueado, content contém texto cifrado no cliente.
create table if not exists public.diaries (
  user_id uuid primary key references auth.users(id) on delete cascade,
  content text not null default '',
  locked boolean not null default false,
  encryption_salt text,
  encryption_iv text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint diaries_encryption_fields check (
    (locked and encryption_salt is not null and encryption_iv is not null)
    or
    (not locked and encryption_salt is null and encryption_iv is null)
  )
);

drop trigger if exists diaries_set_updated_at on public.diaries;
create trigger diaries_set_updated_at
before update on public.diaries
for each row execute function public.set_updated_at();

alter table public.diaries enable row level security;

drop policy if exists "diaries_select_own" on public.diaries;
create policy "diaries_select_own"
on public.diaries for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "diaries_insert_own" on public.diaries;
create policy "diaries_insert_own"
on public.diaries for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "diaries_update_own" on public.diaries;
create policy "diaries_update_own"
on public.diaries for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "diaries_delete_own" on public.diaries;
create policy "diaries_delete_own"
on public.diaries for delete to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.diaries to authenticated;

notify pgrst, 'reload schema';
