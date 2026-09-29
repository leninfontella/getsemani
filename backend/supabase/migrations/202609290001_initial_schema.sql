-- Getsêmani: perfis e manifestações protegidos por Row Level Security.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  gender text not null default 'nao-informar'
    check (gender in ('masculino', 'feminino', 'nao-informar')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.manifestations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id text not null check (char_length(goal_id) between 1 and 120),
  title text not null check (char_length(title) between 1 and 180),
  content text not null check (char_length(btrim(content)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists manifestations_user_created_idx
  on public.manifestations (user_id, created_at desc);

create index if not exists manifestations_user_goal_idx
  on public.manifestations (user_id, goal_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists manifestations_set_updated_at on public.manifestations;
create trigger manifestations_set_updated_at
before update on public.manifestations
for each row execute function public.set_updated_at();

-- Cria o perfil usando os metadados enviados no signUp.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, gender)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)),
    case
      when new.raw_user_meta_data ->> 'gender' in ('masculino', 'feminino', 'nao-informar')
        then new.raw_user_meta_data ->> 'gender'
      else 'nao-informar'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.manifestations enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "manifestations_select_own" on public.manifestations;
create policy "manifestations_select_own"
on public.manifestations for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "manifestations_insert_own" on public.manifestations;
create policy "manifestations_insert_own"
on public.manifestations for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "manifestations_update_own" on public.manifestations;
create policy "manifestations_update_own"
on public.manifestations for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "manifestations_delete_own" on public.manifestations;
create policy "manifestations_delete_own"
on public.manifestations for delete
to authenticated
using ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.manifestations to authenticated;
