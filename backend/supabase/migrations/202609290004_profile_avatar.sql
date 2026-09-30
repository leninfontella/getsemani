alter table public.profiles
add column if not exists avatar_url text
check (avatar_url is null or char_length(avatar_url) <= 2048);
