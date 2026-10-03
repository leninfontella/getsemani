-- Permite um registro de livro por usuário e por dia.
alter table public.diaries
  add column if not exists entry_date date;

update public.diaries
set entry_date = (updated_at at time zone 'America/Sao_Paulo')::date
where entry_date is null;

alter table public.diaries
  alter column entry_date set default current_date,
  alter column entry_date set not null;

alter table public.diaries drop constraint if exists diaries_pkey;
alter table public.diaries
  add constraint diaries_pkey primary key (user_id, entry_date);

create index if not exists diaries_user_date_idx
  on public.diaries (user_id, entry_date desc);

notify pgrst, 'reload schema';
