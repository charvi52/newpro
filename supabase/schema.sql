-- Run once in the Supabase SQL editor. All private rows require authenticated access.
create table if not exists public.medpro_cabinets(user_id uuid primary key references auth.users on delete cascade, medicines jsonb not null default '[]', updated_at timestamptz not null default now());
create table if not exists public.medpro_family(id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users on delete cascade, recipient_email text not null check(recipient_email=lower(trim(recipient_email))), enabled boolean not null default true, unique(owner_id,recipient_email));
create table if not exists public.medpro_notifications(id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users on delete cascade, body text not null check(length(body)<=2000), created_at timestamptz not null default now());
alter table public.medpro_cabinets enable row level security;
alter table public.medpro_family enable row level security;
alter table public.medpro_notifications enable row level security;
drop policy if exists cabinet_owner on public.medpro_cabinets;
create policy cabinet_owner on public.medpro_cabinets for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists family_owner on public.medpro_family;
create policy family_owner on public.medpro_family for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
drop policy if exists notification_owner on public.medpro_notifications;
create policy notification_owner on public.medpro_notifications for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
drop policy if exists notification_recipient on public.medpro_notifications;
create policy notification_recipient on public.medpro_notifications for select to authenticated using(exists(select 1 from public.medpro_family f where f.owner_id=medpro_notifications.owner_id and f.enabled and f.recipient_email=lower(auth.jwt()->>'email')));
-- Recipient sees only their own grant. No access to the owner's cabinet.
drop policy if exists family_recipient on public.medpro_family;
create policy family_recipient on public.medpro_family for select to authenticated using(recipient_email=lower(auth.jwt()->>'email'));
grant select,insert,update,delete on public.medpro_cabinets,public.medpro_family,public.medpro_notifications to authenticated;

-- Non-destructive cloud sync with optimistic revision checks.
alter table public.medpro_cabinets add column if not exists revision bigint not null default 0;
create or replace function public.medpro_save_cabinet(p_medicines jsonb,p_expected_revision bigint)
returns bigint language plpgsql security invoker set search_path=public as $$
declare next_revision bigint;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if jsonb_typeof(p_medicines)<>'array' or octet_length(p_medicines::text)>5000000 then raise exception 'Invalid cabinet'; end if;
 insert into public.medpro_cabinets(user_id,medicines,revision) values(auth.uid(),'[]',0) on conflict(user_id) do nothing;
 update public.medpro_cabinets set medicines=p_medicines,revision=revision+1,updated_at=now() where user_id=auth.uid() and revision=p_expected_revision returning revision into next_revision;
 if next_revision is null then raise exception 'Cloud cabinet changed. Load and review again.' using errcode='40001'; end if;
 return next_revision;
end $$;
revoke all on function public.medpro_save_cabinet(jsonb,bigint) from public,anon;
grant execute on function public.medpro_save_cabinet(jsonb,bigint) to authenticated;


