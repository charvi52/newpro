-- Run once in the Supabase SQL editor. All private rows require authenticated access.
create table if not exists public.carely_cabinets(user_id uuid primary key references auth.users on delete cascade, medicines jsonb not null default '[]', updated_at timestamptz not null default now());
create table if not exists public.carely_family(id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users on delete cascade, recipient_email text not null check(recipient_email=lower(trim(recipient_email))), enabled boolean not null default true, unique(owner_id,recipient_email));
create table if not exists public.carely_notifications(id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users on delete cascade, body text not null check(length(body)<=2000), created_at timestamptz not null default now());
alter table public.carely_cabinets enable row level security;
alter table public.carely_family enable row level security;
alter table public.carely_notifications enable row level security;
drop policy if exists cabinet_owner on public.carely_cabinets;
create policy cabinet_owner on public.carely_cabinets for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists family_owner on public.carely_family;
create policy family_owner on public.carely_family for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
drop policy if exists notification_owner on public.carely_notifications;
create policy notification_owner on public.carely_notifications for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
drop policy if exists notification_recipient on public.carely_notifications;
create policy notification_recipient on public.carely_notifications for select to authenticated using(exists(select 1 from public.carely_family f where f.owner_id=carely_notifications.owner_id and f.enabled and f.recipient_email=lower(auth.jwt()->>'email')));
-- Recipient sees only their own grant. No access to the owner's cabinet.
drop policy if exists family_recipient on public.carely_family;
create policy family_recipient on public.carely_family for select to authenticated using(recipient_email=lower(auth.jwt()->>'email'));
grant select,insert,update,delete on public.carely_cabinets,public.carely_family,public.carely_notifications to authenticated;
